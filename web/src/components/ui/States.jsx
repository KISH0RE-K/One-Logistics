import { AlertTriangle, Inbox, RefreshCw, WifiOff } from 'lucide-react';
import Button from './Button';
import { SkeletonCard } from './Skeleton';
import './ui.css';

/**
 * The three states every data-backed screen needs. Having them here means no
 * page invents its own loading spinner or error copy.
 */

/** Loading - a shimmer in the shape of the content that is coming. */
export function LoadingState({ label = 'Loading', count = 3, layout = 'grid' }) {
  return (
    <div className={`state-loading state-loading--${layout}`} aria-busy="true">
      <span className="sr-only">{label}</span>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

/** Empty - never a bare "no data"; always says what to do next. */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  message,
  action = null,
  className = '',
}) {
  return (
    <div className={`state ${className}`}>
      <span className="state__icon" aria-hidden="true">
        <Icon size={26} />
      </span>
      <h3 className="state__title">{title}</h3>
      {message && <p className="state__message">{message}</p>}
      {action && <div className="state__action">{action}</div>}
    </div>
  );
}

/**
 * Error - shows the normalised message from the API layer. Raw server faults
 * are already replaced with neutral copy there; validation messages, which
 * are genuinely useful, come through intact.
 */
export function ErrorState({ error, onRetry, title = 'Something went wrong', className = '' }) {
  const isNetwork = error?.status === 0 || error?.code === 'network';
  const Icon = isNetwork ? WifiOff : AlertTriangle;

  return (
    <div className={`state state--error ${className}`} role="alert">
      <span className="state__icon state__icon--error" aria-hidden="true">
        <Icon size={26} />
      </span>
      <h3 className="state__title">{isNetwork ? 'Connection problem' : title}</h3>
      <p className="state__message">
        {error?.message ||
          "We're having trouble connecting to the logistics service. Please try again."}
      </p>
      {onRetry && (
        <div className="state__action">
          <Button variant="secondary" iconLeft={RefreshCw} onClick={onRetry}>
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}

/** Inline form-level error banner (used above submit buttons). */
export function FormError({ message }) {
  if (!message) return null;
  return (
    <div className="form-error" role="alert">
      <AlertTriangle size={16} aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
