import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

/**
 * The mobile app's entire backend contract, in one file.
 *
 * Same Express API as the web client. The device never talks to MongoDB, the
 * ML service or any LLM directly.
 *
 * Base URL comes from EXPO_PUBLIC_API_URL. It is not hard-coded, but note
 * that "localhost" means the device itself - on a phone or emulator that is
 * not your computer - so the fallback below resolves the host machine's LAN
 * address from the Expo dev server, which is what actually works in practice.
 */

function resolveBaseUrl() {
  const configured = process.env.EXPO_PUBLIC_API_URL;
  if (configured) return `${configured.replace(/\/+$/, '')}/api`;

  // Derive the dev machine's IP from the Expo host (e.g. "192.168.1.5:8081").
  const hostUri =
    Constants.expoConfig?.hostUri || Constants.expoGoConfig?.debuggerHost || '';
  const host = hostUri.split(':')[0];
  if (host) return `http://${host}:5000/api`;

  return 'http://localhost:5000/api';
}

export const BASE_URL = resolveBaseUrl();

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

/* -- Token ---------------------------------------------------------------- */

const TOKEN_KEY = 'ole.token';
let authToken = null;
let onUnauthorized = null;

export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

export async function loadToken() {
  try {
    authToken = await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    authToken = null;
  }
  return authToken;
}

export async function setToken(token) {
  authToken = token || null;
  try {
    if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
    else await AsyncStorage.removeItem(TOKEN_KEY);
  } catch {
    /* in-memory token still works for this session */
  }
}

api.interceptors.request.use((config) => {
  if (authToken) config.headers.Authorization = `Bearer ${authToken}`;
  // Always 'mobile' - this is what makes lastChannel meaningful.
  config.headers['X-Channel'] = 'mobile';
  return config;
});

/* -- Errors ---------------------------------------------------------------- */

const GENERIC = "We're having trouble reaching the logistics service. Please try again.";

const STATUS_MESSAGE = {
  401: 'Your session has expired. Please sign in again.',
  403: "You don't have permission to do that.",
  404: "We couldn't find what you were looking for.",
  429: 'Too many requests. Please wait a moment.',
  500: 'Something went wrong on our side.',
  503: 'That service is temporarily unavailable.',
  504: 'That request took too long.',
};

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      setToken(null);
      onUnauthorized?.();
    }

    const backendMessage = error.response?.data?.message;
    // Validation and conflict messages are useful; server faults are not.
    const message =
      !error.response
        ? GENERIC
        : [400, 409, 422, 503, 504].includes(status) && backendMessage
          ? backendMessage
          : STATUS_MESSAGE[status] || GENERIC;

    const wrapped = new Error(message);
    wrapped.status = status ?? 0;
    return Promise.reject(wrapped);
  }
);

const data = (res) => res?.data?.data ?? null;

/* -- Endpoints ------------------------------------------------------------- */

export async function login(email, password) {
  const res = await api.post('/auth/login', { email, password });
  const payload = data(res);
  if (payload?.token) await setToken(payload.token);
  return payload; // { token, user }
}

export async function register(name, email, password) {
  const res = await api.post('/auth/register', { name, email, password });
  const payload = data(res);
  if (payload?.token) await setToken(payload.token);
  return payload;
}

export async function getMe() {
  const res = await api.get('/auth/me');
  return data(res)?.user ?? null;
}

export async function getActiveShipments() {
  const res = await api.get('/shipments', { params: { active: 'true' } });
  return data(res)?.shipments ?? [];
}

export async function getShipments() {
  const res = await api.get('/shipments');
  return data(res)?.shipments ?? [];
}

export async function getDrafts() {
  const res = await api.get('/shipments/drafts');
  return data(res)?.drafts ?? [];
}

export async function deleteShipment(id) {
  const res = await api.delete(`/shipments/${id}`);
  return data(res);
}

/**
 * Confirm a draft from the phone.
 *
 * Sending status:'booked' promotes it: the backend issues the tracking
 * number and stamps lastChannel as 'mobile' via the X-Channel header - which
 * is precisely the web-to-mobile handover this app is here to demonstrate.
 */
export async function confirmDraft(id, { transportMode, cost, estimatedTime } = {}) {
  const body = { status: 'booked' };
  if (transportMode) body.transportMode = transportMode;
  if (cost !== undefined) body.cost = cost;
  if (estimatedTime !== undefined) body.estimatedTime = estimatedTime;

  const res = await api.put(`/shipments/${id}`, body);
  return data(res)?.shipment ?? null;
}

export async function trackShipment(trackingNumber) {
  const res = await api.get(`/tracking/${encodeURIComponent(trackingNumber)}`);
  return data(res);
}

export async function getRecommendation(payload) {
  const res = await api.post('/recommendation', payload);
  return data(res);
}

export default api;
