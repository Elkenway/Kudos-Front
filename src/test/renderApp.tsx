import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { sessionStorageKey } from '../api/client';
import type { PersonSummary } from '../api/types';
import { App } from '../App';
import { AuthProvider } from '../auth/AuthProvider';
import { routerFutureFlags } from '../routerFutureFlags';

/** Monta la aplicación completa en una ruta, opcionalmente con la sesión de la persona indicada. */
export function renderApp(route: string, account?: PersonSummary) {
  if (account) {
    localStorage.setItem(
      sessionStorageKey,
      JSON.stringify({ accessToken: 'token-de-prueba', expiresAt: '2099-01-01T00:00:00Z', account }),
    );
  }
  return render(
    <MemoryRouter initialEntries={[route]} future={routerFutureFlags}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  );
}
