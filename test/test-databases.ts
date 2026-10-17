import 'dotenv/config';

// Cada servicio tiene su schema de pruebas. Nunca se corre un test contra auth o siagie.
export const TEST_DATABASES = [
  { service: 'ms-auth', envVar: 'AUTH_DATABASE_URL', testVar: 'AUTH_TEST_DATABASE_URL', schema: 'auth_test' },
  { service: 'ms-siagie', envVar: 'SIAGIE_DATABASE_URL', testVar: 'SIAGIE_TEST_DATABASE_URL', schema: 'siagie_test' },
] as const;

export function pointToTestDatabases(): void {
  for (const db of TEST_DATABASES) {
    const url = process.env[db.testVar];
    if (!url) throw new Error(`Falta la variable de entorno ${db.testVar}`);
    if (new URL(url).searchParams.get('schema') !== db.schema) {
      throw new Error(`${db.testVar} debe usar schema=${db.schema}; se aborta para no tocar datos reales`);
    }
    process.env[db.envVar] = url;
  }
}
