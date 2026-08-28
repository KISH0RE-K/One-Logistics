import { Route, Routes } from 'react-router-dom';

import AuthLayout from '../layouts/AuthLayout';
import CustomerLayout from '../layouts/CustomerLayout';
import AdminLayout from '../layouts/AdminLayout';

import ProtectedRoute from './ProtectedRoute';
import RoleRoute, { CustomerOnlyRoute } from './RoleRoute';
import RootRedirect from './RootRedirect';

import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';

import Dashboard from '../pages/customer/Dashboard';
import CreateShipment from '../pages/customer/CreateShipment';
import Drafts from '../pages/customer/Drafts';
import ActiveShipments from '../pages/customer/ActiveShipments';
import ShipmentHistory from '../pages/customer/ShipmentHistory';
import ShipmentDetail from '../pages/customer/ShipmentDetail';
import Tracking from '../pages/customer/Tracking';
import Assistant from '../pages/customer/Assistant';
import Profile from '../pages/customer/Profile';

import AdminDashboard from '../pages/admin/AdminDashboard';
import AuditLogs from '../pages/admin/AuditLogs';
import AdminVehicles from '../pages/admin/AdminVehicles';

import NotFound from '../pages/NotFound';

/**
 * Route table.
 *
 * Three zones: public authentication, the customer app, and the admin
 * console. A customer cannot reach an admin route through the UI, and an
 * admin is kept out of the customer app - but both guards are convenience
 * only, with the backend enforcing the real boundary.
 */
export default function AppRoutes() {
  return (
    <Routes>
      {/* Public: authentication */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Signed-in */}
      <Route element={<ProtectedRoute />}>
        {/* Customer application */}
        <Route element={<CustomerOnlyRoute />}>
          <Route element={<CustomerLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/ship" element={<CreateShipment />} />
            <Route path="/drafts" element={<Drafts />} />

            {/* Static segments before the dynamic :id. */}
            <Route path="/shipments" element={<ActiveShipments />} />
            <Route path="/shipments/history" element={<ShipmentHistory />} />
            <Route path="/shipments/:id" element={<ShipmentDetail />} />

            <Route path="/track" element={<Tracking />} />
            <Route path="/track/:trackingNumber" element={<Tracking />} />

            <Route path="/assistant" element={<Assistant />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>

        {/* Admin console */}
        <Route element={<RoleRoute role="admin" />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/audit-logs" element={<AuditLogs />} />
            <Route path="/admin/vehicles" element={<AdminVehicles />} />
            {/* Admins get their own profile path so the customer-only guard
                on /profile never bounces them away from it. */}
            <Route path="/admin/profile" element={<Profile />} />
          </Route>
        </Route>
      </Route>

      {/* Send everyone to the right home for their role. */}
      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
