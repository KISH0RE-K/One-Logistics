import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import AppRoutes from './routes/AppRoutes';
import ScrollToTop from './routes/ScrollToTop';

/**
 * Application root.
 *
 * Providers wrap the router so a 401 caught anywhere in the API layer can
 * clear the session and let the route guards redirect.
 */
export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <ScrollToTop />
        <AppRoutes />
      </AuthProvider>
    </ToastProvider>
  );
}
