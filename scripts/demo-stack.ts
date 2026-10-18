// Demo local completa sobre los schemas de PRUEBA (*_test): migra, siembra datos sintéticos,
// genera actividad de asistencia, arranca los cinco servicios compilados y carga los indicadores.
// Nunca toca los schemas reales: pointToTestDatabases() aborta si una URL no termina en _test.
// Uso: npm run build && npm run demo:stack   (Ctrl+C detiene todo)
import 'dotenv/config';
import { execSync, spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { connect } from 'node:net';
import { setTimeout as sleep } from 'node:timers/promises';
import { dateOnly, pgConnectionFromUrl, todayInLima } from '@app/common';
import { SEED_IDS } from '@app/fixtures';
import {
  pointToTestDatabases,
  TEST_DATABASES,
} from '../test/test-databases.js';
import { seedAuth } from '../apps/ms-auth/prisma/seed.js';
import { seedSiagie } from '../apps/ms-siagie/prisma/seed.js';
import { seedRules } from '../apps/ms-alerta/prisma/seed.js';
import { seedDocuments } from '../apps/ms-simon/prisma/seed.js';
import { PrismaService as AuthPrisma } from '../apps/ms-auth/src/prisma.service.js';
import { PrismaService as SiagiePrisma } from '../apps/ms-siagie/src/prisma.service.js';
import { PrismaService as AlertaPrisma } from '../apps/ms-alerta/src/prisma.service.js';
import { PrismaService as SimonPrisma } from '../apps/ms-simon/src/prisma.service.js';
import { PrismaService as EscalePrisma } from '../apps/ms-escale/src/prisma.service.js';

const PORTS = {
  'ms-auth': 3000,
  'ms-siagie': 3001,
  'ms-alerta': 3002,
  'ms-simon': 3003,
  'ms-escale': 3004,
};

pointToTestDatabases();
const password = process.env.SEED_PASSWORD;
if (!password) throw new Error('Falta la variable de entorno SEED_PASSWORD');
for (const service of Object.keys(PORTS))
  if (!existsSync(`dist/apps/${service}/main.js`))
    throw new Error(`Falta el build de ${service}: ejecute npm run build`);

// Otro programa en estos puertos (aunque sea solo por IPv4 o IPv6) recibiría parte de las peticiones a
// localhost: los servicios y el login de la demo hablarían con él. Mejor detenerse y avisarlo.
const answers = (host: string, port: number) =>
  new Promise<boolean>((resolve) => {
    const socket = connect({ host, port });
    socket.setTimeout(500);
    const done = (inUse: boolean) => {
      socket.destroy();
      resolve(inUse);
    };
    socket.once('connect', () => done(true));
    socket.once('error', () => done(false));
    socket.once('timeout', () => done(false));
  });
for (const port of Object.values(PORTS))
  for (const host of ['127.0.0.1', '::1'])
    if (await answers(host, port))
      throw new Error(
        `El puerto ${port} ya está en uso (${host}): detén ese proceso antes de la demo (lsof -nP -iTCP:${port} -sTCP:LISTEN)`,
      );

for (const db of TEST_DATABASES)
  execSync(
    `npx prisma migrate deploy --config apps/${db.service}/prisma.config.ts`,
    { stdio: 'ignore', env: process.env },
  );
console.log('Migraciones aplicadas en los schemas de prueba');

// Últimos 10 días hábiles antes de hoy (Lima).
function pastSchoolDays(count: number): string[] {
  const days: string[] = [];
  let t = dateOnly(todayInLima()).getTime();
  while (days.length < count) {
    t -= 86400000;
    const d = new Date(t);
    if (d.getUTCDay() !== 0 && d.getUTCDay() !== 6)
      days.unshift(d.toISOString().slice(0, 10));
  }
  return days;
}
const days = pastSchoolDays(10);

const authDb = new AuthPrisma();
const siagieDb = new SiagiePrisma();
const alertaDb = new AlertaPrisma();
const simonDb = new SimonPrisma();
const escaleDb = new EscalePrisma();

// La demo parte de schemas de prueba vacíos (las e2e dejan filas propias). Se conservan las
// migraciones y el catálogo de indicadores, que viene de la migración de ms-escale.
const KEEP = new Set(['_prisma_migrations', 'indicator_definitions']);
async function resetTestSchema(
  db: {
    $queryRawUnsafe: AuthPrisma['$queryRawUnsafe'];
    $executeRawUnsafe: AuthPrisma['$executeRawUnsafe'];
  },
  envVar: string,
) {
  const { schema } = pgConnectionFromUrl(process.env[envVar]!);
  if (!schema.endsWith('_test'))
    throw new Error(`Se aborta: ${schema} no es un schema de pruebas`);
  const rows = await db.$queryRawUnsafe<{ tablename: string }[]>(
    'SELECT tablename FROM pg_tables WHERE schemaname = $1',
    schema,
  );
  const tables = rows.map((r) => r.tablename).filter((t) => !KEEP.has(t));
  if (tables.length)
    await db.$executeRawUnsafe(
      `TRUNCATE ${tables.map((t) => `"${schema}"."${t}"`).join(', ')} CASCADE`,
    );
}

try {
  await resetTestSchema(authDb, 'AUTH_DATABASE_URL');
  await resetTestSchema(siagieDb, 'SIAGIE_DATABASE_URL');
  await resetTestSchema(alertaDb, 'ALERTA_DATABASE_URL');
  await resetTestSchema(simonDb, 'SIMON_DATABASE_URL');
  await resetTestSchema(escaleDb, 'ESCALE_DATABASE_URL');
  await seedAuth(authDb, password);
  await seedSiagie(siagieDb);
  await seedRules(alertaDb);
  await seedDocuments(simonDb);
  // Asistencia sintética: la mayoría asiste; algunos estudiantes acumulan faltas o tardanzas para que
  // las reglas de ms-alerta tengan evidencia. Sección B no pasa lista el último día (aula en silencio).
  const enrollments = await siagieDb.enrollment.findMany({
    where: { status: 'ENROLLED', section: { schoolId: SEED_IDS.school } },
    select: { id: true, sectionId: true },
    orderBy: { id: 'asc' },
  });
  const pattern = (n: number, i: number) => {
    if (n === 3 || n === 34) return i >= days.length - 4 ? 'ABSENT' : 'PRESENT';
    if (n === 7 || n === 41) return i % 3 === 0 ? 'ABSENT' : 'PRESENT';
    if (n === 12) return i >= days.length - 3 ? 'LATE' : 'PRESENT';
    if (n === 20 && i === days.length - 2) return 'JUSTIFIED';
    return 'PRESENT';
  };
  const records = enrollments.flatMap((e, n) =>
    days.flatMap((date, i) =>
      e.sectionId === SEED_IDS.sections.b1 && i === days.length - 1
        ? []
        : [
            {
              enrollmentId: e.id,
              date: dateOnly(date),
              status: pattern(n + 1, i) as
                'PRESENT' | 'ABSENT' | 'LATE' | 'JUSTIFIED',
              source: 'MANUAL' as const,
              recordedByUserId: SEED_IDS.users.auxiliar,
            },
          ],
    ),
  );
  const { count } = await siagieDb.attendanceRecord.createMany({
    data: records,
    skipDuplicates: true,
  });
  console.log(
    `Datos sintéticos listos (${count} registros de asistencia nuevos, ${days[0]} → ${days.at(-1)})`,
  );
} finally {
  await Promise.all(
    [authDb, siagieDb, alertaDb, simonDb, escaleDb].map((db) =>
      db.$disconnect(),
    ),
  );
}

const env = {
  ...process.env,
  AUTH_URL: 'http://localhost:3000',
  AUTH_JWKS_URL: 'http://localhost:3000/.well-known/jwks.json',
  SIAGIE_URL: 'http://localhost:3001',
  ALERTA_URL: 'http://localhost:3002',
};
const children: ChildProcess[] = [];
for (const [service, port] of Object.entries(PORTS)) {
  const child = spawn(process.execPath, [`dist/apps/${service}/main.js`], {
    env: { ...env, PORT: String(port) },
    stdio: ['ignore', 'ignore', 'inherit'],
  });
  children.push(child);
}
const stop = () => {
  for (const child of children) child.kill('SIGTERM');
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);

for (const [service, port] of Object.entries(PORTS)) {
  for (let i = 0; ; i++) {
    try {
      if ((await fetch(`http://localhost:${port}/health`)).ok) break;
    } catch {
      // Aún arrancando.
    }
    if (i > 150) throw new Error(`${service} no respondió /health`);
    await sleep(200);
  }
}
console.log('Servicios en 3000–3004');

// Indicadores: datos abiertos de docs/ y agregados de los días simulados (como MINEDU).
// Reintenta: recién arrancado, la primera consulta a una base remota puede expirar.
let login: Response | undefined;
for (let attempt = 0; attempt < 5 && !login?.ok; attempt++) {
  if (attempt) await sleep(2000);
  login = await fetch('http://localhost:3000/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      documentNumber: SEED_IDS.documents.admin,
      password,
    }),
  }).catch(() => undefined);
}
if (login?.ok) {
  const { accessToken } = (await login.json()) as { accessToken: string };
  const post = (path: string, body: unknown) =>
    fetch(`http://localhost:3004${path}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });
  for (const [dataset, fileName] of [
    ['DROPOUT_BY_REGION_SIAGIE', 'desercion_por_region_siagie_2023_2024.csv'],
    ['DROPOUT_RATE_SECONDARY_ESCALE', 'tasa_desercion_secundaria_escale.csv'],
  ]) {
    const r = await post('/imports', {
      dataset,
      fileName,
      content: readFileSync(`docs/${fileName}`, 'utf8'),
    });
    console.log(
      `Importación ${fileName}: ${r.status === 409 ? 'ya estaba' : r.status}`,
    );
  }
  for (const date of days) await post('/stats/compute', { date });
  console.log('Agregados diarios e indicadores por UGEL calculados');
} else {
  console.log(
    `No se pudo iniciar sesión como admin de demo (${login?.status ?? 'sin respuesta'}): indicadores sin cargar`,
  );
}
console.log(
  'Listo. Frontend: npm run web:dev → http://localhost:5173 · Ctrl+C para detener',
);
