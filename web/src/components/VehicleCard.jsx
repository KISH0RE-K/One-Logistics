import { Check, MapPin, Plane, Train, Truck, Weight } from 'lucide-react';
import Button from './ui/Button';
import Badge from './ui/Badge';
import { vehicleStatusMeta } from '../utils/shipment';
import './domain.css';

const TYPE_ICON = {
  Truck,
  Van: Truck,
  Rail: Train,
  Aircraft: Plane,
};

/**
 * An available vehicle returned by GET /api/vehicles/available.
 *
 * Cards rather than a table: for a customer choosing a vehicle this is a
 * comparison, not a data dump.
 */
export default function VehicleCard({ vehicle, isSelected = false, onSelect }) {
  if (!vehicle) return null;

  const Icon = TYPE_ICON[vehicle.type] || Truck;
  const status = vehicleStatusMeta(vehicle.status);

  return (
    <article className={`vehicle-card ${isSelected ? 'is-selected' : ''}`}>
      {isSelected && (
        <span className="vehicle-card__selected" aria-hidden="true">
          <Check size={13} />
          Selected
        </span>
      )}

      <div className="vehicle-card__head">
        <span className="vehicle-card__icon" aria-hidden="true">
          <Icon size={22} />
        </span>
        <div className="vehicle-card__ident">
          <p className="vehicle-card__type">{vehicle.type}</p>
          <p className="vehicle-card__number mono">{vehicle.vehicleNumber}</p>
        </div>
      </div>

      <dl className="vehicle-card__facts">
        <div>
          <dt>
            <MapPin size={12} aria-hidden="true" /> Current location
          </dt>
          <dd>{vehicle.location}</dd>
        </div>
        <div>
          <dt>
            <Weight size={12} aria-hidden="true" /> Capacity
          </dt>
          <dd>{vehicle.capacityKg} kg</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>
            <Badge tone={status.tone} size="sm">
              {status.label}
            </Badge>
          </dd>
        </div>
      </dl>

      {onSelect && (
        <Button
          variant={isSelected ? 'secondary' : 'outline'}
          size="sm"
          fullWidth
          onClick={() => onSelect(vehicle)}
          aria-pressed={isSelected}
        >
          {isSelected ? 'Vehicle selected' : 'Select vehicle'}
        </Button>
      )}
    </article>
  );
}
