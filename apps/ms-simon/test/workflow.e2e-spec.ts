import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { AddressInfo } from 'node:net';
import { randomUUID } from 'node:crypto';
import argon2 from 'argon2';
import request from 'supertest';
import { AppModule as AuthModule } from '../../ms-auth/src/app.module.js';
import { PrismaService as AuthPrisma } from '../../ms-auth/src/prisma.service.js';
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
import { SourcesClient } from '../src/clients.js';

async function start(module: unknown) {
  const ref = await Test.createTestingModule({
    imports: [module as never],
  }).compile();
  const app = ref.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.listen(0, '127.0.0.1');
  return {
    app,
    url: `http://127.0.0.1:${(app.getHttpServer().address() as AddressInfo).port}`,
  };
}

describe('F3: reportes, planes protegidos y visitas', () => {
  let auth: Awaited<ReturnType<typeof start>>,
    siagie: Awaited<ReturnType<typeof start>>,
    alerta: Awaited<ReturnType<typeof start>>,
    simon: Awaited<ReturnType<typeof start>>;
  let prisma: PrismaService, source: SiagiePrisma;
  let fx: Awaited<ReturnType<typeof createSchoolFixture>>;
  let student: Awaited<ReturnType<typeof createEnrolledStudent>>;
  let periodId: string, otherPeriodId: string, nextPeriodId: string;
  const tokens: Record<string, string> = {};
  const psychId = randomUUID(),
    ugelId = randomUUID(),
    unassignedId = randomUUID(),
    director2Id = randomUUID();
  const oldEnv = Object.fromEntries(
    ['AUTH_URL', 'AUTH_JWKS_URL', 'SIAGIE_URL', 'ALERTA_URL'].map((k) => [
      k,
      process.env[k],
    ]),
  );
  const headers = (who = 'director') => ({
    Authorization: `Bearer ${tokens[who]}`,
  });
  const generate = (extra = {}, who = 'director') =>
    request(simon.url)
      .post('/reports/generate')
      .set(headers(who))
      .send({
        schoolId: fx.schoolA.id,
        year: 2026,
        type: 'MONTHLY_FOLLOWUP',
        month: 3,
        ...extra,
      });
  const createPlan = (extra = {}, who = 'tutor') =>
    request(simon.url)
      .post('/support-plans')
      .set(headers(who))
      .send({
        schoolId: fx.schoolA.id,
        studentId: student.student.id,
        year: 2026,
        barriers: 'Dificultad para acceder a materiales',
        strengths: 'Participación',
        diagnosis: 'Diagnóstico sintético reservado',
        ...extra,
      });
  const content = {
    goals: ['Asistir con regularidad'],
    adjustments: ['Material accesible'],
    strategies: ['Acompañamiento semanal'],
  };
  const version = (id: string, extra = {}, who = 'teacher') =>
    request(simon.url)
      .post(`/support-plans/${id}/versions`)
      .set(headers(who))
      .send({ periodId, ...content, ...extra });
  const approve = (
    id: string,
    v: { id: string; updatedAt: string },
    who = 'tutor',
  ) =>
    request(simon.url)
      .post(`/support-plans/${id}/versions/${v.id}/approve`)
      .set(headers(who))
      .send({ expectedUpdatedAt: v.updatedAt });
  const visit = (extra = {}, who = 'director') =>
    request(simon.url)
      .post('/monitoring-visits')
      .set(headers(who))
      .send({
        schoolId: fx.schoolA.id,
        sectionId: fx.sectionA.id,
        observedTeacherUserId: USERS.teacherA,
        visitedAt: '2026-03-10T09:00:00-05:00',
        protocolVersion: '2026.1',
        ...extra,
      });
  const key = { 'x-internal-key': process.env.INTERNAL_API_KEY! };

  beforeAll(async () => {
    auth = await start(AuthModule);
    process.env.AUTH_URL = auth.url;
    process.env.AUTH_JWKS_URL = `${auth.url}/.well-known/jwks.json`;
    siagie = await start(SiagieModule);
    source = siagie.app.get(SiagiePrisma);
    process.env.SIAGIE_URL = siagie.url;
    alerta = await start(AlertaModule);
    process.env.ALERTA_URL = alerta.url;
    simon = await start(AppModule);
    prisma = simon.app.get(PrismaService);
    const authDb = auth.app.get(AuthPrisma),
      alertsDb = alerta.app.get(AlertaPrisma);
    await cleanSiagieTables(source);
    await authDb.$executeRawUnsafe(
      'TRUNCATE "auth_test"."auth_events", "auth_test"."refresh_tokens", "auth_test"."user_roles", "auth_test"."users" CASCADE',
    );
    await alertsDb.$executeRawUnsafe(
      'TRUNCATE "alerta_test"."guardian_responses", "alerta_test"."notifications", "alerta_test"."case_actions", "alerta_test"."alerts", "alerta_test"."cases", "alerta_test"."inbox_events" CASCADE',
    );
    fx = await createSchoolFixture(source);
    student = await createEnrolledStudent(source, fx.sectionA.id);
    await createEnrolledStudent(source, fx.sectionA.id, 'WITHDRAWN').then((s) =>
      source.enrollment.update({
        where: { id: s.enrollment.id },
        data: {
          statusChangedAt: new Date('2026-03-15T10:00:00-05:00'),
          statusReason: 'Razón privada que no se exporta',
        },
      }),
    );
    await source.teachingAssignment.create({
      data: {
        sectionId: fx.sectionA.id,
        areaId: fx.area.id,
        teacherUserId: USERS.teacherA,
        weeklyHours: 4,
      },
    });
    const periods = await Promise.all(
      [fx.schoolA.id, fx.schoolB.id].map((schoolId) =>
        source.academicPeriod.create({
          data: {
            schoolId,
            year: 2026,
            type: 'BIMESTER',
            number: 1,
            startDate: new Date('2026-03-01'),
            endDate: new Date('2026-04-30'),
          },
        }),
      ),
    );
    [periodId, otherPeriodId] = periods.map((p) => p.id);
    nextPeriodId = (
      await source.academicPeriod.create({
        data: {
          schoolId: fx.schoolA.id,
          year: 2026,
          type: 'BIMESTER',
          number: 2,
          startDate: new Date('2026-05-01'),
          endDate: new Date('2026-06-30'),
        },
      })
    ).id;
    await source.attendanceRecord.createMany({
      data: ['PRESENT', 'ABSENT', 'LATE'].map((status, i) => ({
        enrollmentId: student.enrollment.id,
        date: new Date(`2026-03-0${i + 2}`),
        status: status as 'PRESENT' | 'ABSENT' | 'LATE',
        source: 'MANUAL',
        recordedByUserId: USERS.auxiliarA,
      })),
    });
    const session = await source.classSession.create({
      data: {
        sectionId: fx.sectionA.id,
        areaId: fx.area.id,
        teacherUserId: USERS.teacherA,
        date: new Date('2026-03-02'),
        periodNumber: 1,
      },
    });
    await source.attendanceRecord.create({
      data: {
        enrollmentId: student.enrollment.id,
        date: new Date('2026-03-02'),
        status: 'ABSENT',
        source: 'MANUAL',
        recordedByUserId: USERS.teacherA,
        classSessionId: session.id,
      },
    });
    await source.periodGrade.create({
      data: {
        enrollmentId: student.enrollment.id,
        competencyId: fx.competencies[0].id,
        periodId,
        value: 'B',
        calculationMethod: 'MANUAL',
        attendanceRate: 66.67,
        calculatedAt: new Date(),
      },
    });
    const c = await alertsDb.case.create({
      data: {
        studentId: student.student.id,
        schoolId: fx.schoolA.id,
        sectionId: fx.sectionA.id,
        ownerUserId: USERS.tutorA,
        ownerRole: 'TUTOR',
        dueAt: new Date('2026-03-10'),
        openedAt: new Date('2026-03-02T10:00:00-05:00'),
        firstContactAt: new Date('2026-03-04T10:00:00-05:00'),
      },
    });
    await alertsDb.caseAction.create({
      data: {
        caseId: c.id,
        type: 'CALL',
        performedByUserId: USERS.tutorA,
        performedAt: new Date('2026-03-04T10:00:00-05:00'),
      },
    });
    await alertsDb.alert.create({
      data: {
        schoolId: fx.schoolA.id,
        studentId: student.student.id,
        type: 'ABSENCE_PATTERN',
        severity: 'HIGH',
        dedupeKey: randomUUID(),
        caseId: c.id,
        detectedAt: new Date('2026-03-02T10:00:00-05:00'),
      },
    });
    const password = 'Prueba-Simon-2026',
      passwordHash = await argon2.hash(password);
    const identities = [
      ['director', USERS.directorA, 'DIRECTOR', fx.schoolA.id],
      ['secretary', USERS.secretaryA, 'SECRETARY', fx.schoolA.id],
      ['tutor', USERS.tutorA, 'TUTOR', fx.schoolA.id],
      ['teacher', USERS.teacherA, 'TEACHER', fx.schoolA.id],
      ['psych', psychId, 'PSYCHOLOGIST', fx.schoolA.id],
      ['ugel', ugelId, 'UGEL_SPECIALIST', null],
      ['outsider', USERS.directorB, 'DIRECTOR', fx.schoolB.id],
      ['unassigned', unassignedId, 'TEACHER', fx.schoolA.id],
      ['director2', director2Id, 'DIRECTOR', fx.schoolA.id],
    ] as const;
    await authDb.user.createMany({
      data: identities.map(([, id], i) => ({
        id,
        documentType: 'DNI',
        documentNumber: `7100000${i}`,
        firstName: 'Personal',
        lastName: 'Sintético',
        passwordHash,
      })),
    });
    await authDb.userRole.createMany({
      data: identities.map(([, id, role, schoolId]) => ({
        userId: id,
        role,
        ...(schoolId ? { schoolId } : { ugelId: fx.ugel.id }),
      })),
    });
    // Una persona con ambos roles tampoco puede revisar su propio envío.
    await authDb.userRole.create({
      data: {
        userId: USERS.directorA,
        role: 'UGEL_SPECIALIST',
        ugelId: fx.ugel.id,
      },
    });
    for (let i = 0; i < identities.length; i++)
      tokens[identities[i][0]] = (
        await request(auth.url)
          .post('/auth/login')
          .send({ documentNumber: `7100000${i}`, password })
          .expect(200)
      ).body.accessToken;
  }, 120000);
  beforeEach(async () => {
    await prisma.$executeRawUnsafe(
      'TRUNCATE "simon_test"."audit_logs", "simon_test"."support_plan_versions", "simon_test"."support_plans", "simon_test"."self_reports", "simon_test"."monitoring_visits" CASCADE',
    );
  });
  afterEach(() => vi.restoreAllMocks());
  afterAll(async () => {
    await simon?.app.close();
    await alerta?.app.close();
    await siagie?.app.close();
    await auth?.app.close();
    for (const [name, value] of Object.entries(oldEnv))
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
  });

  it('agrega solo asistencia diaria y cifras de SIAGIE/Alerta, sin datos privados', async () => {
    const { body: r } = await generate().expect(201);
    expect(r.payload.school).toMatchObject({
      totalEnrollments: 2,
      activeEnrollments: 1,
      reportedSectionDays: 3,
      exitsWithReason: 1,
      exitsWithoutReason: 0,
      grades: { B: 1 },
    });
    expect(r.payload.school.attendance).toMatchObject({
      present: 1,
      absent: 1,
      late: 1,
      observedEnrollmentDays: 3,
      attendedEnrollmentDays: 2,
      rate: 66.67,
    });
    expect(r.payload.alerts).toMatchObject({
      casesOpened: 1,
      alertsDetected: 1,
      currentlyOpenCases: 1,
      firstContacts: 1,
      averageDaysToFirstContact: 2,
      actionsByType: { CALL: 1 },
    });
    expect(JSON.stringify(r.payload)).not.toContain(student.student.id);
    expect(JSON.stringify(r.payload)).not.toContain('Razón privada');
    const again = await generate().expect(201);
    expect(again.body.id).toBe(r.id);
    expect(again.body.revision).toBe(2);
  });
  it('envía dirección, observa UGEL y regenera con revisión; rechaza auto-revisión', async () => {
    const { body: r } = await generate().expect(201);
    const submit = (who = 'director', revision = 1) =>
      request(simon.url)
        .post(`/reports/${r.id}/submit`)
        .set(headers(who))
        .send({ revision });
    await submit('secretary').expect(403);
    await submit('director', 50).expect(409);
    await submit().expect(200);
    await generate().expect(409);
    const review = (who: string, body: object) =>
      request(simon.url)
        .post(`/reports/${r.id}/review`)
        .set(headers(who))
        .send(body);
    await review('director', { revision: 2, status: 'REVIEWED' }).expect(403);
    await review('ugel', { revision: 2, status: 'OBSERVED' }).expect(400);
    await review('ugel', {
      revision: 2,
      status: 'OBSERVED',
      notes: 'Completar registros',
    }).expect(200);
    const regenerated = await generate().expect(201);
    expect(regenerated.body.revision).toBe(4);
    await submit('director', 4).expect(200);
    await review('ugel', { revision: 5, status: 'REVIEWED' }).expect(200);
    await generate().expect(409);
    expect(await prisma.auditLog.count({ where: { entityId: r.id } })).toBe(6);
  }, 60000);
  it('valida bimestres, mes y datos forjados y niega generar a supervisión', async () => {
    await generate({
      type: 'BIMESTER_ATTENDANCE',
      month: undefined,
      periodId,
    }).expect(201);
    await generate({
      type: 'BIMESTER_ATTENDANCE',
      month: undefined,
      periodId: otherPeriodId,
    }).expect(400);
    await generate({ periodId }).expect(400);
    await generate({ month: 12, year: 2027 }).expect(400);
    await generate({ payload: { attendance: 100 } }).expect(400);
    await generate({}, 'ugel').expect(403);
    await generate({}, 'outsider').expect(403);
  });
  it('falla sin guardar un reporte parcial si una fuente no responde', async () => {
    vi.spyOn(simon.app.get(SourcesClient), 'alerts').mockRejectedValueOnce(
      new (await import('@nestjs/common')).ServiceUnavailableException(
        'Fuente no disponible',
      ),
    );
    await generate().expect(503);
    expect(await prisma.selfReport.count()).toBe(0);
  });
  it('protege fuentes internas y limita consultas de reportes', async () => {
    await request(siagie.url)
      .get(`/internal/simon/students/${student.student.id}`)
      .query({ schoolId: fx.schoolA.id, year: 2026 })
      .expect(401);
    await request(alerta.url)
      .get('/internal/simon/reports')
      .query({ schoolId: fx.schoolA.id, from: '2026-03-10', to: '2026-03-01' })
      .set(key)
      .expect(400);
    const { body: r } = await generate().expect(201);
    await request(simon.url)
      .get(`/reports/${r.id}`)
      .set(headers('teacher'))
      .expect(403);
    await request(simon.url)
      .get(`/reports/${r.id}`)
      .set(headers('outsider'))
      .expect(403);
    await request(simon.url)
      .get('/reports')
      .set(headers('ugel'))
      .expect(200)
      .then((r) => expect(r.body).toHaveLength(1));
    await request(simon.url).get('/reports').expect(401);
  });
  it('cifra diagnóstico y audita lecturas autorizadas; secretaría y docente reciben datos omitidos', async () => {
    const { body: p } = await createPlan().expect(201);
    expect(p).not.toHaveProperty('diagnosis');
    expect(p).not.toHaveProperty('diagnosisEncrypted');
    const stored = await prisma.supportPlan.findUniqueOrThrow({
      where: { id: p.id },
    });
    expect(stored.diagnosisEncrypted).toMatch(/^v1\./);
    expect(stored.diagnosisEncrypted).not.toContain('Diagnóstico');
    for (const who of ['tutor', 'director', 'psych']) {
      const detail = await request(simon.url)
        .get(`/support-plans/${p.id}`)
        .set(headers(who))
        .expect(200);
      expect(detail.body.diagnosis).toBe('Diagnóstico sintético reservado');
      expect(detail.body).not.toHaveProperty('diagnosisEncrypted');
    }
    for (const who of ['teacher', 'secretary']) {
      await request(simon.url)
        .get(`/support-plans/${p.id}`)
        .set(headers(who))
        .expect(200)
        .then((r) => {
          expect(r.body).not.toHaveProperty('diagnosis');
          expect(r.body).not.toHaveProperty('diagnosisEncrypted');
        });
    }
    const logs = await prisma.auditLog.findMany({ where: { entityId: p.id } });
    expect(logs.filter((l) => l.action === 'PLAN_DIAGNOSIS_READ')).toHaveLength(
      3,
    );
    expect(JSON.stringify(logs)).not.toContain('Diagnóstico');
    await request(simon.url)
      .get('/support-plans')
      .set(headers('director'))
      .expect(200)
      .then((r) => expect(r.body[0]).not.toHaveProperty('diagnosisEncrypted'));
  }, 60000);
  it('niega planes a otras IEs, supervisión y docentes sin asignación', async () => {
    const { body: p } = await createPlan().expect(201);
    for (const who of ['outsider', 'ugel', 'unassigned'])
      await request(simon.url)
        .get(`/support-plans/${p.id}`)
        .set(headers(who))
        .expect(403);
    await request(simon.url)
      .get('/support-plans')
      .set(headers('unassigned'))
      .expect(200)
      .then((r) => expect(r.body).toEqual([]));
    await createPlan({}, 'teacher').expect(403);
    await createPlan({ tutorUserId: USERS.teacherA }).expect(400);
    await createPlan({ diagnosis: null }).expect(400);
  });
  it('rechaza duplicados y periodos ajenos y exige aprobación del tutor antes de activar', async () => {
    const { body: p } = await createPlan().expect(201);
    await createPlan().expect(409);
    await request(simon.url)
      .patch(`/support-plans/${p.id}/status`)
      .set(headers())
      .send({ status: 'ACTIVE' })
      .expect(409);
    await version(p.id, { periodId: otherPeriodId }).expect(400);
    await version(p.id, { approvedByUserId: USERS.tutorA }).expect(400);
    const { body: v } = await version(p.id).expect(201);
    expect(v.generatedBy).toBe('HUMAN');
    expect(v.aiModel).toBeNull();
    expect(v.version).toBe(1);
    await version(p.id).expect(409);
    await approve(p.id, v, 'psych').expect(403);
    await approve(p.id, v, 'teacher').expect(403);
    await approve(p.id, v).expect(200);
    await request(simon.url)
      .patch(`/support-plans/${p.id}/versions/${v.id}`)
      .set(headers('teacher'))
      .send(content)
      .expect(409);
    await request(simon.url)
      .patch(`/support-plans/${p.id}/status`)
      .set(headers())
      .send({ status: 'ACTIVE' })
      .expect(200);
    await version(p.id, { periodId: nextPeriodId })
      .expect(201)
      .then((r) => expect(r.body.version).toBe(2));
    await request(simon.url)
      .patch(`/support-plans/${p.id}/status`)
      .set(headers())
      .send({ status: 'ARCHIVED' })
      .expect(200);
    await request(simon.url)
      .patch(`/support-plans/${p.id}`)
      .set(headers('tutor'))
      .send({ barriers: 'Cambios' })
      .expect(409);
    await version(p.id, { periodId: nextPeriodId }).expect(409);
  }, 60000);
  it('detecta contenido cambiado antes de aprobar una versión', async () => {
    const { body: p } = await createPlan().expect(201);
    const { body: v } = await version(p.id).expect(201);
    const { body: updated } = await request(simon.url)
      .patch(`/support-plans/${p.id}/versions/${v.id}`)
      .set(headers('teacher'))
      .send({ ...content, goals: ['Nueva meta'] })
      .expect(200);
    await approve(p.id, v).expect(409);
    await approve(p.id, updated).expect(200);
  });
  it('un diagnóstico corrupto falla cerrado y no se filtra al docente', async () => {
    const { body: p } = await createPlan().expect(201);
    await prisma.supportPlan.update({
      where: { id: p.id },
      data: { diagnosisEncrypted: 'texto alterado reservado' },
    });
    await request(simon.url)
      .get(`/support-plans/${p.id}`)
      .set(headers('tutor'))
      .expect(503)
      .then((r) => expect(JSON.stringify(r.body)).not.toContain('reservado'));
    await request(simon.url)
      .get(`/support-plans/${p.id}`)
      .set(headers('teacher'))
      .expect(200)
      .then((r) => expect(r.body).not.toHaveProperty('diagnosis'));
  });
  it('valida docente y sección de las visitas y rechaza actor forjado', async () => {
    await visit({ sectionId: fx.sectionB.id }).expect(400);
    await visit({ observedTeacherUserId: unassignedId }).expect(422);
    await visit({ observerUserId: ugelId }).expect(400);
    await visit({}, 'teacher').expect(403);
    await visit({}, 'outsider').expect(403);
    await visit({ visitedAt: '2026-03-10' }).expect(400);
  });
  it('registra observación y devolución solo por el observador original', async () => {
    const { body: v } = await visit().expect(201);
    const update = (body: object, who = 'director') =>
      request(simon.url)
        .patch(`/monitoring-visits/${v.id}`)
        .set(headers(who))
        .send(body);
    await update(
      { status: 'DONE', observations: 'Práctica observada' },
      'director2',
    ).expect(403);
    await update({
      status: 'FEEDBACK_GIVEN',
      feedback: 'Adecuar tiempos',
      improvementCommitment: 'Sesión accesible',
    }).expect(409);
    await update({ status: 'DONE' }).expect(400);
    await update({ status: 'DONE', observations: 'Práctica observada' }).expect(
      200,
    );
    await update({
      status: 'FEEDBACK_GIVEN',
      feedback: 'Adecuar tiempos',
      improvementCommitment: 'Sesión accesible',
    }).expect(200);
    await update({ status: 'DONE', observations: 'Reescribir' }).expect(409);
    await request(simon.url)
      .get(`/monitoring-visits/${v.id}`)
      .set(headers('teacher'))
      .expect(200);
    await request(simon.url)
      .get(`/monitoring-visits/${v.id}`)
      .set(headers('unassigned'))
      .expect(403);
    await request(simon.url)
      .get('/monitoring-visits')
      .set(headers('unassigned'))
      .expect(200)
      .then((r) => expect(r.body).toEqual([]));
    expect(await prisma.auditLog.count({ where: { entityId: v.id } })).toBe(3);
  }, 60000);
  it('impide completar visitas futuras', async () => {
    const { body: v } = await visit({
      visitedAt: '2026-12-20T09:00:00-05:00',
    }).expect(201);
    await request(simon.url)
      .patch(`/monitoring-visits/${v.id}`)
      .set(headers())
      .send({ status: 'DONE', observations: 'Pendiente' })
      .expect(400);
  });
});
