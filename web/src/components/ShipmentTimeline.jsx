import { Check, Circle, XCircle } from 'lucide-react';
import { buildTimeline } from '../utils/shipment';
import { formatDateTime } from '../utils/format';
import './domain.css';

/**
 * Vertical tracking timeline.
 *
 * Milestones already reached carry the event's real location and timestamp
 * from the shipment's embedded `events` array; milestones still ahead are
 * shown as upcoming with no invented detail attached.
 *
 * The list is an ordered list so screen readers announce position, and each
 * step's state is conveyed in text as well as by icon and colour.
 */
export default function ShipmentTimeline({ events = [], status }) {
  const steps = buildTimeline(events, status);

  if (!steps.length) {
    return (
      <p className="timeline__empty">
        No tracking events have been recorded for this shipment yet.
      </p>
    );
  }

  return (
    <ol className="timeline">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;

        return (
          <li key={`${step.status}-${index}`} className={`timeline__step is-${step.state}`}>
            <div className="timeline__gutter">
              <span className="timeline__marker" aria-hidden="true">
                {step.state === 'complete' && <Check size={13} />}
                {step.state === 'current' && <span className="timeline__pulse" />}
                {step.state === 'cancelled' && <XCircle size={14} />}
                {step.state === 'upcoming' && <Circle size={8} />}
              </span>
              {!isLast && <span className="timeline__line" aria-hidden="true" />}
            </div>

            <div className="timeline__body">
              <p className="timeline__status">
                {step.status}
                <span className="sr-only">
                  {step.state === 'complete' && ' - completed'}
                  {step.state === 'current' && ' - current status'}
                  {step.state === 'upcoming' && ' - not yet reached'}
                  {step.state === 'cancelled' && ' - cancelled'}
                </span>
              </p>

              {step.location && <p className="timeline__location">{step.location}</p>}

              {step.description && (
                <p className="timeline__description">{step.description}</p>
              )}

              {step.timestamp ? (
                <time className="timeline__time" dateTime={step.timestamp}>
                  {formatDateTime(step.timestamp)}
                </time>
              ) : (
                <p className="timeline__pending">Pending</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
