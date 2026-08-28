import { Link } from 'react-router-dom';
import { History, PackagePlus, Truck } from 'lucide-react';
import ShipmentCard from '../../components/ShipmentCard';
import Button from '../../components/ui/Button';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States';
import { useAsync } from '../../hooks/useAsync';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { getActiveShipments } from '../../api/shipmentApi';
import './lists.css';

/**
 * Shipments currently in flight.
 *
 * Uses GET /api/shipments?active=true, so the filtering to booked, in transit
 * and out for delivery happens on the server rather than being trimmed here.
 */
export default function ActiveShipments() {
  useDocumentTitle('Active shipments');

  const { data: shipments, error, isLoading, reload } = useAsync(getActiveShipments, []);

  return (
    <div className="container page">
      <header className="page-header list-header">
        <div>
          <h1 className="page-title">Active shipments</h1>
          <p className="page-subtitle">
            Everything booked, in transit or out for delivery right now.
          </p>
        </div>

        <div className="list-header__actions">
          <Button variant="outline" to="/shipments/history" iconLeft={History}>
            View history
          </Button>
          <Button to="/ship" iconLeft={PackagePlus}>
            New shipment
          </Button>
        </div>
      </header>

      {isLoading && <LoadingState label="Loading your shipments" count={3} />}

      {!isLoading && error && <ErrorState error={error} onRetry={reload} />}

      {!isLoading && !error && shipments?.length === 0 && (
        <EmptyState
          icon={Truck}
          title="You don't have any shipments yet."
          message="Once you book a shipment it will appear here, with live status and a full delivery timeline."
          action={
            <>
              <Button to="/ship" iconLeft={PackagePlus}>
                Create shipment
              </Button>
              <Button variant="outline" to="/shipments/history">
                See past shipments
              </Button>
            </>
          }
        />
      )}

      {!isLoading && !error && shipments?.length > 0 && (
        <>
          <p className="list-count">
            {shipments.length} active shipment{shipments.length === 1 ? '' : 's'} ·{' '}
            <Link to="/shipments/history">view completed shipments</Link>
          </p>

          <div className="card-grid">
            {shipments.map((shipment) => (
              <ShipmentCard key={shipment._id} shipment={shipment} showCost />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
