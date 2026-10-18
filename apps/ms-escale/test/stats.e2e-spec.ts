import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { AppModule as AuthModule } from '../../ms-auth/src/app.module.js';
import { AppModule as SiagieModule } from '../../ms-siagie/src/app.module.js';
import { PrismaService as SiagiePrisma } from '../../ms-siagie/src/prisma.service.js';
import { AppModule as AlertaModule } from '../../ms-alerta/src/app.module.js';
import { PrismaService as AlertaPrisma } from '../../ms-alerta/src/prisma.service.js';
import {
  createEnrolledStudent,
  createSchoolFixture,
  USERS,
} from '../../ms-siagie/test/helpers/fixtures.js';
import { cleanSiagieTables } from '../../ms-siagie/test/helpers/db.js';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma.service.js';
import { cleanEscaleTables, loginAs, start } from './helpers.js';
import type { Started } from './helpers.js';

// 2026-03-02 es lunes; 2026-03-07, sábado.
const MONDAY = '2026-03-02';

describe('F4: agregados diarios e indicadores por UGEL', () => {
  let auth: Started, siagie: Started, alerta: Started, escale: Started;
  let prisma: PrismaService;
  let fx: Awaited<ReturnType<typeof createSchoolFixture>>;
  let tokens: Record<string, string>;
  const oldEnv = Object.fromEntries(
    ['AUTH_JWKS_URL', 'SIAGIE_URL', 'ALERTA_URL'].map((k) => [
      k,
      process.env[k],
    ]),
  );
  const as = (who: string) => ({ Authorization: `Bearer ${tokens[who]}` });
  const compute = (date: string, who = 'admin') =>
    request(escale.url).post('/stats/compute').set(as(who)).send({ date });

  beforeAll(async () => {
    auth = await start(AuthModule);
    process.env.AUTH_JWKS_URL = `${auth.url}/.well-known/jwks.json`;
    siagie = await start(SiagieModule);
    process.env.SIAGIE_URL = siagie.url;
    alerta = await start(AlertaModule);
    process.env.ALERTA_URL = alerta.url;
    escale = await start(AppModule);
    prisma = escale.app.get(PrismaService);
    const source = siagie.app.get(SiagiePrisma);
    const alertsDb = alerta.app.get(AlertaPrisma);
    await cleanSiagieTables(source);
    await alertsDb.$executeRawUnsafe(
      'TRUNCATE "alerta_test"."guardian_responses", "alerta_test"."notifications", "alerta_test"."case_actions", "alerta_test"."alerts", "alerta_test"."cases", "alerta_test"."inbox_events" CASCADE',
    );
    fx = await createSchoolFixture(source);
    // IE A: sección A con un presente y una falta; sección B sin pase de lista (aula en silencio).
    // IE B: una tardanza y una falta justificada.
    const marks = [
      [fx.sectionA.id, 'PRESENT'],
      [fx.sectionA.id, 'ABSENT'],
      [fx.sectionB.id, 'LATE'],
      [fx.sectionB.id, 'JUSTIFIED'],
    ] as const;
    const students = [];
    for (const [sectionId, status] of marks) {
      const s = await createEnrolledStudent(source, sectionId);
      students.push(s);
      await source.attendanceRecord.create({
        data: {
          enrollmentId: s.enrollment.id,
          date: new Date(MONDAY),
          status,
          source: 'MANUAL',
          recordedByUserId: USERS.auxiliarA,
        },
      });
    }
    // Dos casos abiertos, uno con contacto familiar.
    for (const [i, school, section] of [
      [0, fx.schoolA.id, fx.sectionA.id],
      [2, fx.schoolB.id, fx.sectionB.id],
    ] as const)
      await alertsDb.case.create({
        data: {
          studentId: students[i].student.id,
          schoolId: school,
          sectionId: section,
          ownerUserId: USERS.tutorA,
          ownerRole: 'TUTOR',
          dueAt: new Date('2026-03-10'),
          openedAt: new Date('2026-03-02T10:00:00-05:00'),
          firstContactAt:
            i === 0 ? new Date('2026-03-02T15:00:00-05:00') : null,
        },
      });
    tokens = await loginAs(
      auth,
      {
        admin: { id: randomUUID(), claim: { role: 'MINEDU_ADMIN' } },
        ugel: {
          id: randomUUID(),
          claim: { role: 'UGEL_SPECIALIST', ugelId: fx.ugel.id },
        },
        otherUgel: {
          id: randomUUID(),
          claim: { role: 'UGEL_SPECIALIST', ugelId: randomUUID() },
        },
      },
      '7300000',
    );
  }, 120000);
  beforeEach(() => cleanEscaleTables(prisma));
  afterAll(async () => {
    await escale?.app.close();
    await alerta?.app.close();
    await siagie?.app.close();
    await auth?.app.close();
    for (const [name, value] of Object.entries(oldEnv))
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
  });

  it('calcula el agregado diario de cada IE desde SIAGIE y Alerta', async () => {
    const { body } = await compute(MONDAY).expect(200);
    expect(body).toEqual({
      date: MONDAY,
      skipped: false,
      schools: 2,
      computed: 2,
      failed: 0,
    });
    const rows = await prisma.schoolDailyStat.findMany();
    const of = (schoolId: string) => rows.find((r) => r.schoolId === schoolId);
    expect(of(fx.schoolA.id)).toMatchObject({
      ugelId: fx.ugel.id,
      dreId: fx.dre.id,
      enrolled: 2,
      present: 1,
      absent: 1,
      late: 0,
      sectionsTotal: 2,
      sectionsReported: 1,
      openCases: 1,
      contactedCases: 1,
    });
    expect(of(fx.schoolB.id)).toMatchObject({
      present: 0,
      late: 1,
      absent: 1,
      sectionsTotal: 1,
      sectionsReported: 1,
      openCases: 1,
      contactedCases: 0,
    });
  });

  it('publica los indicadores mensuales de la UGEL solo para su ámbito', async () => {
    await compute(MONDAY).expect(200);
    const { body } = await request(escale.url)
      .get('/indicators')
      .query({ geo_level: 'UGEL', period: '2026-03' })
      .set(as('ugel'))
      .expect(200);
    const byCode = Object.fromEntries(
      body.map((r: { code: string }) => [r.code, r]),
    );
    expect(byCode.ATTENDANCE_RATE).toMatchObject({
      geoCode: fx.ugel.code,
      geoName: fx.ugel.name,
      source: 'COMPUTED',
      value: 50,
      numerator: 2,
      denominator: 4,
    });
    expect(byCode.SILENT_SECTIONS_RATE).toMatchObject({
      value: 33.3333,
      numerator: 1,
      denominator: 3,
    });
    expect(byCode.CASES_CONTACTED_RATE).toMatchObject({
      value: 50,
      numerator: 1,
      denominator: 2,
    });
    const { body: hidden } = await request(escale.url)
      .get('/indicators')
      .query({ geo_level: 'UGEL', period: '2026-03' })
      .set(as('otherUgel'))
      .expect(200);
    expect(hidden).toEqual([]);
  });

  it('repetir el cálculo no duplica filas', async () => {
    await compute(MONDAY).expect(200);
    await compute(MONDAY).expect(200);
    expect(await prisma.schoolDailyStat.count()).toBe(2);
    expect(
      await prisma.indicatorValue.count({ where: { geoLevel: 'UGEL' } }),
    ).toBe(3);
  });

  it('los fines de semana no generan aulas en silencio', async () => {
    const { body } = await compute('2026-03-07').expect(200);
    expect(body).toMatchObject({ skipped: true, computed: 0 });
    expect(await prisma.schoolDailyStat.count()).toBe(0);
  });

  it('una fuente caída no borra lo ya calculado', async () => {
    await compute(MONDAY).expect(200);
    const alertaUrl = process.env.ALERTA_URL;
    process.env.ALERTA_URL = 'http://127.0.0.1:9';
    try {
      const { body } = await compute('2026-03-03').expect(200);
      expect(body).toMatchObject({ schools: 2, computed: 0, failed: 2 });
    } finally {
      process.env.ALERTA_URL = alertaUrl;
    }
    expect(await prisma.schoolDailyStat.count()).toBe(2);
    expect(
      await prisma.indicatorValue.count({ where: { geoLevel: 'UGEL' } }),
    ).toBe(3);
  });

  it('solo MINEDU ejecuta el cálculo y con una fecha válida', async () => {
    await compute(MONDAY, 'ugel').expect(403);
    await compute('2026-02-30').expect(400);
    await compute('ayer').expect(400);
  });
});
