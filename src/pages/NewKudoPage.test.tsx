import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { installFakeServer } from '../test/fakeServer';
import { kudoCard, person } from '../test/fixtures';
import { renderApp } from '../test/renderApp';

const author = person({ id: 'autora', fullName: 'Marta Ruiz', role: 'TEACHER' });
const recipient = person({ id: 'mateo', fullName: 'Mateo Henao' });

function installServer() {
  return installFakeServer({
    'GET /api/categories': [
      { id: 'c1', name: 'Liderazgo', description: '', active: true },
      { id: 'c2', name: 'Categoría retirada', description: '', active: false },
    ],
    'GET /api/people': [author, recipient],
    'POST /api/kudos': { id: 'k-nuevo' },
    'GET /api/kudos/k-nuevo': { kudo: kudoCard('k-nuevo', { author, recipient }), conversation: [] },
  });
}

describe('NewKudoPage', () => {
  it('publica el Kudo y abre su detalle', async () => {
    const server = installServer();
    renderApp('/kudos/nuevo', author);

    await userEvent.type(screen.getByLabelText('Buscar persona'), 'Ma');
    await userEvent.click(await screen.findByRole('button', { name: /Mateo Henao/ }));
    await userEvent.selectOptions(screen.getByLabelText('Categoría'), 'Liderazgo');
    await userEvent.type(screen.getByLabelText('Mensaje'), 'Excelente acompañamiento en el semillero');
    await userEvent.click(screen.getByRole('button', { name: 'Publicar Kudo' }));

    expect(await screen.findByText('Gracias por todo k-nuevo')).toBeInTheDocument();
    expect(server.sent('POST', '/api/kudos')[0]?.body).toEqual({
      recipientId: 'mateo',
      categoryId: 'c1',
      body: 'Excelente acompañamiento en el semillero',
    });
  });

  it('no ofrece reconocerse a sí mismo ni categorías inactivas', async () => {
    installServer();
    renderApp('/kudos/nuevo', author);

    await userEvent.type(screen.getByLabelText('Buscar persona'), 'Ma');
    await screen.findByRole('button', { name: /Mateo Henao/ });

    expect(screen.queryByRole('button', { name: /Marta Ruiz/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Categoría retirada' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Publicar Kudo' })).toBeDisabled();
  });

  it('permite cambiar a la persona elegida', async () => {
    installServer();
    renderApp('/kudos/nuevo', author);

    await userEvent.type(screen.getByLabelText('Buscar persona'), 'Ma');
    await userEvent.click(await screen.findByRole('button', { name: /Mateo Henao/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Cambiar' }));

    expect(screen.getByLabelText('Buscar persona')).toBeInTheDocument();
  });
});
