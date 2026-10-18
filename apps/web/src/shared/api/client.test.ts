import {
  ApiError,
  apiFetch,
  onSessionExpired,
  session,
} from '@/shared/api/client';

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('apiFetch', () => {
  beforeEach(() => {
    session.set({ accessToken: 'old', refreshToken: 'r1' });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    session.clear();
  });

  it('envía el bearer y prefija la ruta del servicio', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(200, { ok: true }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(apiFetch('siagie', '/schools')).resolves.toEqual({ ok: true });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/siagie/schools');
    expect(new Headers(init.headers).get('authorization')).toBe('Bearer old');
  });

  it('renueva el token una sola vez aunque fallen dos peticiones a la vez', async () => {
    const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
      if (url === '/api/auth/auth/refresh')
        return json(200, {
          accessToken: 'new',
          refreshToken: 'r2',
          expiresIn: 900,
        });
      const auth = new Headers(init.headers).get('authorization');
      return auth === 'Bearer new'
        ? json(200, { url })
        : json(401, { message: 'Unauthorized' });
    });
    vi.stubGlobal('fetch', fetchMock);
    const [a, b] = await Promise.all([
      apiFetch('alerta', '/alerts'),
      apiFetch('alerta', '/cases'),
    ]);
    expect(a).toEqual({ url: '/api/alerta/alerts' });
    expect(b).toEqual({ url: '/api/alerta/cases' });
    expect(
      fetchMock.mock.calls.filter(([u]) => u === '/api/auth/auth/refresh'),
    ).toHaveLength(1);
    expect(session.get()).toEqual({ accessToken: 'new', refreshToken: 'r2' });
  });

  it('si la renovación falla, cierra la sesión y avisa una vez', async () => {
    const expired = vi.fn();
    const off = onSessionExpired(expired);
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) =>
        url === '/api/auth/auth/refresh'
          ? json(401, { message: 'Token inválido' })
          : json(401, {}),
      ),
    );
    await expect(apiFetch('simon', '/reports')).rejects.toMatchObject({
      status: 401,
    });
    expect(session.get()).toBeNull();
    expect(expired).toHaveBeenCalledTimes(1);
    off();
  });

  it('traduce el mensaje de error del backend', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        json(400, {
          message: ['date must be a valid ISO 8601 date string', 'otro'],
        }),
      ),
    );
    const error = (await apiFetch('escale', '/stats/compute', {
      method: 'POST',
      body: {},
    }).catch((e) => e)) as ApiError;
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(400);
    expect(error.message).toBe(
      'date must be a valid ISO 8601 date string · otro',
    );
  });

  it('devuelve undefined en 204 y serializa el cuerpo como JSON', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(
      apiFetch('auth', '/auth/logout', {
        method: 'POST',
        body: { refreshToken: 'r1' },
      }),
    ).resolves.toBeUndefined();
    const [, init] = fetchMock.mock.calls[0];
    expect(init.body).toBe('{"refreshToken":"r1"}');
    expect(new Headers(init.headers).get('content-type')).toBe(
      'application/json',
    );
  });

  it('el refresh token se guarda en sessionStorage, nunca el access token', () => {
    session.set({ accessToken: 'a', refreshToken: 'r' });
    expect(sessionStorage.getItem('centinela.refresh')).toBe('r');
    expect(JSON.stringify({ ...sessionStorage })).not.toContain('"a"');
  });
});

describe('seg', () => {
  it('acepta un UUID y rechaza segmentos que cambian la ruta', async () => {
    const { seg } = await import('@/shared/api/client');
    expect(seg('01920000-0000-7000-8000-000000000010')).toBe(
      '01920000-0000-7000-8000-000000000010',
    );
    for (const bad of [
      '../users',
      '..%2F..%2Fauth',
      'abc?x=1',
      'a#b',
      '',
      undefined,
    ])
      expect(() => seg(bad)).toThrow(ApiError);
  });
});
