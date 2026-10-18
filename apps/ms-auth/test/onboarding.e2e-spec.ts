import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma.service.js';
import { cleanAuthTables, createAuthApp, createTestUser, TEST_PASSWORD } from './helpers/app.js';

describe('recorrido de bienvenida', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  const http = () => request(app.getHttpServer());
  const as = (req: request.Test) => req.set('Authorization', `Bearer ${token}`);

  beforeAll(async () => {
    ({ app, prisma } = await createAuthApp());
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await cleanAuthTables(prisma);
    const user = await createTestUser(prisma);
    await prisma.userRole.create({ data: { userId: user.id, role: 'TEACHER', schoolId: '019a0000-0000-7000-8000-000000000001' } });
    token = (await http().post('/auth/login').send({ documentNumber: '70000001', password: TEST_PASSWORD }).expect(200)).body.accessToken;
  });

  it('una cuenta nueva no completó ningún recorrido', async () => {
    const { body } = await as(http().get('/auth/onboarding')).expect(200);
    expect(body).toEqual({ completedRoles: [] });
  });

  it('marca el recorrido de un rol una sola vez', async () => {
    await as(http().post('/auth/onboarding')).send({ role: 'TEACHER' }).expect(200, { completedRoles: ['TEACHER'] });
    await as(http().post('/auth/onboarding')).send({ role: 'TEACHER' }).expect(200, { completedRoles: ['TEACHER'] });
    await as(http().post('/auth/onboarding')).send({ role: 'DIRECTOR' }).expect(200);
    const { body } = await as(http().get('/auth/onboarding')).expect(200);
    expect([...body.completedRoles].sort()).toEqual(['DIRECTOR', 'TEACHER']);
  });

  it('solo acepta roles que la persona tiene', async () => {
    await as(http().post('/auth/onboarding')).send({ role: 'MINEDU_ADMIN' }).expect(403);
    await as(http().post('/auth/onboarding')).send({ role: 'NO_EXISTE' }).expect(400);
    await http().get('/auth/onboarding').expect(401);
  });

  it('volver a ver el recorrido lo deja pendiente de nuevo', async () => {
    await as(http().post('/auth/onboarding')).send({ role: 'TEACHER' }).expect(200);
    await as(http().delete('/auth/onboarding/TEACHER')).expect(200, { completedRoles: [] });
  });
});
