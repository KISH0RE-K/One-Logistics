import { Check, Info, Plane, Train, Truck } from 'lucide-react';
import Badge from './ui/Badge';
import { formatCurrency, formatHours } from '../utils/format';
import './domain.css';

const MODE_ICON = { Road: Truck, Rail: Train, Air: Plane };

/**
 * The ML service's recommendation and its alternatives.
 *
 * Every number here is what the Python model returned through the Express
 * proxy - nothing is computed, adjusted or invented in the browser. The
 * explanation is written from the model's own output (which mode it picked,
 * how it compares on cost and time against the alternatives it returned) so
 * it stays truthful rather than decorative.
 */
export default function RecommendationCard({
  recommendation,
  deliveryOption,
  selectedMode,
  onSelectMode,
}) {
  if (!recommendation) return null;

  const { recommendedMode, options = [] } = recommendation;
  const recommended = options.find((o) => o.mode === recommendedMode) || null;
  const alternatives = options.filter((o) => o.mode !== recommendedMode);

  const RecommendedIcon = MODE_ICON[recommendedMode] || Truck;
  const isRecommendedSelected = selectedMode === recommendedMode;

  /** Explain the pick using only the numbers the model actually returned. */
  function explain() {
    if (!recommended || options.length < 2) {
      return `The model selected ${recommendedMode} for this shipment.`;
    }

    const fastest = options.reduce((a, b) => (a.time <= b.time ? a : b));
    const cheapest = options.reduce((a, b) => (a.cost <= b.cost ? a : b));

    const reasons = [];
    if (fastest.mode === recommendedMode) {
      reasons.push('the shortest estimated delivery time');
    }
    if (cheapest.mode === recommendedMode) {
      reasons.push('the lowest cost');
    }

    if (reasons.length) {
      return `Recommended because you selected ${deliveryOption} delivery and this option provides ${reasons.join(
        ' and '
      )} of the options returned.`;
    }

    // Neither fastest nor cheapest: say so plainly rather than overselling it.
    return `Recommended as the best balance for ${deliveryOption} delivery. ${fastest.mode} is faster (${formatHours(
      fastest.time
    )}) and ${cheapest.mode} is cheaper (${formatCurrency(cheapest.cost)}).`;
  }

  return (
    <div className="rec">
      {/* Headline recommendation */}
      <article
        className={`rec__primary ${isRecommendedSelected ? 'is-selected' : ''}`}
      >
        <div className="rec__badge-row">
          <Badge tone="gold" size="sm">
            Recommended
          </Badge>
          {isRecommendedSelected && (
            <span className="rec__chosen">
              <Check size={13} aria-hidden="true" /> Chosen
            </span>
          )}
        </div>

        <div className="rec__mode">
          <span className="rec__mode-icon" aria-hidden="true">
            <RecommendedIcon size={26} />
          </span>
          <span className="rec__mode-name">{recommendedMode}</span>
        </div>

        {recommended && (
          <div className="rec__numbers">
            <div>
              <p className="rec__number-label">Estimated cost</p>
              <p className="rec__cost">{formatCurrency(recommended.cost)}</p>
            </div>
            <div>
              <p className="rec__number-label">Estimated delivery</p>
              <p className="rec__time">{formatHours(recommended.time)}</p>
            </div>
          </div>
        )}

        <p className="rec__why">
          <Info size={15} aria-hidden="true" />
          <span>
            <strong>Why this is recommended: </strong>
            {explain()}
          </span>
        </p>

        {onSelectMode && (
          <button
            type="button"
            className="rec__choose"
            onClick={() => onSelectMode(recommendedMode, recommended)}
            aria-pressed={isRecommendedSelected}
          >
            {isRecommendedSelected
              ? `${recommendedMode} selected`
              : `Choose ${recommendedMode}`}
          </button>
        )}
      </article>

      {/* Alternatives */}
      {alternatives.length > 0 && (
        <div className="rec__alts">
          <p className="section-label">Other options</p>
          <div className="rec__alt-grid">
            {alternatives.map((option) => {
              const Icon = MODE_ICON[option.mode] || Truck;
              const isSelected = selectedMode === option.mode;
              return (
                <article
                  key={option.mode}
                  className={`rec__alt ${isSelected ? 'is-selected' : ''}`}
                >
                  <div className="rec__alt-head">
                    <Icon size={18} aria-hidden="true" />
                    <span className="rec__alt-name">{option.mode}</span>
                    {isSelected && (
                      <Check className="rec__alt-check" size={15} aria-hidden="true" />
                    )}
                  </div>
                  <p className="rec__alt-cost">{formatCurrency(option.cost)}</p>
                  <p className="rec__alt-time">{formatHours(option.time)}</p>

                  {onSelectMode && (
                    <button
                      type="button"
                      className="rec__alt-choose"
                      onClick={() => onSelectMode(option.mode, option)}
                      aria-pressed={isSelected}
                    >
                      {isSelected ? 'Selected' : `Choose ${option.mode}`}
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
