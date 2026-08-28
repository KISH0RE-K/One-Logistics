import Badge from './Badge';
import { statusMeta } from '../../utils/shipment';

/** Shipment status as a labelled pill, using the shared status vocabulary. */
export default function StatusBadge({ status, size = 'md' }) {
  const meta = statusMeta(status);
  return (
    <Badge tone={meta.tone} size={size}>
      {meta.label}
    </Badge>
  );
}
