import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { sessionStorageKey } from './api/client';
import { installFakeServer } from './test/fakeServer';
import { pageOf, person } from './test/fixtures';
import { renderApp } from './test/renderApp';

const navigationLabels = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('nav[aria-label="Principal"] a')).map((link) => link.textContent);

beforeEach(() => {
  installFakeServer({ 'GET /api/kudos': pageOf([]) });
});

describe('navegación de la aplicación', () => {
  it('envía al ingreso a quien no ha iniciado sesión', () => {
    renderApp('/moderacion');

    expect(screen.getByRole('button', { name: 'Ingresar' })).toBeInTheDocument();
  });

  it('muestra a un estudiante solo las secciones de la comunidad', async () => {
    const { container } = renderApp('/', person({ role: 'STUDENT' }));
    await screen.findByText('Todavía no hay Kudos publicados.');

    expect(navigationLabels(container)).toEqual(['Muro', 'Reconocer', 'Mis Kudos', 'Notificaciones', 'Estructura']);
  });

  it('muestra al rector las secciones de gestión, moderación y auditoría', async () => {
    const { container } = renderApp('/', person({ role: 'RECTOR' }));
    await screen.findByText('Todavía no hay Kudos publicados.');

    expect(navigationLabels(container)).toEqual(
      expect.arrayContaining(['Aprobaciones', 'Usuarios', 'Categorías', 'Moderación', 'Auditoría']),
    );
  });

  it('lleva al muro cuando la ruta no existe', async () => {
    renderApp('/ruta-inexistente', person());

    expect(await screen.findByRole('heading', { name: 'Muro de reconocimientos' })).toBeInTheDocument();
  });

  it('cierra la sesión y vuelve al ingreso', async () => {
    renderApp('/', person());

    await userEvent.click(screen.getByRole('button', { name: 'Salir' }));

    expect(screen.getByRole('button', { name: 'Ingresar' })).toBeInTheDocument();
    expect(localStorage.getItem(sessionStorageKey)).toBeNull();
  });
});
