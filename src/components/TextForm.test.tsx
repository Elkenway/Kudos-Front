import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiError } from '../api/client';
import { TextForm } from './TextForm';

describe('TextForm', () => {
  it('no permite enviar un texto vacío', () => {
    render(<TextForm label="Motivo" submitLabel="Rechazar" onSubmit={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Rechazar' })).toBeDisabled();
  });

  it('envía el texto, limpia el campo y avisa que terminó', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onDone = vi.fn();
    render(<TextForm label="Motivo" submitLabel="Rechazar" onSubmit={onSubmit} onDone={onDone} />);

    await userEvent.type(screen.getByLabelText('Motivo'), 'Datos incompletos');
    await userEvent.click(screen.getByRole('button', { name: 'Rechazar' }));

    expect(onSubmit).toHaveBeenCalledWith('Datos incompletos');
    expect(onDone).toHaveBeenCalledOnce();
    expect(screen.getByLabelText('Motivo')).toHaveValue('');
  });

  it('conserva el texto y muestra el mensaje del servidor cuando la operación falla', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new ApiError(422, 'La réplica no puede estar vacía'));
    const onDone = vi.fn();
    render(<TextForm label="Respuesta" submitLabel="Publicar" onSubmit={onSubmit} onDone={onDone} multiline={false} />);

    await userEvent.type(screen.getByLabelText('Respuesta'), 'Hola');
    await userEvent.click(screen.getByRole('button', { name: 'Publicar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('La réplica no puede estar vacía');
    expect(screen.getByLabelText('Respuesta')).toHaveValue('Hola');
    expect(onDone).not.toHaveBeenCalled();
  });

  it('ofrece cancelar solo cuando se indica cómo hacerlo', async () => {
    const onCancel = vi.fn();
    render(<TextForm label="Motivo" submitLabel="Enviar" onSubmit={vi.fn()} onCancel={onCancel} />);

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onCancel).toHaveBeenCalledOnce();
  });
});
