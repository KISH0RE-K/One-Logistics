import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import FullPageLoader from '../components/FullPageLoader';

/**
 * Gate for signed-in routes.
 *
 * This is a UX layer only. It stops a signed-out visitor from seeing an empty
 * shell, but it grants nothing: every protected endpoint independently
 * verifies the JWT server-side, which is the boundary that actually matters.
 *
 * The attempted path is remembered so the user lands where they meant to go
 * after signing in.
 */
export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <FullPageLoader label="Checking your session" />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
