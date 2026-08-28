import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as api from './api';

const AuthContext = createContext(null);

/**
 * Session state. Restores a stored token on launch and confirms it against
 * GET /api/auth/me before treating the user as signed in.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const signOut = useCallback(async () => {
    await api.setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    api.setUnauthorizedHandler(() => setUser(null));
    return () => api.setUnauthorizedHandler(null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const token = await api.loadToken();
      if (!token) {
        if (!cancelled) setIsLoading(false);
        return;
      }
      try {
        const me = await api.getMe();
        if (!cancelled) setUser(me);
      } catch {
        // Token is stale; the interceptor has already cleared it.
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (email, password) => {
    const payload = await api.login(email, password);
    setUser(payload.user);
    return payload.user;
  }, []);

  const signUp = useCallback(async (name, email, password) => {
    const payload = await api.register(name, email, password);
    setUser(payload.user);
    return payload.user;
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, isSignedIn: Boolean(user), signIn, signUp, signOut }),
    [user, isLoading, signIn, signUp, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
