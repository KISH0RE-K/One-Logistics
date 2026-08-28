import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PackageSearch, Search } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import StatusBadge from '../../components/ui/StatusBadge';
import ShipmentTimeline from '../../components/ShipmentTimeline';
import { EmptyState, ErrorState } from '../../components/ui/States';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { trackShipment } from '../../api/shipmentApi';
import { validateTrackingNumber } from '../../utils/validation';
import {
  formatCurrency,
  formatDimensions,
  formatDuration,
  formatWeight,
} from '../../utils/format';
import { statusMeta } from '../../utils/shipment';
import './tracking.css';

/**
 * Shipment tracking.
 *
 * Reads GET /api/tracking/:trackingNumber - the one endpoint that needs no
 * token. All data on this page is live from that response; there is no mock
 * tracking fallback.
 */
export default function Tracking() {
  const { trackingNumber: routeNumber } = useParams();
  const navigate = useNavigate();
  useDocumentTitle(routeNumber ? `Tracking ${routeNumber}` : 'Track a shipment');

  const [query, setQuery] = useState(routeNumber || '');
  const [inputError, setInputError] = useState(null);

  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const lookup = useCallback(async (number) => {
    setIsLoading(true);
    setError(null);
    setNotFound(false);
    setResult(null);

    try {
      const data = await trackShipment(number);
      setResult(data);
    } catch (err) {
      if (err.status === 404) setNotFound(true);
      else setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /* Track straight away when the number is in the URL - which is what the
     links from shipment cards and notifications use. */
  useEffect(() => {
    if (!routeNumber) return;
    setQuery(routeNumber);
    lookup(routeNumber);
  }, [routeNumber, lookup]);

  function handleSubmit(event) {
    event.preventDefault();

    const trimmed = query.trim();
    const validationError = validateTrackingNumber(trimmed);
    if (validationError) {
      setInputError(validationError);
      return;
    }

    setInputError(null);
    // Drive lookups through the URL so a tracking page can be shared.
    navigate(`/track/${trimmed.toUpperCase()}`);
  }

  const pkg = result?.packageDetails;

  return (
    <div className="container page">
      <header className="page-header">
        <h1 className="page-title">Track your shipment</h1>
        <p className="page-subtitle">
          Enter a tracking number to see where a shipment is and everywhere it
          has been.
        </p>
      </header>

      {/* -- Search panel --------------------------------------------------- */}
      <Card padding="lg" className="track-panel">
        <form className="track-form" onSubmit={handleSubmit} noValidate>
          <Input
            label="Tracking number"
            name="trackingNumber"
            placeholder="UPS123456789"
            iconLeft={Search}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (inputError) setInputError(null);
            }}
            error={inputError}
            autoComplete="off"
            spellCheck="false"
            containerClassName="track-form__field"
          />
          <Button type="submit" size="lg" isLoading={isLoading} loadingText="Tracking">
            Track
          </Button>
        </form>
      </Card>

      {/* -- Results -------------------------------------------------------- */}
      {isLoading && (
        <div className="track-loading" aria-busy="true">
          <SkeletonCard lines={4} />
          <SkeletonCard lines={6} />
        </div>
      )}

      {!isLoading && notFound && (
        <EmptyState
          icon={PackageSearch}
          title="We couldn't find a shipment with that tracking number."
          message="Check the number and try again. Tracking numbers look like UPS123456789 and are issued when a shipment is confirmed."
        />
      )}

      {!isLoading && error && <ErrorState error={error} onRetry={() => lookup(query)} />}

      {!isLoading && result && (
        <div className="track-result">
          {/* Summary */}
          <Card padding="lg" className="track-summary">
            <div className="track-summary__head">
              <div>
                <p className="section-label">Tracking number</p>
                <p className="track-summary__number mono">{result.trackingNumber}</p>
              </div>
              <StatusBadge status={result.currentStatus} />
            </div>

            <p className="track-summary__status-note">
              {statusMeta(result.currentStatus).description}
            </p>

            <dl className="track-summary__facts">
              <div>
                <dt>From</dt>
                <dd>{result.from || '—'}</dd>
              </div>
              <div>
                <dt>To</dt>
                <dd>{result.to || '—'}</dd>
              </div>
              <div>
                <dt>Transport mode</dt>
                <dd>{result.transportMode || '—'}</dd>
              </div>
              <div>
                <dt>Service</dt>
                <dd>{result.deliveryOption || '—'}</dd>
              </div>
              <div>
                <dt>Estimated delivery</dt>
                <dd>{formatDuration(result.estimatedTime)}</dd>
              </div>
              <div>
                <dt>Cost</dt>
                <dd className="track-summary__cost">{formatCurrency(result.cost)}</dd>
              </div>
            </dl>

            {pkg && (
              <div className="track-summary__package">
                <p className="section-label">Package</p>
                <p>
                  {formatWeight(pkg.weight)} · {formatDimensions(pkg)} ·{' '}
                  {pkg.packageType}
                  {pkg.fragile ? ' · Fragile' : ''}
                </p>
              </div>
            )}
          </Card>

          {/* Timeline */}
          <Card padding="lg" as="section" aria-labelledby="timeline-heading">
            <h2 className="track-timeline__title" id="timeline-heading">
              Shipment progress
            </h2>
            <ShipmentTimeline events={result.events} status={result.currentStatus} />
          </Card>
        </div>
      )}
    </div>
  );
}
