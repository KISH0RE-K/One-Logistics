/**
 * Formatting and shipment helpers, matching the web client so both surfaces
 * describe the same data identically. Pure functions, no platform APIs.
 */

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export function formatCurrency(value) {
  if (value === undefined || value === null || value === '') return '—';
  const n = Number(value);
  return Number.isFinite(n) ? INR.format(n) : '—';
}

export function formatDuration(hours) {
  if (hours === undefined || hours === null || hours === '') return '—';
  const total = Number(hours);
  if (!Number.isFinite(total) || total < 0) return '—';
  if (total < 24) {
    const h = Math.round(total);
    return `${h} hour${h === 1 ? '' : 's'}`;
  }
  const days = Math.floor(total / 24);
  const rest = Math.round(total % 24);
  const d = `${days} day${days === 1 ? '' : 's'}`;
  return rest ? `${d} ${rest} hr` : d;
}

export function formatWeight(kg) {
  if (kg === undefined || kg === null || kg === '') return '—';
  const n = Number(kg);
  return Number.isFinite(n) ? `${n} kg` : '—';
}

export function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatRelative(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';

  const seconds = Math.round((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return 'just now';

  const units = [
    ['minute', 60],
    ['hour', 3600],
    ['day', 86400],
    ['week', 604800],
    ['month', 2592000],
    ['year', 31536000],
  ];

  let size = 31536000;
  let name = 'year';
  for (let i = 0; i < units.length; i += 1) {
    const next = units[i + 1];
    if (!next || seconds < next[1]) {
      [name, size] = units[i];
      break;
    }
  }

  const amount = Math.floor(seconds / size);
  return `${amount} ${name}${amount === 1 ? '' : 's'} ago`;
}

/** 'web' | 'mobile' -> a label the customer understands. */
export function channelLabel(channel) {
  return channel === 'mobile' ? 'Mobile' : 'Web';
}

/* -- Draft completeness ----------------------------------------------------
   The backend stores no progress field, so this is derived from the fields
   the draft document actually has - exactly as the web app computes it.   */

function packageComplete(pkg) {
  return Boolean(
    pkg && pkg.weight && pkg.height && pkg.width && pkg.length && pkg.packageType
  );
}

export const CHECKPOINTS = [
  { key: 'pickup', label: 'Pickup', done: (s) => Boolean(s?.from) },
  { key: 'delivery', label: 'Delivery', done: (s) => Boolean(s?.to) },
  { key: 'package', label: 'Package', done: (s) => packageComplete(s?.packageId) },
  { key: 'service', label: 'Service', done: (s) => Boolean(s?.deliveryOption) },
  { key: 'transport', label: 'Transport', done: (s) => Boolean(s?.transportMode) },
];

export function draftProgress(draft) {
  if (!draft) return 0;
  const done = CHECKPOINTS.filter((c) => c.done(draft)).length;
  return Math.round((done / CHECKPOINTS.length) * 100);
}

/** What is still missing, so the screen can say so plainly. */
export function missingSteps(draft) {
  return CHECKPOINTS.filter((c) => !c.done(draft)).map((c) => c.label);
}

/** True when a draft has everything the backend needs to book it. */
export function isDraftBookable(draft) {
  return CHECKPOINTS.every((c) => c.done(draft));
}

/* -- Tracking timeline ------------------------------------------------------ */

export const MILESTONES = [
  'Booked',
  'Picked Up',
  'In Transit',
  'Out for Delivery',
  'Delivered',
];

export function buildTimeline(events = [], currentStatus) {
  const recorded = [...events].sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
  );

  if (currentStatus === 'cancelled') {
    return recorded.map((e, i) => ({
      status: e.status,
      location: e.location || null,
      timestamp: e.timestamp || null,
      state: i === recorded.length - 1 ? 'cancelled' : 'complete',
    }));
  }

  const byMilestone = new Map();
  for (const e of recorded) {
    const key = String(e.status || '').toLowerCase();
    if (!byMilestone.has(key)) byMilestone.set(key, e);
  }

  const lastReached = MILESTONES.reduce(
    (acc, m, i) => (byMilestone.has(m.toLowerCase()) ? i : acc),
    -1
  );

  return MILESTONES.map((milestone, i) => {
    const event = byMilestone.get(milestone.toLowerCase()) || null;
    let state = 'upcoming';
    if (i < lastReached) state = 'complete';
    else if (i === lastReached) state = 'current';

    return {
      status: milestone,
      location: event?.location || null,
      timestamp: event?.timestamp || null,
      state,
    };
  });
}
