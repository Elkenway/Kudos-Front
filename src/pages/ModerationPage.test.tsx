import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { installFakeServer } from '../test/fakeServer';
import { person } from '../test/fixtures';
import { renderApp } from '../test/renderApp';

const rector = person({ id: 'rector', fullName: 'Rector UCO', role: 'RECTOR' });
const reporter = person({ id: 'reportante', fullName: 'Paula Reportante' });

function reportedContent(id: string, contentStatus: 'REPORTED' | 'UNDER_REVIEW') {
  return {
    content: { type: 'REPLY', id },
    kudoId: 'k1',
    contentStatus,
    author: person({ id: `autor-${id}`, fullName: `Autor ${id}` }),
    body: `Texto reportado ${id}`,
    reports: [
      {
        id: `reporte-${id}`,
        reporter,
        reason: 'OFFENSIVE_LANGUAGE',
        detail: 'Groserías',
        status: contentStatus === 'REPORTED' ? 'PENDING' : 'IN_REVIEW',
        reportedAt: '2026-11-04T09:00:00Z',
      },
    ],
  };
}

function installServer() {
  return installFakeServer({
    'GET /api/moderation/reported-contents': [reportedContent('nuevo', 'REPORTED'), reportedContent('revision', 'UNDER_REVIEW')],
    'GET /api/moderation/decisions': [
      {
        id: 'd1',
        content: { type: 'KUDO', id: 'k9' },
        moderator: rector,
        outcome: 'RELEASED',
        rationale: 'El reporte no procede',
        resolvedReports: 2,
        decidedAt: '2026-11-01T12:00:00Z',
      },
    ],
    'POST /api/moderation/contents/REPLY/nuevo/review': undefined,
    'POST /api/moderation/contents/REPLY/revision/decision': undefined,
  });
}

const cardOf = async (text: string) => (await screen.findByText(text)).closest('article') as HTMLElement;

describe('ModerationPage', () => {
  it('consulta los pendientes al abrir y todos al quitar el filtro', async () => {
    const server = installServer();
    renderApp('/moderacion', rector);

    await screen.findByText('Texto reportado nuevo');
    await userEvent.selectOptions(screen.getByLabelText('Estado de los reportes'), 'Todos');

    const statusFilters = server.sent('GET', '/api/moderation/reported-contents').map((request) => request.query.get('status'));
    expect(statusFilters).toEqual(['PENDING', null]);
  });

  it('muestra los reportes de cada contenido y el historial de decisiones', async () => {
    installServer();
    renderApp('/moderacion', rector);

    const card = await cardOf('Texto reportado nuevo');

    expect(within(card).getByText('Lenguaje ofensivo')).toBeInTheDocument();
    expect(within(card).getByText(/Paula Reportante/)).toBeInTheDocument();
    expect(screen.getByText('El reporte no procede')).toBeInTheDocument();
    expect(screen.getByText('Liberado')).toBeInTheDocument();
  });

  it('inicia la revisión de un contenido reportado', async () => {
    const server = installServer();
    renderApp('/moderacion', rector);

    await userEvent.click(within(await cardOf('Texto reportado nuevo')).getByRole('button', { name: 'Iniciar revisión' }));

    expect(server.sent('POST', '/api/moderation/contents/REPLY/nuevo/review')).toHaveLength(1);
  });

  it('cierra la revisión vetando el contenido con una justificación', async () => {
    const server = installServer();
    renderApp('/moderacion', rector);

    await userEvent.click(within(await cardOf('Texto reportado revision')).getByRole('button', { name: 'Vetar' }));
    await userEvent.type(screen.getByLabelText('Justificación del veto'), 'Incumple el reglamento');
    await userEvent.click(screen.getByRole('button', { name: 'Registrar decisión' }));

    expect(server.sent('POST', '/api/moderation/contents/REPLY/revision/decision')[0]?.body).toEqual({
      outcome: 'VETOED',
      rationale: 'Incumple el reglamento',
    });
  });

  it('también puede liberar el contenido revisado', async () => {
    installServer();
    renderApp('/moderacion', rector);

    await userEvent.click(within(await cardOf('Texto reportado revision')).getByRole('button', { name: 'Liberar' }));

    expect(screen.getByLabelText('Justificación de la liberación')).toBeInTheDocument();
  });
});
