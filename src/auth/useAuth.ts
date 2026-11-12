import { useContext } from 'react';
import { AuthContext, type AuthContextValue, type Session } from './AuthContext';

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}

/** Para pantallas protegidas: RequireSession garantiza que la sesión existe antes de renderizarlas. */
export function useSession(): Session {
  const { session } = useAuth();
  if (!session) {
    throw new Error('Esta pantalla requiere una sesión iniciada');
  }
  return session;
}
