import { useMemo } from 'react';
import {
  Ban,
  CheckCircle2,
  Package,
  Truck,
  TruckIcon,
  Users,
  Wrench,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/States';
import { useAsync } from '../../hooks/useAsync';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { getDashboard, getVehicles } from '../../api/adminApi';
import { VEHICLE_STATUSES } from '../../utils/shipment';
import './admin.css';

/**
 * Operations dashboard.
 *
 * Counts come from GET /api/admin/dashboard, which the backend aggregates
 * from the existing collections - there is no analytics store and nothing is
 * estimated here. The breakdown panels are computed from the vehicle list the
 * admin API returns, so every bar is a real count of real documents.
 */
export default function AdminDashboard() {
  useDocumentTitle('Admin dashboard');

  const stats = useAsync(getDashboard, []);
  const fleet = useAsync(() => getVehicles(), []);

  const vehicleBreakdown = useMemo(() => {
    const vehicles = fleet.data || [];
    return VEHICLE_STATUSES.map((status) => ({
      ...status,
      count: vehicles.filter((v) => v.status === status.value).length,
    }));
  }, [fleet.data]);

  const typeBreakdown = useMemo(() => {
    const vehicles = fleet.data || [];
    const counts = new Map();
    for (const vehicle of vehicles) {
      counts.set(vehicle.type, (counts.get(vehicle.type) || 0) + 1);
    }
    return [...counts.entries()]
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }, [fleet.data]);

  const s = stats.data;
  const totalFleet = fleet.data?.length || 0;

  const shipmentBreakdown = s
    ? [
        { label: 'Active', count: s.shipments.active, tone: 'info' },
        { label: 'Delivered', count: s.shipments.delivered, tone: 'success' },
        { label: 'Cancelled', count: s.shipments.cancelled, tone: 'danger' },
      ]
    : [];

  return (
    <>
      <header className="page-header">
        <h1 className="page-title">Operations dashboard</h1>
        <p className="page-subtitle">
          Live totals across shipments, fleet and customers.
        </p>
      </header>

      {stats.error && (
        <div className="admin-error">
          <ErrorState error={stats.error} onRetry={stats.reload} />
        </div>
      )}

      {/* -- Metric tiles --------------------------------------------------- */}
      <section className="metric-grid" aria-label="Key metrics">
        <Metric
          label="Total shipments"
          value={s?.shipments.total}
          icon={Package}
          isLoading={stats.isLoading}
          hasError={Boolean(stats.error)}
          hint="Drafts excluded"
        />
        <Metric
          label="Active shipments"
          value={s?.shipments.active}
          icon={Truck}
          isLoading={stats.isLoading}
          hasError={Boolean(stats.error)}
          hint="Booked, in transit or out for delivery"
        />
        <Metric
          label="Delivered"
          value={s?.shipments.delivered}
          icon={CheckCircle2}
          tone="success"
          isLoading={stats.isLoading}
          hasError={Boolean(stats.error)}
        />
        <Metric
          label="Cancelled"
          value={s?.shipments.cancelled}
          icon={Ban}
          tone="danger"
          isLoading={stats.isLoading}
          hasError={Boolean(stats.error)}
        />
        <Metric
          label="Available vehicles"
          value={s?.vehicles.available}
          icon={TruckIcon}
          isLoading={stats.isLoading}
          hasError={Boolean(stats.error)}
        />
        <Metric
          label="Vehicles in transit"
          value={s?.vehicles.inTransit}
          icon={Wrench}
          isLoading={stats.isLoading}
          hasError={Boolean(stats.error)}
        />
        <Metric
          label="Total customers"
          value={s?.users.total}
          icon={Users}
          isLoading={stats.isLoading}
          hasError={Boolean(stats.error)}
          hint="All registered accounts"
        />
      </section>

      {/* -- Breakdowns ----------------------------------------------------- */}
      <section className="admin-panels" aria-label="Breakdowns">
        <Card padding="lg" as="section" aria-labelledby="status-breakdown">
          <h2 className="admin-panel__title" id="status-breakdown">
            Shipment status
          </h2>

          {stats.isLoading ? (
            <PanelSkeleton rows={3} />
          ) : stats.error ? (
            <p className="admin-panel__empty">Unavailable.</p>
          ) : s.shipments.total === 0 ? (
            <p className="admin-panel__empty">No shipments recorded yet.</p>
          ) : (
            <ul className="bar-list">
              {shipmentBreakdown.map((row) => (
                <BarRow
                  key={row.label}
                  label={row.label}
                  count={row.count}
                  total={s.shipments.total}
                  tone={row.tone}
                />
              ))}
            </ul>
          )}
        </Card>

        <Card padding="lg" as="section" aria-labelledby="fleet-breakdown">
          <h2 className="admin-panel__title" id="fleet-breakdown">
            Vehicle availability
          </h2>

          {fleet.isLoading ? (
            <PanelSkeleton rows={4} />
          ) : fleet.error ? (
            <p className="admin-panel__empty">Unavailable.</p>
          ) : totalFleet === 0 ? (
            <p className="admin-panel__empty">No vehicles registered yet.</p>
          ) : (
            <ul className="bar-list">
              {vehicleBreakdown.map((row) => (
                <BarRow
                  key={row.value}
                  label={row.label}
                  count={row.count}
                  total={totalFleet}
                  tone={row.tone}
                />
              ))}
            </ul>
          )}
        </Card>

        <Card padding="lg" as="section" aria-labelledby="type-breakdown">
          <h2 className="admin-panel__title" id="type-breakdown">
            Transport mode distribution
          </h2>
          <p className="admin-panel__sub">Registered fleet by vehicle type</p>

          {fleet.isLoading ? (
            <PanelSkeleton rows={4} />
          ) : fleet.error ? (
            <p className="admin-panel__empty">Unavailable.</p>
          ) : typeBreakdown.length === 0 ? (
            <p className="admin-panel__empty">No vehicles registered yet.</p>
          ) : (
            <ul className="bar-list">
              {typeBreakdown.map((row) => (
                <BarRow
                  key={row.type}
                  label={row.type}
                  count={row.count}
                  total={totalFleet}
                  tone="neutral"
                />
              ))}
            </ul>
          )}
        </Card>
      </section>
    </>
  );
}

function Metric({ label, value, icon: Icon, hint, tone = 'neutral', isLoading, hasError }) {
  return (
    <Card padding="lg" className={`metric metric--${tone}`}>
      <span className="metric__icon" aria-hidden="true">
        <Icon size={18} />
      </span>

      <p className="metric__label">{label}</p>

      {isLoading ? (
        <Skeleton width={72} height={40} />
      ) : (
        <p className="metric__value">{hasError ? '—' : (value ?? 0)}</p>
      )}

      {hint && <p className="metric__hint">{hint}</p>}
    </Card>
  );
}

function BarRow({ label, count, total, tone }) {
  const percent = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <li className="bar-row">
      <div className="bar-row__head">
        <span className="bar-row__label">{label}</span>
        <span className="bar-row__count">
          {count}
          <span className="bar-row__percent">({percent}%)</span>
        </span>
      </div>
      <div
        className={`bar-row__track bar-row__track--${tone}`}
        role="img"
        aria-label={`${label}: ${count} of ${total}, ${percent} percent`}
      >
        <div className="bar-row__fill" style={{ width: `${percent}%` }} />
      </div>
    </li>
  );
}

function PanelSkeleton({ rows }) {
  return (
    <div className="bar-list" aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="bar-row">
          <Skeleton width="40%" height={13} />
          <Skeleton height={10} radius="999px" />
        </div>
      ))}
    </div>
  );
}
