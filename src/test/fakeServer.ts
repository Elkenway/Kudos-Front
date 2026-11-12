import { jsonResponse } from './fixtures';

export interface RecordedRequest {
  method: string;
  path: string;
  query: URLSearchParams;
  body: unknown;
}

type RouteReply = unknown | ((request: RecordedRequest) => unknown);

/**
 * Sustituye fetch por un servidor en memoria. Las rutas se declaran como "MÉTODO /ruta" (sin query string);
 * una respuesta `undefined` equivale a 204 y una Response se devuelve tal cual. Las rutas no declaradas
 * responden 404 para que una petición inesperada haga fallar la prueba de forma visible.
 */
export function installFakeServer(routes: Record<string, RouteReply>) {
  const requests: RecordedRequest[] = [];

  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(input instanceof Request ? input.url : String(input), 'http://localhost');
      const method = init?.method ?? 'GET';
      const recorded: RecordedRequest = {
        method,
        path: url.pathname,
        query: url.searchParams,
        body: typeof init?.body === 'string' ? (JSON.parse(init.body) as unknown) : undefined,
      };
      requests.push(recorded);

      const key = `${method} ${url.pathname}`;
      if (!(key in routes)) {
        return Promise.resolve(jsonResponse(404, { detail: `Sin respuesta simulada para ${key}` }));
      }
      const reply = routes[key];
      const value: unknown = typeof reply === 'function' ? (reply as (request: RecordedRequest) => unknown)(recorded) : reply;
      if (value instanceof Response) {
        return Promise.resolve(value);
      }
      return Promise.resolve(value === undefined ? new Response(null, { status: 204 }) : jsonResponse(200, value));
    }),
  );

  return {
    requests,
    sent: (method: string, path: string) => requests.filter((request) => request.method === method && request.path === path),
  };
}

export const failWith = (status: number, detail: string) => () => jsonResponse(status, { detail });
