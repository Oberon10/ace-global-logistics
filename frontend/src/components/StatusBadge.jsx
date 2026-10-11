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
  RotateCcw
} from 'lucide-react';

export default function StatusBadge({ status, className = '' }) {
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
  } else if (norm === 'PENDING VERIFICATION' || norm === 'ORDER CREATED' || norm === 'PENDING' || norm === 'PROCESSING') {
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

  return (
    <span className={`ace-badge ${badgeClass} ${className}`}>
      <span className="ace-badge-dot" />
      <Icon size={12} strokeWidth={2.5} />
      <span>{text}</span>
    </span>
  );
}
