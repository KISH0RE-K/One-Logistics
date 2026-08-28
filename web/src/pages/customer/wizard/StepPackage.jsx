import { Box } from 'lucide-react';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { PACKAGE_TYPES } from '../../../utils/shipment';
import { formatDimensions, formatWeight } from '../../../utils/format';
import './wizard.css';

/**
 * Package dimensions and type.
 *
 * Weight and all three dimensions must be greater than zero - the same rule
 * the Mongoose schema and the Joi validator enforce server-side, checked here
 * first so the customer finds out immediately rather than after a round trip.
 */
export default function StepPackage({ value, errors, onChange }) {
  const hasSummary = value.weight || value.length || value.width || value.height;

  return (
    <div className="wizard-step">
      <p className="wizard-step__intro">
        Tell us about what you are sending. Accurate measurements give a better
        cost and transit-time estimate.
      </p>

      <div className="wizard-grid">
        <Input
          label="Weight"
          name="weight"
          type="number"
          inputMode="decimal"
          min="0.01"
          step="0.01"
          placeholder="5"
          suffix="kg"
          value={value.weight}
          onChange={(e) => onChange({ weight: e.target.value })}
          error={errors.weight}
          required
        />

        <Select
          label="Package type"
          name="packageType"
          options={PACKAGE_TYPES}
          placeholder="Choose a type"
          value={value.packageType}
          onChange={(e) => onChange({ packageType: e.target.value })}
          error={errors.packageType}
          required
        />

        <Input
          label="Length"
          name="length"
          type="number"
          inputMode="decimal"
          min="0.01"
          step="0.1"
          placeholder="30"
          suffix="cm"
          value={value.length}
          onChange={(e) => onChange({ length: e.target.value })}
          error={errors.length}
          required
        />

        <Input
          label="Width"
          name="width"
          type="number"
          inputMode="decimal"
          min="0.01"
          step="0.1"
          placeholder="20"
          suffix="cm"
          value={value.width}
          onChange={(e) => onChange({ width: e.target.value })}
          error={errors.width}
          required
        />

        <Input
          label="Height"
          name="height"
          type="number"
          inputMode="decimal"
          min="0.01"
          step="0.1"
          placeholder="15"
          suffix="cm"
          value={value.height}
          onChange={(e) => onChange({ height: e.target.value })}
          error={errors.height}
          containerClassName="wizard-grid__full"
          required
        />
      </div>

      <label className="checkbox">
        <input
          type="checkbox"
          className="checkbox__input"
          checked={Boolean(value.fragile)}
          onChange={(e) => onChange({ fragile: e.target.checked })}
        />
        <span className="checkbox__text">
          This package is fragile
          <span className="checkbox__hint">
            Handled with extra care and labelled for the courier.
          </span>
        </span>
      </label>

      {/* Live summary of what has been entered so far. */}
      {hasSummary && (
        <div className="pkg-summary">
          <span className="pkg-summary__icon" aria-hidden="true">
            <Box size={22} />
          </span>
          <div className="pkg-summary__facts">
            <div>
              <p className="pkg-summary__label">Weight</p>
              <p className="pkg-summary__value">{formatWeight(value.weight)}</p>
            </div>
            <div>
              <p className="pkg-summary__label">Dimensions</p>
              <p className="pkg-summary__value">{formatDimensions(value)}</p>
            </div>
            <div>
              <p className="pkg-summary__label">Type</p>
              <p className="pkg-summary__value">
                {PACKAGE_TYPES.find((t) => t.value === value.packageType)?.label ||
                  'Not chosen'}
              </p>
            </div>
            <div>
              <p className="pkg-summary__label">Handling</p>
              <p className="pkg-summary__value">
                {value.fragile ? 'Fragile' : 'Standard'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
