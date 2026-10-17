import { requireEnv } from './require-env.js';

describe('requireEnv', () => {
  it('devuelve el valor si la variable existe', () => {
    process.env.TEST_REQUIRE_ENV = 'valor';
    expect(requireEnv('TEST_REQUIRE_ENV')).toBe('valor');
  });

  it('lanza un error con el nombre si falta', () => {
    delete process.env.TEST_REQUIRE_ENV_MISSING;
    expect(() => requireEnv('TEST_REQUIRE_ENV_MISSING')).toThrow(
      'Falta la variable de entorno TEST_REQUIRE_ENV_MISSING',
    );
  });
});
