import { Check } from 'lucide-react';
import './domain.css';

/**
 * Wizard progress indicator.
 *
 * Steps already completed are clickable so the customer can go back and
 * change an answer; steps ahead are not, because the wizard validates each
 * one before it will move on.
 *
 * Rendered as an ordered list with aria-current on the active step, and a
 * plain-text "Step N of M" summary for screen readers on small viewports
 * where the labels are visually collapsed.
 */
export default function Stepper({ steps = [], current = 0, onStepClick }) {
  return (
    <nav className="stepper" aria-label="Shipment progress">
      <p className="sr-only">
        Step {current + 1} of {steps.length}: {steps[current]?.label}
      </p>

      <ol className="stepper__list">
        {steps.map((step, index) => {
          const isComplete = index < current;
          const isCurrent = index === current;
          const canNavigate = isComplete && typeof onStepClick === 'function';

          const state = isComplete ? 'complete' : isCurrent ? 'current' : 'upcoming';

          return (
            <li key={step.key} className={`stepper__step is-${state}`}>
              {canNavigate ? (
                <button
                  type="button"
                  className="stepper__button"
                  onClick={() => onStepClick(index)}
                >
                  <StepMarker index={index} isComplete={isComplete} />
                  <span className="stepper__label">{step.label}</span>
                </button>
              ) : (
                <span
                  className="stepper__button stepper__button--static"
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  <StepMarker index={index} isComplete={isComplete} />
                  <span className="stepper__label">{step.label}</span>
                </span>
              )}

              {index < steps.length - 1 && (
                <span className="stepper__connector" aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function StepMarker({ index, isComplete }) {
  return (
    <span className="stepper__marker" aria-hidden="true">
      {isComplete ? <Check size={14} /> : index + 1}
    </span>
  );
}
