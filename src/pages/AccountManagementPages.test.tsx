import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { installFakeServer } from '../test/fakeServer';
import { person } from '../test/fixtures';
import { renderApp } from '../test/renderApp';

const programCoordinator = person({ id: 'coordinador', fullName: 'Coordinadora Sistemas', role: 'PROGRAM_COORDINATOR' });
const administrator = person({ id: 'admin', fullName: 'Administración', role: 'ADMINISTRATOR' });

const pendingRegistration = {
  requestId: 'solicitud-1',
  applicant: person({ id: 'aspirante', fullName: 'Pedro Arango', status: 'PENDING_ACTIVATION' }),
  email: 'pedro@uco.edu.co',
  phone: '3005556677',
  emailVerified: true,
  phoneVerified: false,
  requestedRole: 'STUDENT',
  requestedPrograms: ['Ingeniería de Sistemas'],
  requestedFaculty: null,
  submittedAt: '2026-11-03T10:00:00Z',
};

describe('ApprovalsPage', () => {
  it('muestra la solicitud con el estado de verificación de cada contacto', async () => {
    installFakeServer({ 'GET /api/registration-requests': [pendingRegistration] });
    renderApp('/aprobaciones', programCoordinator);

    expect(await screen.findByRole('heading', { name: 'Pedro Arango' })).toBeInTheDocument();
    expect(screen.getByText('pedro@uco.edu.co (verificado)')).toBeInTheDocument();
    expect(screen.getByText('3005556677 (sin verificar)')).toBeInTheDocument();
    expect(screen.getByText('Ingeniería de Sistemas')).toBeInTheDocument();
  });

  it('aprueba una solicitud y recarga la lista', async () => {
    const server = installFakeServer({
      'GET /api/registration-requests': [pendingRegistration],
      'POST /api/registration-requests/solicitud-1/approval': undefined,
    });
    renderApp('/aprobaciones', programCoordinator);

    await userEvent.click(await screen.findByRole('button', { name: 'Aprobar' }));

    expect(server.sent('POST', '/api/registration-requests/solicitud-1/approval')).toHaveLength(1);
    expect(server.sent('GET', '/api/registration-requests')).toHaveLength(2);
  });

  it('rechaza una solicitud con un motivo', async () => {
    const server = installFakeServer({
      'GET /api/registration-requests': [pendingRegistration],
      'POST /api/registration-requests/solicitud-1/rejection': undefined,
    });
    renderApp('/aprobaciones', programCoordinator);

    await userEvent.click(await screen.findByRole('button', { name: 'Rechazar' }));
    await userEvent.type(screen.getByLabelText('Motivo del rechazo'), 'No pertenece al programa');
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar rechazo' }));

    expect(server.sent('POST', '/api/registration-requests/solicitud-1/rejection')[0]?.body).toEqual({
      reason: 'No pertenece al programa',
    });
  });

  it('indica cuando no hay solicitudes pendientes', async () => {
    installFakeServer({ 'GET /api/registration-requests': [] });
    renderApp('/aprobaciones', programCoordinator);

    expect(await screen.findByText('No hay solicitudes pendientes.')).toBeInTheDocument();
  });
});

describe('ManagedAccountsPage', () => {
  const managedAccounts = [
    {
      person: person({ id: 'activo', fullName: 'Ana Activa', role: 'TEACHER' }),
      email: 'ana@uco.edu.co',
      phone: '3001112233',
      affiliation: 'Ingeniería de Sistemas',
    },
    {
      person: person({ id: 'suspendido', fullName: 'Sergio Suspendido', status: 'SUSPENDED' }),
      email: 'sergio@uco.edu.co',
      phone: '3004445566',
      affiliation: 'Ingeniería de Sistemas',
    },
  ];

  it('suspende una cuenta activa indicando el motivo', async () => {
    const server = installFakeServer({
      'GET /api/managed-accounts': managedAccounts,
      'POST /api/managed-accounts/activo/suspension': undefined,
    });
    renderApp('/usuarios', programCoordinator);

    const activeRow = (await screen.findByText('Ana Activa')).closest('tr') as HTMLElement;
    await userEvent.click(within(activeRow).getByRole('button', { name: 'Suspender' }));
    await userEvent.type(screen.getByLabelText('Motivo de la suspensión'), 'Proceso disciplinario');
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(server.sent('POST', '/api/managed-accounts/activo/suspension')[0]?.body).toEqual({
      reason: 'Proceso disciplinario',
    });
  });

  it('reactiva una cuenta suspendida', async () => {
    const server = installFakeServer({
      'GET /api/managed-accounts': managedAccounts,
      'POST /api/managed-accounts/suspendido/reactivation': undefined,
    });
    renderApp('/usuarios', programCoordinator);

    await userEvent.click(await screen.findByRole('button', { name: 'Reactivar' }));

    expect(server.sent('POST', '/api/managed-accounts/suspendido/reactivation')).toHaveLength(1);
  });

  it('desactiva una cuenta con su motivo', async () => {
    const server = installFakeServer({
      'GET /api/managed-accounts': managedAccounts,
      'POST /api/managed-accounts/suspendido/deactivation': undefined,
    });
    renderApp('/usuarios', programCoordinator);

    const suspendedRow = (await screen.findByText('Sergio Suspendido')).closest('tr') as HTMLElement;
    await userEvent.click(within(suspendedRow).getByRole('button', { name: 'Desactivar' }));
    await userEvent.type(screen.getByLabelText('Motivo de la desactivación'), 'Retiro de la universidad');
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(server.sent('POST', '/api/managed-accounts/suspendido/deactivation')[0]?.body).toEqual({
      reason: 'Retiro de la universidad',
    });
  });

  it('solo quien administra registra directamente a rectores y administradores', async () => {
    const server = installFakeServer({
      'GET /api/managed-accounts': [],
      'POST /api/managed-accounts': { id: 'nuevo-rector' },
    });
    renderApp('/usuarios', administrator);

    await userEvent.click(await screen.findByText('Registrar Administrador o Rector'));
    await userEvent.selectOptions(screen.getByLabelText('Rol'), 'Rector');
    await userEvent.type(screen.getByLabelText('Nombre completo'), 'Nuevo Rector');
    await userEvent.type(screen.getByLabelText('Correo institucional'), 'rector@uco.edu.co');
    await userEvent.type(screen.getByLabelText('Celular'), '3009998877');
    await userEvent.type(screen.getByLabelText('Contraseña inicial'), 'ClaveSegura2026');
    await userEvent.click(screen.getByRole('button', { name: 'Registrar' }));

    expect(await screen.findByText(/Nuevo Rector debe verificar su correo y su celular/)).toBeInTheDocument();
    expect(server.sent('POST', '/api/managed-accounts')[0]?.body).toEqual({
      fullName: 'Nuevo Rector',
      email: 'rector@uco.edu.co',
      phone: '3009998877',
      password: 'ClaveSegura2026',
      role: 'RECTOR',
    });
  });

  it('un coordinador de programa no ve el registro directo', async () => {
    installFakeServer({ 'GET /api/managed-accounts': [] });
    renderApp('/usuarios', programCoordinator);

    expect(await screen.findByText('No tienes usuarios a cargo.')).toBeInTheDocument();
    expect(screen.queryByText(/^Registrar /)).not.toBeInTheDocument();
  });
});
