import { createContext } from 'react';
import type { PersonSummary } from '../api/types';

export interface Session {
  accessToken: string;
  expiresAt: string;
  account: PersonSummary;
}

export interface AuthContextValue {
  session: Session | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
