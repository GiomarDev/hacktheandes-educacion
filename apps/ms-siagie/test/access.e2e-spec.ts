import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma.service.js';
import { createSiagieApp } from './helpers/app.js';
import { cleanSiagieTables } from './helpers/db.js';
import { createEnrolledStudent, createSchoolFixture, USERS } from './helpers/fixtures.js';
import { bearer, signTestToken } from './helpers/tokens.js';

describe('carné QR e ingreso/salida', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let fx: Awaited<ReturnType<typeof createSchoolFixture>>;
  let secretary: string;
  let auxiliar: string;
  let studentId: string;
  const http = () => request(app.getHttpServer());
  const issueQr = () => http().post(`/students/${studentId}/qr`).set(bearer(secretary));
  const access = (token: string, body: object) => http().post('/access-events').set(bearer(token)).send(body);

  beforeAll(async () => {
    ({ app, prisma } = await createSiagieApp());
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await cleanSiagieTables(prisma);
    fx = await createSchoolFixture(prisma);
    secretary = signTestToken({ id: USERS.secretaryA, roles: [{ role: 'SECRETARY', schoolId: fx.schoolA.id }] });
    auxiliar = signTestToken({ id: USERS.auxiliarA, roles: [{ role: 'AUXILIAR', schoolId: fx.schoolA.id }] });
    studentId = (await createEnrolledStudent(prisma, fx.sectionA.id)).student.id;
  });

  it('emite un QR y registra el ingreso con él', async () => {
    const { body } = await issueQr().expect(201);
    expect(body.token).toBeTruthy();
    const res = await access(auxiliar, { token: body.token, type: 'ENTRY', deviceId: 'puerta-1' }).expect(201);
    expect(res.body).toMatchObject({ studentId, type: 'ENTRY' });
    const event = await prisma.accessEvent.findFirstOrThrow();
    expect(event).toMatchObject({ method: 'QR', schoolId: fx.schoolA.id, recordedByUserId: USERS.auxiliarA });
  });

  it('no guarda el token en claro', async () => {
    const { body } = await issueQr().expect(201);
    const credential = await prisma.qrCredential.findFirstOrThrow();
    expect(credential.tokenHash).not.toBe(body.token);
    expect(credential.tokenHash).not.toContain(body.token);
  });

  it('al reemitir, el QR anterior deja de servir', async () => {
    const first = (await issueQr().expect(201)).body.token;
    await issueQr().expect(201);
    await access(auxiliar, { token: first, type: 'ENTRY' }).expect(404);
  });

  it('un token inventado: 404', async () => {
    await access(auxiliar, { token: 'token-inventado-123456', type: 'ENTRY' }).expect(404);
  });

  it('token y estudiante a la vez: 400', async () => {
    const { body } = await issueQr().expect(201);
    await access(auxiliar, { token: body.token, studentId, type: 'ENTRY' }).expect(400);
    await access(auxiliar, { type: 'ENTRY' }).expect(400);
  });

  it('registra una salida manual', async () => {
    await access(auxiliar, { studentId, type: 'EXIT' }).expect(201);
    expect((await prisma.accessEvent.findFirstOrThrow()).method).toBe('MANUAL');
  });

  it('un auxiliar de otra IE no puede registrar', async () => {
    const { body } = await issueQr().expect(201);
    const auxiliarB = signTestToken({ id: USERS.auxiliarB, roles: [{ role: 'AUXILIAR', schoolId: fx.schoolB.id }] });
    await access(auxiliarB, { token: body.token, type: 'ENTRY' }).expect(403);
  });

  it('al retirar al estudiante su carné deja de servir', async () => {
    const { body } = await issueQr().expect(201);
    const enrollment = await prisma.enrollment.findFirstOrThrow({ where: { studentId } });
    await http()
      .patch(`/enrollments/${enrollment.id}/status`)
      .set(bearer(secretary))
      .send({ status: 'TRANSFERRED_OUT', statusReason: 'Traslado a otra IE' })
      .expect(200);
    await access(auxiliar, { token: body.token, type: 'ENTRY' }).expect(404);
    await access(auxiliar, { studentId, type: 'ENTRY' }).expect(404);
  });

  it('un docente no emite QR', async () => {
    const teacher = signTestToken({ id: USERS.teacherA, roles: [{ role: 'TEACHER', schoolId: fx.schoolA.id }] });
    await http().post(`/students/${studentId}/qr`).set(bearer(teacher)).expect(403);
  });
});
