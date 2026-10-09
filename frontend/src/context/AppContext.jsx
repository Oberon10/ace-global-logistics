'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { INITIAL_SHIPMENTS } from '../data/shipments';

const AppContext = createContext(null);

export const ROUTE_MAP = {
  'home': '/',
  'services': '/services',
  'track': '/tracking',
  'tracking': '/tracking',
  'about': '/about',
  'contact': '/contact',
  'quote': '/quote',
  'new-shipment': '/new-shipment',
  'login': '/login',
  'customer-dashboard': '/customer/dashboard',
  'staff-dashboard': '/staff/dashboard',
  'admin-dashboard': '/admin/dashboard',
  'admin-shipments': '/admin/shipments',
  'admin-customers': '/admin/customers',
  'admin-settings': '/admin/settings',
  'analytics': '/admin/analytics',
  'users': '/admin/users'
};

export function AppProvider({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  // Hydration state tracking
  const [isHydrated, setIsHydrated] = useState(false);

  // Authentication State with client lazy synchronous initialization
  const [activeRole, setActiveRole] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('ace_auth_role');
        if (saved) return saved;
      } catch {}
    }
    return 'guest';
  });

  const [currentUser, setCurrentUser] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('ace_current_user');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return null;
  });

  const [loginPortal, setLoginPortal] = useState('customer');
  const [authNotice, setAuthNotice] = useState('');
  const [postLoginRedirect, setPostLoginRedirect] = useState(null);

  // Theme State
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('ace_theme') || 'light';
      } catch {}
    }
    return 'light';
  });

  // Central Reactive Shipments Repository
  const [shipments, setShipments] = useState(INITIAL_SHIPMENTS);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [trackingQuery, setTrackingQuery] = useState('');
  const [hasSearchedTracking, setHasSearchedTracking] = useState(false);
  const [prefilledQuote, setPrefilledQuote] = useState(null);

  // Receipt Modal State
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [receiptShipment, setReceiptShipment] = useState(null);

  // Hydrate client state from localStorage and MongoDB on mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('ace_theme') || 'light';
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
      if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.remove('dark-mode');
      }

      const savedRole = localStorage.getItem('ace_auth_role');
      if (savedRole) {
        setActiveRole(savedRole);
      }

      const savedUser = localStorage.getItem('ace_current_user');
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }

      // Fetch live shipments from MongoDB
      const fetchLiveShipments = async () => {
        try {
          const backendUrl = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
            ? 'http://localhost:5000/api/shipments'
            : '/api/shipments';
          const token = localStorage.getItem('ace_auth_token');
          const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
          const res = await fetch(backendUrl, { headers });
          if (res.ok) {
            const data = await res.json();
            if (data?.success && Array.isArray(data.shipments) && data.shipments.length > 0) {
              const mapped = data.shipments.map(b => ({
                id: b.trackingNumber || b._id,
                trackingNumber: b.trackingNumber,
                status: b.currentStatus === 'IN_TRANSIT' ? 'IN TRANSIT' :
                        b.currentStatus === 'ORDER_CREATED' ? 'ORDER CREATED' :
                        b.currentStatus === 'OUT_FOR_DELIVERY' ? 'OUT FOR DELIVERY' :
                        b.currentStatus || 'IN TRANSIT',
                statusCode: (b.currentStatus || 'transit').toLowerCase().replace('_', '-'),
                method: b.packageDetails?.category || 'Air Freight Priority',
                methodType: 'air',
                origin: `${b.origin?.city || 'Accra'}, ${b.origin?.country || 'Ghana'}`,
                destination: `${b.destination?.city || 'London'}, ${b.destination?.country || 'UK'}`,
                currentLocation: b.origin?.city ? `${b.origin.city} Hub` : 'In Transit',
                estimatedDelivery: b.packageDetails?.estimatedDelivery ? new Date(b.packageDetails.estimatedDelivery).toLocaleDateString() : 'September 18, 2026',
                createdDate: b.createdAt ? new Date(b.createdAt).toISOString().split('T')[0] : '2026-09-12',
                customer: b.sender?.name || 'Commercial Freight Consignor',
                sender: {
                  name: b.sender?.name || 'ACE Consignor',
                  address: b.origin?.address || 'Terminal Hub',
                  city: b.origin?.city || 'Accra',
                  country: b.origin?.country || 'Ghana'
                },
                receiver: {
                  name: 'Consignee Partner',
                  address: b.destination?.address || 'Destination Hub',
                  city: b.destination?.city || 'London',
                  country: b.destination?.country || 'UK'
                },
                package: {
                  type: b.packageDetails?.category || 'General Freight',
                  weightKg: b.packageDetails?.weightKg || 10,
                  dimensions: '60 × 45 × 40 cm',
                  pieces: 1,
                  declaredValue: '$12,450',
                  sealNumber: `ACE-SL-${b.trackingNumber.slice(-5)}`
                },
                charges: {
                  freight: 360,
                  fuelSurcharge: 43,
                  customsHandling: 35,
                  total: 438
                },
                timeline: (b.trackingHistory && b.trackingHistory.length > 0)
                  ? b.trackingHistory.map((h, i) => ({
                      id: i + 1,
                      title: h.status?.replace('_', ' ') || 'Checkpoint',
                      description: h.description || `Logged at ${h.location}`,
                      location: h.location || 'Hub',
                      date: h.timestamp ? new Date(h.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Sep 12, 2026',
                      time: h.timestamp ? new Date(h.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '08:00 AM',
                      status: i === b.trackingHistory.length - 1 ? 'completed' : 'completed'
                    }))
                  : []
              }));

              setShipments(prev => {
                const combined = [...mapped, ...prev];
                const seen = new Set();
                return combined.filter(s => {
                  const key = (s.trackingNumber || s.id || '').trim().toUpperCase();
                  if (!key || seen.has(key)) return false;
                  seen.add(key);
                  return true;
                });
              });
            }
          }
        } catch (e) {
          console.warn('Live shipments fetch warning:', e);
        }
      };
      fetchLiveShipments();

      const storedShipments = localStorage.getItem('ace_registered_consignments');
      if (storedShipments) {
        const parsed = JSON.parse(storedShipments);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const seen = new Set();
          const deduplicated = parsed.filter(s => {
            const key = (s.trackingNumber || s.id || '').trim().toUpperCase();
            if (!key || seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          setShipments(prev => {
            const merged = [...prev, ...deduplicated];
            const dedupSet = new Set();
            return merged.filter(s => {
              const key = (s.trackingNumber || s.id || '').trim().toUpperCase();
              if (!key || dedupSet.has(key)) return false;
              dedupSet.add(key);
              return true;
            });
          });
        }
      }
    } catch (err) {
      console.warn('LocalStorage hydration error:', err);
    } finally {
      setIsHydrated(true);
    }
  }, []);


  // Theme toggler
  const toggleTheme = () => {
    setTheme(prev => {
      const nextTheme = prev === 'light' ? 'dark' : 'light';
      try {
        localStorage.setItem('ace_theme', nextTheme);
        document.documentElement.setAttribute('data-theme', nextTheme);
        if (nextTheme === 'dark') {
          document.body.classList.add('dark-mode');
        } else {
          document.body.classList.remove('dark-mode');
        }
      } catch {
        // ignore
      }
      return nextTheme;
    });
  };

  // Global Navigation Helper: compatible with both legacy view IDs ('about') and paths ('/about')
  const navigate = (target) => {
    if (!target) return;
    const dest = ROUTE_MAP[target] || (target.startsWith('/') ? target : `/${target}`);
    // Privacy protection: whenever navigating directly to public 'track' or away from tracking to another page,
    // clear the previously searched shipment details so they are never retained or visible to another receiver
    if (target === 'track' || dest !== '/tracking') {
      handleClearTracking();
    }
    router.push(dest);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const setView = (target) => {
    navigate(target);
  };

  // Tracking Search Functionality
  const handleSearchTracking = async (trackingNumber) => {
    const cleanNumber = (trackingNumber || '').trim();
    if (!cleanNumber) {
      setSelectedShipment(null);
      setTrackingQuery('');
      setHasSearchedTracking(false);
      router.push('/tracking');
      return;
    }

    setTrackingQuery(cleanNumber);
    setHasSearchedTracking(true);

    const upperClean = cleanNumber.toUpperCase();
    const stripped = upperClean.replace(/[^A-Z0-9]/g, '');

    let found = shipments.find(s => {
      const sNum = (s.trackingNumber || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      const sId = (s.id || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      const sSeal = (s.package?.sealNumber || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      return sNum === stripped || sId === stripped || sSeal === stripped;
    });

    if (!found) {
      try {
        const backendUrl = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
          ? `http://localhost:5000/api/shipments/track/${encodeURIComponent(cleanNumber)}`
          : `/api/shipments/track/${encodeURIComponent(cleanNumber)}`;
        const res = await fetch(backendUrl);
        if (res.ok) {
          const data = await res.json();
          if (data?.success && data?.shipment) {
            const bShipment = data.shipment;
            found = {
              id: bShipment._id || bShipment.id || bShipment.trackingNumber,
              trackingNumber: bShipment.trackingNumber,
              status: bShipment.currentStatus || 'IN TRANSIT',
              origin: bShipment.origin?.city || bShipment.origin?.address || 'Origin Terminal',
              destination: bShipment.destination?.city || bShipment.destination?.address || 'Destination Hub',
              currentLocation: bShipment.currentLocation || bShipment.origin?.city || 'En Route',
              estimatedDelivery: bShipment.estimatedDelivery || 'In Progress',
              method: bShipment.shippingMethod || 'Standard Express Cargo',
              methodType: bShipment.methodType || 'Air',
              sender: bShipment.sender || { name: 'Authorized Consignor' },
              receiver: bShipment.receiver || { name: 'Authorized Consignee' },
              package: bShipment.packageDetails || { type: 'Commercial Freight', weight: 'Standard' },
              timeline: (bShipment.trackingHistory && bShipment.trackingHistory.length > 0)
                ? bShipment.trackingHistory.map((h, i) => ({
                    id: i + 1,
                    title: h.status || 'Status Checkpoint',
                    description: h.description || `Checkpoint logged at ${h.location}`,
                    location: h.location || 'Transit Hub',
                    date: h.timestamp ? new Date(h.timestamp).toLocaleDateString() : 'Recorded',
                    time: h.timestamp ? new Date(h.timestamp).toLocaleTimeString() : '',
                    status: (i === bShipment.trackingHistory.length - 1) ? 'active' : 'completed'
                  }))
                : [
                    { id: 1, title: 'Manifest Created', description: 'Booking confirmed', location: bShipment.origin?.city || 'Origin', date: 'Recorded', status: 'completed' },
                    { id: 2, title: 'In Transit', description: 'Consignment en route', location: bShipment.currentLocation || 'En Route', date: 'Today', status: 'active' }
                  ]
            };
          }
        }
      } catch {
        // Continue with local result
      }
    }

    setSelectedShipment(found || null);
    router.push('/tracking');

    setTimeout(() => {
      const detailsEl = document.getElementById('shipment-telemetry-root') || 
                        document.getElementById('consignment-input') || 
                        document.getElementById('shipment-details-section');
      if (detailsEl) {
        detailsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
  };

  const handleSelectShipment = (shipment) => {
    setSelectedShipment(shipment);
    if (shipment) {
      setTrackingQuery(shipment.trackingNumber || shipment.id || '');
      setHasSearchedTracking(true);
    }
    router.push('/tracking');
    setTimeout(() => {
      const detailsEl = document.getElementById('shipment-telemetry-root') || 
                        document.getElementById('shipment-details-section');
      if (detailsEl) {
        detailsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
  };

  const handleClearTracking = () => {
    setSelectedShipment(null);
    setTrackingQuery('');
    setHasSearchedTracking(false);
  };

  // Receipt Modal Handlers
  const handleOpenReceipt = (shipment) => {
    setReceiptShipment(shipment);
    setReceiptModalOpen(true);
  };

  const handleCloseReceipt = () => {
    setReceiptModalOpen(false);
    setReceiptShipment(null);
  };

  // Shipment Creation (Strict Single Instance per Creation, Persisted to MongoDB)
  const handleShipmentCreated = (newShipment, postAction = null) => {
    if (!newShipment) return;

    setShipments(prev => {
      const trackingKey = (newShipment.trackingNumber || newShipment.id || '').trim().toUpperCase();
      const alreadyExists = prev.some(s => (s.trackingNumber || s.id || '').trim().toUpperCase() === trackingKey);

      if (alreadyExists) {
        return prev; // Prevent duplicate entries
      }

      const updated = [newShipment, ...prev];
      try {
        localStorage.setItem('ace_registered_consignments', JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to sync shipments to localStorage', err);
      }
      return updated;
    });

    setSelectedShipment(newShipment);

    // Persist directly to MongoDB
    try {
      const backendUrl = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:5000/api/shipments'
        : '/api/shipments';
      
      const token = typeof window !== 'undefined' ? localStorage.getItem('ace_auth_token') : null;
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      fetch(backendUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          trackingNumber: newShipment.trackingNumber || newShipment.id,
          origin: newShipment.origin,
          destination: newShipment.destination,
          status: newShipment.status || 'IN_TRANSIT',
          method: newShipment.method,
          packageDetails: {
            weightKg: newShipment.package?.weightKg || 10,
            category: newShipment.package?.type || 'General Freight',
            estimatedDelivery: newShipment.estimatedDelivery
          }
        })
      }).catch(err => {
        console.warn('Backend MongoDB shipment registration notice:', err);
      });
    } catch (err) {
      console.warn('Shipment persist warning:', err);
    }

    if (postAction === 'view-details') {
      navigate('/tracking');
    } else if (postAction === 'view-receipt') {
      handleOpenReceipt(newShipment);
    }
  };

  // Shipment Status Update (Staff & Admin, Persisted to MongoDB)
  const handleUpdateShipmentStatus = (shipmentId, updates) => {
    setShipments(prev => {
      const updatedList = prev.map(s => {
        if (s.id === shipmentId || s.trackingNumber === shipmentId) {
          const now = new Date();
          const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

          const updatedTimeline = [
            ...s.timeline.map(t => t.status === 'active' ? { ...t, status: 'completed' } : t),
            {
              id: s.timeline.length + 1,
              title: `Status Milestone: ${updates.status}`,
              description: updates.note || `Dispatcher update recorded at ${updates.currentLocation}.`,
              location: updates.currentLocation || s.currentLocation,
              date: dateStr,
              time: timeStr,
              status: 'active'
            }
          ];

          const updated = {
            ...s,
            status: updates.status,
            currentLocation: updates.currentLocation || s.currentLocation,
            timeline: updatedTimeline
          };

          if (selectedShipment?.id === s.id || selectedShipment?.trackingNumber === s.trackingNumber) {
            setSelectedShipment(updated);
          }
          return updated;
        }
        return s;
      });

      try {
        localStorage.setItem('ace_registered_consignments', JSON.stringify(updatedList));
      } catch (err) {
        console.error('Failed to sync updated shipment to localStorage', err);
      }
      return updatedList;
    });

    // Persist update to MongoDB
    try {
      const backendUrl = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? `http://localhost:5000/api/shipments/${encodeURIComponent(shipmentId)}/status`
        : `/api/shipments/${encodeURIComponent(shipmentId)}/status`;
      
      const token = typeof window !== 'undefined' ? localStorage.getItem('ace_auth_token') : null;
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      fetch(backendUrl, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          status: updates.status,
          location: updates.currentLocation,
          description: updates.note
        })
      }).catch(err => {
        console.warn('Backend MongoDB status update notice:', err);
      });
    } catch (err) {
      console.warn('Status update persist warning:', err);
    }
  };

  // Quote -> Shipment Booking Transition
  const handleProceedToShipmentFromQuote = (quoteData) => {
    setPrefilledQuote(quoteData);
    navigate('/new-shipment');
  };

  // Send Package Action with Guest gate
  const handleSendPackageClick = () => {
    if (activeRole === 'guest') {
      setLoginPortal('customer');
      setAuthNotice('Please sign in or create an account to book and send a package.');
      setPostLoginRedirect('/new-shipment');
      navigate('/login?portal=customer');
    } else {
      navigate('/new-shipment');
    }
  };

  // Authentication Handlers
  const handleLoginSuccess = (role, userObj, customRedirect = null) => {
    setActiveRole(role);
    setCurrentUser(userObj);

    try {
      localStorage.setItem('ace_auth_role', role);
      localStorage.setItem('ace_current_user', JSON.stringify(userObj));
    } catch {
      // ignore
    }

    const destination = customRedirect || postLoginRedirect;
    setPostLoginRedirect(null);
    setAuthNotice('');

    if (destination) {
      navigate(destination);
    } else if (role === 'admin') {
      navigate('/admin/dashboard');
    } else if (role === 'staff') {
      navigate('/staff/dashboard');
    } else if (role === 'customer') {
      navigate('/customer/dashboard');
    } else {
      navigate('/');
    }
  };

  const handleLogout = () => {
    setActiveRole('guest');
    setCurrentUser(null);
    try {
      localStorage.removeItem('ace_auth_role');
      localStorage.removeItem('ace_current_user');
    } catch {
      // ignore
    }
    navigate('/');
  };

  // Quick authorize demo for admin
  const quickAuthorizeAdmin = () => {
    const adminUser = {
      name: 'Derek Sterling',
      email: 'd.sterling@acelogistics.com',
      role: 'admin',
      title: 'Executive Vice President of Operations',
      clearanceLevel: 'Level 5 (Full Authority)'
    };
    handleLoginSuccess('admin', adminUser, pathname);
  };

  // Current view helper derived from route pathname
  const currentView = (() => {
    if (pathname === '/') return 'home';
    if (pathname.startsWith('/about')) return 'about';
    if (pathname.startsWith('/services')) return 'services';
    if (pathname.startsWith('/tracking') || pathname.startsWith('/track')) return 'track';
    if (pathname.startsWith('/contact')) return 'contact';
    if (pathname.startsWith('/login')) return 'login';
    if (pathname.startsWith('/quote')) return 'quote';
    if (pathname.startsWith('/new-shipment')) return 'new-shipment';
    if (pathname.startsWith('/admin/shipments')) return 'admin-shipments';
    if (pathname.startsWith('/admin/customers')) return 'admin-customers';
    if (pathname.startsWith('/admin/settings')) return 'admin-settings';
    if (pathname.startsWith('/admin/analytics')) return 'analytics';
    if (pathname.startsWith('/admin/users')) return 'users';
    if (pathname.startsWith('/admin')) return 'admin-dashboard';
    if (pathname.startsWith('/customer/dashboard')) return 'customer-dashboard';
    if (pathname.startsWith('/staff/dashboard')) return 'staff-dashboard';
    return 'home';
  })();

  const value = {
    // Auth & User
    activeRole,
    setActiveRole,
    currentUser,
    setCurrentUser,
    isHydrated,
    loginPortal,
    setLoginPortal,
    authNotice,
    setAuthNotice,
    handleLoginSuccess,
    handleLogout,
    quickAuthorizeAdmin,
    handleSendPackageClick,


    // Theme
    theme,
    toggleTheme,

    // Navigation
    currentView,
    navigate,
    setView,
    pathname,

    // Shipments & Tracking
    shipments,
    selectedShipment,
    setSelectedShipment,
    trackingQuery,
    setTrackingQuery,
    hasSearchedTracking,
    handleSearchTracking,
    handleSelectShipment,
    handleClearTracking,
    handleShipmentCreated,
    handleUpdateShipmentStatus,

    // Quote & New Shipment
    prefilledQuote,
    setPrefilledQuote,
    handleProceedToShipmentFromQuote,

    // Receipts
    receiptModalOpen,
    receiptShipment,
    handleOpenReceipt,
    handleCloseReceipt
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
