/* Formatting helpers. Kept pure and dependency-free. */

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

/** Cost as Indian rupees. Returns an em dash when the backend has no value. */
export function formatCurrency(value) {
  if (value === undefined || value === null || value === '') return '—';
  const num = Number(value);
  if (!Number.isFinite(num)) return '—';
  return INR.format(num);
}

/**
 * The backend stores estimatedTime in hours. Show it the way a person would
 * say it: "24 hours", "2 days 12 hours".
 */
export function formatDuration(hours) {
  if (hours === undefined || hours === null || hours === '') return '—';
  const total = Number(hours);
  if (!Number.isFinite(total) || total < 0) return '—';
  if (total < 1) return 'Under an hour';
  if (total < 24) return `${Math.round(total)} hour${Math.round(total) === 1 ? '' : 's'}`;

  const days = Math.floor(total / 24);
  const rest = Math.round(total % 24);
  const dayPart = `${days} day${days === 1 ? '' : 's'}`;
  return rest ? `${dayPart} ${rest} hr` : dayPart;
}

/** Weight with its unit, tolerant of missing values. */
export function formatWeight(kg) {
  if (kg === undefined || kg === null || kg === '') return '—';
  const num = Number(kg);
  if (!Number.isFinite(num)) return '—';
  return `${num} kg`;
}

/** L x W x H, only when all three are present. */
export function formatDimensions(pkg) {
  if (!pkg) return '—';
  const { length, width, height } = pkg;
  if (!length || !width || !height) return '—';
  return `${length} x ${width} x ${height} cm`;
}

export function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatTime(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

/** "2 hours ago" style, for audit logs and conversation lists. */
export function formatRelative(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';

  const seconds = Math.round((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return 'Just now';

  const units = [
    ['minute', 60],
    ['hour', 3600],
    ['day', 86400],
    ['week', 604800],
    ['month', 2592000],
    ['year', 31536000],
  ];

  let label = 'year';
  let size = 31536000;
  for (let i = 0; i < units.length; i += 1) {
    const [name, secs] = units[i];
    const next = units[i + 1];
    if (!next || seconds < next[1]) {
      label = name;
      size = secs;
      break;
    }
  }

  const amount = Math.floor(seconds / size);
  return `${amount} ${label}${amount === 1 ? '' : 's'} ago`;
}

/** Turn CREATE_SHIPMENT into "Create shipment" for the audit log table. */
export function humanizeAction(action) {
  if (!action) return '—';
  const lower = String(action).toLowerCase().split('_').join(' ');
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/** Two-letter initials for the profile avatar. */
export function initials(name) {
  if (!name) return '?';
  const parts = String(name).trim().split(' ').filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Raw hours, exactly as the ML service reports them ("24 hours", "96 hours").
 * Used wherever we are quoting the model's own numbers back to the user and
 * rounding them into days would misrepresent the comparison.
 */
export function formatHours(hours) {
  if (hours === undefined || hours === null || hours === '') return '—';
  const num = Number(hours);
  if (!Number.isFinite(num) || num < 0) return '—';
  const rounded = Math.round(num);
  return `${rounded} hour${rounded === 1 ? '' : 's'}`;
}
