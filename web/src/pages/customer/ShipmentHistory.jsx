import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, History, PackagePlus } from 'lucide-react';
import ShipmentCard from '../../components/ShipmentCard';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import StatusBadge from '../../components/ui/StatusBadge';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States';
import { useAsync } from '../../hooks/useAsync';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { getShipments } from '../../api/shipmentApi';
import { CLOSED_STATUSES } from '../../utils/shipment';
import { formatCurrency, formatDate } from '../../utils/format';
import './lists.css';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

/**
 * Completed and cancelled shipments.
 *
 * A table on desktop, where comparison across rows is the point, and the same
 * data as cards on mobile - not a squeezed table with a horizontal scrollbar.
 */
export default function ShipmentHistory() {
  useDocumentTitle('Shipment history');
  const isMobile = useIsMobile();

  const [filter, setFilter] = useState('all');
  const { data: shipments, error, isLoading, reload } = useAsync(() => getShipments(), []);

  const closed = useMemo(
    () =>
      (shipments || [])
        .filter((s) => CLOSED_STATUSES.includes(s.status))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [shipments]
  );

  const visible = useMemo(
    () => (filter === 'all' ? closed : closed.filter((s) => s.status === filter)),
    [closed, filter]
  );

  return (
    <div className="container page">
      <header className="page-header list-header">
        <div>
          <h1 className="page-title">Shipment history</h1>
          <p className="page-subtitle">
            Every shipment that has been delivered or cancelled.
          </p>
        </div>

        <Button variant="outline" to="/shipments">
          Active shipments
        </Button>
      </header>

      {isLoading && <LoadingState label="Loading your history" count={3} layout="list" />}

      {!isLoading && error && <ErrorState error={error} onRetry={reload} />}

      {!isLoading && !error && closed.length === 0 && (
        <EmptyState
          icon={History}
          title="No completed shipments yet."
          message="Once a shipment is delivered or cancelled it moves here, so your active list stays focused on what is still moving."
          action={
            <Button to="/ship" iconLeft={PackagePlus}>
              Create shipment
            </Button>
          }
        />
      )}

      {!isLoading && !error && closed.length > 0 && (
        <>
          {/* Filter */}
          <div className="filter-bar" role="group" aria-label="Filter by status">
            {FILTERS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`filter-chip ${filter === option.value ? 'is-active' : ''}`}
                onClick={() => setFilter(option.value)}
                aria-pressed={filter === option.value}
              >
                {option.label}
                <span className="filter-chip__count">
                  {option.value === 'all'
                    ? closed.length
                    : closed.filter((s) => s.status === option.value).length}
                </span>
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <EmptyState
              icon={History}
              title={`No ${filter} shipments`}
              message="Try a different filter to see more of your history."
            />
          ) : isMobile ? (
            <div className="card-grid">
              {visible.map((shipment) => (
                <ShipmentCard key={shipment._id} shipment={shipment} showCost />
              ))}
            </div>
          ) : (
            <Card padding="none" className="table-card">
              <div className="scroll-x">
                <table className="data-table">
                  <caption className="sr-only">
                    Completed and cancelled shipments
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Tracking number</th>
                      <th scope="col">Route</th>
                      <th scope="col">Date</th>
                      <th scope="col">Status</th>
                      <th scope="col">Cost</th>
                      <th scope="col">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((shipment) => (
                      <tr key={shipment._id}>
                        <td className="mono data-table__strong">
                          {shipment.trackingNumber}
                        </td>
                        <td>
                          {shipment.from} <span aria-hidden="true">→</span> {shipment.to}
                        </td>
                        <td>{formatDate(shipment.createdAt)}</td>
                        <td>
                          <StatusBadge status={shipment.status} size="sm" />
                        </td>
                        <td className="data-table__strong">
                          {formatCurrency(shipment.cost)}
                        </td>
                        <td className="data-table__actions">
                          <Link
                            to={`/shipments/${shipment._id}`}
                            className="data-table__link"
                          >
                            View details
                            <ArrowRight size={14} aria-hidden="true" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
