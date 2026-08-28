import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthUser } from '../types';
import { login as apiLogin, register as apiRegister, tokenStore } from '../api';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// We don't decode the JWT for the email, we just remember what the
// login/register response told us and keep it in memory alongside the
// token. On a hard reload this is lost until the next successful call,
// which is fine, nothing in this app currently needs the email on first
// paint before any data has loaded anyway.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => tokenStore.get());
  const [user, setUser] = useState<AuthUser | null>(null);

  const logout = useCallback(() => {
    tokenStore.set(null);
    setToken(null);
    setUser(null);
  }, []);

  // Fired by the axios response interceptor when a request comes back 401
  // for a token that existed at request time (i.e. it expired or was
  // invalidated), not for a plain wrong-password rejection on login itself.
  useEffect(() => {
    const handler = () => logout();
    window.addEventListener('wdig:unauthorized', handler);
    return () => window.removeEventListener('wdig:unauthorized', handler);
  }, [logout]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiLogin(email, password);
    tokenStore.set(res.token);
    setToken(res.token);
    setUser(res.user);
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const res = await apiRegister(email, password);
    tokenStore.set(res.token);
    setToken(res.token);
    setUser(res.user);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, token, isAuthenticated: !!token, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
