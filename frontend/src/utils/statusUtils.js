/**
 * ACE Global Logistics - Shipment Status Lifecycle & Presentation Utilities
 * 
 * Enforces unified status mapping, customer-friendly status descriptions,
 * and operational status transition matrices between frontend portals and MongoDB Atlas.
 */

export const CUSTOMER_STATUS_DESCRIPTIONS = {
  PENDING_VERIFICATION: 'Pending Intake — Awaiting staff verification',
  PENDING: 'Pending Intake — Awaiting staff verification',
  PENDING_INTAKE: 'Pending Intake — Awaiting staff verification',
  ORDER_CREATED: 'Pending Intake — Awaiting staff verification',
  VERIFIED: 'Verified — Shipment details confirmed',
  READY_FOR_DISPATCH: 'Ready for Dispatch — Scheduled for transit linehaul',
  IN_TRANSIT: 'In Transit — Your shipment is on its way',
  ARRIVED_AT_FACILITY: 'Arrived at Facility — Shipment received at a logistics facility',
  OUT_FOR_DELIVERY: 'Out for Delivery — Your shipment is approaching its destination',
  DELIVERED: 'Delivered — Shipment successfully delivered',
  ON_HOLD: 'On Hold — Shipment temporarily delayed',
  CANCELLED: 'Cancelled — Shipment has been cancelled',
  REJECTED: 'Intake Rejected — Physical inspection failed',
  DELIVERY_FAILED: 'Delivery Exception — Contact support',
  RETURNED: 'Returned — Consignment returned to terminal'
};

export const CUSTOMER_STATUS_SHORT = {
  PENDING_VERIFICATION: 'Pending Intake',
  PENDING: 'Pending Intake',
  PENDING_INTAKE: 'Pending Intake',
  ORDER_CREATED: 'Pending Intake',
  VERIFIED: 'Verified',
  READY_FOR_DISPATCH: 'Ready for Dispatch',
  IN_TRANSIT: 'In Transit',
  ARRIVED_AT_FACILITY: 'Arrived at Facility',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  ON_HOLD: 'On Hold',
  CANCELLED: 'Cancelled',
  REJECTED: 'Rejected',
  DELIVERY_FAILED: 'Delivery Exception',
  RETURNED: 'Returned'
};

/**
 * Standardize any status string into clean uppercase key (e.g., "in_transit" -> "IN_TRANSIT")
 */
export function normalizeStatusKey(rawStatus) {
  if (!rawStatus) return 'PENDING_VERIFICATION';
  let norm = String(rawStatus).toUpperCase().trim().replace(/\s+/g, '_');
  if (norm === 'TRANSIT') norm = 'IN_TRANSIT';
  return norm;
}

/**
 * Retrieve the full customer-friendly status description for a given shipment status.
 * Example: 'pending_verification' -> 'Pending Intake — Awaiting staff verification'
 */
export function getCustomerStatusDescription(rawStatus) {
  const key = normalizeStatusKey(rawStatus);
  return CUSTOMER_STATUS_DESCRIPTIONS[key] || `${key.replace(/_/g, ' ')} — Status recorded in system`;
}

/**
 * Retrieve the short customer-facing display name.
 * Example: 'pending_verification' -> 'Pending Intake'
 */
export function getCustomerStatusShort(rawStatus) {
  const key = normalizeStatusKey(rawStatus);
  return CUSTOMER_STATUS_SHORT[key] || key.replace(/_/g, ' ');
}

/**
 * Allowed operational transitions for terminal staff (enforces logistics business rules)
 */
export const STAFF_ALLOWED_TRANSITIONS = {
  PENDING: ['VERIFIED', 'IN_TRANSIT', 'ON_HOLD', 'CANCELLED'],
  PENDING_INTAKE: ['VERIFIED', 'IN_TRANSIT', 'ON_HOLD', 'CANCELLED'],
  PENDING_VERIFICATION: ['VERIFIED', 'IN_TRANSIT', 'ON_HOLD', 'CANCELLED'],
  VERIFIED: ['READY_FOR_DISPATCH', 'IN_TRANSIT', 'ARRIVED_AT_FACILITY', 'OUT_FOR_DELIVERY', 'ON_HOLD', 'CANCELLED'],
  READY_FOR_DISPATCH: ['IN_TRANSIT', 'ARRIVED_AT_FACILITY', 'OUT_FOR_DELIVERY', 'ON_HOLD', 'CANCELLED'],
  IN_TRANSIT: ['ARRIVED_AT_FACILITY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'ON_HOLD', 'CANCELLED'],
  ARRIVED_AT_FACILITY: ['IN_TRANSIT', 'OUT_FOR_DELIVERY', 'ON_HOLD', 'DELIVERED', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'ARRIVED_AT_FACILITY', 'ON_HOLD', 'CANCELLED'],
  ON_HOLD: ['PENDING_VERIFICATION', 'VERIFIED', 'READY_FOR_DISPATCH', 'IN_TRANSIT', 'ARRIVED_AT_FACILITY', 'OUT_FOR_DELIVERY', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: []
};

/**
 * Full list of statuses available to Administrator for management and override
 */
export const ALL_OPERATIONAL_STATUSES = [
  { value: 'PENDING_VERIFICATION', label: 'Pending Verification (Intake Stage)' },
  { value: 'VERIFIED', label: 'Verified (Terminal Certified)' },
  { value: 'READY_FOR_DISPATCH', label: 'Ready for Dispatch (Staged)' },
  { value: 'IN_TRANSIT', label: 'In Transit (Line-haul Flight / Cargo)' },
  { value: 'ARRIVED_AT_FACILITY', label: 'Arrived at Facility (Regional Hub)' },
  { value: 'OUT_FOR_DELIVERY', label: 'Out for Delivery (Courier Assigned)' },
  { value: 'DELIVERED', label: 'Delivered (Successfully Handed Over)' },
  { value: 'ON_HOLD', label: 'On Hold (Temporary Delay / Inspection)' },
  { value: 'CANCELLED', label: 'Cancelled (Operational Cancellation)' }
];
