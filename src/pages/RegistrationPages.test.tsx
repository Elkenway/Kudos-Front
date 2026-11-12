import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { failWith, installFakeServer } from '../test/fakeServer';
import { renderApp } from '../test/renderApp';

const organizationRoutes = {
  'GET /api/faculties': [{ id: 'f1', name: 'Ingenierías', coordinator: null, programCount: 2 }],
  'GET /api/programs': [
    { id: 'p1', name: 'Ingeniería de Sistemas', facultyId: 'f1', coordinator: null },
    { id: 'p2', name: 'Ingeniería Industrial', facultyId: 'f1', coordinator: null },
  ],
};

async function fillPersonalData() {
  await userEvent.type(screen.getByLabelText('Nombre completo'), 'Laura Gómez');
  await userEvent.type(screen.getByLabelText('Correo institucional (@uco.edu.co)'), 'laura@uco.edu.co');
  await userEvent.type(screen.getByLabelText('Celular'), '3001234567');
  await userEvent.type(screen.getByLabelText('Contraseña (mínimo 8 caracteres)'), 'ClaveSegura2026');
}

describe('RegisterPage', () => {
  it('registra a un estudiante con sus programas y lo lleva a verificar el contacto', async () => {
    const server = installFakeServer({
      ...organizationRoutes,
      'POST /api/auth/registrations': { accountId: 'a1', registrationRequestId: 'r1' },
    });
    renderApp('/registro');

    await fillPersonalData();
    await userEvent.click(await screen.findByLabelText('Ingeniería de Sistemas'));
    await userEvent.click(screen.getByLabelText('Ingeniería Industrial'));
    await userEvent.click(screen.getByRole('button', { name: 'Enviar solicitud' }));

    expect(await screen.findByRole('heading', { name: 'Verificar contacto' })).toBeInTheDocument();
    expect(screen.getByLabelText('Correo institucional')).toHaveValue('laura@uco.edu.co');
    expect(server.sent('POST', '/api/auth/registrations')[0]?.body).toEqual({
      fullName: 'Laura Gómez',
      email: 'laura@uco.edu.co',
      phone: '3001234567',
      password: 'ClaveSegura2026',
      role: 'STUDENT',
      programIds: ['p1', 'p2'],
      facultyId: null,
    });
  });

  it('pide la facultad, y no programas, a quien coordinará una facultad', async () => {
    const server = installFakeServer({
      ...organizationRoutes,
      'POST /api/auth/registrations': { accountId: 'a1', registrationRequestId: 'r1' },
    });
    renderApp('/registro');

    await fillPersonalData();
    await userEvent.selectOptions(screen.getByLabelText('Rol'), 'Coordinador de Facultad');
    await userEvent.selectOptions(await screen.findByLabelText('Facultad que coordinarás'), 'Ingenierías');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar solicitud' }));

    expect(screen.queryByText('Programas a los que perteneces')).not.toBeInTheDocument();
    expect(server.sent('POST', '/api/auth/registrations')[0]?.body).toMatchObject({
      role: 'FACULTY_COORDINATOR',
      programIds: [],
      facultyId: 'f1',
    });
  });

  it('un coordinador de programa elige un único programa', async () => {
    installFakeServer(organizationRoutes);
    renderApp('/registro');

    await userEvent.selectOptions(screen.getByLabelText('Rol'), 'Coordinador de Programa');
    await userEvent.click(await screen.findByLabelText('Ingeniería de Sistemas'));
    await userEvent.click(screen.getByLabelText('Ingeniería Industrial'));

    expect(screen.getByLabelText('Ingeniería de Sistemas')).not.toBeChecked();
    expect(screen.getByLabelText('Ingeniería Industrial')).toBeChecked();
  });

  it('muestra el rechazo del servidor', async () => {
    installFakeServer({
      ...organizationRoutes,
      'POST /api/auth/registrations': failWith(422, 'El correo debe ser institucional'),
    });
    renderApp('/registro');

    await fillPersonalData();
    await userEvent.click(screen.getByRole('button', { name: 'Enviar solicitud' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('El correo debe ser institucional');
  });
});

describe('VerifyPage', () => {
  it('verifica el correo e informa el estado de la cuenta', async () => {
    const server = installFakeServer({
      'POST /api/auth/email-verification': {
        emailVerified: true,
        phoneVerified: false,
        approved: false,
        status: 'PENDING_ACTIVATION',
      },
    });
    renderApp('/verificacion');

    await userEvent.type(screen.getByLabelText('Correo institucional'), 'laura@uco.edu.co');
    await userEvent.type(screen.getByLabelText('Código del correo'), '123456');
    await userEvent.click(screen.getByRole('button', { name: 'Verificar correo' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Estado de la cuenta: Pendiente de activación · pendiente de aprobación institucional',
    );
    expect(screen.getByRole('button', { name: 'Correo verificado' })).toBeDisabled();
    expect(server.sent('POST', '/api/auth/email-verification')[0]?.body).toEqual({
      email: 'laura@uco.edu.co',
      code: '123456',
    });
  });

  it('verifica el celular con su propio código', async () => {
    const server = installFakeServer({
      'POST /api/auth/phone-verification': { emailVerified: true, phoneVerified: true, approved: true, status: 'ACTIVE' },
    });
    renderApp('/verificacion');

    await userEvent.type(screen.getByLabelText('Correo institucional'), 'laura@uco.edu.co');
    await userEvent.type(screen.getByLabelText('Código del celular'), '654321');
    await userEvent.click(screen.getByRole('button', { name: 'Verificar celular' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Estado de la cuenta: Activa');
    expect(server.sent('POST', '/api/auth/phone-verification')[0]?.body).toEqual({
      email: 'laura@uco.edu.co',
      code: '654321',
    });
  });

  it('reenvía los códigos pendientes', async () => {
    installFakeServer({ 'POST /api/auth/verification-codes': undefined });
    renderApp('/verificacion');

    await userEvent.type(screen.getByLabelText('Correo institucional'), 'laura@uco.edu.co');
    await userEvent.click(screen.getByRole('button', { name: 'Reenviar códigos' }));

    expect(await screen.findByText(/Enviamos nuevos códigos/)).toBeInTheDocument();
  });
});
