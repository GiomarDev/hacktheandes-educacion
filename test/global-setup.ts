import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { pointToTestDatabases } from './test-databases.js';

// Aplica las migraciones pendientes a los schemas de prueba (no borra nada; cada test limpia sus tablas).
export default function setup(): void {
  pointToTestDatabases();
  for (const app of ['ms-auth', 'ms-siagie', 'ms-alerta', 'ms-simon']) {
    if (!existsSync(`apps/${app}/prisma/migrations`)) continue;
    execSync(
      `npx prisma migrate deploy --config apps/${app}/prisma.config.ts`,
      {
        stdio: 'inherit',
        env: process.env,
      },
    );
  }
}
