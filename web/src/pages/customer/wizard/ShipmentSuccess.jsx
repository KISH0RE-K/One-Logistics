import { useEffect, useRef, useState } from 'react';
import { ArrowRight, CheckCircle2, Copy, LayoutDashboard } from 'lucide-react';
import Button from '../../../components/ui/Button';
import { formatCurrency, formatDuration } from '../../../utils/format';
import './wizard.css';

/**
 * Booking confirmation.
 *
 * The tracking number shown is the one the backend generated - the customer's
 * handle on this shipment from here on, which is why it is the loudest thing
 * on the page and can be copied in one click.
 */
export default function ShipmentSuccess({ shipment }) {
  const [copied, setCopied] = useState(false);
  const headingRef = useRef(null);

  // Announce the outcome to screen readers and move focus to it.
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copyTracking() {
    try {
      await navigator.clipboard.writeText(shipment.trackingNumber);
      setCopied(true);
    } catch {
      // Clipboard access can be blocked; the number is on screen regardless.
      setCopied(false);
    }
  }

  return (
    <div className="container page">
      <div className="success" role="status">
        <span className="success__icon" aria-hidden="true">
          <CheckCircle2 size={30} />
        </span>

        <h1 className="success__title" ref={headingRef} tabIndex={-1}>
          Shipment created successfully.
        </h1>
        <p className="success__lede">
          {shipment.from} to {shipment.to} is booked and awaiting pickup.
        </p>

        <div className="success__tracking">
          <p className="success__tracking-label">Tracking number</p>
          <p className="success__tracking-number mono">{shipment.trackingNumber}</p>
          <button type="button" className="success__copy" onClick={copyTracking}>
            <Copy size={14} aria-hidden="true" />
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        <dl className="success__facts">
          <div>
            <dt>Transport</dt>
            <dd>{shipment.transportMode || '—'}</dd>
          </div>
          <div>
            <dt>Service</dt>
            <dd>{shipment.deliveryOption || '—'}</dd>
          </div>
          <div>
            <dt>Estimated delivery</dt>
            <dd>{formatDuration(shipment.estimatedTime)}</dd>
          </div>
          <div>
            <dt>Cost</dt>
            <dd>{formatCurrency(shipment.cost)}</dd>
          </div>
        </dl>

        <div className="success__actions">
          <Button size="lg" to={`/track/${shipment.trackingNumber}`} iconRight={ArrowRight}>
            Track shipment
          </Button>
          <Button variant="outline" size="lg" to="/dashboard" iconLeft={LayoutDashboard}>
            Back to dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
