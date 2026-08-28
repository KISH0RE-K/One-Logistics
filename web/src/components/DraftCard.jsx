import { ArrowRight, Monitor, Smartphone, Trash2 } from 'lucide-react';
import Button from './ui/Button';
import ProgressBar from './ui/ProgressBar';
import { channelLabel, draftProgress } from '../utils/shipment';
import { formatRelative, formatWeight } from '../utils/format';
import './domain.css';

/**
 * A saved, unfinished shipment.
 *
 * The channel line is the heart of the cross-device story: `lastChannel` is
 * written by the backend on every save, so a draft started in the desktop
 * browser genuinely reports "Started on Web" when it is opened on a phone.
 * The completion percentage is computed from the fields the draft actually
 * has - it is not a stored or invented number.
 */
export default function DraftCard({ draft, onContinue, onDelete, isDeleting = false }) {
  if (!draft) return null;

  const progress = draftProgress(draft);
  const pkg = draft.packageId;
  const channel = channelLabel(draft.lastChannel);
  const ChannelIcon = draft.lastChannel === 'mobile' ? Smartphone : Monitor;

  return (
    <article className="draft-card">
      <div className="draft-card__top">
        <div className="draft-card__route">
          <span>{draft.from || 'Pickup not set'}</span>
          <ArrowRight size={15} aria-hidden="true" />
          <span>{draft.to || 'Delivery not set'}</span>
        </div>

        <span className="draft-card__channel">
          <ChannelIcon size={13} aria-hidden="true" />
          Started on {channel}
        </span>
      </div>

      <ProgressBar value={progress} label="Booking progress" />

      <dl className="draft-card__facts">
        <div>
          <dt>Package</dt>
          <dd>{pkg?.weight ? formatWeight(pkg.weight) : 'Not added'}</dd>
        </div>
        <div>
          <dt>Service</dt>
          <dd>{draft.deliveryOption || 'Not chosen'}</dd>
        </div>
        <div>
          <dt>Transport</dt>
          <dd>{draft.transportMode || 'Not chosen'}</dd>
        </div>
      </dl>

      <p className="draft-card__edited">
        Last edited {formatRelative(draft.updatedAt || draft.createdAt)}
      </p>

      <div className="draft-card__actions">
        <Button
          variant="primary"
          size="sm"
          onClick={() => onContinue?.(draft)}
          iconRight={ArrowRight}
        >
          Continue
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete?.(draft)}
          isLoading={isDeleting}
          iconLeft={Trash2}
        >
          Delete
        </Button>
      </div>
    </article>
  );
}
