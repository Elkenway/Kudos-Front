import { jsonResponse } from '../test/fixtures';
import { ApiError, onUnauthorized, request, sessionStorageKey } from './client';

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

function storeSession(accessToken: string) {
  localStorage.setItem(sessionStorageKey, JSON.stringify({ accessToken }));
}

describe('request', () => {
  it('envía el token de la sesión y el cuerpo como JSON', async () => {
    storeSession('token-de-prueba');
    fetchMock.mockResolvedValue(jsonResponse(200, { ok: true }));

    const result = await request<{ ok: boolean }>('POST', '/api/kudos', { body: 'Gracias' });

    expect(result).toEqual({ ok: true });
    const [path, init] = fetchMock.mock.calls[0] ?? [];
    expect(path).toBe('/api/kudos');
    expect(init?.headers).toEqual({ Authorization: 'Bearer token-de-prueba', 'Content-Type': 'application/json' });
    expect(init?.body).toBe(JSON.stringify({ body: 'Gracias' }));
  });

  it('no envía encabezados cuando no hay sesión ni cuerpo', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, []));

    await request('GET', '/api/faculties');

    expect(fetchMock.mock.calls[0]?.[1]?.headers).toEqual({});
  });

  it('resuelve sin contenido cuando el servidor responde 204', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await expect(request('POST', '/api/notifications/1/read')).resolves.toBeUndefined();
  });

  it('convierte un ProblemDetail en ApiError con el detalle y los campos inválidos', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(400, { title: 'Bad Request', detail: 'Datos inválidos', invalidFields: { email: 'requerido' } }),
    );

    const failure = await request('POST', '/api/auth/registrations', {}).catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(ApiError);
    expect(failure).toMatchObject({ status: 400, message: 'Datos inválidos', invalidFields: { email: 'requerido' } });
  });

  it('usa un mensaje genérico cuando el error no trae cuerpo JSON', async () => {
    fetchMock.mockResolvedValue(new Response('fallo', { status: 500 }));

    await expect(request('GET', '/api/kudos')).rejects.toMatchObject({
      status: 500,
      message: 'No fue posible completar la operación',
    });
  });

  it('avisa la sesión vencida cuando una petición autenticada recibe 401', async () => {
    const listener = vi.fn();
    onUnauthorized(listener);
    storeSession('token-vencido');
    fetchMock.mockResolvedValue(jsonResponse(401, { title: 'Unauthorized' }));

    await expect(request('GET', '/api/profile')).rejects.toBeInstanceOf(ApiError);
    expect(listener).toHaveBeenCalledOnce();
  });
});
