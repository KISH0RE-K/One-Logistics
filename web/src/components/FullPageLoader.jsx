import { Loader2 } from 'lucide-react';
import Logo from './Logo';
import './FullPageLoader.css';

/**
 * Shown only while the app decides whether a stored session is still valid.
 * Deliberately branded rather than a bare spinner, so the first paint after a
 * refresh is never an empty white screen.
 */
export default function FullPageLoader({ label = 'Loading' }) {
  return (
    <div className="full-loader" role="status" aria-live="polite">
      <Logo to={null} size="lg" />
      <div className="full-loader__spinner">
        <Loader2 size={20} aria-hidden="true" />
        <span>{label}…</span>
      </div>
    </div>
  );
}
