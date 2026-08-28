import { useCallback, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, PackageCheck } from 'lucide-react';
import { useDismissable } from '../hooks/useDismissable';
import { useAsync } from '../hooks/useAsync';
import { getActiveShipments } from '../api/shipmentApi';
import { formatRelative } from '../utils/format';
import StatusBadge from './ui/StatusBadge';
import './NotificationsMenu.css';

/**
 * Notification bell.
 *
 * The backend has no notifications collection or endpoint, and inventing
 * fake alerts would be dishonest - so this is built entirely from real data:
 * the latest recorded timeline event on each of the user's active shipments.
 * That is genuinely what the customer would want to be told about, and every
 * line is traceable to a document in MongoDB.
 */
export default function NotificationsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const close = useCallback(() => setIsOpen(false), []);
  useDismissable(containerRef, isOpen, close);

  const { data: shipments, isLoading, error } = useAsync(getActiveShipments, []);

  const updates = (shipments || [])
    .map((shipment) => {
      const events = [...(shipment.events || [])].sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );
      return { shipment, latest: events[0] || null };
    })
    .filter((entry) => entry.latest)
    .sort((a, b) => new Date(b.latest.timestamp) - new Date(a.latest.timestamp))
    .slice(0, 6);

  const count = updates.length;

  return (
    <div className="notifications" ref={containerRef}>
      <button
        type="button"
        className="notifications__trigger"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={
          count > 0
            ? `Notifications, ${count} shipment update${count === 1 ? '' : 's'}`
            : 'Notifications'
        }
      >
        <Bell size={19} aria-hidden="true" />
        {count > 0 && (
          <span className="notifications__count" aria-hidden="true">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notifications__panel" role="dialog" aria-label="Shipment updates">
          <div className="notifications__header">
            <p className="notifications__title">Shipment updates</p>
            <p className="notifications__subtitle">
              The most recent scan on each active shipment
            </p>
          </div>

          <div className="notifications__list">
            {isLoading && <p className="notifications__empty">Loading updates…</p>}

            {error && !isLoading && (
              <p className="notifications__empty">
                Updates are unavailable right now.
              </p>
            )}

            {!isLoading && !error && count === 0 && (
              <div className="notifications__empty-state">
                <PackageCheck size={22} aria-hidden="true" />
                <p>No active shipments to report on.</p>
              </div>
            )}

            {!isLoading &&
              !error &&
              updates.map(({ shipment, latest }) => (
                <Link
                  key={shipment._id}
                  to={`/track/${shipment.trackingNumber}`}
                  className="notifications__item"
                  onClick={close}
                >
                  <div className="notifications__item-top">
                    <span className="notifications__event">{latest.status}</span>
                    <StatusBadge status={shipment.status} size="sm" />
                  </div>
                  <p className="notifications__route">
                    {shipment.from} to {shipment.to}
                  </p>
                  <p className="notifications__meta">
                    {latest.location ? `${latest.location} · ` : ''}
                    {formatRelative(latest.timestamp)}
                  </p>
                </Link>
              ))}
          </div>

          <Link to="/shipments" className="notifications__footer" onClick={close}>
            View all active shipments
          </Link>
        </div>
      )}
    </div>
  );
}
