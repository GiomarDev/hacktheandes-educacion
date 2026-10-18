import { pointToTestDatabases } from './test-databases.js';

describe('aislamiento de las bases de prueba', () => {
  beforeEach(() => {
    vi.stubEnv(
      'SIMON_TEST_DATABASE_URL',
      'postgresql://test:fake@localhost/school?schema=simon_test',
    );
    vi.stubEnv(
      'SIMON_DATABASE_URL',
      'postgresql://test:fake@localhost/school?schema=simon',
    );
    vi.stubEnv(
      'ALERTA_TEST_DATABASE_URL',
      'postgresql://test:fake@localhost/school?schema=alerta_test',
    );
    vi.stubEnv(
      'ALERTA_DATABASE_URL',
      'postgresql://test:fake@localhost/school?schema=alerta',
    );
    vi.stubEnv(
      'AUTH_TEST_DATABASE_URL',
      'postgresql://test:fake@localhost/school?schema=auth_test',
    );
    vi.stubEnv(
      'SIAGIE_TEST_DATABASE_URL',
      'postgresql://test:fake@localhost/school?schema=siagie_test',
    );
    vi.stubEnv(
      'AUTH_DATABASE_URL',
      'postgresql://test:fake@localhost/school?schema=auth',
    );
    vi.stubEnv(
      'SIAGIE_DATABASE_URL',
      'postgresql://test:fake@localhost/school?schema=siagie',
    );
  });

  afterEach(() => vi.unstubAllEnvs());

  it('redirige todos los servicios exclusivamente a sus schemas de prueba', () => {
    pointToTestDatabases();
    expect(process.env.SIMON_DATABASE_URL).toBe(
      process.env.SIMON_TEST_DATABASE_URL,
    );
    expect(process.env.AUTH_DATABASE_URL).toBe(
      process.env.AUTH_TEST_DATABASE_URL,
    );
    expect(process.env.SIAGIE_DATABASE_URL).toBe(
      process.env.SIAGIE_TEST_DATABASE_URL,
    );
    expect(process.env.ALERTA_DATABASE_URL).toBe(
      process.env.ALERTA_TEST_DATABASE_URL,
    );
  });

  it.each(['AUTH', 'SIAGIE', 'ALERTA', 'SIMON'])(
    'rechaza el schema real de %s',
    (service) => {
      vi.stubEnv(
        `${service}_TEST_DATABASE_URL`,
        `postgresql://test:fake@localhost/school?schema=${service.toLowerCase()}`,
      );
      expect(() => pointToTestDatabases()).toThrow(
        'se aborta para no tocar datos reales',
      );
    },
  );

  it('deriva escale_test de la URL de prueba de SIMON cuando no hay una propia', () => {
    vi.stubEnv('ESCALE_TEST_DATABASE_URL', undefined);
    pointToTestDatabases();
    const url = new URL(process.env.ESCALE_DATABASE_URL!);
    expect(url.searchParams.get('schema')).toBe('escale_test');
    expect(url.host).toBe('localhost');
  });

  it('rechaza el schema real de ESCALE', () => {
    vi.stubEnv(
      'ESCALE_TEST_DATABASE_URL',
      'postgresql://test:fake@localhost/school?schema=escale',
    );
    expect(() => pointToTestDatabases()).toThrow(
      'se aborta para no tocar datos reales',
    );
  });

  it('aborta si falta la URL de prueba', () => {
    vi.stubEnv('AUTH_TEST_DATABASE_URL', undefined);
    expect(() => pointToTestDatabases()).toThrow(
      'Falta la variable de entorno AUTH_TEST_DATABASE_URL',
    );
  });
});
