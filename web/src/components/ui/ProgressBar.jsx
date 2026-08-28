import './ui.css';

/**
 * Determinate progress meter. Used for draft completeness, where the value is
 * computed from the fields the backend actually has - never a decorative
 * number.
 */
export default function ProgressBar({ value = 0, label, tone = 'gold', showValue = true }) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <div className="progress">
      {(label || showValue) && (
        <div className="progress__meta">
          {label && <span className="progress__label">{label}</span>}
          {showValue && <span className="progress__value">{clamped}% complete</span>}
        </div>
      )}
      <div
        className={`progress__track progress__track--${tone}`}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || 'Completion'}
      >
        <div className="progress__fill" style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}
