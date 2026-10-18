import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { AddressInfo } from 'node:net';
import { randomUUID } from 'node:crypto';
import argon2 from 'argon2';
import request from 'supertest';
import { todayInLima } from '@app/common';
import { AppModule as AuthModule } from '../../ms-auth/src/app.module.js';
import { PrismaService as AuthPrisma } from '../../ms-auth/src/prisma.service.js';
import { AppModule as SiagieModule } from '../../ms-siagie/src/app.module.js';
import { PrismaService as SiagiePrisma } from '../../ms-siagie/src/prisma.service.js';
import {
  createEnrolledStudent,
  createSchoolFixture,
  USERS,
} from '../../ms-siagie/test/helpers/fixtures.js';
import { cleanSiagieTables } from '../../ms-siagie/test/helpers/db.js';
import { OutboxService } from '../../ms-siagie/src/events/outbox.service.js';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma.service.js';
import { EngineService } from '../src/rules/engine.service.js';
import { SiagieClient } from '../src/clients.js';
import { InboxService } from '../src/inbox.service.js';
import {
  NotificationProvider,
  NotificationsService,
} from '../src/notifications.service.js';
import { schoolDays } from '../src/rules/risk-rules.js';
import { seedRules } from '../prisma/seed.js';

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

describe('F2: SIAGIE → alertas → caso → familia', () => {
  let auth: Awaited<ReturnType<typeof start>>;
  let siagie: Awaited<ReturnType<typeof start>>;
  let alerta: Awaited<ReturnType<typeof start>>;
  let authPrisma: AuthPrisma;
  let siagiePrisma: SiagiePrisma;
  let prisma: PrismaService;
  let fx: Awaited<ReturnType<typeof createSchoolFixture>>;
  let student: Awaited<ReturnType<typeof createEnrolledStudent>>;
  let guardianId: string;
  let director: string;
  let auxiliar: string;
  let outsider: string;
  const password = 'Prueba-Alerta-2026';
  const key = { 'x-internal-key': process.env.INTERNAL_API_KEY! };
  const dates = schoolDays(todayInLima(), 3);
  const oldEnv = {
    AUTH_URL: process.env.AUTH_URL,
    SIAGIE_URL: process.env.SIAGIE_URL,
    ALERTA_URL: process.env.ALERTA_URL,
    AUTH_JWKS_URL: process.env.AUTH_JWKS_URL,
  };
  const login = async (documentNumber: string) =>
    (
      await request(auth.url)
        .post('/auth/login')
        .send({ documentNumber, password })
        .expect(200)
    ).body.accessToken as string;
  const as = (token: string) => ({ Authorization: `Bearer ${token}` });
  const flush = async () => {
    await request(siagie.url)
      .post('/internal/events/dispatch')
      .set(key)
      .expect(200);
    await request(alerta.url).post('/internal/jobs/run').set(key).expect(200);
  };
  const mark = (date: string, status = 'ABSENT') =>
    request(siagie.url)
      .post('/attendance/bulk')
      .set(as(auxiliar))
      .send({
        sectionId: fx.sectionA.id,
        date,
        records: [{ enrollmentId: student.enrollment.id, status }],
      });
  const message = (
    caseId: string,
    requestId = randomUUID(),
    token = director,
  ) =>
    request(alerta.url)
      .post(`/cases/${caseId}/send-message`)
      .set(as(token))
      .send({ requestId });
  const response = (
    providerMessageId: string,
    providerEventId = randomUUID(),
    rawText = 'Estamos organizándonos para que regrese a clases.',
  ) =>
    request(alerta.url).post('/webhooks/notifications').set(key).send({
      providerMessageId,
      providerEventId,
      rawText,
      classifiedReason: 'FAMILY',
    });

  beforeAll(async () => {
    auth = await start(AuthModule);
    authPrisma = auth.app.get(AuthPrisma);
    process.env.AUTH_URL = auth.url;
    process.env.AUTH_JWKS_URL = `${auth.url}/.well-known/jwks.json`;
    siagie = await start(SiagieModule);
    siagiePrisma = siagie.app.get(SiagiePrisma);
    process.env.SIAGIE_URL = siagie.url;
    alerta = await start(AppModule);
    prisma = alerta.app.get(PrismaService);
    process.env.ALERTA_URL = alerta.url;
  });
  afterAll(async () => {
    vi.restoreAllMocks();
    await alerta?.app.close();
    await siagie?.app.close();
    await auth?.app.close();
    for (const [name, value] of Object.entries(oldEnv)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  });
  beforeEach(async () => {
    vi.restoreAllMocks();
    await prisma.$executeRawUnsafe(
      'TRUNCATE "alerta_test"."guardian_responses", "alerta_test"."notifications", "alerta_test"."case_actions", "alerta_test"."alerts", "alerta_test"."cases", "alerta_test"."risk_rules", "alerta_test"."inbox_events" CASCADE',
    );
    await seedRules(prisma);
    await cleanSiagieTables(siagiePrisma);
    await authPrisma.$executeRawUnsafe(
      'TRUNCATE "auth_test"."auth_events", "auth_test"."refresh_tokens", "auth_test"."user_roles", "auth_test"."users" CASCADE',
    );
    fx = await createSchoolFixture(siagiePrisma);
    student = await createEnrolledStudent(siagiePrisma, fx.sectionA.id);
    const guardian = await siagiePrisma.guardian.create({
      data: {
        documentType: 'DNI',
        documentNumber: '60000001',
        firstName: 'Apoderada',
        lastName: 'Sintética',
        phone: '+51900000001',
        whatsappOptIn: true,
        optInAt: new Date(),
        preferredChannel: 'WHATSAPP',
        students: {
          create: {
            studentId: student.student.id,
            relationship: 'MOTHER',
            isPrimary: true,
            receivesAlerts: true,
          },
        },
      },
    });
    guardianId = guardian.id;
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    await authPrisma.user.createMany({
      data: [
        USERS.directorA,
        USERS.auxiliarA,
        USERS.directorB,
        USERS.teacherA,
        USERS.tutorA,
      ].map((id, i) => ({
        id,
        documentType: 'DNI',
        documentNumber: `7000000${i + 1}`,
        firstName: 'Personal',
        lastName: 'Demo',
        passwordHash,
      })),
    });
    await authPrisma.userRole.createMany({
      data: [
        { userId: USERS.directorA, role: 'DIRECTOR', schoolId: fx.schoolA.id },
        { userId: USERS.auxiliarA, role: 'AUXILIAR', schoolId: fx.schoolA.id },
        { userId: USERS.directorB, role: 'DIRECTOR', schoolId: fx.schoolB.id },
        { userId: USERS.teacherA, role: 'TEACHER', schoolId: fx.schoolA.id },
        { userId: USERS.tutorA, role: 'UGEL_SPECIALIST', ugelId: fx.ugel.id },
      ],
    });
    director = await login('70000001');
    auxiliar = await login('70000002');
    outsider = await login('70000003');
  });

  async function openCase() {
    await siagiePrisma.attendanceRecord.createMany({
      data: dates.map((date) => ({
        enrollmentId: student.enrollment.id,
        date: new Date(date),
        status: 'ABSENT' as const,
        source: 'MANUAL' as const,
        recordedByUserId: USERS.auxiliarA,
      })),
    });
    const sections = await alerta.app
      .get(SiagieClient)
      .sections(dates[2], fx.sectionA.id);
    await alerta.app.get(EngineService).evaluate(sections, dates[2]);
    return prisma.case.findFirstOrThrow();
  }

  it('tres faltas abren un solo caso; mensaje, respuesta y auditoría cierran el ciclo de contacto', async () => {
    for (const date of dates) await mark(date).expect(200);
    expect(await siagiePrisma.outboxEvent.count()).toBe(3);
    await flush();
    expect(
      await prisma.inboxEvent.count({ where: { processedAt: { not: null } } }),
    ).toBe(3);
    const cases = await request(alerta.url)
      .get('/cases')
      .set(as(director))
      .expect(200);
    expect(cases.body).toHaveLength(1);
    const record = cases.body[0];
    expect(record).toMatchObject({
      ownerUserId: USERS.auxiliarA,
      ownerRole: 'AUXILIAR',
      status: 'OPEN',
    });
    const requestId = randomUUID();
    const sent = await message(record.id, requestId).expect(200);
    expect(sent.body).toHaveLength(1);
    expect(sent.body[0]).toMatchObject({
      status: 'SENT',
      provider: 'console',
      guardianId,
    });
    await message(record.id, requestId).expect(200);
    expect(
      await prisma.notification.count({ where: { caseId: record.id } }),
    ).toBe(1);
    const eventId = randomUUID();
    await response(sent.body[0].providerMessageId, eventId).expect(200);
    await response(sent.body[0].providerMessageId, eventId).expect(200);
    await response(
      sent.body[0].providerMessageId,
      eventId,
      'Texto diferente',
    ).expect(409);
    const updated = await prisma.case.findUniqueOrThrow({
      where: { id: record.id },
    });
    expect(updated.status).toBe('CONTACTED');
    expect(updated.firstContactAt).not.toBeNull();
    expect(updated.reasonCategory).toBe('FAMILY');
    expect(await prisma.guardianResponse.count()).toBe(1);
    expect(
      await prisma.caseAction.count({
        where: { caseId: record.id, type: 'MESSAGE_SENT' },
      }),
    ).toBe(1);
    await prisma.case.update({
      where: { id: record.id },
      data: { dueAt: new Date(0) },
    });
    expect(await alerta.app.get(EngineService).escalate()).toBe(0);
  }, 60000);

  it('reentregar un evento no duplica alertas ni casos', async () => {
    for (const date of dates) await mark(date).expect(200);
    await flush();
    const count = await prisma.alert.count();
    await siagiePrisma.outboxEvent.updateMany({
      data: { deliveredAt: null, nextAttemptAt: new Date(0) },
    });
    await flush();
    expect(await prisma.alert.count()).toBe(count);
    expect(await prisma.case.count()).toBe(1);
    expect(await prisma.inboxEvent.count()).toBe(3);
  }, 60000);

  it('una caída de alerta conserva el pase de lista y reintenta la entrega persistida', async () => {
    const original = process.env.ALERTA_URL;
    try {
      process.env.ALERTA_URL = 'http://127.0.0.1:1';
      await mark(dates[0]).expect(200);
      expect(await siagiePrisma.attendanceRecord.count()).toBe(1);
      expect((await siagie.app.get(OutboxService).flush()).delivered).toBe(0);
      const pending = await siagiePrisma.outboxEvent.findFirstOrThrow();
      expect(pending.deliveredAt).toBeNull();
      expect(pending.attempts).toBe(1);
    } finally {
      process.env.ALERTA_URL = original;
    }
    await siagiePrisma.outboxEvent.updateMany({
      data: { nextAttemptAt: new Date(0) },
    });
    expect((await siagie.app.get(OutboxService).flush()).delivered).toBe(1);
    expect(await prisma.inboxEvent.count()).toBe(1);
  });

  it('un fallo de contexto queda en inbox para reintento y no se considera procesado', async () => {
    const inbox = alerta.app.get(InboxService);
    const dto = {
      id: randomUUID(),
      type: 'ATTENDANCE_RECORDED',
      resourceId: fx.sectionA.id,
      date: dates[0],
    };
    await inbox.receive(dto);
    const stub = vi
      .spyOn(alerta.app.get(SiagieClient), 'sections')
      .mockRejectedValueOnce(new Error('Caída simulada'));
    expect(await inbox.process()).toBe(0);
    expect(
      (await prisma.inboxEvent.findUniqueOrThrow({ where: { id: dto.id } }))
        .processedAt,
    ).toBeNull();
    stub.mockRestore();
    await prisma.inboxEvent.update({
      where: { id: dto.id },
      data: { nextAttemptAt: new Date(0) },
    });
    expect(await inbox.process()).toBe(1);
  });

  it('otra IE no lista ni consulta ni modifica casos; un docente no gestiona el caso del auxiliar', async () => {
    const record = await openCase();
    expect(
      (await request(alerta.url).get('/cases').set(as(outsider)).expect(200))
        .body,
    ).toHaveLength(0);
    expect(
      (await request(alerta.url).get('/alerts').set(as(outsider)).expect(200))
        .body,
    ).toHaveLength(0);
    await request(alerta.url)
      .get(`/cases/${record.id}`)
      .set(as(outsider))
      .expect(403);
    await message(record.id, randomUUID(), outsider).expect(403);
    await request(alerta.url)
      .get(`/cases?schoolId=${fx.schoolA.id}`)
      .set(as(outsider))
      .expect(403);
    const teacher = await login('70000004');
    await request(alerta.url)
      .post(`/cases/${record.id}/actions`)
      .set(as(teacher))
      .send({ type: 'NOTE', notes: 'Intento no autorizado' })
      .expect(403);
    const alert = await prisma.alert.findFirstOrThrow();
    await request(alerta.url)
      .patch(`/alerts/${alert.id}`)
      .set(as(outsider))
      .send({ status: 'RESOLVED' })
      .expect(403);
  });

  it('el especialista UGEL ve solo su ámbito y el propietario registra una acción', async () => {
    const record = await openCase();
    const specialist = await login('70000005');
    expect(
      (await request(alerta.url).get('/cases').set(as(specialist)).expect(200))
        .body,
    ).toHaveLength(1);
    await request(alerta.url)
      .post(`/cases/${record.id}/actions`)
      .set(as(auxiliar))
      .send({
        type: 'CALL',
        notes: 'Se intentó llamar; pendiente de respuesta.',
      })
      .expect(201);
    expect(
      (await prisma.case.findUniqueOrThrow({ where: { id: record.id } }))
        .firstContactAt,
    ).toBeNull();
    expect(
      await prisma.caseAction.count({
        where: {
          caseId: record.id,
          type: 'CALL',
          performedByUserId: USERS.auxiliarA,
        },
      }),
    ).toBe(1);
  });

  it('un caso vencido escala a dirección, comité y UGEL una sola vez por plazo', async () => {
    const record = await openCase();
    const engine = alerta.app.get(EngineService);
    for (let level = 1; level <= 3; level++) {
      await prisma.case.update({
        where: { id: record.id },
        data: { dueAt: new Date(0) },
      });
      expect(await engine.escalate()).toBe(1);
      expect(
        (await prisma.case.findUniqueOrThrow({ where: { id: record.id } }))
          .escalationLevel,
      ).toBe(level);
      expect(await engine.escalate()).toBe(0);
    }
    const final = await prisma.case.findUniqueOrThrow({
      where: { id: record.id },
    });
    expect(final.ownerRole).toBe('UGEL_SPECIALIST');
    expect(final.ownerUserId).toBe(USERS.tutorA);
    expect(
      await prisma.caseAction.count({
        where: { caseId: record.id, type: 'ESCALATED' },
      }),
    ).toBe(3);
  });

  it('sin consentimiento no se encola contacto y un reintento revalida el destino', async () => {
    const record = await openCase();
    await siagiePrisma.guardian.update({
      where: { id: guardianId },
      data: { whatsappOptIn: false },
    });
    await message(record.id).expect(422);
    expect(await prisma.notification.count()).toBe(0);
    await siagiePrisma.guardian.update({
      where: { id: guardianId },
      data: { whatsappOptIn: true },
    });
    const provider = vi
      .spyOn(alerta.app.get(NotificationProvider), 'send')
      .mockRejectedValueOnce(new Error('Fallo simulado'));
    const queued = await message(record.id).expect(200);
    expect(queued.body[0].status).toBe('FAILED');
    expect(provider).toHaveBeenCalledTimes(1);
    await siagiePrisma.guardian.update({
      where: { id: guardianId },
      data: { whatsappOptIn: false },
    });
    await prisma.notification.updateMany({
      data: { nextAttemptAt: new Date(0) },
    });
    await alerta.app.get(NotificationsService).dispatch();
    expect(provider).toHaveBeenCalledTimes(1);
    expect((await prisma.notification.findFirstOrThrow()).status).toBe(
      'FAILED',
    );
  });

  it('ingreso y salida generan avisos simulados al apoderado y al auxiliar sin abrir casos', async () => {
    for (const type of ['ENTRY', 'EXIT'])
      await request(siagie.url)
        .post('/access-events')
        .set(as(auxiliar))
        .send({ studentId: student.student.id, type })
        .expect(201);
    await flush();
    expect(await prisma.notification.count({ where: { status: 'SENT' } })).toBe(
      4,
    );
    expect(
      await prisma.notification.count({
        where: { userId: USERS.auxiliarA, channel: 'IN_APP' },
      }),
    ).toBe(2);
    expect(await prisma.case.count()).toBe(0);
  });

  it('nota aprobatoria sin asistencia publica evento y genera alerta específica', async () => {
    await siagiePrisma.teachingAssignment.create({
      data: {
        sectionId: fx.sectionA.id,
        areaId: fx.area.id,
        teacherUserId: USERS.teacherA,
        weeklyHours: 5,
      },
    });
    const period = await siagiePrisma.academicPeriod.create({
      data: {
        schoolId: fx.schoolA.id,
        year: 2026,
        type: 'BIMESTER',
        number: 1,
        startDate: new Date('2026-03-01'),
        endDate: new Date('2026-12-31'),
      },
    });
    const teacher = await login('70000004');
    await request(siagie.url)
      .post('/grades/entries')
      .set(as(teacher))
      .send({
        enrollmentId: student.enrollment.id,
        competencyId: fx.competencies[0].id,
        periodId: period.id,
        columnNumber: 1,
        value: 'A',
      })
      .expect(200);
    expect(
      await siagiePrisma.outboxEvent.count({
        where: { type: 'GRADE_RECORDED' },
      }),
    ).toBe(1);
    await flush();
    expect(
      await prisma.alert.count({ where: { type: 'GRADE_WITHOUT_ATTENDANCE' } }),
    ).toBe(1);
  });

  it('las rutas internas y el webhook requieren llave; eventos y reglas inválidos se rechazan', async () => {
    await request(alerta.url).post('/internal/events').send({}).expect(401);
    await request(alerta.url).post('/internal/jobs/run').expect(401);
    await request(alerta.url)
      .post('/webhooks/notifications')
      .send({})
      .expect(401);
    await request(siagie.url)
      .get(`/internal/risk/sections?date=${dates[0]}`)
      .expect(401);
    await request(auth.url)
      .get(`/internal/staff?schoolId=${fx.schoolA.id}&ugelId=${fx.ugel.id}`)
      .expect(401);
    const event = {
      id: randomUUID(),
      type: 'ATTENDANCE_RECORDED',
      resourceId: fx.sectionA.id,
      date: dates[0],
    };
    await request(alerta.url)
      .post('/internal/events')
      .set(key)
      .send(event)
      .expect(202);
    await request(alerta.url)
      .post('/internal/events')
      .set(key)
      .send({ ...event, resourceId: fx.sectionB.id })
      .expect(409);
    await request(alerta.url)
      .post('/internal/events')
      .set(key)
      .send({ ...event, id: randomUUID(), date: '2026-02-31' })
      .expect(400);
    await request(alerta.url)
      .post('/rules')
      .set(as(director))
      .send({
        code: 'OWN_RULE',
        type: 'LATE_COUNT',
        severity: 'HIGH',
        params: { count: 3, windowSchoolDays: 1 },
        schoolId: fx.schoolA.id,
      })
      .expect(400);
    const global = await prisma.riskRule.findFirstOrThrow();
    await request(alerta.url)
      .patch(`/rules/${global.id}`)
      .set(as(director))
      .send({ isActive: false })
      .expect(403);
  });

  it('una lista inválida no deja eventos huérfanos ni registros parciales', async () => {
    await request(siagie.url)
      .post('/attendance/bulk')
      .set(as(auxiliar))
      .send({
        sectionId: fx.sectionA.id,
        date: dates[0],
        records: [
          { enrollmentId: student.enrollment.id, status: 'PRESENT' },
          { enrollmentId: randomUUID(), status: 'ABSENT' },
        ],
      })
      .expect(400);
    expect(await siagiePrisma.attendanceRecord.count()).toBe(0);
    expect(await siagiePrisma.outboxEvent.count()).toBe(0);
  });

  it('cerrar un caso exige motivo, deja bitácora y una respuesta tardía no lo reabre', async () => {
    const record = await openCase();
    const sent = await message(record.id).expect(200);
    await request(alerta.url)
      .post(`/cases/${record.id}/actions`)
      .set(as(director))
      .send({
        type: 'STATUS_CHANGE',
        status: 'CLOSED_RETURNED',
        notes: 'Volvió a clases y se confirmó el seguimiento.',
      })
      .expect(201);
    await response(sent.body[0].providerMessageId).expect(200);
    expect(
      (await prisma.case.findUniqueOrThrow({ where: { id: record.id } }))
        .status,
    ).toBe('CLOSED_RETURNED');
    await message(record.id).expect(400);
  });

  it('evaluaciones simultáneas y ventanas sucesivas mantienen un solo caso y una alerta activa por regla', async () => {
    const record = await openCase();
    const engine = alerta.app.get(EngineService);
    const sections = await alerta.app
      .get(SiagieClient)
      .sections(dates[2], fx.sectionA.id);
    await Promise.all([
      engine.evaluate(sections, dates[2]),
      engine.evaluate(sections, dates[2]),
    ]);
    expect(await prisma.case.count()).toBe(1);
    expect(await prisma.alert.count()).toBe(2);
    // Al desplazarse la ventana puede cambiar la primera fecha, pero la alerta abierta sigue siendo la misma.
    const changed = structuredClone(sections);
    const moreDays = schoolDays(dates[2], 4);
    changed[0].students[0].attendance = moreDays.map((date) => ({
      date,
      status: 'ABSENT',
      classSessionId: null,
    }));
    await engine.evaluate(changed, dates[2]);
    expect(await prisma.case.count({ where: { id: record.id } })).toBe(1);
    expect(await prisma.alert.count()).toBe(2);
  });

  it('dirección configura reglas de su IE sin modificar reglas globales', async () => {
    const created = await request(alerta.url)
      .post('/rules')
      .set(as(director))
      .send({
        code: 'IE_ABSENCES_2',
        type: 'ABSENCES_IN_WINDOW',
        severity: 'MEDIUM',
        params: { count: 2, windowSchoolDays: 5 },
        schoolId: fx.schoolA.id,
      })
      .expect(201);
    await request(alerta.url)
      .patch(`/rules/${created.body.id}`)
      .set(as(director))
      .send({ severity: 'HIGH' })
      .expect(200);
    await request(alerta.url)
      .patch(`/rules/${created.body.id}`)
      .set(as(outsider))
      .send({ isActive: false })
      .expect(403);
    for (const date of dates.slice(0, 2)) await mark(date).expect(200);
    await flush();
    expect(
      await prisma.alert.count({
        where: { ruleId: created.body.id, severity: 'HIGH' },
      }),
    ).toBe(1);
  });

  it('un psicólogo disponible recibe el nivel 2 y el auxiliar anterior pierde la gestión', async () => {
    const record = await openCase();
    await siagiePrisma.school.update({
      where: { id: fx.schoolA.id },
      data: { hasPsychologist: true },
    });
    await authPrisma.userRole.create({
      data: {
        userId: USERS.teacherA,
        role: 'PSYCHOLOGIST',
        schoolId: fx.schoolA.id,
      },
    });
    await prisma.case.update({
      where: { id: record.id },
      data: {
        escalationLevel: 1,
        ownerRole: 'DIRECTOR',
        ownerUserId: USERS.directorA,
        dueAt: new Date(0),
      },
    });
    expect(await alerta.app.get(EngineService).escalate()).toBe(1);
    expect(
      (await prisma.case.findUniqueOrThrow({ where: { id: record.id } }))
        .ownerRole,
    ).toBe('PSYCHOLOGIST');
    await message(record.id, randomUUID(), auxiliar).expect(403);
  });

  it('la base impide un destinatario ambiguo y una respuesta no puede apuntar a un mensaje inventado', async () => {
    await expect(
      prisma.notification.create({
        data: {
          recipientType: 'GUARDIAN',
          guardianId,
          userId: USERS.directorA,
          channel: 'WHATSAPP',
          templateCode: 'TEST',
          body: 'Prueba',
          dedupeKey: randomUUID(),
        },
      }),
    ).rejects.toThrow();
    expect(await prisma.notification.count()).toBe(0);
    await response('console:inexistente').expect(404);
    expect(await prisma.guardianResponse.count()).toBe(0);
  });

  it('el cierre cancela entregas pendientes y evita reintentar un mensaje de un caso cerrado', async () => {
    const record = await openCase();
    const provider = vi
      .spyOn(alerta.app.get(NotificationProvider), 'send')
      .mockRejectedValueOnce(new Error('Fallo simulado'));
    await message(record.id).expect(200);
    expect(provider).toHaveBeenCalledTimes(1);
    await request(alerta.url)
      .post(`/cases/${record.id}/actions`)
      .set(as(director))
      .send({
        type: 'STATUS_CHANGE',
        status: 'CLOSED_RETURNED',
        notes: 'Se confirmó el retorno.',
      })
      .expect(201);
    await prisma.notification.updateMany({
      data: { nextAttemptAt: new Date(0) },
    });
    expect(await alerta.app.get(NotificationsService).dispatch()).toBe(0);
    expect(provider).toHaveBeenCalledTimes(1);
    expect((await prisma.notification.findFirstOrThrow()).error).toBe(
      'Entrega cancelada por cierre del caso',
    );
  });
});
