import { useCallback, useEffect, useState } from 'react';
import { Check, RefreshCw, ServerCrash, Sparkles } from 'lucide-react';
import Button from '../../../components/ui/Button';
import RecommendationCard from '../../../components/RecommendationCard';
import { SkeletonCard } from '../../../components/ui/Skeleton';
import { getRecommendation } from '../../../api/recommendationApi';
import { DELIVERY_OPTIONS } from '../../../utils/shipment';
import './wizard.css';

/**
 * Delivery speed, then the ML recommendation.
 *
 * The recommendation is fetched from POST /api/recommendation, which Express
 * proxies to the Python service. Nothing is predicted in the browser: if that
 * service is unreachable the backend answers 503 and this step says so
 * plainly and lets the customer pick a mode themselves, rather than
 * substituting numbers of our own invention.
 */
export default function StepService({ form, errors, onChange }) {
  const [recommendation, setRecommendation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const { deliveryOption, transportMode } = form;
  const pkg = form.package;
  const fromCity = form.pickup.city;
  const toCity = form.delivery.city;

  const canRequest = Boolean(
    deliveryOption &&
      fromCity &&
      toCity &&
      pkg.weight &&
      pkg.height &&
      pkg.width &&
      pkg.length &&
      pkg.packageType
  );

  const fetchRecommendation = useCallback(async () => {
    if (!canRequest) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await getRecommendation({
        from: fromCity,
        to: toCity,
        weight: pkg.weight,
        height: pkg.height,
        width: pkg.width,
        length: pkg.length,
        deliveryOption,
        packageType: pkg.packageType,
      });
      setRecommendation(result);
    } catch (err) {
      setError(err);
      setRecommendation(null);
    } finally {
      setIsLoading(false);
    }
  }, [
    canRequest,
    fromCity,
    toCity,
    deliveryOption,
    pkg.weight,
    pkg.height,
    pkg.width,
    pkg.length,
    pkg.packageType,
  ]);

  /* Re-request whenever the inputs the model depends on change. */
  useEffect(() => {
    fetchRecommendation();
  }, [fetchRecommendation]);

  /** Choosing a mode also adopts that option's cost and transit estimate. */
  function selectMode(mode, option) {
    onChange({
      transportMode: mode,
      cost: option?.cost,
      estimatedTime: option?.time,
    });
  }

  return (
    <div className="wizard-step">
      <p className="wizard-step__intro">
        Choose how quickly this needs to arrive. We will then compare the
        available transport modes for your route.
      </p>

      {/* -- Delivery speed ------------------------------------------------ */}
      <fieldset className="service-options">
        <legend className="sr-only">Delivery speed</legend>

        {DELIVERY_OPTIONS.map((option) => {
          const isSelected = deliveryOption === option.value;
          return (
            <label
              key={option.value}
              className={`service-option ${isSelected ? 'is-selected' : ''}`}
            >
              <input
                type="radio"
                name="deliveryOption"
                value={option.value}
                checked={isSelected}
                onChange={() =>
                  // Changing the speed invalidates any mode chosen for the old one.
                  onChange({
                    deliveryOption: option.value,
                    transportMode: '',
                    cost: undefined,
                    estimatedTime: undefined,
                  })
                }
                className="sr-only"
              />
              <span className="service-option__head">
                <span className="service-option__name">{option.label}</span>
                {isSelected && (
                  <span className="service-option__check" aria-hidden="true">
                    <Check size={15} />
                  </span>
                )}
              </span>
              <span className="service-option__blurb">{option.blurb}</span>
            </label>
          );
        })}
      </fieldset>

      {errors.deliveryOption && (
        <p className="field__error" role="alert">
          {errors.deliveryOption}
        </p>
      )}

      {/* -- Recommendation ------------------------------------------------ */}
      <section className="rec-section" aria-labelledby="rec-heading">
        <div className="rec-section__head">
          <h3 className="rec-section__title" id="rec-heading">
            <Sparkles size={17} aria-hidden="true" />
            Recommended transport
          </h3>
          {recommendation && !isLoading && (
            <Button
              variant="ghost"
              size="sm"
              iconLeft={RefreshCw}
              onClick={fetchRecommendation}
            >
              Refresh
            </Button>
          )}
        </div>

        {!deliveryOption && (
          <p className="rec-section__hint">
            Choose a delivery speed above to see recommended options.
          </p>
        )}

        {deliveryOption && isLoading && (
          <div aria-busy="true">
            <SkeletonCard lines={4} />
          </div>
        )}

        {deliveryOption && !isLoading && error && (
          <div className="rec-unavailable" role="alert">
            <span className="rec-unavailable__icon" aria-hidden="true">
              <ServerCrash size={22} />
            </span>
            <div>
              <p className="rec-unavailable__title">
                Recommendations are unavailable right now
              </p>
              <p className="rec-unavailable__message">{error.message}</p>
              <p className="rec-unavailable__fallback">
                You can still choose a transport mode below and book as normal.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchRecommendation}>
              Try again
            </Button>
          </div>
        )}

        {deliveryOption && !isLoading && !error && recommendation && (
          <RecommendationCard
            recommendation={recommendation}
            deliveryOption={deliveryOption}
            selectedMode={transportMode}
            onSelectMode={selectMode}
          />
        )}

        {/* Manual fallback whenever the model could not answer. */}
        {deliveryOption && !isLoading && error && (
          <fieldset className="mode-fallback">
            <legend className="section-label">Choose a transport mode</legend>
            <div className="mode-fallback__options">
              {['Road', 'Rail', 'Air'].map((mode) => (
                <label
                  key={mode}
                  className={`mode-fallback__option ${
                    transportMode === mode ? 'is-selected' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="transportMode"
                    value={mode}
                    checked={transportMode === mode}
                    onChange={() => onChange({ transportMode: mode })}
                    className="sr-only"
                  />
                  {mode}
                </label>
              ))}
            </div>
            <p className="mode-fallback__note">
              Cost and transit time will be confirmed once the pricing service
              is reachable again.
            </p>
          </fieldset>
        )}
      </section>
    </div>
  );
}
