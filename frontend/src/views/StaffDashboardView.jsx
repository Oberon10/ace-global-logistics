import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import StatusBadge from '../components/StatusBadge';
import { 
  Truck, 
  QrCode, 
  CheckCircle2, 
  ArrowRight, 
  Search, 
  MapPin, 
  Package, 
  Clock, 
  RefreshCw,
  AlertCircle,
  Plus,
  ClipboardCheck,
  Scale,
  X,
  Filter,
  FileText,
  Check,
  ShieldAlert,
  Send,
  Eye
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { generateTrackingNumber } from '../data/shipments';

export default function StaffDashboardView({ 
  shipments = [], 
  onUpdateShipmentStatus, 
  onVerifyShipment,
  onCreateShipment,
  onSelectShipment, 
  setView, 
  activeRole = 'staff',
  setActiveRole 
}) {
  const app = useApp ? useApp() : {};
  const verifyHandler = onVerifyShipment || app.handleVerifyShipment;
  const updateStatusHandler = onUpdateShipmentStatus || app.handleUpdateShipmentStatus;
  const createShipmentHandler = onCreateShipment || app.handleShipmentCreated;
  const selectShipmentHandler = onSelectShipment || app.handleSelectShipment;

  // Selected shipment for operations
  const [selectedTracking, setSelectedTracking] = useState(shipments[0]?.trackingNumber || '');
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchFilter, setSearchFilter] = useState('');
  const [scanSimulating, setScanSimulating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Modals
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Verification Form State
  const [verifyForm, setVerifyForm] = useState({
    actualWeight: '',
    actualDimensions: '',
    condition: 'Pristine / Factory Sealed',
    specialHandling: '',
    verificationNotes: ''
  });

  // Walk-in Customer Intake Form State
  const [walkInForm, setWalkInForm] = useState({
    senderName: '',
    senderEmail: '',
    senderPhone: '',
    senderAddress: '',
    senderCity: 'Accra',
    senderCountry: 'Ghana',
    receiverName: '',
    receiverEmail: '',
    receiverPhone: '',
    receiverAddress: '',
    receiverCity: 'London',
    receiverCountry: 'United Kingdom',
    packageType: 'Commercial Goods',
    estimatedWeight: '5.0',
    estimatedDimensions: '40 × 30 × 25 cm',
    shippingMethod: 'Air Freight Priority',
    notes: ''
  });

  // Action status input states for transition wizard
  const [actionLocation, setActionLocation] = useState('');
  const [actionNote, setActionNote] = useState('');

  const activeShipment = shipments.find(s => s.trackingNumber === selectedTracking) || shipments[0] || null;

  // Helper to normalize status
  const getStatusKey = (s) => (s?.statusRaw || s?.status || '').toUpperCase().trim().replace(/\s+/g, '_');

  // Tab Filtering
  const filteredShipments = shipments.filter(s => {
    // Search match
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      const matchTrack = (s.trackingNumber || '').toLowerCase().includes(q);
      const matchSender = (s.sender?.name || s.sender?.company || s.customer || '').toLowerCase().includes(q);
      const matchDest = (s.destination || '').toLowerCase().includes(q);
      if (!matchTrack && !matchSender && !matchDest) return false;
    }

    const st = getStatusKey(s);
    if (activeTab === 'ALL') return true;
    if (activeTab === 'PENDING_VERIFICATION') return st === 'PENDING' || st === 'PENDING_VERIFICATION' || st === 'PENDING_INTAKE' || st === 'ORDER_CREATED';
    if (activeTab === 'VERIFIED') return st === 'VERIFIED';
    if (activeTab === 'READY_FOR_DISPATCH') return st === 'READY_FOR_DISPATCH';
    if (activeTab === 'IN_TRANSIT') return st === 'IN_TRANSIT';
    if (activeTab === 'OUT_FOR_DELIVERY') return st === 'OUT_FOR_DELIVERY';
    if (activeTab === 'DELIVERED') return st === 'DELIVERED';
    if (activeTab === 'EXCEPTIONS') {
      return ['REJECTED', 'CANCELLED', 'ON_HOLD', 'DELIVERY_FAILED', 'RETURNED'].includes(st);
    }
    return true;
  });

  // Barcode handheld scan simulation
  const handleSimulateScan = () => {
    if (!activeShipment) return;
    setScanSimulating(true);
    setTimeout(() => {
      setScanSimulating(false);
      setSuccessMessage(`Consignment [${activeShipment.trackingNumber}] scanned into Station ACC-T1 terminal queue.`);
      setTimeout(() => setSuccessMessage(''), 4500);
    }, 600);
  };

  // Open physical verification modal
  const handleOpenVerifyModal = (shipment) => {
    const target = shipment || activeShipment;
    if (!target) return;
    setSelectedTracking(target.trackingNumber);
    setVerifyForm({
      actualWeight: target.package?.actualWeight || target.package?.estimatedWeight || target.package?.weightKg || '10.0',
      actualDimensions: target.package?.actualDimensions || target.package?.estimatedDimensions || target.package?.dimensions || '60 × 45 × 40 cm',
      condition: target.package?.condition || 'Pristine / Factory Sealed',
      specialHandling: target.package?.specialHandling || target.specialHandling || '',
      verificationNotes: `Physical package inspected and certified at terminal station.`
    });
    setShowVerifyModal(true);
  };

  // Submit physical verification
  const handleSubmitVerification = async (decision = 'APPROVE') => {
    if (!activeShipment || !verifyHandler) return;
    setIsSubmitting(true);
    try {
      const res = await verifyHandler(activeShipment.id || activeShipment.trackingNumber, {
        decision,
        actualWeight: parseFloat(verifyForm.actualWeight) || 0,
        actualDimensions: verifyForm.actualDimensions,
        condition: verifyForm.condition,
        specialHandling: verifyForm.specialHandling,
        verificationNotes: verifyForm.verificationNotes
      });

      if (res) {
        setShowVerifyModal(false);
        setSuccessMessage(`Shipment [${activeShipment.trackingNumber}] successfully ${decision === 'APPROVE' ? 'VERIFIED' : 'REJECTED'}.`);
        setTimeout(() => setSuccessMessage(''), 4500);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || 'Error recording verification.');
      setTimeout(() => setErrorMessage(''), 4500);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Lifecycle Transitions (Adhering to strict rule transitions)
  const handleTransition = async (nextStatus, defaultLoc, defaultNote) => {
    if (!activeShipment || !updateStatusHandler) return;
    setIsSubmitting(true);
    try {
      const loc = actionLocation || defaultLoc || activeShipment.currentLocation;
      const note = actionNote || defaultNote || `Operational stage advanced to ${nextStatus}`;
      await updateStatusHandler(activeShipment.id || activeShipment.trackingNumber, {
        status: nextStatus,
        currentLocation: loc,
        note: note
      });
      setActionLocation('');
      setActionNote('');
      setSuccessMessage(`Shipment [${activeShipment.trackingNumber}] advanced to ${nextStatus}.`);
      setTimeout(() => setSuccessMessage(''), 4500);
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || 'Error updating status.');
      setTimeout(() => setErrorMessage(''), 4500);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Walk-in Customer Shipment Creation (Desk Intake)
  const handleCreateWalkInShipment = async (e) => {
    e.preventDefault();
    if (!createShipmentHandler) return;
    setIsSubmitting(true);
    try {
      const newTrackingId = generateTrackingNumber();
      const weightNum = parseFloat(walkInForm.estimatedWeight) || 5;

      const newShipment = {
        id: newTrackingId,
        trackingNumber: newTrackingId,
        status: 'PENDING_VERIFICATION',
        statusCode: 'pending',
        method: walkInForm.shippingMethod,
        origin: `${walkInForm.senderCity}, ${walkInForm.senderCountry}`,
        destination: `${walkInForm.receiverCity}, ${walkInForm.receiverCountry}`,
        currentLocation: `${walkInForm.senderCity} Desk Intake`,
        estimatedDelivery: 'September 22, 2026',
        createdDate: new Date().toISOString().split('T')[0],
        customer: walkInForm.senderName,
        sender: {
          name: walkInForm.senderName,
          company: walkInForm.senderName,
          phone: walkInForm.senderPhone,
          email: walkInForm.senderEmail,
          address: walkInForm.senderAddress,
          city: walkInForm.senderCity,
          country: walkInForm.senderCountry
        },
        receiver: {
          name: walkInForm.receiverName,
          company: walkInForm.receiverName,
          phone: walkInForm.receiverPhone,
          email: walkInForm.receiverEmail,
          address: walkInForm.receiverAddress,
          city: walkInForm.receiverCity,
          country: walkInForm.receiverCountry
        },
        package: {
          type: walkInForm.packageType,
          estimatedWeight: weightNum,
          weightKg: weightNum,
          estimatedDimensions: walkInForm.estimatedDimensions,
          dimensions: walkInForm.estimatedDimensions,
          pieces: 1,
          declaredValue: '$500',
          insurance: 'Standard Commercial Liability',
          specialHandling: walkInForm.notes || '',
          sealNumber: `ACE-SL-${Math.floor(10000 + Math.random() * 90000)}`
        },
        charges: {
          freight: Math.round(weightNum * 8.5),
          fuelSurcharge: Math.round(weightNum * 1.1),
          customsHandling: 35,
          total: Math.round(weightNum * 8.5 + weightNum * 1.1 + 35)
        }
      };

      await createShipmentHandler(newShipment);
      setShowWalkInModal(false);
      setSelectedTracking(newTrackingId);
      setSuccessMessage(`Walk-in consignment [${newTrackingId}] registered. Now awaiting physical verification.`);
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || 'Error creating walk-in shipment.');
      setTimeout(() => setErrorMessage(''), 4500);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Tab counts
  const countPending = shipments.filter(s => {
    const st = getStatusKey(s);
    return st === 'PENDING' || st === 'PENDING_VERIFICATION' || st === 'PENDING_INTAKE' || st === 'ORDER_CREATED';
  }).length;
  const countVerified = shipments.filter(s => getStatusKey(s) === 'VERIFIED').length;
  const countReady = shipments.filter(s => getStatusKey(s) === 'READY_FOR_DISPATCH').length;
  const countTransit = shipments.filter(s => getStatusKey(s) === 'IN_TRANSIT').length;
  const countOut = shipments.filter(s => getStatusKey(s) === 'OUT_FOR_DELIVERY').length;
  const countDelivered = shipments.filter(s => getStatusKey(s) === 'DELIVERED').length;

  return (
    <div className="ace-dashboard-layout">
      {/* Sidebar */}
      <Sidebar 
        role={activeRole === 'admin' ? 'admin' : 'staff'} 
        currentView="staff-dashboard" 
        setView={setView} 
        setActiveRole={setActiveRole} 
      />

      {/* Main Staff Console */}
      <main className="ace-dashboard-main">
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#0D9488', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Terminal Dispatch & Field Operations
              </span>
              <span style={{ backgroundColor: '#CCFBF1', color: '#0F766E', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px' }}>
                STATION ID: ACC-T1
              </span>
            </div>
            <h1 style={{ fontSize: '26px', color: 'var(--color-primary-blue)', fontWeight: 800, marginTop: '2px' }}>
              Dispatcher Control & Verification Console
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowWalkInModal(true)}
              className="ace-btn ace-btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={16} />
              <span>+ Desk Intake / Walk-in Booking</span>
            </button>

            <button
              onClick={handleSimulateScan}
              disabled={scanSimulating}
              className="ace-btn ace-btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <QrCode size={16} />
              <span>{scanSimulating ? 'Scanning Barcode...' : 'Simulate Handheld Scan'}</span>
            </button>
          </div>
        </div>

        {/* Alerts */}
        {successMessage && (
          <div style={{
            backgroundColor: '#ECFDF5',
            border: '1px solid #A7F3D0',
            color: '#065F46',
            padding: '12px 18px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '20px',
            fontSize: '14px',
            fontWeight: 600
          }}>
            <CheckCircle2 size={18} color="#10B981" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div style={{
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            color: '#991B1B',
            padding: '12px 18px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '20px',
            fontSize: '14px',
            fontWeight: 600
          }}>
            <AlertCircle size={18} color="#EF4444" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Operational Lifecycle Filter Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '8px',
          marginBottom: '20px',
          borderBottom: '1px solid var(--color-border)'
        }}>
          {[
            { id: 'ALL', label: 'All Consignments', count: shipments.length },
            { id: 'PENDING_VERIFICATION', label: 'Pending Shipments', count: countPending, highlight: countPending > 0 },
            { id: 'VERIFIED', label: 'Verified', count: countVerified },
            { id: 'READY_FOR_DISPATCH', label: 'Ready for Dispatch', count: countReady },
            { id: 'IN_TRANSIT', label: 'In Transit Shipments', count: countTransit },
            { id: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', count: countOut },
            { id: 'DELIVERED', label: 'Delivered Shipments', count: countDelivered },
            { id: 'EXCEPTIONS', label: 'Exceptions' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: activeTab === tab.id ? '2px solid var(--color-primary-blue)' : '1px solid var(--color-border)',
                backgroundColor: activeTab === tab.id ? 'var(--color-very-light-blue)' : 'var(--color-white)',
                color: activeTab === tab.id ? 'var(--color-primary-blue)' : 'var(--text-secondary)',
                fontWeight: activeTab === tab.id ? 700 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap'
              }}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: '10px',
                  backgroundColor: tab.highlight ? '#FEF3C7' : 'var(--color-border)',
                  color: tab.highlight ? '#B45309' : 'var(--text-secondary)'
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Two-Column Workspace */}
        {shipments.length === 0 ? (
          <div className="ace-card" style={{ textAlign: 'center', padding: '60px 24px', maxWidth: '640px', margin: '20px auto 32px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-light-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: 'var(--color-primary-blue)'
            }}>
              <Package size={28} />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-primary-blue)', marginBottom: '8px' }}>
              No Active Registered Consignments
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 24px', lineHeight: 1.5 }}>
              There are currently no shipments registered in the operations queue. Click below to intake a walk-in package or await customer booking submissions.
            </p>
            <button
              onClick={() => setShowWalkInModal(true)}
              className="ace-btn ace-btn-action"
            >
              <span>+ Create Walk-in Shipment</span>
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.25fr) minmax(0, 1fr)',
            gap: '24px',
            marginBottom: '32px'
          }} className="staff-grid">
            {/* LEFT: ACTIVE SHIPMENT ACTION & TRANSITION WORKFLOW */}
            <div className="ace-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <RefreshCw size={18} color="var(--color-primary-blue)" />
                  <h3 style={{ fontSize: '17px', color: 'var(--color-primary-blue)', fontWeight: 700 }}>
                    Operational Lifecycle Manager
                  </h3>
                </div>
                {activeShipment && <StatusBadge status={activeShipment.status} />}
              </div>

              {/* Consignment Selector */}
              <div className="ace-form-group" style={{ marginBottom: '18px' }}>
                <label className="ace-label ace-label-required">Select Consignment to Manage</label>
                <select
                  className="ace-select"
                  value={selectedTracking}
                  onChange={(e) => setSelectedTracking(e.target.value)}
                >
                  {shipments.map(s => (
                    <option key={s.id} value={s.trackingNumber}>
                      {s.trackingNumber} — {s.sender?.company || s.sender?.name} ({s.status})
                    </option>
                  ))}
                </select>
              </div>

              {activeShipment ? (
                <div>
                  {/* STAGE-SPECIFIC ACTION CONTROLS (Strict Workflow Rules) */}
                  <div style={{
                    backgroundColor: 'var(--color-light-blue)',
                    border: '1px solid #bfdbfe',
                    borderRadius: '10px',
                    padding: '18px',
                    marginBottom: '20px'
                  }}>
                    <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--color-primary-blue)', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Next Operational Action
                    </div>

                    {/* 1. If PENDING */}
                    {(getStatusKey(activeShipment) === 'PENDING' || getStatusKey(activeShipment) === 'PENDING_VERIFICATION' || getStatusKey(activeShipment) === 'PENDING_INTAKE' || getStatusKey(activeShipment) === 'ORDER_CREATED') && (
                      <div>
                        <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.45 }}>
                          This package was booked as a <strong>Shipment Request</strong>. Staff must physically weigh the package and verify its dimensions before it can proceed into the delivery network.
                        </p>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenVerifyModal(activeShipment)}
                            className="ace-btn ace-btn-primary"
                            style={{ flex: 1, height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                          >
                            <Scale size={18} />
                            <span>Verify Physical Package</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* 2. If VERIFIED */}
                    {getStatusKey(activeShipment) === 'VERIFIED' && (
                      <div>
                        <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.45 }}>
                          Physical package verified ({activeShipment.package?.actualWeight || activeShipment.package?.weightKg} kg). Ready to move to transit linehaul or stage for dispatch.
                        </p>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => handleTransition(
                              'IN_TRANSIT',
                              `Dispatched from ${activeShipment.sender?.city || 'Accra'} Hub en route to ${activeShipment.receiver?.city || activeShipment.destination}`,
                              'Package acknowledged and dispatched into active linehaul transit.'
                            )}
                            disabled={isSubmitting}
                            className="ace-btn ace-btn-primary"
                            style={{ flex: 1, minWidth: '180px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                          >
                            <Truck size={18} />
                            <span>Move to Transit (Dispatch)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTransition(
                              'READY_FOR_DISPATCH',
                              `${activeShipment.sender?.city || 'Accra'} Staging Hub (Bay 2)`,
                              'Package verified and staged ready for dispatch courier pickup.'
                            )}
                            disabled={isSubmitting}
                            className="ace-btn ace-btn-ghost"
                            style={{ flex: 1, minWidth: '160px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: '1px solid var(--color-border)' }}
                          >
                            <ClipboardCheck size={18} />
                            <span>Stage for Dispatch</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* 3. If READY_FOR_DISPATCH */}
                    {getStatusKey(activeShipment) === 'READY_FOR_DISPATCH' && (
                      <div>
                        <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.45 }}>
                          Consignment is staged. Hand over to linehaul transport carrier to move shipment into active transit.
                        </p>
                        <button
                          type="button"
                          onClick={() => handleTransition(
                            'IN_TRANSIT',
                            `En route to ${activeShipment.receiver?.city || activeShipment.destination}`,
                            'Consignment loaded and dispatched on carrier linehaul.'
                          )}
                          disabled={isSubmitting}
                          className="ace-btn ace-btn-primary"
                          style={{ width: '100%', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        >
                          <Truck size={18} />
                          <span>Dispatch Shipment (Mark In Transit)</span>
                        </button>
                      </div>
                    )}

                    {/* 4. If IN_TRANSIT */}
                    {getStatusKey(activeShipment) === 'IN_TRANSIT' ? (
                      <div>
                        <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.45 }}>
                          Consignment is currently in active transit. Confirm delivery upon destination arrival or dispatch final-mile courier.
                        </p>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => handleTransition(
                              'DELIVERED',
                              `${activeShipment.destination} (Destination Handover)`,
                              'Delivered successfully to consignee. Verified by terminal staff.'
                            )}
                            disabled={isSubmitting}
                            className="ace-btn"
                            style={{ flex: 1, minWidth: '180px', height: '44px', backgroundColor: '#059669', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                          >
                            <CheckCircle2 size={18} />
                            <span>Confirm Delivery (Delivered)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTransition(
                              'OUT_FOR_DELIVERY',
                              `${activeShipment.receiver?.city || activeShipment.destination} Delivery Courier Unit`,
                              'Package out for final delivery courier handover.'
                            )}
                            disabled={isSubmitting}
                            className="ace-btn ace-btn-action"
                            style={{ flex: 1, minWidth: '160px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                          >
                            <Send size={18} />
                            <span>Mark Out for Delivery</span>
                          </button>
                        </div>
                      </div>
                    ) : null}

                    {/* 5. If OUT_FOR_DELIVERY */}
                    {getStatusKey(activeShipment) === 'OUT_FOR_DELIVERY' && (
                      <div>
                        <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.45 }}>
                          Consignment is on final delivery run. Record recipient confirmation upon completed handover.
                        </p>
                        <button
                          type="button"
                          onClick={() => handleTransition(
                            'DELIVERED',
                            `${activeShipment.destination} (Recipient Confirmed)`,
                            'Delivered and verified recipient signature recorded.'
                          )}
                          disabled={isSubmitting}
                          className="ace-btn"
                          style={{ width: '100%', height: '44px', backgroundColor: '#059669', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        >
                          <CheckCircle2 size={18} />
                          <span>Mark Consignment Delivered</span>
                        </button>
                      </div>
                    )}

                    {/* 6. If DELIVERED */}
                    {getStatusKey(activeShipment) === 'DELIVERED' && (
                      <div style={{ color: '#065F46', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '14px' }}>
                        <CheckCircle2 size={18} color="#10B981" />
                        <span>Shipment cycle completed. Package successfully delivered to consignee.</span>
                      </div>
                    )}

                    {/* 7. Exception status */}
                    {['REJECTED', 'CANCELLED', 'ON_HOLD', 'DELIVERY_FAILED', 'RETURNED'].includes(activeShipment.status) && (
                      <div style={{ color: '#991B1B', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '14px' }}>
                        <ShieldAlert size={18} color="#EF4444" />
                        <span>Shipment in exception state: {activeShipment.status}.</span>
                      </div>
                    )}
                  </div>

                  {/* Manual Location / Note Override Section */}
                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                    <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '10px' }}>
                      Optional Waypoint / Event Log Notes
                    </div>

                    <div className="ace-form-group" style={{ marginBottom: '10px' }}>
                      <input
                        type="text"
                        className="ace-input"
                        placeholder={activeShipment.currentLocation || "Waypoint Location (e.g. Accra Air Cargo Bay 3)"}
                        value={actionLocation}
                        onChange={(e) => setActionLocation(e.target.value)}
                      />
                    </div>

                    <div className="ace-form-group" style={{ marginBottom: '14px' }}>
                      <input
                        type="text"
                        className="ace-input"
                        placeholder="Dispatcher notes (e.g. Cleared security screening)"
                        value={actionNote}
                        onChange={(e) => setActionNote(e.target.value)}
                      />
                    </div>

                    {/* Exception Actions */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => handleTransition('ON_HOLD', activeShipment.currentLocation, actionNote || 'Shipment placed on operational hold.')}
                        className="ace-btn ace-btn-ghost ace-btn-sm"
                        style={{ color: '#D97706', fontSize: '12px' }}
                      >
                        Place on Hold
                      </button>

                      <button
                        type="button"
                        onClick={() => handleTransition('CANCELLED', activeShipment.currentLocation, actionNote || 'Shipment voided by station dispatcher.')}
                        className="ace-btn ace-btn-ghost ace-btn-sm"
                        style={{ color: '#DC2626', fontSize: '12px' }}
                      >
                        Void / Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* RIGHT: SELECTED SHIPMENT SPECIFICATION & ESTIMATED VS ACTUAL COMPARISON */}
            {activeShipment && (
              <div className="ace-card" style={{ backgroundColor: 'var(--color-white)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary-blue)', textTransform: 'uppercase' }}>
                    Consignment Specification
                  </div>
                  <StatusBadge status={activeShipment.status} />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-primary-blue)' }}>
                    {activeShipment.trackingNumber}
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {activeShipment.method} • Payment: <strong>{activeShipment.paymentStatus || 'PENDING'}</strong>
                  </div>
                </div>

                {/* ESTIMATED VS ACTUAL MEASUREMENTS TABLE */}
                <div style={{
                  backgroundColor: 'var(--color-very-light-blue)',
                  borderRadius: '8px',
                  padding: '14px',
                  marginBottom: '16px',
                  border: '1px solid var(--color-border)'
                }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary-blue)', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Measurement Comparison
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12.5px' }}>
                    <div style={{ backgroundColor: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>
                        Customer Estimate
                      </div>
                      <div style={{ fontWeight: 700, marginTop: '2px' }}>
                        {activeShipment.package?.estimatedWeight || activeShipment.package?.weightKg || '--'} kg
                      </div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '11.5px', marginTop: '2px' }}>
                        {activeShipment.package?.estimatedDimensions || activeShipment.package?.dimensions || '--'}
                      </div>
                    </div>

                    <div style={{ backgroundColor: activeShipment.package?.actualWeight ? '#ECFDF5' : '#FFFBEB', padding: '10px', borderRadius: '6px', border: `1px solid ${activeShipment.package?.actualWeight ? '#A7F3D0' : '#FDE68A'}` }}>
                      <div style={{ color: activeShipment.package?.actualWeight ? '#065F46' : '#92400E', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>
                        Official Staff Verified
                      </div>
                      <div style={{ fontWeight: 800, marginTop: '2px', color: activeShipment.package?.actualWeight ? '#047857' : '#B45309' }}>
                        {activeShipment.package?.actualWeight ? `${activeShipment.package.actualWeight} kg` : 'Pending Intake'}
                      </div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '11.5px', marginTop: '2px' }}>
                        {activeShipment.package?.actualDimensions || 'Awaiting scale verification'}
                      </div>
                    </div>
                  </div>

                  {/* Verification Notes / Condition if available */}
                  {(activeShipment.verificationNotes || activeShipment.package?.condition) && (
                    <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed #cbd5e1', fontSize: '12px' }}>
                      {activeShipment.package?.condition && (
                        <div><strong>Condition:</strong> {activeShipment.package.condition}</div>
                      )}
                      {activeShipment.verificationNotes && (
                        <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                          <strong>Notes:</strong> {activeShipment.verificationNotes}
                        </div>
                      )}
                      {activeShipment.verifiedBy && (
                        <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '2px' }}>
                          Verified by {activeShipment.verifiedBy.name || 'Staff'} ({activeShipment.verifiedBy.role || 'STAFF'})
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Shipper & Consignee Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', backgroundColor: 'var(--color-very-light-blue)', padding: '14px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Shipper:</span>
                    <strong>{activeShipment.sender?.name} ({activeShipment.sender?.city})</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Consignee:</span>
                    <strong>{activeShipment.receiver?.name} ({activeShipment.receiver?.city})</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Current Waypoint:</span>
                    <strong style={{ color: 'var(--color-bright-action)' }}>{activeShipment.currentLocation}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Cargo Type:</span>
                    <strong>{activeShipment.package?.type}</strong>
                  </div>
                </div>

                <div style={{ marginTop: '18px' }}>
                  <button
                    onClick={() => selectShipmentHandler(activeShipment)}
                    className="ace-btn ace-btn-secondary ace-btn-sm"
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <Eye size={14} />
                    <span>View Public Customer Timeline</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Dispatch Queue Table */}
        <div className="ace-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '16px', color: 'var(--color-primary-blue)', fontWeight: 700 }}>
                Station Intake & Dispatch Queue ({filteredShipments.length})
              </h3>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', maxWidth: '300px', width: '100%' }}>
              <div style={{ position: 'relative', width: '100%' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="ace-input"
                  style={{ paddingLeft: '32px', height: '36px', fontSize: '13px' }}
                  placeholder="Filter by tracking / client..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="ace-table-container">
            <table className="ace-table">
              <thead>
                <tr>
                  <th>Tracking Number</th>
                  <th>Shipper</th>
                  <th>Route</th>
                  <th>Operational Stage</th>
                  <th>Weight (Est / Act)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredShipments.map(s => {
                  const isPending = s.status === 'PENDING_VERIFICATION';
                  return (
                    <tr 
                      key={s.id} 
                      style={{ backgroundColor: s.trackingNumber === selectedTracking ? 'var(--color-very-light-blue)' : undefined }}
                    >
                      <td>
                        <strong style={{ color: 'var(--color-primary-blue)', cursor: 'pointer' }} onClick={() => setSelectedTracking(s.trackingNumber)}>
                          {s.trackingNumber}
                        </strong>
                      </td>
                      <td>{s.sender?.company || s.sender?.name}</td>
                      <td>{s.origin} → {s.destination}</td>
                      <td><StatusBadge status={s.status} /></td>
                      <td style={{ fontSize: '12.5px' }}>
                        <span>{s.package?.estimatedWeight || s.package?.weightKg} kg</span>
                        {s.package?.actualWeight && (
                          <span style={{ color: '#059669', fontWeight: 700, marginLeft: '4px' }}>
                            / {s.package.actualWeight} kg
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {isPending ? (
                            <button
                              onClick={() => handleOpenVerifyModal(s)}
                              className="ace-btn ace-btn-primary ace-btn-sm"
                              style={{ fontSize: '12px', padding: '4px 10px' }}
                            >
                              <Scale size={13} />
                              <span>Verify</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => setSelectedTracking(s.trackingNumber)}
                              className="ace-btn ace-btn-ghost ace-btn-sm"
                              style={{ color: 'var(--color-bright-action)', fontWeight: 600, fontSize: '12px' }}
                            >
                              Select
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL 1: PHYSICAL VERIFICATION INSPECTION MODAL */}
        {showVerifyModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}>
            <div className="ace-card" style={{ maxWidth: '580px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Scale size={20} color="var(--color-primary-blue)" />
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-primary-blue)' }}>
                    Physical Package Verification & Intake
                  </h3>
                </div>
                <button
                  onClick={() => setShowVerifyModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ backgroundColor: 'var(--color-very-light-blue)', padding: '12px 16px', borderRadius: '8px', marginBottom: '18px', fontSize: '13px' }}>
                <div><strong>Tracking:</strong> {activeShipment?.trackingNumber}</div>
                <div><strong>Shipper:</strong> {activeShipment?.sender?.name} ({activeShipment?.sender?.city})</div>
                <div><strong>Declared Cargo:</strong> {activeShipment?.package?.type}</div>
                <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Customer Estimate: {activeShipment?.package?.estimatedWeight || activeShipment?.package?.weightKg} kg • {activeShipment?.package?.estimatedDimensions || activeShipment?.package?.dimensions}
                </div>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleSubmitVerification('APPROVE'); }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div className="ace-form-group">
                    <label className="ace-label ace-label-required">Actual Gross Weight (kg)</label>
                    <input
                      type="number"
                      step="0.05"
                      className="ace-input"
                      required
                      value={verifyForm.actualWeight}
                      onChange={(e) => setVerifyForm(prev => ({ ...prev, actualWeight: e.target.value }))}
                      placeholder="e.g. 3.4"
                    />
                  </div>

                  <div className="ace-form-group">
                    <label className="ace-label ace-label-required">Actual Dimensions (cm)</label>
                    <input
                      type="text"
                      className="ace-input"
                      required
                      value={verifyForm.actualDimensions}
                      onChange={(e) => setVerifyForm(prev => ({ ...prev, actualDimensions: e.target.value }))}
                      placeholder="e.g. 62 × 46 × 41 cm"
                    />
                  </div>
                </div>

                <div className="ace-form-group" style={{ marginBottom: '14px' }}>
                  <label className="ace-label ace-label-required">Physical Package Condition</label>
                  <select
                    className="ace-select"
                    value={verifyForm.condition}
                    onChange={(e) => setVerifyForm(prev => ({ ...prev, condition: e.target.value }))}
                  >
                    <option value="Pristine / Factory Sealed">Pristine / Factory Sealed</option>
                    <option value="Securely Repacked">Securely Repacked by Terminal</option>
                    <option value="Minor Outer Carton Wear - Contents Intact">Minor Outer Carton Wear - Contents Intact</option>
                    <option value="Special Seal Affixed">Special Tamper-Evident Seal Affixed</option>
                    <option value="Damaged / Compromised">Damaged / Compromised (Requires Inspection)</option>
                  </select>
                </div>

                <div className="ace-form-group" style={{ marginBottom: '14px' }}>
                  <label className="ace-label">Special Handling Requirements</label>
                  <input
                    type="text"
                    className="ace-input"
                    value={verifyForm.specialHandling}
                    onChange={(e) => setVerifyForm(prev => ({ ...prev, specialHandling: e.target.value }))}
                    placeholder="e.g. Keep upright, fragile electronic sensors"
                  />
                </div>

                <div className="ace-form-group" style={{ marginBottom: '20px' }}>
                  <label className="ace-label">Verification Audit Notes</label>
                  <textarea
                    rows="3"
                    className="ace-textarea"
                    value={verifyForm.verificationNotes}
                    onChange={(e) => setVerifyForm(prev => ({ ...prev, verificationNotes: e.target.value }))}
                    placeholder="Inspection remarks, terminal scale ID, barcoding confirmation..."
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                  <button
                    type="button"
                    onClick={() => handleSubmitVerification('REJECT')}
                    disabled={isSubmitting}
                    className="ace-btn"
                    style={{ backgroundColor: '#EF4444', color: '#fff', fontSize: '13px' }}
                  >
                    <span>Reject Consignment</span>
                  </button>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setShowVerifyModal(false)}
                      className="ace-btn ace-btn-ghost"
                    >
                      <span>Cancel</span>
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="ace-btn ace-btn-primary"
                    >
                      <CheckCircle2 size={16} />
                      <span>{isSubmitting ? 'Verifying...' : 'Approve & Mark Verified'}</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: WALK-IN CUSTOMER INTAKE MODAL */}
        {showWalkInModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}>
            <div className="ace-card" style={{ maxWidth: '640px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Plus size={20} color="var(--color-primary-blue)" />
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-primary-blue)' }}>
                    Desk Intake: Create Walk-in Shipment
                  </h3>
                </div>
                <button
                  onClick={() => setShowWalkInModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateWalkInShipment}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary-blue)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  1. Walk-in Customer (Shipper)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                  <input
                    type="text"
                    className="ace-input"
                    placeholder="Customer Name *"
                    required
                    value={walkInForm.senderName}
                    onChange={(e) => setWalkInForm(prev => ({ ...prev, senderName: e.target.value }))}
                  />
                  <input
                    type="email"
                    className="ace-input"
                    placeholder="Customer Email *"
                    required
                    value={walkInForm.senderEmail}
                    onChange={(e) => setWalkInForm(prev => ({ ...prev, senderEmail: e.target.value }))}
                  />
                  <input
                    type="tel"
                    className="ace-input"
                    placeholder="Phone Number *"
                    required
                    value={walkInForm.senderPhone}
                    onChange={(e) => setWalkInForm(prev => ({ ...prev, senderPhone: e.target.value }))}
                  />
                  <input
                    type="text"
                    className="ace-input"
                    placeholder="Origin City *"
                    required
                    value={walkInForm.senderCity}
                    onChange={(e) => setWalkInForm(prev => ({ ...prev, senderCity: e.target.value }))}
                  />
                </div>

                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary-blue)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  2. Destination (Consignee)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                  <input
                    type="text"
                    className="ace-input"
                    placeholder="Receiver Name *"
                    required
                    value={walkInForm.receiverName}
                    onChange={(e) => setWalkInForm(prev => ({ ...prev, receiverName: e.target.value }))}
                  />
                  <input
                    type="email"
                    className="ace-input"
                    placeholder="Receiver Email *"
                    required
                    value={walkInForm.receiverEmail}
                    onChange={(e) => setWalkInForm(prev => ({ ...prev, receiverEmail: e.target.value }))}
                  />
                  <input
                    type="text"
                    className="ace-input"
                    placeholder="Delivery City *"
                    required
                    value={walkInForm.receiverCity}
                    onChange={(e) => setWalkInForm(prev => ({ ...prev, receiverCity: e.target.value }))}
                  />
                  <input
                    type="text"
                    className="ace-input"
                    placeholder="Destination Country *"
                    required
                    value={walkInForm.receiverCountry}
                    onChange={(e) => setWalkInForm(prev => ({ ...prev, receiverCountry: e.target.value }))}
                  />
                </div>

                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary-blue)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  3. Cargo Details & Estimated Intake
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                  <input
                    type="text"
                    className="ace-input"
                    placeholder="Package Description *"
                    required
                    value={walkInForm.packageType}
                    onChange={(e) => setWalkInForm(prev => ({ ...prev, packageType: e.target.value }))}
                  />
                  <input
                    type="number"
                    step="0.1"
                    className="ace-input"
                    placeholder="Est. Weight (kg) *"
                    required
                    value={walkInForm.estimatedWeight}
                    onChange={(e) => setWalkInForm(prev => ({ ...prev, estimatedWeight: e.target.value }))}
                  />
                  <input
                    type="text"
                    className="ace-input"
                    placeholder="Est. Dimensions (cm)"
                    value={walkInForm.estimatedDimensions}
                    onChange={(e) => setWalkInForm(prev => ({ ...prev, estimatedDimensions: e.target.value }))}
                  />
                  <select
                    className="ace-select"
                    value={walkInForm.shippingMethod}
                    onChange={(e) => setWalkInForm(prev => ({ ...prev, shippingMethod: e.target.value }))}
                  >
                    <option value="Air Freight Priority">Air Freight Priority</option>
                    <option value="Ground Cargo Express">Ground Cargo Express</option>
                    <option value="Ocean Freight Container">Ocean Freight Container</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                  <button
                    type="button"
                    onClick={() => setShowWalkInModal(false)}
                    className="ace-btn ace-btn-ghost"
                  >
                    <span>Cancel</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="ace-btn ace-btn-primary"
                  >
                    <Plus size={16} />
                    <span>{isSubmitting ? 'Registering...' : 'Register Walk-in Consignment'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <style>{`
        @media (max-width: 860px) {
          .staff-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
