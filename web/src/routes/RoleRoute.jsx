import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import FullPageLoader from '../components/FullPageLoader';

/**
 * Role gate.
 *
 * A customer who types /admin is sent to their own dashboard rather than
 * shown an admin shell they cannot use. Again: presentation only. The Express
 * `requireAdmin` middleware is what actually refuses a customer token, and it
 * would still refuse one if this component were removed entirely.
 */
export default function RoleRoute({ role = 'admin', redirectTo = '/dashboard' }) {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) return <FullPageLoader label="Checking your permissions" />;

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (user?.role !== role) return <Navigate to={redirectTo} replace />;

  return <Outlet />;
}

/**
 * The mirror of the above: keeps an admin out of the customer app so they
 * land in the operations console instead.
 */
export function CustomerOnlyRoute() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) return <FullPageLoader label="Loading" />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'admin') return <Navigate to="/admin" replace />;

  return <Outlet />;
}
