import './ui.css';

/**
 * Shimmering placeholder used while a request is in flight, so no screen ever
 * shows a blank white panel. Hidden from assistive tech - the surrounding
 * region carries aria-busy instead.
 */
export default function Skeleton({ width, height = 16, radius = 'var(--radius-sm)', className = '' }) {
  return (
    <span
      className={`skeleton ${className}`}
      style={{ width: width || '100%', height, borderRadius: radius }}
      aria-hidden="true"
    />
  );
}

/** A card-shaped cluster of skeleton lines. */
export function SkeletonCard({ lines = 3 }) {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <Skeleton width="45%" height={20} />
      <div className="skeleton-card__lines">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} width={i === lines - 1 ? '60%' : '100%'} height={13} />
        ))}
      </div>
    </div>
  );
}
