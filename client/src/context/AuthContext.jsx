import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authApi from '../api/auth.api.js';
import { setAccessToken, setAuthLostHandler } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  const clear = useCallback(() => {
    setAccessToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setAuthLostHandler(clear);
  }, [clear]);

  // Silent re-login on refresh using the httpOnly refresh cookie.
  useEffect(() => {
    let alive = true;
    authApi
      .refreshSession()
      .then(({ accessToken, user: fresh }) => {
        if (!alive) return;
        setAccessToken(accessToken);
        setUser(fresh);
      })
      .catch(() => alive && clear())
      .finally(() => alive && setBooting(false));
    return () => {
      alive = false;
    };
  }, [clear]);

  const login = useCallback(async (credentials) => {
    const { accessToken, user: fresh } = await authApi.loginUser(credentials);
    setAccessToken(accessToken);
    setUser(fresh);
    return fresh;
  }, []);

  const completeOtp = useCallback(async (payload) => {
    const { accessToken, user: fresh } = await authApi.verifyOtp(payload);
    setAccessToken(accessToken);
    setUser(fresh);
    return fresh;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logoutUser();
    } finally {
      clear();
    }
  }, [clear]);

  const value = useMemo(
    () => ({ user, booting, login, logout, completeOtp, refreshUser: () => authApi.fetchMe().then(setUser) }),
    [user, booting, login, logout, completeOtp],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
