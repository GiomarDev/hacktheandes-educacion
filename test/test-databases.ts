import 'dotenv/config';

// Cada servicio tiene su schema de pruebas. Nunca se corre un test contra auth o siagie.
export const TEST_DATABASES = [
  {
    service: 'ms-auth',
    envVar: 'AUTH_DATABASE_URL',
    testVar: 'AUTH_TEST_DATABASE_URL',
    schema: 'auth_test',
  },
  {
    service: 'ms-siagie',
    envVar: 'SIAGIE_DATABASE_URL',
    testVar: 'SIAGIE_TEST_DATABASE_URL',
    schema: 'siagie_test',
  },
  {
    service: 'ms-alerta',
    envVar: 'ALERTA_DATABASE_URL',
    testVar: 'ALERTA_TEST_DATABASE_URL',
    schema: 'alerta_test',
  },
  {
    service: 'ms-simon',
    envVar: 'SIMON_DATABASE_URL',
    testVar: 'SIMON_TEST_DATABASE_URL',
    schema: 'simon_test',
  },
  {
    service: 'ms-escale',
    envVar: 'ESCALE_DATABASE_URL',
    testVar: 'ESCALE_TEST_DATABASE_URL',
    schema: 'escale_test',
    // Misma base y credenciales que SIMON; solo cambia el schema. Evita duplicar el secreto en el .env.
    derivedFrom: 'SIMON_TEST_DATABASE_URL',
  },
] as const;

function testUrlOf(db: (typeof TEST_DATABASES)[number]): string | undefined {
  const url = process.env[db.testVar];
  if (url || !('derivedFrom' in db)) return url;
  const base = process.env[db.derivedFrom];
  if (!base) return undefined;
  const derived = new URL(base);
  derived.searchParams.set('schema', db.schema);
  return derived.toString();
}

export function pointToTestDatabases(): void {
  for (const db of TEST_DATABASES) {
    const url = testUrlOf(db);
    if (!url) throw new Error(`Falta la variable de entorno ${db.testVar}`);
    if (new URL(url).searchParams.get('schema') !== db.schema) {
      throw new Error(
        `${db.testVar} debe usar schema=${db.schema}; se aborta para no tocar datos reales`,
      );
    }
    process.env[db.envVar] = url;
    process.env[db.testVar] = url;
  }
}
