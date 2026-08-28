import './ui.css';

/**
 * Small status pill. `tone` maps to the semantic colour tokens, never to a
 * raw colour - and every badge carries readable text, so colour is never the
 * only signal.
 */
export default function Badge({ tone = 'neutral', size = 'md', children, className = '' }) {
  return (
    <span className={`badge badge--${tone} badge--${size} ${className}`}>{children}</span>
  );
}
