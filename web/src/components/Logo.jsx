import { Link } from 'react-router-dom';
import './Logo.css';

/**
 * Brand mark for the platform.
 *
 * An original mark - a golden delivery arc over a deep brown tile - rather
 * than any carrier's real logo. `tone` switches the wordmark for placement on
 * light or dark surfaces.
 */
export default function Logo({ to = '/', tone = 'dark', size = 'md', showWordmark = true }) {
  const mark = (
    <span className={`logo logo--${size} logo--${tone}`}>
      <span className="logo__mark" aria-hidden="true">
        <svg viewBox="0 0 64 64" focusable="false">
          <rect width="64" height="64" rx="16" className="logo__tile" />
          <path
            d="M20 21v14.5c0 6.4 5.4 10.5 12 10.5s12-4.1 12-10.5V21"
            fill="none"
            className="logo__arc"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <circle cx="32" cy="16" r="3.5" className="logo__dot" />
        </svg>
      </span>

      {showWordmark && (
        <span className="logo__text">
          <span className="logo__name">One Logistics</span>
          <span className="logo__tagline">Experience</span>
        </span>
      )}
    </span>
  );

  if (!to) return mark;

  return (
    <Link to={to} className="logo__link" aria-label="One Logistics Experience, go to home">
      {mark}
    </Link>
  );
}
