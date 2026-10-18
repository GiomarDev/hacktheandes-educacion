export type Service = 'auth' | 'siagie' | 'alerta' | 'simon' | 'escale';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

interface Tokens {
  accessToken: string;
  refreshToken: string;
}

// El access token vive solo en memoria; el refresh token en sessionStorage (se borra al cerrar la pestaña).
const REFRESH_KEY = 'centinela.refresh';
let accessToken: string | null = null;

function storage(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export const session = {
  get(): Tokens | null {
    const refreshToken = storage()?.getItem(REFRESH_KEY) ?? null;
    return refreshToken
      ? { accessToken: accessToken ?? '', refreshToken }
      : null;
  },
  set(tokens: Tokens) {
    accessToken = tokens.accessToken;
    storage()?.setItem(REFRESH_KEY, tokens.refreshToken);
  },
  clear() {
    accessToken = null;
    storage()?.removeItem(REFRESH_KEY);
  },
};

const expiredListeners = new Set<() => void>();
export function onSessionExpired(listener: () => void) {
  expiredListeners.add(listener);
  return () => {
    expiredListeners.delete(listener);
  };
}

async function errorOf(response: Response): Promise<ApiError> {
  let message = response.statusText || `Error ${response.status}`;
  try {
    const body = await response.json();
    if (Array.isArray(body?.message)) message = body.message.join(' · ');
    else if (typeof body?.message === 'string') message = body.message;
  } catch {
    // Respuesta sin JSON: se usa el estado HTTP.
  }
  return new ApiError(response.status, message);
}

// Varias peticiones que reciben 401 a la vez comparten una sola renovación.
let refreshing: Promise<boolean> | null = null;
function refreshOnce(): Promise<boolean> {
  refreshing ??= (async () => {
    const refreshToken = session.get()?.refreshToken;
    if (!refreshToken) return false;
    try {
      const response = await fetch('/api/auth/auth/refresh', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!response.ok) return false;
      const tokens = (await response.json()) as Tokens;
      session.set(tokens);
      return true;
    } catch {
      return false;
    }
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

export interface ApiInit extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

export async function apiFetch<T = unknown>(
  service: Service,
  path: string,
  init: ApiInit = {},
): Promise<T> {
  const send = () => {
    const headers = new Headers(init.headers);
    if (accessToken) headers.set('authorization', `Bearer ${accessToken}`);
    if (init.body !== undefined)
      headers.set('content-type', 'application/json');
    return fetch(`/api/${service}${path}`, {
      ...init,
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
  };
  let response = await send();
  if (response.status === 401 && session.get()) {
    if (await refreshOnce()) response = await send();
    if (response.status === 401) {
      const hadSession = session.get() !== null;
      session.clear();
      if (hadSession) expiredListeners.forEach((l) => l());
    }
  }
  if (!response.ok) throw await errorOf(response);
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
