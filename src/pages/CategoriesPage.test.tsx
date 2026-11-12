import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { installFakeServer } from '../test/fakeServer';
import { person } from '../test/fixtures';
import { renderApp } from '../test/renderApp';

const academicCoordinator = person({ id: 'academico', role: 'ACADEMIC_COORDINATOR' });
const leadership = { id: 'c1', name: 'Liderazgo', description: 'Guía a otros', active: true };

function installServer() {
  return installFakeServer({
    'GET /api/categories': [leadership],
    'POST /api/categories': { id: 'c2', name: 'Innovación', description: 'Ideas nuevas', active: true },
    'PUT /api/categories/c1': { ...leadership, name: 'Liderazgo positivo' },
    'POST /api/categories/c1/deactivation': { ...leadership, active: false },
  });
}

describe('CategoriesPage', () => {
  it('crea una categoría', async () => {
    const server = installServer();
    renderApp('/categorias', academicCoordinator);

    await userEvent.type(await screen.findByLabelText('Nombre'), 'Innovación');
    await userEvent.type(screen.getByLabelText('Descripción'), 'Ideas nuevas');
    await userEvent.click(screen.getByRole('button', { name: 'Crear categoría' }));

    expect(server.sent('POST', '/api/categories')[0]?.body).toEqual({ name: 'Innovación', description: 'Ideas nuevas' });
  });

  it('edita una categoría partiendo de sus datos actuales', async () => {
    const server = installServer();
    renderApp('/categorias', academicCoordinator);

    const row = (await screen.findByText('Guía a otros')).closest('tr') as HTMLElement;
    await userEvent.click(within(row).getByRole('button', { name: 'Editar' }));

    expect(screen.getByRole('heading', { name: 'Editar Liderazgo' })).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Nombre'), ' positivo');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(server.sent('PUT', '/api/categories/c1')[0]?.body).toEqual({
      name: 'Liderazgo positivo',
      description: 'Guía a otros',
    });
    expect(await screen.findByRole('heading', { name: 'Nueva categoría' })).toBeInTheDocument();
  });

  it('desactiva una categoría activa', async () => {
    const server = installServer();
    renderApp('/categorias', academicCoordinator);

    await userEvent.click(await screen.findByRole('button', { name: 'Desactivar' }));

    expect(server.sent('POST', '/api/categories/c1/deactivation')).toHaveLength(1);
  });
});
