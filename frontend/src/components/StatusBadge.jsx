import React from 'react';
import { 
  CheckCircle2, 
  Truck, 
  Clock, 
  XCircle, 
  ShieldCheck, 
  Package, 
  Navigation, 
  AlertTriangle,
  RotateCcw,
  Building2,
  ChevronDown
} from 'lucide-react';
import { getCustomerStatusDescription, getCustomerStatusShort } from '../utils/statusUtils';

export default function StatusBadge({ 
  status, 
  className = '', 
  customerMode = false, 
  showDescription = false,
  clickable = false,
  onClick = null
}) {
  const norm = (status || '').toUpperCase().trim().replace(/_/g, ' ');

  let badgeClass = 'ace-badge-neutral';
  let Icon = Clock;
  let text = norm || 'UNKNOWN';

  if (norm === 'DELIVERED' || norm === 'COMPLETED' || norm === 'SUCCESS') {
    badgeClass = 'ace-badge-delivered';
    Icon = CheckCircle2;
    text = 'DELIVERED';
  } else if (norm === 'OUT FOR DELIVERY') {
    badgeClass = 'ace-badge-out';
    Icon = Navigation;
    text = 'OUT FOR DELIVERY';
  } else if (norm === 'ARRIVED AT FACILITY' || norm === 'ARRIVED FACILITY') {
    badgeClass = 'ace-badge-facility';
    Icon = Building2;
    text = 'ARRIVED AT FACILITY';
  } else if (norm === 'IN TRANSIT' || norm === 'TRANSIT' || norm === 'ACTIVE') {
    badgeClass = 'ace-badge-transit';
    Icon = Truck;
    text = 'IN TRANSIT';
  } else if (norm === 'READY FOR DISPATCH') {
    badgeClass = 'ace-badge-ready';
    Icon = Package;
    text = 'READY FOR DISPATCH';
  } else if (norm === 'VERIFIED') {
    badgeClass = 'ace-badge-verified';
    Icon = ShieldCheck;
    text = 'VERIFIED';
  } else if (norm === 'PENDING VERIFICATION' || norm === 'ORDER CREATED' || norm === 'PENDING' || norm === 'PROCESSING' || norm === 'PENDING INTAKE') {
    badgeClass = 'ace-badge-pending';
    Icon = Clock;
    text = norm === 'ORDER CREATED' ? 'ORDER CREATED' : 'PENDING VERIFICATION';
  } else if (norm === 'ON HOLD') {
    badgeClass = 'ace-badge-hold';
    Icon = AlertTriangle;
    text = 'ON HOLD';
  } else if (norm === 'REJECTED') {
    badgeClass = 'ace-badge-rejected';
    Icon = XCircle;
    text = 'REJECTED';
  } else if (norm === 'DELIVERY FAILED') {
    badgeClass = 'ace-badge-rejected';
    Icon = XCircle;
    text = 'DELIVERY FAILED';
  } else if (norm === 'RETURNED') {
    badgeClass = 'ace-badge-hold';
    Icon = RotateCcw;
    text = 'RETURNED';
  } else if (norm === 'CANCELLED' || norm === 'FAILED' || norm === 'ERROR') {
    badgeClass = 'ace-badge-cancelled';
    Icon = XCircle;
    text = 'CANCELLED';
  }

  // Adjust display text for customer-facing views if requested
  if (showDescription) {
    text = getCustomerStatusDescription(status);
  } else if (customerMode) {
    text = getCustomerStatusShort(status);
  }

  const tooltip = getCustomerStatusDescription(status);

  return (
    <span 
      className={`ace-badge ${badgeClass} ${className} ${clickable ? 'ace-badge-clickable' : ''}`}
      title={tooltip}
      onClick={onClick}
      style={clickable ? { cursor: 'pointer', userSelect: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px' } : undefined}
    >
      <span className="ace-badge-dot" />
      <Icon size={12} strokeWidth={2.5} style={{ flexShrink: 0 }} />
      <span>{text}</span>
      {clickable && <ChevronDown size={11} strokeWidth={2.5} style={{ opacity: 0.7, marginLeft: '2px' }} />}
    </span>
  );
}
