import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { installFakeServer } from '../test/fakeServer';
import { kudoCard, pageOf, person } from '../test/fixtures';
import { renderApp } from '../test/renderApp';

const student = person({ id: 'estudiante', fullName: 'Laura Gómez', role: 'STUDENT' });
const auditor = person({ id: 'admin', role: 'ADMINISTRATOR' });

describe('PersonPage', () => {
  it('muestra la vinculación y alterna entre Kudos recibidos y enviados', async () => {
    const server = installFakeServer({
      'GET /api/people/estudiante/affiliation': {
        person: student,
        faculty: null,
        programs: [{ id: 'p1', name: 'Ingeniería de Sistemas', facultyId: 'f1', coordinator: null }],
      },
      'GET /api/people/estudiante/received-kudos': pageOf([kudoCard('recibido')]),
      'GET /api/people/estudiante/authored-kudos': pageOf([]),
    });
    renderApp('/personas/estudiante', student);

    expect(await screen.findByText('Programas: Ingeniería de Sistemas')).toBeInTheDocument();
    expect(await screen.findByText('Gracias por todo recibido')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: 'Enviados' }));

    expect(await screen.findByText('No hay Kudos en esta lista.')).toBeInTheDocument();
    expect(server.sent('GET', '/api/people/estudiante/authored-kudos')).toHaveLength(1);
  });
});

describe('ProfilePage', () => {
  const profile = {
    id: 'estudiante',
    fullName: 'Laura Gómez',
    email: 'laura@uco.edu.co',
    phone: '3001234567',
    role: 'STUDENT',
    status: 'ACTIVE',
    approved: true,
    emailVerified: true,
    phoneVerified: true,
    programs: ['Ingeniería de Sistemas'],
    faculty: null,
    registeredAt: '2026-08-01T00:00:00Z',
  };

  function installServer() {
    return installFakeServer({
      'GET /api/profile': profile,
      'GET /api/profile/activity': pageOf([
        { id: 'e1', eventType: 'KudoPublished', aggregateId: 'k1', actorId: 'estudiante', occurredOn: '2026-11-01T00:00:00Z', evidence: '{}' },
      ]),
      'PUT /api/profile': profile,
    });
  }

  it('muestra los datos de la cuenta y la actividad propia', async () => {
    installServer();
    renderApp('/perfil', student);

    expect(await screen.findByText('Ingeniería de Sistemas')).toBeInTheDocument();
    expect(await screen.findByText('KudoPublished')).toBeInTheDocument();
  });

  it('advierte que un contacto nuevo debe verificarse', async () => {
    const server = installServer();
    renderApp('/perfil', student);

    const phoneInput = await screen.findByLabelText('Celular');
    await userEvent.clear(phoneInput);
    await userEvent.type(phoneInput, '3109876543');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByText(/Debes verificar el nuevo contacto/)).toBeInTheDocument();
    expect(server.sent('PUT', '/api/profile')[0]?.body).toEqual({
      fullName: 'Laura Gómez',
      email: 'laura@uco.edu.co',
      phone: '3109876543',
    });
  });

  it('guarda un cambio de nombre sin exigir verificación', async () => {
    installServer();
    renderApp('/perfil', student);

    await userEvent.type(await screen.findByLabelText('Nombre completo'), ' María');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByText('Datos guardados.')).toBeInTheDocument();
  });
});

describe('NotificationsPage', () => {
  it('marca como leída una notificación y enlaza al contenido relacionado', async () => {
    const server = installFakeServer({
      'GET /api/notifications': [
        {
          id: 'n1',
          recipientId: 'estudiante',
          message: 'Recibiste un Kudo',
          relatedContent: { type: 'KUDO', id: 'k1' },
          createdAt: '2026-11-05T08:00:00Z',
          readAt: null,
        },
      ],
      'POST /api/notifications/n1/read': undefined,
    });
    renderApp('/notificaciones', student);

    expect(await screen.findByRole('link', { name: 'Ver' })).toHaveAttribute('href', '/kudos/k1');
    await userEvent.click(screen.getByRole('button', { name: 'Marcar como leída' }));

    expect(server.sent('POST', '/api/notifications/n1/read')).toHaveLength(1);
  });

  it('indica cuando no hay notificaciones', async () => {
    installFakeServer({ 'GET /api/notifications': [] });
    renderApp('/notificaciones', student);

    expect(await screen.findByText('No tienes notificaciones.')).toBeInTheDocument();
  });
});

describe('AuditPage', () => {
  it('filtra la auditoría y muestra la evidencia legible', async () => {
    const server = installFakeServer({
      'GET /api/audit': pageOf([
        {
          id: 'e1',
          eventType: 'KudoVetoed',
          aggregateId: 'k1',
          actorId: null,
          occurredOn: '2026-11-05T08:00:00Z',
          evidence: '{"rationale":"Ofensivo"}',
        },
      ]),
    });
    renderApp('/auditoria', auditor);

    expect(await screen.findByText('Sistema')).toBeInTheDocument();
    expect(screen.getByText(/"rationale": "Ofensivo"/)).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Tipo de evento'), 'KudoVetoed');
    await userEvent.click(screen.getByRole('button', { name: 'Filtrar' }));

    const lastQuery = server.sent('GET', '/api/audit').at(-1)?.query;
    expect(lastQuery?.get('eventType')).toBe('KudoVetoed');
    expect(lastQuery?.get('page')).toBe('0');
  });
});
