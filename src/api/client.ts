const SESSION_STORAGE_KEY = 'uco-kudos.session';

export class ApiError extends Error {
  readonly status: number;
  readonly invalidFields: Record<string, string>;

  constructor(status: number, message: string, invalidFields: Record<string, string> = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.invalidFields = invalidFields;
  }
}

interface ProblemDetail {
  title?: string;
  detail?: string;
  invalidFields?: Record<string, string>;
}

type UnauthorizedListener = () => void;
let unauthorizedListener: UnauthorizedListener = () => undefined;

export function onUnauthorized(listener: UnauthorizedListener): void {
  unauthorizedListener = listener;
}

export function storedToken(): string | null {
  const stored = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!stored) {
    return null;
  }
  return (JSON.parse(stored) as { accessToken: string }).accessToken;
}

export const sessionStorageKey = SESSION_STORAGE_KEY;

async function toApiError(response: Response): Promise<ApiError> {
  const fallbackMessage = 'No fue posible completar la operación';
  try {
    const problem = (await response.json()) as ProblemDetail;
    return new ApiError(response.status, problem.detail ?? problem.title ?? fallbackMessage, problem.invalidFields);
  } catch {
    return new ApiError(response.status, fallbackMessage);
  }
}

export async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  const token = storedToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.status === 401 && token) {
    unauthorizedListener();
  }
  if (!response.ok) {
    throw await toApiError(response);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}
