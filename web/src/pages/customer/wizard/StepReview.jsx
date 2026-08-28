import { Pencil } from 'lucide-react';
import Badge from '../../../components/ui/Badge';
import {
  formatCurrency,
  formatDimensions,
  formatHours,
  formatWeight,
} from '../../../utils/format';
import { PACKAGE_TYPES } from '../../../utils/shipment';
import './wizard.css';

/**
 * Final check before booking. Every row links back to the step that owns it,
 * so correcting something never means starting over.
 */
export default function StepReview({ form, onEditStep }) {
  const pkg = form.package;
  const packageType =
    PACKAGE_TYPES.find((t) => t.value === pkg.packageType)?.label || 'Not chosen';

  return (
    <div className="wizard-step">
      <p className="wizard-step__intro">
        Check the details below, then confirm to book. A tracking number is
        issued as soon as the shipment is created.
      </p>

      <div className="review">
        <ReviewBlock title="Pickup" onEdit={() => onEditStep(0)}>
          <ReviewLine label="Address" value={form.pickup.addressLine} />
          <ReviewLine label="City" value={form.pickup.city} emphasis />
          <ReviewLine label="State" value={form.pickup.state} />
          <ReviewLine label="Postal code" value={form.pickup.postalCode} />
          <ReviewLine label="Contact" value={form.pickup.contactName} />
          <ReviewLine label="Phone" value={form.pickup.contactPhone} />
        </ReviewBlock>

        <ReviewBlock title="Delivery" onEdit={() => onEditStep(1)}>
          <ReviewLine label="Address" value={form.delivery.addressLine} />
          <ReviewLine label="City" value={form.delivery.city} emphasis />
          <ReviewLine label="State" value={form.delivery.state} />
          <ReviewLine label="Postal code" value={form.delivery.postalCode} />
          <ReviewLine label="Contact" value={form.delivery.contactName} />
          <ReviewLine label="Phone" value={form.delivery.contactPhone} />
        </ReviewBlock>

        <ReviewBlock title="Package" onEdit={() => onEditStep(2)}>
          <ReviewLine label="Weight" value={formatWeight(pkg.weight)} emphasis />
          <ReviewLine label="Dimensions" value={formatDimensions(pkg)} />
          <ReviewLine label="Type" value={packageType} />
          <ReviewLine label="Handling" value={pkg.fragile ? 'Fragile' : 'Standard'} />
        </ReviewBlock>

        <ReviewBlock title="Service" onEdit={() => onEditStep(3)}>
          <ReviewLine label="Delivery speed" value={form.deliveryOption} emphasis />
          <ReviewLine label="Transport mode" value={form.transportMode} emphasis />
        </ReviewBlock>

        <ReviewBlock title="Vehicle" onEdit={() => onEditStep(4)}>
          {form.vehicle ? (
            <>
              <ReviewLine label="Type" value={form.vehicle.type} />
              <ReviewLine label="Vehicle" value={form.vehicle.vehicleNumber} emphasis />
              <ReviewLine label="Location" value={form.vehicle.location} />
              <ReviewLine label="Capacity" value={`${form.vehicle.capacityKg} kg`} />
              <p className="review__caveat">
                Shown for your reference. The shipping API does not record a
                vehicle against a shipment yet.
              </p>
            </>
          ) : (
            <p className="review__none">No specific vehicle selected.</p>
          )}
        </ReviewBlock>
      </div>

      {/* Estimates, carried over from whichever option the model returned. */}
      <div className="review-totals">
        <div className="review-totals__item">
          <p className="review-totals__label">Estimated cost</p>
          <p className="review-totals__value review-totals__value--cost">
            {formatCurrency(form.cost)}
          </p>
        </div>
        <div className="review-totals__item">
          <p className="review-totals__label">Estimated delivery time</p>
          <p className="review-totals__value">{formatHours(form.estimatedTime)}</p>
        </div>
        <div className="review-totals__item">
          <p className="review-totals__label">Transport</p>
          <p className="review-totals__value">
            <Badge tone="gold">{form.transportMode || 'Not chosen'}</Badge>
          </p>
        </div>
      </div>

      {(form.cost === undefined || form.estimatedTime === undefined) && (
        <p className="review__estimate-note">
          Cost and transit time will be confirmed once the pricing service
          returns an estimate for this route.
        </p>
      )}
    </div>
  );
}

function ReviewBlock({ title, onEdit, children }) {
  return (
    <section className="review-block">
      <header className="review-block__head">
        <h3 className="review-block__title">{title}</h3>
        <button type="button" className="review-block__edit" onClick={onEdit}>
          <Pencil size={13} aria-hidden="true" />
          Edit
          <span className="sr-only"> {title}</span>
        </button>
      </header>
      <dl className="review-block__list">{children}</dl>
    </section>
  );
}

function ReviewLine({ label, value, emphasis = false }) {
  return (
    <div className="review-line">
      <dt>{label}</dt>
      <dd className={emphasis ? 'is-emphasis' : ''}>{value || '—'}</dd>
    </div>
  );
}
