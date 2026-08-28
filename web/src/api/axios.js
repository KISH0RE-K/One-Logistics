import axios from 'axios';

/**
 * The single Axios instance for the whole application.
 *
 * Every network call in this app goes through here. React never talks to
 * MongoDB, the Python ML service or any LLM provider directly - the Express
 * API is the only origin the browser is allowed to know about.
 *
 * Base URL comes from VITE_API_URL. When it is empty (the default in
 * development) requests go to a relative /api path, which the Vite dev server
 * proxies to the Express port. Nothing is ever hard-coded.
 */

const baseURL = import.meta.env.VITE_API_URL
  ? `${String(import.meta.env.VITE_API_URL).replace(/\/+$/, '')}/api`
  : '/api';

const api = axios.create({
  baseURL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

/* ---------------------------------------------------------------------------
 * Auth token
 *
 * The Express backend authenticates with a bearer JWT (Authorization:
 * Bearer <token>) - it does not issue cookies - so the frontend follows that
 * existing contract rather than inventing a different scheme.
 *
 * The token is held in module scope and mirrored to localStorage so a reload
 * can restore the session. Reads go through the module variable, so a
 * cross-tab logout takes effect immediately.
 * ------------------------------------------------------------------------ */

const TOKEN_KEY = 'ole.token';

let authToken = null;

/** Restore a persisted token at boot. Safe if storage is unavailable. */
export function loadStoredToken() {
  try {
    authToken = window.localStorage.getItem(TOKEN_KEY);
  } catch {
    authToken = null;
  }
  return authToken;
}

export function getAuthToken() {
  return authToken;
}

export function setAuthToken(token) {
  authToken = token || null;
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* Private mode / storage disabled - the in-memory token still works. */
  }
}

export function clearAuthToken() {
  setAuthToken(null);
}

/* ---------------------------------------------------------------------------
 * Session expiry
 *
 * A 401 means the token is missing, invalid or expired. Rather than letting
 * every screen handle that, the interceptor clears auth state once and
 * notifies whoever is listening (AuthContext) to redirect to /login.
 * ------------------------------------------------------------------------ */

let onUnauthorized = null;

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

/* ---------------------------------------------------------------------------
 * Channel
 *
 * The backend records `lastChannel` ('web' | 'mobile') on shipments so a draft
 * started in one place can be recognised in the other. Every request carries
 * the current channel via the X-Channel header, which the Express controllers
 * already read.
 * ------------------------------------------------------------------------ */

let channel = 'web';

export function setChannel(next) {
  channel = next === 'mobile' ? 'mobile' : 'web';
}

export function getChannel() {
  return channel;
}

api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  config.headers['X-Channel'] = channel;
  return config;
});

/* ---------------------------------------------------------------------------
 * Error normalisation
 *
 * Backend errors always look like { success: false, message: string }. Raw
 * backend text is never shown for server-side faults - those get a neutral
 * message - but validation and conflict messages are genuinely useful to the
 * person filling in the form, so those are passed through.
 * ------------------------------------------------------------------------ */

export class ApiError extends Error {
  constructor(message, { status = 0, code = 'error', details = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  /** True when the user could plausibly fix this by changing their input. */
  get isUserFixable() {
    return [400, 409, 422].includes(this.status);
  }
}

const GENERIC_MESSAGE =
  "We're having trouble connecting to the logistics service. Please try again.";

const STATUS_MESSAGES = {
  401: 'Your session has expired. Please sign in again.',
  403: "You don't have permission to do that.",
  404: 'We couldn’t find what you were looking for.',
  429: "You've made a lot of requests in a short time. Please wait a moment and try again.",
  500: 'Something went wrong on our side. Please try again in a moment.',
  502: GENERIC_MESSAGE,
  503: 'That service is temporarily unavailable. Please try again shortly.',
  504: 'That request took too long. Please try again.',
};

function normalizeError(error) {
  // No response at all: offline, DNS failure, CORS, or the API is down.
  if (!error.response) {
    if (error.code === 'ECONNABORTED') {
      return new ApiError('That request took too long. Please try again.', {
        status: 0,
        code: 'timeout',
      });
    }
    return new ApiError(GENERIC_MESSAGE, { status: 0, code: 'network' });
  }

  const { status, data } = error.response;
  const backendMessage = typeof data?.message === 'string' ? data.message : null;

  // 400 / 409 / 422 carry actionable validation detail - show it verbatim.
  if ([400, 409, 422].includes(status) && backendMessage) {
    return new ApiError(backendMessage, { status, code: 'validation', details: data });
  }

  // 503/504 from the ML proxy explain which dependency is down - useful.
  if ([503, 504].includes(status) && backendMessage) {
    return new ApiError(backendMessage, { status, code: 'unavailable', details: data });
  }

  return new ApiError(STATUS_MESSAGES[status] || GENERIC_MESSAGE, {
    status,
    code: `http_${status}`,
    details: null,
  });
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      clearAuthToken();
      if (onUnauthorized) onUnauthorized();
    }

    return Promise.reject(normalizeError(error));
  }
);

/**
 * Unwrap the backend's envelope: every endpoint answers
 * { success: true, data: {...} }. Callers get `data` directly.
 */
export function unwrap(response) {
  return response?.data?.data ?? null;
}

export default api;
