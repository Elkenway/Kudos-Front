import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { KudoCard } from '../api/types';
import { installFakeServer } from '../test/fakeServer';
import { kudoCard, person, reply } from '../test/fixtures';
import { renderApp } from '../test/renderApp';

const student = person({ id: 'estudiante', role: 'STUDENT' });
const rector = person({ id: 'rector', fullName: 'Rector UCO', role: 'RECTOR' });

function installServer(kudo: KudoCard = kudoCard('k1')) {
  return installFakeServer({
    'GET /api/kudos/k1': { kudo, conversation: [reply('r1', 0)] },
    'POST /api/kudos/k1/replies': { id: 'r2' },
    'PUT /api/contents/KUDO/k1/rating': { ratedContent: { type: 'KUDO', id: 'k1' }, averageStars: 5, ratingCount: 1 },
    'POST /api/contents/KUDO/k1/reports': { id: 'reporte-1' },
    'POST /api/moderation/contents/KUDO/k1/veto': undefined,
  });
}

describe('KudoDetailPage', () => {
  it('publica una réplica al Kudo y recarga la conversación', async () => {
    const server = installServer();
    renderApp('/kudos/k1', student);

    await userEvent.type(await screen.findByLabelText('Responder al Kudo'), 'Totalmente merecido');
    await userEvent.click(screen.getByRole('button', { name: 'Publicar réplica' }));

    expect(server.sent('POST', '/api/kudos/k1/replies')[0]?.body).toEqual({ body: 'Totalmente merecido' });
    expect(server.sent('GET', '/api/kudos/k1')).toHaveLength(2);
  });

  it('califica el Kudo con estrellas', async () => {
    const server = installServer();
    renderApp('/kudos/k1', student);

    const [kudoStars] = await screen.findAllByRole('button', { name: 'Calificar con 5 estrellas' });
    await userEvent.click(kudoStars as HTMLElement);

    expect(server.sent('PUT', '/api/contents/KUDO/k1/rating')[0]?.body).toEqual({ stars: 5 });
  });

  it('reporta el Kudo indicando el motivo', async () => {
    const server = installServer();
    renderApp('/kudos/k1', student);

    const [reportKudo] = await screen.findAllByRole('button', { name: 'Reportar' });
    await userEvent.click(reportKudo as HTMLElement);
    await userEvent.selectOptions(screen.getByLabelText('Motivo'), 'Spam');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar reporte' }));

    expect(server.sent('POST', '/api/contents/KUDO/k1/reports')[0]?.body).toEqual({ reason: 'SPAM', detail: null });
  });

  it('solo quien modera puede vetar el Kudo con una justificación', async () => {
    const server = installServer();
    renderApp('/kudos/k1', rector);

    const [vetoKudo] = await screen.findAllByRole('button', { name: 'Vetar' });
    await userEvent.click(vetoKudo as HTMLElement);
    await userEvent.type(screen.getByLabelText('Justificación del veto'), 'Contenido ofensivo');
    await userEvent.click(screen.getByRole('button', { name: 'Vetar Kudo' }));

    expect(server.sent('POST', '/api/moderation/contents/KUDO/k1/veto')[0]?.body).toEqual({
      rationale: 'Contenido ofensivo',
    });
  });

  it('no muestra acciones de moderación a un estudiante', async () => {
    installServer();
    renderApp('/kudos/k1', student);

    await screen.findByText('Gracias por todo k1');

    expect(screen.queryByRole('button', { name: 'Vetar' })).not.toBeInTheDocument();
  });

  it('un Kudo vetado oculta su texto y no admite réplicas', async () => {
    installServer(kudoCard('k1', { body: null, status: 'VETOED' }));
    renderApp('/kudos/k1', student);

    expect(await screen.findByText('Este Kudo fue vetado por moderación.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Responder al Kudo')).not.toBeInTheDocument();
  });
});
