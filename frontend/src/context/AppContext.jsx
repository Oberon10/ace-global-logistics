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
};

/**
 * Standardized mapping helper: converts a MongoDB shipment document into reactive frontend format.
 * Preserves both estimated and verified package details, lifecycle stages, and audit history.
 */
export const mapShipmentDoc = (b) => {
  if (!b) return null;
  const rawStatus = b.currentStatus || b.status || 'PENDING';
  const cleanStatus = String(rawStatus).toUpperCase().trim().replace(/\s+/g, '_');
  const displayStatus = cleanStatus === 'PENDING' ? 'PENDING' :
                        cleanStatus === 'PENDING_VERIFICATION' ? 'PENDING' :
                        cleanStatus === 'IN_TRANSIT' ? 'IN TRANSIT' :
                        cleanStatus === 'READY_FOR_DISPATCH' ? 'READY FOR DISPATCH' :
                        cleanStatus === 'OUT_FOR_DELIVERY' ? 'OUT FOR DELIVERY' :
                        cleanStatus === 'DELIVERY_FAILED' ? 'DELIVERY FAILED' :
                        cleanStatus === 'ON_HOLD' ? 'ON HOLD' :
                        cleanStatus.replace(/_/g, ' ');

  const pkg = b.packageDetails || b.package || {};
  const estWeight = pkg.estimatedWeight !== undefined && pkg.estimatedWeight !== null 
    ? Number(pkg.estimatedWeight) 
    : (Number(pkg.weightKg) || 10);
  const actWeight = (pkg.actualWeight !== undefined && pkg.actualWeight !== null) 
    ? Number(pkg.actualWeight) 
    : null;
  const estDims = pkg.estimatedDimensions || pkg.dimensions || '60 × 45 × 40 cm';
  const actDims = pkg.actualDimensions || '';

  return {
    _id: b._id,
    id: b.trackingNumber || b._id,
    trackingNumber: b.trackingNumber,
    status: cleanStatus,
    statusRaw: cleanStatus,
    statusDisplay: displayStatus,
    statusCode: cleanStatus.toLowerCase().replace(/_/g, '-'),
    paymentStatus: b.paymentStatus || 'PENDING',
    assignedStaff: b.assignedStaff,
    createdBy: b.createdBy,
    createdByRole: b.createdByRole || 'CUSTOMER',
    verifiedBy: b.verifiedBy,
    verifiedAt: b.verifiedAt,
    verificationNotes: b.verificationNotes || pkg.verificationNotes || '',
    method: b.shippingMethod || pkg.category || 'Air Freight Priority',
    methodType: (b.shippingMethod || '').toLowerCase().includes('ocean') ? 'ocean' :
                (b.shippingMethod || '').toLowerCase().includes('rail') ? 'rail' :
                (b.shippingMethod || '').toLowerCase().includes('road') ? 'road' : 'air',
    origin: b.origin?.city ? `${b.origin.city}, ${b.origin.country || 'Ghana'}` : (b.origin?.address || 'Origin Hub'),
    destination: b.destination?.city ? `${b.destination.city}, ${b.destination.country || 'United Kingdom'}` : (b.destination?.address || 'Destination Hub'),
    currentLocation: b.currentLocation || (b.origin?.city ? `${b.origin.city} Hub` : 'Intake Hub'),
    estimatedDelivery: pkg.estimatedDelivery ? new Date(pkg.estimatedDelivery).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'September 18, 2026',
    createdDate: b.createdAt ? new Date(b.createdAt).toISOString().split('T')[0] : '2026-10-11',
    customer: b.customer || b.senderDetails?.company || b.senderDetails?.name || b.sender?.name || 'Commercial Freight Consignor',
    sender: {
      _id: b.sender?._id || b.senderDetails?.id,
      name: b.senderDetails?.name || b.sender?.name || 'ACE Consignor',
      email: b.senderDetails?.email || b.sender?.email || '',
      company: b.senderDetails?.company || b.customer || '',
      phone: b.senderDetails?.phone || '',
      address: b.senderDetails?.address || b.origin?.address || 'Terminal Hub',
      city: b.senderDetails?.city || b.origin?.city || 'Accra',
      country: b.senderDetails?.country || b.origin?.country || 'Ghana'
    },
    receiver: b.receiver?.name ? b.receiver : {
      name: 'Consignee Partner',
      company: '',
      phone: '',
      email: '',
      address: b.destination?.address || 'Destination Hub',
      city: b.destination?.city || 'London',
      country: b.destination?.country || 'United Kingdom'
    },
    package: {
      type: pkg.category || 'General Freight',
      weightKg: actWeight !== null ? actWeight : estWeight,
      estimatedWeight: estWeight,
      actualWeight: actWeight,
      dimensions: actDims || estDims,
      estimatedDimensions: estDims,
      actualDimensions: actDims,
      condition: pkg.condition || 'Intact / Standard Packaging',
      specialHandling: pkg.specialHandling || '',
      verificationNotes: pkg.verificationNotes || b.verificationNotes || '',
      pieces: pkg.pieces || 1,
      declaredValue: pkg.declaredValue || '$12,450',
      insurance: pkg.insurance || 'Standard Commercial Liability',
      sealNumber: pkg.sealNumber || `ACE-SL-${(b.trackingNumber || '00000').slice(-5)}`
    },
    charges: b.charges || {
      freight: 360,
      fuelSurcharge: 43,
      customsHandling: 35,
      total: 438
    },
    timeline: (b.trackingHistory && b.trackingHistory.length > 0)
      ? b.trackingHistory.map((h, i) => {
          const rawH = (h.status || 'CHECKPOINT').toUpperCase().trim().replace(/\s+/g, '_');
          const title = rawH === 'PENDING_VERIFICATION' ? 'Shipment Request Created' :
                        rawH === 'VERIFIED' ? 'Package Physically Verified' :
                        rawH === 'READY_FOR_DISPATCH' ? 'Ready for Dispatch' :
                        rawH === 'IN_TRANSIT' ? 'In Transit' :
                        rawH === 'OUT_FOR_DELIVERY' ? 'Out for Delivery' :
                        rawH === 'DELIVERED' ? 'Shipment Delivered' :
                        rawH === 'ON_HOLD' ? 'Shipment On Hold' :
                        rawH === 'REJECTED' ? 'Shipment Rejected' :
                        rawH.replace(/_/g, ' ');

          return {
            id: i + 1,
            title,
            statusRaw: rawH,
            description: h.description || `Logged at ${h.location || 'Hub'}`,
            note: h.note || '',
            location: h.location || 'Hub',
            date: h.timestamp ? new Date(h.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recorded',
            time: h.timestamp ? new Date(h.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '08:00 AM',
            status: i === b.trackingHistory.length - 1 ? 'active' : 'completed',
            changedByRole: h.changedByRole || 'STAFF',
            updatedBy: h.updatedBy
          };
        })
      : []
  };
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

  // API Base URL helper
  const getApiBase = () => {
    if (typeof window !== 'undefined') {
      if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:5000';
      }
    }
    return process.env.NEXT_PUBLIC_API_URL || '';
  };

  // Central Reactive Shipments Repository strictly retrieved from MongoDB Atlas
  const [shipments, setShipments] = useState([]);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [trackingQuery, setTrackingQuery] = useState('');
  const [hasSearchedTracking, setHasSearchedTracking] = useState(false);
  const [prefilledQuote, setPrefilledQuote] = useState(null);

  // In-App Notifications State
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  // Real DB Admin Statistics State
  const [adminStats, setAdminStats] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Receipt Modal State
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [receiptShipment, setReceiptShipment] = useState(null);

  // Fetch in-app notifications
  const fetchNotifications = async () => {
    try {
      const backendUrl = `${getApiBase()}/api/notifications`;
      const token = typeof window !== 'undefined' ? localStorage.getItem('ace_auth_token') : null;
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const res = await fetch(backendUrl, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data?.success && Array.isArray(data.notifications)) {
          setNotifications(data.notifications);
          setUnreadNotifCount(data.unreadCount !== undefined ? data.unreadCount : data.notifications.filter(n => !n.read).length);
        }
      }
    } catch (e) {
      console.warn('Notifications fetch notice:', e);
    }
  };

  const handleMarkNotificationRead = async (id) => {
    try {
      const backendUrl = `${getApiBase()}/api/notifications/${id}/read`;
      const token = typeof window !== 'undefined' ? localStorage.getItem('ace_auth_token') : null;
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      await fetch(backendUrl, { method: 'PATCH', headers });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      setUnreadNotifCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.warn(e);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      const backendUrl = `${getApiBase()}/api/notifications/read-all`;
      const token = typeof window !== 'undefined' ? localStorage.getItem('ace_auth_token') : null;
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      await fetch(backendUrl, { method: 'PATCH', headers });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadNotifCount(0);
    } catch (e) {
      console.warn(e);
    }
  };

  // Fetch real MongoDB Admin operational statistics
  const fetchAdminStats = async () => {
    try {
      setIsLoadingStats(true);
      const backendUrl = `${getApiBase()}/api/shipments/stats/admin`;
      const token = typeof window !== 'undefined' ? localStorage.getItem('ace_auth_token') : null;
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const res = await fetch(backendUrl, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data?.success) {
          setAdminStats(data);
          return data;
        }
      }
    } catch (e) {
      console.warn('Admin stats fetch notice:', e);
    } finally {
      setIsLoadingStats(false);
    }
    return null;
  };

  // Fetch live shipments strictly from MongoDB Atlas
  const fetchLiveShipments = async () => {
    try {
      const backendUrl = `${getApiBase()}/api/shipments`;
      const token = typeof window !== 'undefined' ? localStorage.getItem('ace_auth_token') : null;
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const res = await fetch(backendUrl, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data?.success && Array.isArray(data.shipments)) {
          const mapped = data.shipments.map(mapShipmentDoc).filter(Boolean);
          setShipments(mapped);
          return mapped;
        }
      }
    } catch (e) {
      console.warn('Live shipments fetch warning:', e);
    }
    return [];
  };

  // Hydrate client state from MongoDB on mount
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

      fetchLiveShipments();
      fetchNotifications();
      fetchAdminStats();
    } catch (err) {
      console.warn('Hydration error:', err);
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

  // Tracking Search Functionality (Queries MongoDB Atlas strictly)
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

    let found = null;

    // 1. Query MongoDB Atlas directly through the backend API
    try {
      const backendUrl = `${getApiBase()}/api/shipments/track/${encodeURIComponent(cleanNumber)}`;
      const res = await fetch(backendUrl);
      if (res.ok) {
        const data = await res.json();
        if (data?.success && data?.shipment) {
          found = mapShipmentDoc(data.shipment);
        }
      }
    } catch (e) {
      console.warn('Live tracking lookup notice:', e);
    }

    // Do NOT fall back to in-memory/mock data; reflect true MongoDB Atlas state
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

  // Shipment Creation (Initial status PENDING_VERIFICATION, Persisted to MongoDB Atlas)
  const handleShipmentCreated = async (newShipment, postAction = null) => {
    if (!newShipment) return;

    let savedShipment = newShipment;

    // Persist directly to MongoDB Atlas
    try {
      const backendUrl = `${getApiBase()}/api/shipments`;
      
      const token = typeof window !== 'undefined' ? localStorage.getItem('ace_auth_token') : null;
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const rawWeight = Number(newShipment.package?.estimatedWeight || newShipment.package?.weightKg || 10);
      const rawDimensions = String(newShipment.package?.estimatedDimensions || newShipment.package?.dimensions || '60 × 45 × 40 cm');

      const res = await fetch(backendUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          trackingNumber: newShipment.trackingNumber || newShipment.id,
          origin: newShipment.origin,
          destination: newShipment.destination,
          // Initial status is PENDING for customer bookings
          status: newShipment.status || 'PENDING',
          method: newShipment.method,
          customer: newShipment.customer || newShipment.sender?.company || newShipment.sender?.name,
          sender: newShipment.sender,
          receiver: newShipment.receiver,
          charges: newShipment.charges,
          timeline: newShipment.timeline,
          packageDetails: {
            estimatedWeight: rawWeight,
            weightKg: rawWeight,
            estimatedDimensions: rawDimensions,
            dimensions: rawDimensions,
            category: newShipment.package?.type || 'General Freight',
            pieces: Number(newShipment.package?.pieces) || 1,
            declaredValue: newShipment.package?.declaredValue || '$12,450',
            insurance: newShipment.package?.insurance || 'Standard Commercial Liability',
            sealNumber: newShipment.package?.sealNumber,
            estimatedDelivery: newShipment.estimatedDelivery
          }
        })
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        const detail = data?.error ? ` (${data.error})` : '';
        const msg = (data?.message || 'Failed to save shipment to MongoDB Atlas') + detail;
        throw new Error(msg);
      }

      if (data?.shipment) {
        savedShipment = mapShipmentDoc(data.shipment);
      }
    } catch (err) {
      console.error('Shipment persist error:', err);
      alert('Error persisting shipment to MongoDB Atlas: ' + err.message);
      throw err;
    }

    setShipments(prev => {
      const trackingKey = (savedShipment.trackingNumber || savedShipment.id || '').trim().toUpperCase();
      const filtered = prev.filter(s => (s.trackingNumber || s.id || '').trim().toUpperCase() !== trackingKey);
      return [savedShipment, ...filtered];
    });

    setSelectedShipment(savedShipment);

    // Refresh notifications, admin stats, and live shipments
    fetchNotifications();
    fetchAdminStats();
    fetchLiveShipments();

    if (postAction === 'view-details') {
      navigate('/tracking');
    } else if (postAction === 'view-receipt') {
      handleOpenReceipt(savedShipment);
    }
  };

  // Staff Physical Package Verification
  const handleVerifyShipment = async (shipmentId, verificationData) => {
    try {
      const backendUrl = `${getApiBase()}/api/shipments/${encodeURIComponent(shipmentId)}/verify`;
      const token = typeof window !== 'undefined' ? localStorage.getItem('ace_auth_token') : null;
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(backendUrl, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(verificationData)
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        alert(data?.message || 'Failed to verify package.');
        return null;
      }

      if (data?.shipment) {
        const verifiedMapped = mapShipmentDoc(data.shipment);
        setShipments(prev => prev.map(s => (s.id === shipmentId || s.trackingNumber === shipmentId) ? verifiedMapped : s));
        if (selectedShipment?.id === shipmentId || selectedShipment?.trackingNumber === shipmentId) {
          setSelectedShipment(verifiedMapped);
        }
        fetchNotifications();
        fetchAdminStats();
        return verifiedMapped;
      }
    } catch (err) {
      console.error('Staff verify shipment error:', err);
      alert('Failed to connect to backend database to verify shipment: ' + err.message);
      return null;
    }
  };

  // Shipment Status Update (Staff & Admin, Persisted to MongoDB Atlas adhering to transition rules)
  const handleUpdateShipmentStatus = async (shipmentId, updates) => {
    try {
      const backendUrl = `${getApiBase()}/api/shipments/${encodeURIComponent(shipmentId)}/status`;
      
      const token = typeof window !== 'undefined' ? localStorage.getItem('ace_auth_token') : null;
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(backendUrl, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          status: updates.status,
          location: updates.currentLocation,
          description: updates.description || updates.note,
          note: updates.note
        })
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        alert(data?.message || 'Failed to update shipment status in MongoDB Atlas.');
        return;
      }

      if (data?.shipment) {
        const updatedMapped = mapShipmentDoc(data.shipment);
        setShipments(prev => prev.map(s => (s.id === shipmentId || s.trackingNumber === shipmentId) ? updatedMapped : s));
        if (selectedShipment?.id === shipmentId || selectedShipment?.trackingNumber === shipmentId) {
          setSelectedShipment(updatedMapped);
        }
        fetchNotifications();
        fetchAdminStats();
        return updatedMapped;
      }
    } catch (err) {
      console.error('Backend MongoDB status update error:', err);
      alert('Failed to connect to backend database to update status: ' + err.message);
      return;
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
      localStorage.removeItem('ace_auth_token');
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
    handleVerifyShipment,
    handleUpdateShipmentStatus,
    fetchLiveShipments,

    // Notifications
    notifications,
    unreadNotifCount,
    fetchNotifications,
    handleMarkNotificationRead,
    handleMarkAllNotificationsRead,

    // Real DB Operational Statistics
    adminStats,
    isLoadingStats,
    fetchAdminStats,

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
