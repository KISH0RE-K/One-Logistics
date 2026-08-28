import { ArrowRight, Clock, MapPin, Package } from 'lucide-react';
import Button from './ui/Button';
import StatusBadge from './ui/StatusBadge';
import { formatCurrency, formatDuration, formatWeight } from '../utils/format';
import './domain.css';

const MODE_LABEL = {
  Road: 'Road freight',
  Rail: 'Rail freight',
  Air: 'Air freight',
};

/**
 * A confirmed shipment, shown as a card on the dashboard, the active list and
 * the mobile history view.
 *
 * Everything rendered comes from the shipment document; missing values fall
 * back to an em dash rather than a fabricated placeholder.
 */
export default function ShipmentCard({ shipment, showCost = false }) {
  if (!shipment) return null;

  const pkg = shipment.packageId;

  return (
    <article className="ship-card">
      <header className="ship-card__head">
        <div>
          <p className="ship-card__label">Tracking number</p>
          <p className="ship-card__tracking mono">{shipment.trackingNumber || 'Not issued'}</p>
        </div>
        <StatusBadge status={shipment.status} />
      </header>

      <div className="ship-card__route">
        <div className="ship-card__point">
          <MapPin size={15} aria-hidden="true" />
          <span>{shipment.from || '—'}</span>
        </div>
        <ArrowRight className="ship-card__arrow" size={16} aria-hidden="true" />
        <div className="ship-card__point">
          <MapPin size={15} aria-hidden="true" />
          <span>{shipment.to || '—'}</span>
        </div>
      </div>

      <dl className="ship-card__facts">
        <div className="ship-card__fact">
          <dt>Transport</dt>
          <dd>{MODE_LABEL[shipment.transportMode] || shipment.transportMode || '—'}</dd>
        </div>
        <div className="ship-card__fact">
          <dt>Service</dt>
          <dd>{shipment.deliveryOption || '—'}</dd>
        </div>
        <div className="ship-card__fact">
          <dt>
            <Clock size={12} aria-hidden="true" /> Estimated
          </dt>
          <dd>{formatDuration(shipment.estimatedTime)}</dd>
        </div>
        {pkg && (
          <div className="ship-card__fact">
            <dt>
              <Package size={12} aria-hidden="true" /> Package
            </dt>
            <dd>{formatWeight(pkg.weight)}</dd>
          </div>
        )}
        {showCost && (
          <div className="ship-card__fact">
            <dt>Cost</dt>
            <dd className="ship-card__cost">{formatCurrency(shipment.cost)}</dd>
          </div>
        )}
      </dl>

      <footer className="ship-card__foot">
        {shipment.trackingNumber ? (
          <Button
            variant="outline"
            size="sm"
            to={`/track/${shipment.trackingNumber}`}
            iconRight={ArrowRight}
          >
            Track shipment
          </Button>
        ) : (
          <Button variant="outline" size="sm" to={`/shipments/${shipment._id}`}>
            View details
          </Button>
        )}
      </footer>
    </article>
  );
}
