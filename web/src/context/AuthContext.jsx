import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as authApi from '../api/authApi';
import {
  clearAuthToken,
  getAuthToken,
  loadStoredToken,
  setUnauthorizedHandler,
} from '../api/axios';

export const AuthContext = createContext(null);

/**
 * Session state for the whole app.
 *
 * The backend issues a bearer JWT containing { userId, role }. This provider
 * restores a stored token on boot, confirms it against GET /api/auth/me, and
 * exposes the resulting user.
 *
 * The role held here drives navigation and route guards, which are a UX
 * convenience only - every admin endpoint independently enforces
 * requireAdmin server-side, and that is the real authorisation boundary.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // 'loading' until we know whether the stored token is still good.
  const [status, setStatus] = useState('loading');
  const [sessionExpired, setSessionExpired] = useState(false);

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const signOut = useCallback(({ expired = false } = {}) => {
    clearAuthToken();
    if (!mounted.current) return;
    setUser(null);
    setStatus('anonymous');
    setSessionExpired(expired);
  }, []);

  /* A 401 from any request means the token is gone or expired. Clear the
     session once, centrally, and let the router send the user to /login. */
  useEffect(() => {
    setUnauthorizedHandler(() => signOut({ expired: true }));
    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  /* Boot: restore the token, then verify it really is still valid. */
  useEffect(() => {
    let cancelled = false;

    async function restore() {
      const token = loadStoredToken();
      if (!token) {
        if (!cancelled) setStatus('anonymous');
        return;
      }

      try {
        const me = await authApi.getCurrentUser();
        if (cancelled) return;
        setUser(me);
        setStatus(me ? 'authenticated' : 'anonymous');
      } catch {
        // The 401 interceptor has already cleared the token.
        if (!cancelled) {
          setUser(null);
          setStatus('anonymous');
        }
      }
    }

    restore();
    return () => {
      cancelled = true;
    };
  }, []);

  /* Keep tabs in sync: signing out in one tab signs out the others. */
  useEffect(() => {
    function onStorage(event) {
      if (event.key !== 'ole.token') return;
      if (!event.newValue) {
        setUser(null);
        setStatus('anonymous');
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const signIn = useCallback(async (credentials) => {
    setSessionExpired(false);
    const data = await authApi.login(credentials);
    setUser(data.user);
    setStatus('authenticated');
    return data.user;
  }, []);

  const signUp = useCallback(async (details) => {
    setSessionExpired(false);
    const data = await authApi.register(details);
    setUser(data.user);
    setStatus('authenticated');
    return data.user;
  }, []);

  const value = useMemo(
    () => ({
      user,
      status,
      isLoading: status === 'loading',
      isAuthenticated: status === 'authenticated' && Boolean(user),
      isAdmin: user?.role === 'admin',
      sessionExpired,
      clearSessionExpired: () => setSessionExpired(false),
      token: getAuthToken(),
      signIn,
      signUp,
      signOut,
    }),
    [user, status, sessionExpired, signIn, signUp, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
