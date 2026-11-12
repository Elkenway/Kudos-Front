import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { installFakeServer } from '../test/fakeServer';
import { person } from '../test/fixtures';
import { renderApp } from '../test/renderApp';

const academicCoordinator = person({ id: 'academico', fullName: 'Coordinación Académica', role: 'ACADEMIC_COORDINATOR' });
const programCoordinator = person({ id: 'coordinador', fullName: 'Carla Coordinadora', role: 'PROGRAM_COORDINATOR' });
const student = person({ id: 'estudiante', fullName: 'Laura Gómez', role: 'STUDENT' });
const formerCoordinator = person({ id: 'anterior', fullName: 'Coordinador Anterior', role: 'PROGRAM_COORDINATOR' });

const structureRoutes = {
  'GET /api/faculties': [{ id: 'f1', name: 'Ingenierías', coordinator: null, programCount: 1 }],
  'GET /api/programs': [{ id: 'p1', name: 'Ingeniería de Sistemas', facultyId: 'f1', coordinator: programCoordinator }],
  'GET /api/university-authorities': [
    { position: 'RECTOR', currentHolder: person({ fullName: 'Rector UCO', role: 'RECTOR' }), history: [] },
  ],
  'POST /api/faculties': { id: 'f2' },
  'POST /api/programs': { id: 'p2' },
};

const programDetail = {
  id: 'p1',
  name: 'Ingeniería de Sistemas',
  facultyId: 'f1',
  facultyName: 'Ingenierías',
  createdAt: '2026-01-10T00:00:00Z',
  coordinator: programCoordinator,
  coordinatorHistory: [
    { holder: formerCoordinator, startedAt: '2025-01-10T00:00:00Z', endedAt: '2026-06-30T00:00:00Z' },
    { holder: programCoordinator, startedAt: '2026-07-01T00:00:00Z', endedAt: null },
  ],
  members: [
    { member: student, type: 'STUDENT', linkedAt: '2026-02-01T00:00:00Z', unlinkedAt: null },
    {
      member: person({ id: 'egresado', fullName: 'Egresado Antiguo' }),
      type: 'STUDENT',
      linkedAt: '2020-02-01T00:00:00Z',
      unlinkedAt: '2025-12-01T00:00:00Z',
    },
  ],
};

describe('StructurePage', () => {
  it('lista autoridades, facultades y programas con su coordinación', async () => {
    installFakeServer(structureRoutes);
    renderApp('/estructura', student);

    expect(await screen.findByText('Rector UCO')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ingenierías' })).toBeInTheDocument();
    expect(screen.getByText(/Coordinación: Carla Coordinadora/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Crear facultad' })).not.toBeInTheDocument();
  });

  it('la coordinación académica crea facultades y programas', async () => {
    const server = installFakeServer(structureRoutes);
    renderApp('/estructura', academicCoordinator);

    await userEvent.type(await screen.findByLabelText('Nueva facultad'), 'Ciencias de la Salud');
    await userEvent.click(screen.getByRole('button', { name: 'Crear facultad' }));
    await userEvent.type(screen.getByLabelText('Nuevo programa'), 'Ingeniería Ambiental');
    await userEvent.click(screen.getByRole('button', { name: 'Crear programa' }));

    expect(server.sent('POST', '/api/faculties')[0]?.body).toEqual({ name: 'Ciencias de la Salud' });
    expect(server.sent('POST', '/api/programs')[0]?.body).toEqual({ facultyId: 'f1', name: 'Ingeniería Ambiental' });
  });
});

describe('ProgramPage', () => {
  function installServer() {
    return installFakeServer({
      'GET /api/programs/p1': programDetail,
      'GET /api/people': [person({ id: 'nuevo', fullName: 'Nicolás Nuevo' })],
      'PUT /api/programs/p1/members/nuevo': undefined,
      'DELETE /api/programs/p1/members/estudiante': undefined,
      'PUT /api/programs/p1': undefined,
    });
  }

  it('muestra integrantes activos, vinculaciones anteriores y la historia del cargo', async () => {
    installServer();
    renderApp('/programas/p1', student);

    expect(await screen.findByRole('heading', { name: 'Integrantes (1)' })).toBeInTheDocument();
    expect(screen.getByText('Vinculaciones anteriores (1)')).toBeInTheDocument();
    expect(screen.getByText('Coordinador Anterior')).toBeInTheDocument();
    expect(screen.getByText(/\(actual\)/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Desvincular' })).not.toBeInTheDocument();
  });

  it('quien coordina el programa vincula y desvincula integrantes', async () => {
    const server = installServer();
    renderApp('/programas/p1', programCoordinator);

    await userEvent.type(await screen.findByLabelText('Buscar persona'), 'Ni');
    await userEvent.click(await screen.findByRole('button', { name: /Nicolás Nuevo/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Vincular' }));
    const studentEntry = screen.getByRole('link', { name: 'Laura Gómez' }).closest('li') as HTMLElement;
    await userEvent.click(within(studentEntry).getByRole('button', { name: 'Desvincular' }));

    expect(server.sent('PUT', '/api/programs/p1/members/nuevo')).toHaveLength(1);
    expect(server.sent('DELETE', '/api/programs/p1/members/estudiante')).toHaveLength(1);
  });

  it('la coordinación académica renombra el programa', async () => {
    const server = installServer();
    renderApp('/programas/p1', academicCoordinator);

    await userEvent.click(await screen.findByRole('button', { name: 'Renombrar' }));
    await userEvent.type(screen.getByLabelText('Nuevo nombre'), 'Ingeniería de Software');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(server.sent('PUT', '/api/programs/p1')[0]?.body).toEqual({ name: 'Ingeniería de Software' });
  });
});

describe('FacultyPage', () => {
  it('muestra la coordinación vacante, sus programas y permite renombrarla', async () => {
    const server = installFakeServer({
      'GET /api/faculties/f1': {
        id: 'f1',
        name: 'Ingenierías',
        createdAt: '2026-01-01T00:00:00Z',
        coordinator: null,
        coordinatorHistory: [],
        programs: [{ id: 'p1', name: 'Ingeniería de Sistemas', facultyId: 'f1', coordinator: null }],
      },
      'PUT /api/faculties/f1': undefined,
    });
    renderApp('/facultades/f1', academicCoordinator);

    expect(await screen.findByText('El cargo nunca ha sido ocupado.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ingeniería de Sistemas' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Renombrar' }));
    await userEvent.type(screen.getByLabelText('Nuevo nombre'), 'Facultad de Ingenierías');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(server.sent('PUT', '/api/faculties/f1')[0]?.body).toEqual({ name: 'Facultad de Ingenierías' });
  });
});
