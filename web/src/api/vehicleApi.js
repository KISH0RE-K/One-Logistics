import api, { unwrap } from './axios';

/**
 * Vehicle availability (customer-facing).
 *
 * GET /api/vehicles/available?location=&weight=
 * The backend filters on status === 'available', a case-insensitive exact
 * location match, and capacityKg >= weight.
 */
export async function getAvailableVehicles({ location, weight }) {
  const params = {};
  if (location) params.location = location;
  if (weight !== undefined && weight !== null && weight !== '') {
    params.weight = Number(weight);
  }
  const res = await api.get('/vehicles/available', { params });
  return unwrap(res)?.vehicles ?? [];
}
