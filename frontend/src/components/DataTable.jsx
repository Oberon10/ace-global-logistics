import React, { useState } from 'react';
import StatusBadge from './StatusBadge';
import { 
  Eye, 
  FileText, 
  ArrowUpRight, 
  MapPin, 
  Calendar, 
  Truck, 
  Plane, 
  Ship, 
  Train,
  ArrowRight,
  User,
  XCircle,
  RefreshCw,
  X,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Building2
} from 'lucide-react';
import { 
  normalizeStatusKey, 
  getCustomerStatusDescription, 
  STAFF_ALLOWED_TRANSITIONS, 
  ALL_OPERATIONAL_STATUSES 
} from '../utils/statusUtils';

export default function DataTable({ 
  shipments = [], 
  onSelectShipment, 
  onViewReceipt,
  onCancelShipment,
  onUpdateShipmentStatus,
  activeRole = 'guest',
  customerMode = false,
  emptyMessage = "No shipments found matching the selected criteria." 
}) {
  const canEditStatus = !!onUpdateShipmentStatus && (activeRole === 'admin' || activeRole === 'staff');

  // Status Update Modal State
  const [statusModalShipment, setStatusModalShipment] = useState(null);
  const [selectedNextStatus, setSelectedNextStatus] = useState('');
  const [checkpointLocation, setCheckpointLocation] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusNotice, setStatusNotice] = useState({ type: '', text: '' });

  const handleOpenStatusModal = (shipment) => {
    setStatusModalShipment(shipment);
    setStatusNotice({ type: '', text: '' });
    const currentKey = normalizeStatusKey(shipment.statusRaw || shipment.status);
    
    // Determine default next status
    if (activeRole === 'admin') {
      setSelectedNextStatus(currentKey);
    } else {
      const allowed = STAFF_ALLOWED_TRANSITIONS[currentKey] || [];
      setSelectedNextStatus(allowed[0] || currentKey);
    }

    setCheckpointLocation(shipment.currentLocation || shipment.destination || 'Logistics Terminal Hub');
    setStatusNote('');
  };

  const handleCloseStatusModal = () => {
    if (isUpdatingStatus) return;
    setStatusModalShipment(null);
    setStatusNotice({ type: '', text: '' });
  };

  const handleExecuteStatusUpdate = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!statusModalShipment || !onUpdateShipmentStatus) return;

    if (!selectedNextStatus) {
      setStatusNotice({ type: 'error', text: 'Please select a valid target status.' });
      return;
    }

    setIsUpdatingStatus(true);
    setStatusNotice({ type: '', text: '' });

    try {
      const shipmentId = statusModalShipment.id || statusModalShipment.trackingNumber;
      const res = await onUpdateShipmentStatus(shipmentId, {
        status: selectedNextStatus,
        currentLocation: checkpointLocation.trim() || statusModalShipment.currentLocation || 'Operations Hub',
        note: statusNote.trim() || `Operational status updated to ${selectedNextStatus.replace(/_/g, ' ')}`
      });

      if (res && res.success === false) {
        setStatusNotice({ type: 'error', text: res.message || 'Failed to update status in MongoDB Atlas.' });
      } else {
        setStatusNotice({ 
          type: 'success', 
          text: `Consignment [${statusModalShipment.trackingNumber}] updated to ${selectedNextStatus.replace(/_/g, ' ')} in MongoDB Atlas.` 
        });
        setTimeout(() => {
          setStatusModalShipment(null);
          setIsUpdatingStatus(false);
        }, 1200);
      }
    } catch (err) {
      setStatusNotice({ type: 'error', text: 'Network / Database error: ' + (err.message || err) });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (!shipments || shipments.length === 0) {
    return (
      <div className="ace-card" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
        <p style={{ fontSize: '15px', marginBottom: '8px' }}>{emptyMessage}</p>
        <span style={{ fontSize: '12px' }}>Adjust your filters or book a new shipment to get started.</span>
      </div>
    );
  }

  const getMethodIcon = (methodStr = '') => {
    const m = (methodStr || '').toLowerCase();
    if (m.includes('ocean') || m.includes('sea')) return Ship;
    if (m.includes('road') || m.includes('truck') || m.includes('fleet')) return Truck;
    if (m.includes('rail')) return Train;
    return Plane;
  };

  return (
    <>
      {/* ===================================================
          1. DESKTOP & TABLET VIEW (> 640px)
          =================================================== */}
      <div className="ace-table-container ace-table-desktop">
        <table className="ace-table">
          <thead>
            <tr>
              <th>Tracking Number</th>
              <th>Customer / Shipper</th>
              <th>Destination</th>
              <th>Status</th>
              <th>Method</th>
              <th>Date Created</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {shipments.map(s => (
              <tr key={s.id || s.trackingNumber}>
                <td>
                  <div 
                    onClick={() => onSelectShipment && onSelectShipment(s)}
                    style={{ 
                      cursor: 'pointer',
                      fontWeight: 700, 
                      color: 'var(--color-primary-blue)', 
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px' 
                    }}
                  >
                    <span>{s.trackingNumber}</span>
                    <ArrowUpRight size={13} color="var(--color-bright-action)" />
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    From: {s.origin}
                  </div>
                </td>

                <td>
                  <div style={{ fontWeight: 600 }}>{s.customer || s.sender?.name}</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>{s.sender?.company}</div>
                </td>

                <td>
                  <div style={{ fontWeight: 500 }}>{s.destination}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    ETA: {s.estimatedDelivery}
                  </div>
                </td>

                <td>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <StatusBadge 
                      status={s.status} 
                      customerMode={customerMode}
                      clickable={canEditStatus}
                      onClick={canEditStatus ? () => handleOpenStatusModal(s) : undefined}
                    />
                    {canEditStatus && (
                      <button
                        type="button"
                        onClick={() => handleOpenStatusModal(s)}
                        title="Click to update status in MongoDB Atlas"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '2px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <Edit3 size={12} />
                      </button>
                    )}
                  </div>
                </td>

                <td>
                  <span style={{ 
                    backgroundColor: 'var(--color-very-light-blue)', 
                    border: '1px solid var(--color-border)', 
                    padding: '3px 8px', 
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 500
                  }}>
                    {s.method}
                  </span>
                </td>

                <td style={{ color: 'var(--text-secondary)', fontSize: '12.5px' }}>
                  {s.createdDate}
                </td>

                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    {canEditStatus && (
                      <button
                        onClick={() => handleOpenStatusModal(s)}
                        className="ace-btn ace-btn-primary ace-btn-sm"
                        title="Update Shipment Status"
                      >
                        <RefreshCw size={12} />
                        <span>Status</span>
                      </button>
                    )}

                    <button
                      onClick={() => onSelectShipment && onSelectShipment(s)}
                      className="ace-btn ace-btn-secondary ace-btn-sm"
                      title="View Detailed Tracking"
                    >
                      <Eye size={13} />
                      <span>Track</span>
                    </button>

                    <button
                      onClick={() => onViewReceipt && onViewReceipt(s)}
                      className="ace-btn ace-btn-ghost ace-btn-sm"
                      title="Generate Receipt / Bill of Lading"
                    >
                      <FileText size={13} />
                      <span>Receipt</span>
                    </button>

                    {onCancelShipment && (() => {
                      const st = (s.statusRaw || s.status || '').toUpperCase().trim().replace(/\s+/g, '_');
                      const isCancellable = st !== 'CANCELLED' && st !== 'DELIVERED' && st !== 'RETURNED';
                      if (!isCancellable) return null;
                      return (
                        <button
                          onClick={() => onCancelShipment(s)}
                          className="ace-btn ace-btn-ghost ace-btn-sm"
                          style={{ color: '#DC2626', borderColor: '#FECACA' }}
                          title="Cancel Consignment"
                        >
                          <XCircle size={13} />
                          <span>Cancel</span>
                        </button>
                      );
                    })()}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ===================================================
          2. MOBILE CONSIGNMENT CARDS (<= 640px)
          =================================================== */}
      <div className="ace-table-mobile-cards">
        {shipments.map(s => {
          const MethodIcon = getMethodIcon(s.method || s.methodType);
          return (
            <div key={`mobile-card-${s.id || s.trackingNumber}`} className="ace-mobile-card">
              {/* Header: Tracking Code + Status Badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                <div>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Consignment Ref
                  </span>
                  <div 
                    onClick={() => onSelectShipment && onSelectShipment(s)}
                    style={{
                      fontSize: '15px',
                      fontWeight: 800,
                      color: 'var(--color-primary-blue)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    <span>{s.trackingNumber}</span>
                    <ArrowUpRight size={14} color="var(--color-bright-action)" />
                  </div>
                </div>
                
                <StatusBadge 
                  status={s.status} 
                  customerMode={customerMode}
                  clickable={canEditStatus}
                  onClick={canEditStatus ? () => handleOpenStatusModal(s) : undefined}
                />
              </div>

              {/* Transit Corridor Route: Origin -> Destination */}
              <div style={{
                backgroundColor: 'var(--color-very-light-blue)',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--color-border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                fontSize: '12.5px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)' }}>
                  <MapPin size={13} color="var(--color-primary-blue)" style={{ flexShrink: 0 }} />
                  <span style={{ fontWeight: 600 }}>{s.origin}</span>
                  <ArrowRight size={12} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                  <span style={{ fontWeight: 700, color: 'var(--color-primary-blue)' }}>{s.destination}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-muted)', paddingLeft: '19px' }}>
                  <span>ETA: <strong style={{ color: 'var(--text-primary)' }}>{s.estimatedDelivery}</strong></span>
                  <span>{s.createdDate}</span>
                </div>
              </div>

              {/* Shipper & Transport Method Tags */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px', fontSize: '11.5px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-secondary)' }}>
                  <User size={12} />
                  <span>{s.customer || s.sender?.name}</span>
                </div>

                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: 'var(--color-light-blue)',
                  color: 'var(--color-primary-blue)',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '11px'
                }}>
                  <MethodIcon size={12} />
                  <span>{s.method}</span>
                </div>
              </div>

              {/* Mobile Action Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: canEditStatus ? '1fr 1fr 1fr' : '1fr 1fr', gap: '8px', marginTop: '2px', paddingTop: '10px', borderTop: '1px solid var(--color-border-subtle)' }}>
                {canEditStatus && (
                  <button
                    onClick={() => handleOpenStatusModal(s)}
                    className="ace-btn ace-btn-primary ace-btn-sm"
                    style={{ width: '100%', justifyContent: 'center', height: '38px', fontSize: '12px' }}
                  >
                    <RefreshCw size={13} />
                    <span>Status</span>
                  </button>
                )}

                <button
                  onClick={() => onSelectShipment && onSelectShipment(s)}
                  className="ace-btn ace-btn-secondary ace-btn-sm"
                  style={{ width: '100%', justifyContent: 'center', height: '38px', fontSize: '12.5px' }}
                >
                  <Eye size={14} />
                  <span>Track</span>
                </button>

                <button
                  onClick={() => onViewReceipt && onViewReceipt(s)}
                  className="ace-btn ace-btn-ghost ace-btn-sm"
                  style={{ width: '100%', justifyContent: 'center', height: '38px', fontSize: '12.5px', border: '1px solid var(--color-border)' }}
                >
                  <FileText size={14} />
                  <span>Receipt</span>
                </button>

                {onCancelShipment && (() => {
                  const st = (s.statusRaw || s.status || '').toUpperCase().trim().replace(/\s+/g, '_');
                  const isCancellable = st !== 'CANCELLED' && st !== 'DELIVERED' && st !== 'RETURNED';
                  if (!isCancellable) return null;
                  return (
                    <button
                      onClick={() => onCancelShipment(s)}
                      className="ace-btn ace-btn-ghost ace-btn-sm"
                      style={{ gridColumn: 'span 2', width: '100%', justifyContent: 'center', height: '36px', fontSize: '12px', color: '#DC2626', borderColor: '#FECACA' }}
                    >
                      <XCircle size={14} />
                      <span>Cancel Consignment</span>
                    </button>
                  );
                })()}
              </div>
            </div>
          );
        })}
      </div>

      {/* ===================================================
          3. INTERACTIVE STATUS UPDATE MODAL (ADMIN & STAFF)
          =================================================== */}
      {statusModalShipment && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(3, 11, 22, 0.72)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: 'var(--color-white)',
            borderRadius: '12px',
            maxWidth: '520px',
            width: '100%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            border: '1px solid var(--color-border)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 22px',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'var(--color-light-blue)'
            }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--color-bright-action)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {activeRole === 'admin' ? 'Executive Admin Override' : 'Terminal Operations Update'}
                </span>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-primary-blue)', margin: '2px 0 0' }}>
                  Update Consignment Status
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseStatusModal}
                disabled={isUpdatingStatus}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  padding: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleExecuteStatusUpdate} style={{ padding: '22px' }}>
              {/* Notice Banner */}
              {statusNotice.text && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: statusNotice.type === 'error' ? '#FEE2E2' : '#ECFDF5',
                  color: statusNotice.type === 'error' ? '#991B1B' : '#065F46',
                  border: `1px solid ${statusNotice.type === 'error' ? '#FCA5A5' : '#A7F3D0'}`
                }}>
                  {statusNotice.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                  <span>{statusNotice.text}</span>
                </div>
              )}

              {/* Consignment Overview Banner */}
              <div style={{
                backgroundColor: 'var(--color-very-light-blue)',
                padding: '12px 14px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                marginBottom: '18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-primary-blue)' }}>
                    {statusModalShipment.trackingNumber}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                    Shipper: {statusModalShipment.customer || statusModalShipment.sender?.name}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block', textAlign: 'right', marginBottom: '2px' }}>
                    Current State
                  </span>
                  <StatusBadge status={statusModalShipment.status} />
                </div>
              </div>

              {/* Target Status Select */}
              <div className="ace-form-group" style={{ marginBottom: '16px' }}>
                <label className="ace-label ace-label-required">Select Target Status</label>
                <select
                  className="ace-select"
                  value={selectedNextStatus}
                  onChange={(e) => setSelectedNextStatus(e.target.value)}
                  disabled={isUpdatingStatus}
                  required
                >
                  {activeRole === 'admin' ? (
                    ALL_OPERATIONAL_STATUSES.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))
                  ) : (() => {
                    const currKey = normalizeStatusKey(statusModalShipment.statusRaw || statusModalShipment.status);
                    const allowed = STAFF_ALLOWED_TRANSITIONS[currKey] || [];
                    const optionsToShow = Array.from(new Set([currKey, ...allowed]));
                    return optionsToShow.map(val => (
                      <option key={val} value={val}>
                        {val.replace(/_/g, ' ')} {val === currKey ? '(Current)' : ''}
                      </option>
                    ));
                  })()}
                </select>
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  {activeRole === 'admin' 
                    ? 'As an Administrator, you have full authority to set or override any operational lifecycle status.'
                    : 'Staff can transition consignments according to logistics facility guidelines.'}
                </span>
              </div>

              {/* Checkpoint Location */}
              <div className="ace-form-group" style={{ marginBottom: '16px' }}>
                <label className="ace-label">Facility / Checkpoint Location</label>
                <input
                  type="text"
                  className="ace-input"
                  placeholder="e.g. Accra Air Cargo Hub, Kotoka Terminal, or Heathrow"
                  value={checkpointLocation}
                  onChange={(e) => setCheckpointLocation(e.target.value)}
                  disabled={isUpdatingStatus}
                />
              </div>

              {/* Audit Note / Reason */}
              <div className="ace-form-group" style={{ marginBottom: '20px' }}>
                <label className="ace-label">Operational Note / Reason</label>
                <input
                  type="text"
                  className="ace-input"
                  placeholder="e.g. Cargo scanned into distribution facility"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  disabled={isUpdatingStatus}
                />
              </div>

              {/* Customer presentation preview */}
              <div style={{
                fontSize: '12px',
                padding: '10px 12px',
                borderRadius: '6px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                marginBottom: '20px',
                color: 'var(--text-secondary)'
              }}>
                <strong style={{ color: 'var(--color-primary-blue)' }}>Customer Portal Preview: </strong>
                <span>"{getCustomerStatusDescription(selectedNextStatus)}"</span>
              </div>

              {/* Modal Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleCloseStatusModal}
                  disabled={isUpdatingStatus}
                  className="ace-btn ace-btn-ghost"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isUpdatingStatus || !selectedNextStatus}
                  className="ace-btn ace-btn-action"
                  style={{ minWidth: '160px' }}
                >
                  {isUpdatingStatus ? (
                    <>
                      <RefreshCw size={14} className="ace-spin" />
                      <span>Saving to Atlas...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={15} />
                      <span>Confirm & Save</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
