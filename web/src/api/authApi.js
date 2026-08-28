import api, { unwrap, setAuthToken } from './axios';

/**
 * Authentication - maps to the Express /api/auth routes.
 *
 * Backend contract:
 *   POST /api/auth/register { name, email, password }  -> 201 { token, user }
 *   POST /api/auth/login    { email, password }        -> 200 { token, user }
 *   GET  /api/auth/me                                  -> 200 { user }
 *
 * `role` is deliberately never sent on register: the backend decides it, and
 * a client-supplied role must not be trusted. Admin accounts are provisioned
 * server-side (see server/scripts/seed.js).
 */

export async function register({ name, email, password }) {
  const res = await api.post('/auth/register', { name, email, password });
  const data = unwrap(res);
  if (data?.token) setAuthToken(data.token);
  return data; // { token, user }
}

export async function login({ email, password }) {
  const res = await api.post('/auth/login', { email, password });
  const data = unwrap(res);
  if (data?.token) setAuthToken(data.token);
  return data; // { token, user }
}

export async function getCurrentUser() {
  const res = await api.get('/auth/me');
  return unwrap(res)?.user ?? null;
}

/* --------------------------------------------------------------------------
 * NOT IMPLEMENTED BY THE BACKEND
 *
 * The Express API currently exposes no Google OAuth exchange and no password
 * reset. The UI for both exists but is inert by design - no fake OAuth flow
 * is simulated. When the backend gains these routes, wire them up here and
 * nothing else in the app needs to change.
 *
 *   Google:  POST /api/auth/google  { idToken } -> { token, user }
 *   Reset:   POST /api/auth/forgot-password { email }
 * ----------------------------------------------------------------------- */

export const GOOGLE_OAUTH_ENABLED = false;
export const PASSWORD_RESET_ENABLED = false;
