import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import FullPageLoader from '../components/FullPageLoader';

/** Sends "/" to the right home: admin console, customer dashboard, or login. */
export default function RootRedirect() {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();

  if (isLoading) return <FullPageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />;
}
