import api, { unwrap } from './axios';

/**
 * Admin-only endpoints. The backend enforces role === 'admin' on every one of
 * these (authenticateUser + requireAdmin); the frontend route guard is only a
 * UX convenience on top of that real boundary.
 */

/** GET /api/admin/dashboard -> aggregated counts computed from collections. */
export async function getDashboard() {
  const res = await api.get('/admin/dashboard');
  return unwrap(res); // { shipments: {...}, vehicles: {...}, users: {...} }
}

/** GET /api/admin/audit-logs?action=&userId=&page=&limit= */
export async function getAuditLogs({ action, userId, page = 1, limit = 25 } = {}) {
  const params = { page, limit };
  if (action) params.action = action;
  if (userId) params.userId = userId;
  const res = await api.get('/admin/audit-logs', { params });
  return unwrap(res); // { logs, total, page, limit, totalPages }
}

/** GET /api/admin/vehicles?status=&type=&location= */
export async function getVehicles({ status, type, location } = {}) {
  const params = {};
  if (status) params.status = status;
  if (type) params.type = type;
  if (location) params.location = location;
  const res = await api.get('/admin/vehicles', { params });
  return unwrap(res)?.vehicles ?? [];
}

/** POST /api/admin/vehicles */
export async function createVehicle(vehicle) {
  const res = await api.post('/admin/vehicles', vehicle);
  return unwrap(res)?.vehicle ?? null;
}

/** PUT /api/admin/vehicles/:id */
export async function updateVehicle(id, updates) {
  const res = await api.put(`/admin/vehicles/${id}`, updates);
  return unwrap(res)?.vehicle ?? null;
}
