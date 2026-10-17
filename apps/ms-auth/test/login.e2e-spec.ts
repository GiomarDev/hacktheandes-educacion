import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma.service.js';
import { cleanAuthTables, createAuthApp, createTestUser, TEST_PASSWORD } from './helpers/app.js';
import { verifyWithJwks } from './helpers/verify.js';

const INVALID = { message: 'Credenciales inválidas' };

describe('POST /auth/login', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const login = (documentNumber: string, password: string) =>
    request(app.getHttpServer()).post('/auth/login').send({ documentNumber, password });

  beforeAll(async () => {
    ({ app, prisma } = await createAuthApp());
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await cleanAuthTables(prisma);
  });

  it('login correcto devuelve tokens verificables con roles', async () => {
    const user = await createTestUser(prisma);
    const res = await login('70000001', TEST_PASSWORD).expect(200);
    expect(res.body).toMatchObject({ expiresIn: 900, mustChangePassword: false });
    expect(res.body.refreshToken).toBeTruthy();
    const payload = await verifyWithJwks(app, res.body.accessToken);
    expect(payload.sub).toBe(user.id);
    expect(payload.name).toBe('Ana Prueba');
    expect(payload.roles).toEqual([{ role: 'DIRECTOR', schoolId: '019a0000-0000-7000-8000-000000000001' }]);
    const updated = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(updated.lastLoginAt).not.toBeNull();
    expect(await prisma.authEvent.count({ where: { userId: user.id, type: 'LOGIN_OK' } })).toBe(1);
  });

  it('contraseña errónea: 401 genérico y suma un intento', async () => {
    const user = await createTestUser(prisma);
    const res = await login('70000001', 'otra-clave').expect(401);
    expect(res.body).toMatchObject(INVALID);
    const updated = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(updated.failedLoginAttempts).toBe(1);
    expect(await prisma.authEvent.count({ where: { userId: user.id, type: 'LOGIN_FAILED' } })).toBe(1);
  });

  it('usuario inexistente: misma respuesta y evento sin usuario', async () => {
    const res = await login('79999999', TEST_PASSWORD).expect(401);
    expect(res.body).toMatchObject(INVALID);
    expect(await prisma.authEvent.count({ where: { userId: null, type: 'LOGIN_FAILED' } })).toBe(1);
  });

  it('5 fallos bloquean la cuenta 15 minutos, incluso con la contraseña correcta', async () => {
    const user = await createTestUser(prisma);
    for (let i = 0; i < 5; i++) await login('70000001', 'mala').expect(401);
    const locked = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(locked.status).toBe('LOCKED');
    const minutes = (locked.lockedUntil!.getTime() - Date.now()) / 60000;
    expect(minutes).toBeGreaterThan(14);
    expect(minutes).toBeLessThanOrEqual(15);
    expect(await prisma.authEvent.count({ where: { userId: user.id, type: 'LOCKED' } })).toBe(1);
    const res = await login('70000001', TEST_PASSWORD).expect(401);
    expect(res.body).toMatchObject(INVALID);
  });

  it('intentos fallidos en paralelo cuentan todos y bloquean la cuenta', async () => {
    const user = await createTestUser(prisma);
    await Promise.all(Array.from({ length: 8 }, () => login('70000001', 'mala').expect(401)));
    const updated = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(updated.failedLoginAttempts).toBe(8);
    expect(updated.status).toBe('LOCKED');
  });

  it('bloqueo vencido: entra y reinicia el contador', async () => {
    const user = await createTestUser(prisma, {
      status: 'LOCKED',
      lockedUntil: new Date(Date.now() - 1000),
      failedLoginAttempts: 5,
    });
    await login('70000001', TEST_PASSWORD).expect(200);
    const updated = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(updated.status).toBe('ACTIVE');
    expect(updated.failedLoginAttempts).toBe(0);
  });

  it('usuario inactivo: 401', async () => {
    await createTestUser(prisma, { status: 'INACTIVE' });
    await login('70000001', TEST_PASSWORD).expect(401);
  });

  it('valida el cuerpo', async () => {
    await request(app.getHttpServer()).post('/auth/login').send({ documentNumber: '1' }).expect(400);
  });
});
