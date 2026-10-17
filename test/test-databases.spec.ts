import { pointToTestDatabases } from './test-databases.js';

describe('aislamiento de las bases de prueba', () => {
  beforeEach(() => {
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

  it('redirige ambos servicios exclusivamente a sus schemas de prueba', () => {
    pointToTestDatabases();
    expect(process.env.AUTH_DATABASE_URL).toBe(
      process.env.AUTH_TEST_DATABASE_URL,
    );
    expect(process.env.SIAGIE_DATABASE_URL).toBe(
      process.env.SIAGIE_TEST_DATABASE_URL,
    );
  });

  it.each(['AUTH', 'SIAGIE'])('rechaza el schema real de %s', (service) => {
    vi.stubEnv(
      `${service}_TEST_DATABASE_URL`,
      `postgresql://test:fake@localhost/school?schema=${service.toLowerCase()}`,
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
