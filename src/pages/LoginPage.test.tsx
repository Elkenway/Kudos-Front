import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { routerFutureFlags } from '../routerFutureFlags';
import { sessionStorageKey } from '../api/client';
import { AuthProvider } from '../auth/AuthProvider';
import { jsonResponse, person } from '../test/fixtures';
import { LoginPage } from './LoginPage';

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

function renderLogin() {
  render(
    <MemoryRouter initialEntries={['/login']} future={routerFutureFlags}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<p>Muro institucional</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

async function submitCredentials() {
  await userEvent.type(screen.getByLabelText('Correo institucional'), 'laura@uco.edu.co');
  await userEvent.type(screen.getByLabelText('Contraseña'), 'ClaveSegura2026');
  await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));
}

describe('LoginPage', () => {
  it('guarda la sesión y lleva al muro cuando las credenciales son válidas', async () => {
    const session = { accessToken: 'token', expiresAt: '2099-01-01T00:00:00Z', account: person() };
    fetchMock.mockResolvedValue(jsonResponse(200, session));
    renderLogin();

    await submitCredentials();

    expect(await screen.findByText('Muro institucional')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(sessionStorageKey) ?? '{}')).toEqual(session);
  });

  it('muestra el motivo del rechazo y no guarda sesión', async () => {
    fetchMock.mockResolvedValue(jsonResponse(401, { detail: 'Correo o contraseña incorrectos' }));
    renderLogin();

    await submitCredentials();

    expect(await screen.findByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos');
    expect(localStorage.getItem(sessionStorageKey)).toBeNull();
  });

  it('descarta una sesión guardada que ya venció', () => {
    const expired = { accessToken: 'viejo', expiresAt: '2020-01-01T00:00:00Z', account: person() };
    localStorage.setItem(sessionStorageKey, JSON.stringify(expired));

    renderLogin();

    expect(screen.getByRole('button', { name: 'Ingresar' })).toBeInTheDocument();
    expect(localStorage.getItem(sessionStorageKey)).toBeNull();
  });

  it('redirige al muro si ya hay una sesión vigente', () => {
    const active = { accessToken: 'vigente', expiresAt: '2099-01-01T00:00:00Z', account: person() };
    localStorage.setItem(sessionStorageKey, JSON.stringify(active));

    renderLogin();

    expect(screen.getByText('Muro institucional')).toBeInTheDocument();
  });
});
