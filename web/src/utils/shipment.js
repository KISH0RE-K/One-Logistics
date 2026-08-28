/**
 * Shipment domain helpers.
 *
 * Everything here is derived from what the backend actually returns - no
 * invented fields, no placeholder numbers.
 */

/* -- Status ---------------------------------------------------------------- */

export const STATUS_META = {
  draft: { label: 'Draft', tone: 'neutral', description: 'Saved but not yet booked' },
  booked: { label: 'Booked', tone: 'info', description: 'Confirmed and awaiting pickup' },
  in_transit: { label: 'In Transit', tone: 'info', description: 'On its way' },
  out_for_delivery: {
    label: 'Out for Delivery',
    tone: 'warning',
    description: 'With the courier for final delivery',
  },
  delivered: { label: 'Delivered', tone: 'success', description: 'Delivered successfully' },
  cancelled: { label: 'Cancelled', tone: 'danger', description: 'This shipment was cancelled' },
};

export const ACTIVE_STATUSES = ['booked', 'in_transit', 'out_for_delivery'];
export const CLOSED_STATUSES = ['delivered', 'cancelled'];

export function statusMeta(status) {
  return (
    STATUS_META[status] || { label: status || 'Unknown', tone: 'neutral', description: '' }
  );
}

export function isActive(shipment) {
  return ACTIVE_STATUSES.includes(shipment?.status);
}

/* -- Service and transport options (must mirror the backend enums) --------- */

export const DELIVERY_OPTIONS = [
  {
    value: 'Economy',
    label: 'Economy',
    blurb: 'Lowest cost. Best for non-urgent, bulk or heavy shipments.',
  },
  {
    value: 'Normal',
    label: 'Normal',
    blurb: 'Balanced cost and speed for everyday shipments.',
  },
  {
    value: 'Express',
    label: 'Express',
    blurb: 'Fastest available service, prioritised end to end.',
  },
];

export const TRANSPORT_MODES = ['Road', 'Rail', 'Air'];

export const PACKAGE_TYPES = [
  { value: 'document', label: 'Document' },
  { value: 'parcel', label: 'Parcel' },
  { value: 'fragile', label: 'Fragile' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'other', label: 'Other' },
];

export const VEHICLE_TYPES = ['Truck', 'Van', 'Rail', 'Aircraft'];

export const VEHICLE_STATUSES = [
  { value: 'available', label: 'Available', tone: 'success' },
  { value: 'in_transit', label: 'In Transit', tone: 'info' },
  { value: 'maintenance', label: 'Maintenance', tone: 'warning' },
  { value: 'unavailable', label: 'Unavailable', tone: 'neutral' },
];

export function vehicleStatusMeta(status) {
  return (
    VEHICLE_STATUSES.find((s) => s.value === status) || {
      value: status,
      label: status || 'Unknown',
      tone: 'neutral',
    }
  );
}

/* -- Draft completeness ----------------------------------------------------
   The backend stores no progress field, so completeness is computed from the
   fields that are actually present on the draft document.                   */

function packageComplete(pkg) {
  if (!pkg) return false;
  return Boolean(pkg.weight && pkg.height && pkg.width && pkg.length && pkg.packageType);
}

export const DRAFT_CHECKPOINTS = [
  { key: 'pickup', label: 'Pickup', done: (s) => Boolean(s?.from) },
  { key: 'delivery', label: 'Delivery', done: (s) => Boolean(s?.to) },
  { key: 'package', label: 'Package', done: (s) => packageComplete(s?.packageId) },
  { key: 'service', label: 'Service', done: (s) => Boolean(s?.deliveryOption) },
  { key: 'transport', label: 'Transport', done: (s) => Boolean(s?.transportMode) },
];

/** Percentage of the booking that is filled in, rounded to whole numbers. */
export function draftProgress(draft) {
  if (!draft) return 0;
  const done = DRAFT_CHECKPOINTS.filter((c) => c.done(draft)).length;
  return Math.round((done / DRAFT_CHECKPOINTS.length) * 100);
}

/** The first step still missing, so "Continue" can jump straight there. */
export function nextIncompleteStep(draft) {
  const index = DRAFT_CHECKPOINTS.findIndex((c) => !c.done(draft));
  return index === -1 ? DRAFT_CHECKPOINTS.length : index;
}

/* -- Channel ---------------------------------------------------------------
   lastChannel is what makes the cross-device story visible in the UI.       */

export function channelLabel(channel) {
  return channel === 'mobile' ? 'Mobile' : 'Web';
}

/* -- Tracking timeline -----------------------------------------------------
   The backend keeps an events array on the shipment document. These are the
   canonical milestones; an event matches a milestone by its status text.    */

export const TIMELINE_MILESTONES = [
  'Booked',
  'Picked Up',
  'In Transit',
  'Out for Delivery',
  'Delivered',
];

/**
 * Merge the canonical milestones with the events the backend actually
 * recorded, so the timeline shows both what has happened and what is still
 * ahead. A cancelled shipment ends at its cancellation instead.
 */
export function buildTimeline(events = [], currentStatus) {
  const recorded = [...events].sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
  );

  if (currentStatus === 'cancelled') {
    return recorded.map((event, i) => ({
      status: event.status,
      location: event.location || null,
      description: event.description || null,
      timestamp: event.timestamp || null,
      state: i === recorded.length - 1 ? 'cancelled' : 'complete',
    }));
  }

  const byMilestone = new Map();
  for (const event of recorded) {
    const key = String(event.status || '').toLowerCase();
    if (!byMilestone.has(key)) byMilestone.set(key, event);
  }

  const lastReached = TIMELINE_MILESTONES.reduce(
    (acc, milestone, index) =>
      byMilestone.has(milestone.toLowerCase()) ? index : acc,
    -1
  );

  return TIMELINE_MILESTONES.map((milestone, index) => {
    const event = byMilestone.get(milestone.toLowerCase()) || null;
    let state = 'upcoming';
    if (index < lastReached) state = 'complete';
    else if (index === lastReached) state = 'current';

    return {
      status: milestone,
      location: event?.location || null,
      description: event?.description || null,
      timestamp: event?.timestamp || null,
      state,
    };
  });
}
