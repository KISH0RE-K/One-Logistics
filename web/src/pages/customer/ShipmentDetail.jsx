import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Ban } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import StatusBadge from '../../components/ui/StatusBadge';
import ShipmentTimeline from '../../components/ShipmentTimeline';
import { ConfirmDialog } from '../../components/ui/Modal';
import { ErrorState } from '../../components/ui/States';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { useAsync } from '../../hooks/useAsync';
import { useToast } from '../../hooks/useToast';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { deleteShipment, getShipment } from '../../api/shipmentApi';
import {
  formatCurrency,
  formatDateTime,
  formatDimensions,
  formatDuration,
  formatWeight,
} from '../../utils/format';
import { channelLabel, isActive, statusMeta } from '../../utils/shipment';
import './tracking.css';

/**
 * A single shipment in full.
 *
 * Ownership is enforced by the backend: requesting another customer's
 * shipment returns 403, which the API layer turns into a permission message
 * rather than leaking anything about the record.
 */
export default function ShipmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const { data: shipment, error, isLoading, reload } = useAsync(
    () => getShipment(id),
    [id]
  );

  const [confirmCancel, setConfirmCancel] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  useDocumentTitle(shipment?.trackingNumber || 'Shipment');

  async function handleCancel() {
    setIsCancelling(true);
    try {
      const result = await deleteShipment(id);
      setConfirmCancel(false);

      if (result.deleted) {
        toast.success('Draft deleted.');
        navigate('/drafts', { replace: true });
      } else {
        toast.success('Shipment cancelled.');
        reload();
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsCancelling(false);
    }
  }

  if (isLoading) {
    return (
      <div className="container page" aria-busy="true">
        <SkeletonCard lines={5} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container page">
        <ErrorState
          error={error}
          title={error.status === 403 ? 'Not your shipment' : 'Could not load shipment'}
          onRetry={error.status === 403 ? undefined : reload}
        />
        <div className="detail__back">
          <Button variant="ghost" iconLeft={ArrowLeft} to="/shipments">
            Back to shipments
          </Button>
        </div>
      </div>
    );
  }

  if (!shipment) return null;

  const pkg = shipment.packageId;
  const isDraft = shipment.status === 'draft';
  const canCancel = isActive(shipment) || isDraft;

  return (
    <div className="container page">
      <div className="detail__back">
        <Button variant="ghost" iconLeft={ArrowLeft} onClick={() => navigate(-1)}>
          Back
        </Button>
      </div>

      <header className="page-header detail__header">
        <div>
          <p className="section-label">
            {isDraft ? 'Draft shipment' : 'Tracking number'}
          </p>
          <h1 className="detail__number mono">
            {shipment.trackingNumber || 'Not yet issued'}
          </h1>
          <p className="page-subtitle">{statusMeta(shipment.status).description}</p>
        </div>

        <div className="detail__header-actions">
          <StatusBadge status={shipment.status} />
          {shipment.trackingNumber && (
            <Button
              variant="outline"
              size="sm"
              to={`/track/${shipment.trackingNumber}`}
              iconLeft={MapPin}
            >
              Track
            </Button>
          )}
          {isDraft && (
            <Button size="sm" to={`/ship?draft=${shipment._id}`}>
              Continue draft
            </Button>
          )}
        </div>
      </header>

      <div className="detail__grid">
        <Card padding="lg" as="section" aria-labelledby="detail-summary">
          <h2 className="detail__section-title" id="detail-summary">
            Shipment details
          </h2>

          <dl className="detail__facts">
            <div>
              <dt>From</dt>
              <dd>{shipment.from || '—'}</dd>
            </div>
            <div>
              <dt>To</dt>
              <dd>{shipment.to || '—'}</dd>
            </div>
            <div>
              <dt>Service</dt>
              <dd>{shipment.deliveryOption || '—'}</dd>
            </div>
            <div>
              <dt>Transport mode</dt>
              <dd>{shipment.transportMode || '—'}</dd>
            </div>
            <div>
              <dt>Estimated delivery</dt>
              <dd>{formatDuration(shipment.estimatedTime)}</dd>
            </div>
            <div>
              <dt>Cost</dt>
              <dd className="detail__cost">{formatCurrency(shipment.cost)}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{formatDateTime(shipment.createdAt)}</dd>
            </div>
            <div>
              <dt>Last updated on</dt>
              <dd>{channelLabel(shipment.lastChannel)}</dd>
            </div>
          </dl>

          {pkg && (
            <>
              <h3 className="detail__subsection">Package</h3>
              <dl className="detail__facts">
                <div>
                  <dt>Weight</dt>
                  <dd>{formatWeight(pkg.weight)}</dd>
                </div>
                <div>
                  <dt>Dimensions</dt>
                  <dd>{formatDimensions(pkg)}</dd>
                </div>
                <div>
                  <dt>Type</dt>
                  <dd className="detail__capitalize">{pkg.packageType}</dd>
                </div>
                <div>
                  <dt>Handling</dt>
                  <dd>{pkg.fragile ? 'Fragile' : 'Standard'}</dd>
                </div>
              </dl>
            </>
          )}

          {canCancel && (
            <div className="detail__danger">
              <Button variant="ghost" iconLeft={Ban} onClick={() => setConfirmCancel(true)}>
                {isDraft ? 'Delete draft' : 'Cancel shipment'}
              </Button>
            </div>
          )}
        </Card>

        <Card padding="lg" as="section" aria-labelledby="detail-timeline">
          <h2 className="detail__section-title" id="detail-timeline">
            Progress
          </h2>
          {isDraft ? (
            <p className="detail__draft-note">
              This shipment has not been booked yet, so it has no tracking
              events. Continue the draft to confirm it.
            </p>
          ) : (
            <ShipmentTimeline events={shipment.events} status={shipment.status} />
          )}
        </Card>
      </div>

      <ConfirmDialog
        isOpen={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={handleCancel}
        isLoading={isCancelling}
        title={isDraft ? 'Delete this draft?' : 'Cancel this shipment?'}
        message={
          isDraft
            ? 'This draft will be permanently removed. This cannot be undone.'
            : `Shipment ${shipment.trackingNumber} will be cancelled. The record is kept for your history, but it will no longer be delivered.`
        }
        confirmLabel={isDraft ? 'Delete draft' : 'Cancel shipment'}
        cancelLabel={isDraft ? 'Keep draft' : 'Keep shipment'}
      />
    </div>
  );
}
