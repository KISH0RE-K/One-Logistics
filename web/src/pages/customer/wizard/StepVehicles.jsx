import { Info, TruckIcon } from 'lucide-react';
import VehicleCard from '../../../components/VehicleCard';
import Button from '../../../components/ui/Button';
import { EmptyState, ErrorState, LoadingState } from '../../../components/ui/States';
import { useAsync } from '../../../hooks/useAsync';
import { getAvailableVehicles } from '../../../api/vehicleApi';
import { formatWeight } from '../../../utils/format';
import './wizard.css';

/**
 * Vehicles that could actually carry this shipment.
 *
 * Queried from GET /api/vehicles/available with the pickup city and the
 * package weight, so the backend filters on availability, an exact location
 * match and sufficient capacity. This request is deliberately independent of
 * the recommendation call - either can fail without taking the other down.
 *
 * Selecting a vehicle is optional, and worth being straight about: the
 * shipment schema has no vehicle reference, so the choice appears on the
 * review but is not stored with the booking.
 */
export default function StepVehicles({ form, onSelect }) {
  const location = form.pickup.city;
  const weight = form.package.weight;

  const { data: vehicles, error, isLoading, reload } = useAsync(
    () => getAvailableVehicles({ location, weight }),
    [location, weight]
  );

  const selectedId = form.vehicle?._id;

  return (
    <div className="wizard-step">
      <p className="wizard-step__intro">
        Vehicles currently available in <strong>{location}</strong> with
        capacity for {formatWeight(weight)}.
      </p>

      {isLoading && <LoadingState label="Finding available vehicles" count={3} />}

      {!isLoading && error && <ErrorState error={error} onRetry={reload} />}

      {!isLoading && !error && vehicles?.length === 0 && (
        <EmptyState
          icon={TruckIcon}
          title="No suitable vehicles are currently available"
          message={`Nothing in ${location} can carry ${formatWeight(
            weight
          )} right now. You can continue and book without reserving a specific vehicle.`}
        />
      )}

      {!isLoading && !error && vehicles?.length > 0 && (
        <>
          <div className="vehicle-grid">
            {vehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle._id}
                vehicle={vehicle}
                isSelected={selectedId === vehicle._id}
                onSelect={onSelect}
              />
            ))}
          </div>

          {form.vehicle && (
            <div className="vehicle-clear">
              <Button variant="ghost" size="sm" onClick={() => onSelect(null)}>
                Clear selection
              </Button>
            </div>
          )}
        </>
      )}

      <p className="wizard-note">
        <Info size={15} aria-hidden="true" />
        <span>
          Choosing a vehicle is optional. The shipping API does not yet record a
          vehicle against a shipment, so your choice is shown on the review but
          is not reserved.
        </span>
      </p>
    </div>
  );
}
