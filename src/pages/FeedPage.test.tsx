import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { failWith, installFakeServer } from '../test/fakeServer';
import { kudoCard, pageOf, person } from '../test/fixtures';
import { renderApp } from '../test/renderApp';

describe('FeedPage', () => {
  it('lista los Kudos con su categoría, réplicas y el aviso de los vetados', async () => {
    installFakeServer({
      'GET /api/kudos': pageOf([
        kudoCard('k1', { replyCount: 1 }),
        kudoCard('k2', { body: null, status: 'VETOED', replyCount: 3 }),
      ]),
    });

    renderApp('/', person());

    expect(await screen.findByText('Gracias por todo k1')).toBeInTheDocument();
    expect(screen.getByText('Ver completo · 1 réplica')).toBeInTheDocument();
    expect(screen.getByText('Este contenido fue vetado por moderación.')).toBeInTheDocument();
    expect(screen.getByText('Vetado')).toBeInTheDocument();
  });

  it('pide la siguiente página al avanzar en la paginación', async () => {
    const server = installFakeServer({
      'GET /api/kudos': ({ query }: { query: URLSearchParams }) =>
        pageOf([kudoCard(`pagina-${query.get('page') ?? ''}`)], Number(query.get('page')), 25),
    });
    renderApp('/', person());

    await userEvent.click(await screen.findByRole('button', { name: 'Siguiente' }));

    expect(await screen.findByText('Gracias por todo pagina-1')).toBeInTheDocument();
    expect(screen.getByText('Página 2 de 3')).toBeInTheDocument();
    expect(server.sent('GET', '/api/kudos').map((request) => request.query.get('page'))).toEqual(['0', '1']);
  });

  it('indica cuando aún no hay publicaciones', async () => {
    installFakeServer({ 'GET /api/kudos': pageOf([]) });

    renderApp('/', person());

    expect(await screen.findByText('Todavía no hay Kudos publicados.')).toBeInTheDocument();
  });

  it('muestra el error cuando el muro no se puede cargar', async () => {
    installFakeServer({ 'GET /api/kudos': failWith(500, 'Servicio no disponible') });

    renderApp('/', person());

    expect(await screen.findByRole('alert')).toHaveTextContent('Servicio no disponible');
  });
});
