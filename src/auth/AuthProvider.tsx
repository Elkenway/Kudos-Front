import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { onUnauthorized, sessionStorageKey } from '../api/client';
import { authApi } from '../api/endpoints';
import { AuthContext, type Session } from './AuthContext';

function readStoredSession(): Session | null {
  const stored = localStorage.getItem(sessionStorageKey);
  if (!stored) {
    return null;
  }
  const session = JSON.parse(stored) as Session;
  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    localStorage.removeItem(sessionStorageKey);
    return null;
  }
  return session;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(readStoredSession);

  const signOut = useCallback(() => {
    localStorage.removeItem(sessionStorageKey);
    setSession(null);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const authenticated = await authApi.signIn(email, password);
    localStorage.setItem(sessionStorageKey, JSON.stringify(authenticated));
    setSession(authenticated);
  }, []);

  useEffect(() => onUnauthorized(signOut), [signOut]);

  const value = useMemo(() => ({ session, signIn, signOut }), [session, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
