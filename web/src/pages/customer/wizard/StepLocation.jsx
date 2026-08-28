import { Info } from 'lucide-react';
import Input from '../../../components/ui/Input';
import './wizard.css';

const COPY = {
  pickup: {
    intro: 'Where should we collect this shipment?',
    addressLabel: 'Pickup address',
    contactLabel: 'Pickup contact',
  },
  delivery: {
    intro: 'Where is this shipment going?',
    addressLabel: 'Delivery address',
    contactLabel: 'Delivery contact',
  },
};

/**
 * Pickup and delivery share one component - the fields are identical and the
 * copy is the only difference.
 *
 * A note on what is stored: the current backend models origin and destination
 * as single city strings, so only City is persisted. The remaining fields are
 * collected for the booking review but are dropped in shipmentApi.js, which
 * documents exactly how to persist them once the schema supports it. Saying
 * so in the UI is better than quietly losing what someone typed.
 */
export default function StepLocation({ kind, value, errors, onChange }) {
  const copy = COPY[kind];

  return (
    <div className="wizard-step">
      <p className="wizard-step__intro">{copy.intro}</p>

      <div className="wizard-grid">
        <Input
          label={copy.addressLabel}
          name={`${kind}-address`}
          autoComplete={kind === 'pickup' ? 'street-address' : 'shipping street-address'}
          placeholder="12 Anna Salai, Nungambakkam"
          value={value.addressLine}
          onChange={(e) => onChange({ addressLine: e.target.value })}
          error={errors.addressLine}
          containerClassName="wizard-grid__full"
          required
        />

        <Input
          label="City"
          name={`${kind}-city`}
          autoComplete="address-level2"
          placeholder="Chennai"
          value={value.city}
          onChange={(e) => onChange({ city: e.target.value })}
          error={errors.city}
          hint="Used to match available vehicles and to price the route."
          required
        />

        <Input
          label="State"
          name={`${kind}-state`}
          autoComplete="address-level1"
          placeholder="Tamil Nadu"
          value={value.state}
          onChange={(e) => onChange({ state: e.target.value })}
          error={errors.state}
          required
        />

        <Input
          label="Postal code"
          name={`${kind}-postal`}
          autoComplete="postal-code"
          inputMode="numeric"
          placeholder="600034"
          value={value.postalCode}
          onChange={(e) => onChange({ postalCode: e.target.value })}
          error={errors.postalCode}
          required
        />

        <Input
          label="Contact name"
          name={`${kind}-contact-name`}
          autoComplete="name"
          placeholder="Alex Menon"
          value={value.contactName}
          onChange={(e) => onChange({ contactName: e.target.value })}
          error={errors.contactName}
          required
        />

        <Input
          label="Contact phone"
          name={`${kind}-contact-phone`}
          type="tel"
          autoComplete="tel"
          placeholder="+91 98765 43210"
          value={value.contactPhone}
          onChange={(e) => onChange({ contactPhone: e.target.value })}
          error={errors.contactPhone}
          containerClassName="wizard-grid__full"
          required
        />
      </div>

      <p className="wizard-note">
        <Info size={15} aria-hidden="true" />
        <span>
          The shipping API currently stores the <strong>city</strong> for each
          end of the route. Street, postal code and contact details are shown on
          your review but are not saved with the shipment yet.
        </span>
      </p>
    </div>
  );
}
