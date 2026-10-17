import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma.service.js';
import { createSiagieApp } from './helpers/app.js';
import { cleanSiagieTables } from './helpers/db.js';
import { createEnrolledStudent, createSchoolFixture, USERS } from './helpers/fixtures.js';
import { bearer, signTestToken } from './helpers/tokens.js';

describe('pase de lista', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let fx: Awaited<ReturnType<typeof createSchoolFixture>>;
  let auxiliar: string;
  let enrollments: string[];
  const http = () => request(app.getHttpServer());
  const DATE = '2026-04-06';

  const bulk = (token: string, body: object) => http().post('/attendance/bulk').set(bearer(token)).send(body);

  beforeAll(async () => {
    ({ app, prisma } = await createSiagieApp());
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await cleanSiagieTables(prisma);
    fx = await createSchoolFixture(prisma);
    auxiliar = signTestToken({ id: USERS.auxiliarA, roles: [{ role: 'AUXILIAR', schoolId: fx.schoolA.id }] });
    enrollments = [];
    for (let i = 0; i < 3; i++) enrollments.push((await createEnrolledStudent(prisma, fx.sectionA.id)).enrollment.id);
  });

  const records = (status = 'PRESENT') => enrollments.map((enrollmentId) => ({ enrollmentId, status }));

  it('el auxiliar pasa lista a la sección', async () => {
    const res = await bulk(auxiliar, { sectionId: fx.sectionA.id, date: DATE, records: records() }).expect(200);
    expect(res.body).toEqual({ saved: 3 });
    const stored = await prisma.attendanceRecord.findMany();
    expect(stored.every((r) => r.source === 'MANUAL' && r.recordedByUserId === USERS.auxiliarA)).toBe(true);
  });

  it('reenviar la lista actualiza sin duplicar', async () => {
    await bulk(auxiliar, { sectionId: fx.sectionA.id, date: DATE, records: records() }).expect(200);
    await bulk(auxiliar, { sectionId: fx.sectionA.id, date: DATE, records: records('ABSENT') }).expect(200, { saved: 3 });
    const stored = await prisma.attendanceRecord.findMany();
    expect(stored).toHaveLength(3);
    expect(stored.every((r) => r.status === 'ABSENT')).toBe(true);
  });

  it('una matrícula de otra sección: 400 y no guarda nada', async () => {
    const other = await createEnrolledStudent(prisma, fx.sectionA2.id);
    const res = await bulk(auxiliar, {
      sectionId: fx.sectionA.id,
      date: DATE,
      records: [...records(), { enrollmentId: other.enrollment.id, status: 'PRESENT' }],
    }).expect(400);
    expect(res.body.invalidEnrollmentIds).toEqual([other.enrollment.id]);
    expect(await prisma.attendanceRecord.count()).toBe(0);
  });

  it('una matrícula retirada: 400', async () => {
    const withdrawn = await createEnrolledStudent(prisma, fx.sectionA.id, 'WITHDRAWN');
    await bulk(auxiliar, {
      sectionId: fx.sectionA.id,
      date: DATE,
      records: [{ enrollmentId: withdrawn.enrollment.id, status: 'ABSENT' }],
    }).expect(400);
  });

  it('no acepta fechas futuras', async () => {
    const tomorrow = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
    await bulk(auxiliar, { sectionId: fx.sectionA.id, date: tomorrow, records: records() }).expect(400);
  });

  it('un director de otra IE: 403', async () => {
    const directorB = signTestToken({ id: USERS.directorB, roles: [{ role: 'DIRECTOR', schoolId: fx.schoolB.id }] });
    await bulk(directorB, { sectionId: fx.sectionA.id, date: DATE, records: records() }).expect(403);
  });

  it('la lista de una hora convive con la del día', async () => {
    const teacher = signTestToken({ id: USERS.teacherA, roles: [{ role: 'TEACHER', schoolId: fx.schoolA.id }] });
    const session = await http()
      .post('/class-sessions')
      .set(bearer(teacher))
      .send({ sectionId: fx.sectionA.id, areaId: fx.area.id, date: DATE, periodNumber: 3 })
      .expect(201);
    expect(session.body.teacherUserId).toBe(USERS.teacherA);
    await bulk(auxiliar, { sectionId: fx.sectionA.id, date: DATE, records: records() }).expect(200);
    await bulk(teacher, { sectionId: fx.sectionA.id, date: DATE, classSessionId: session.body.id, records: records('LEFT_EARLY') }).expect(200);
    expect(await prisma.attendanceRecord.count()).toBe(6);
  });

  it('periodNumber fuera de 1..8: 400', async () => {
    const teacher = signTestToken({ id: USERS.teacherA, roles: [{ role: 'TEACHER', schoolId: fx.schoolA.id }] });
    await http()
      .post('/class-sessions')
      .set(bearer(teacher))
      .send({ sectionId: fx.sectionA.id, date: DATE, periodNumber: 9 })
      .expect(400);
  });
});
