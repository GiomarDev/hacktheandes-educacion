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

  it('un fallo con el bloqueo vencido vuelve a bloquear la cuenta', async () => {
    const user = await createTestUser(prisma, {
      status: 'LOCKED',
      lockedUntil: new Date(Date.now() - 1000),
      failedLoginAttempts: 5,
    });
    await login('70000001', 'mala').expect(401);
    const updated = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(updated.status).toBe('LOCKED');
    expect(updated.lockedUntil!.getTime()).toBeGreaterThan(Date.now() + 14 * 60000);
  });

  it('usuario inactivo: 401', async () => {
    await createTestUser(prisma, { status: 'INACTIVE' });
    await login('70000001', TEST_PASSWORD).expect(401);
  });

  describe('límite por IP', () => {
    // Un fallo real para conocer la IP que ve el servicio; el resto se siembra como eventos.
    const failFromThisIp = async (count: number, minutesAgo = 0) => {
      await login('79999999', 'mala').expect(401);
      const { ip } = await prisma.authEvent.findFirstOrThrow({ where: { type: 'LOGIN_FAILED' } });
      const occurredAt = new Date(Date.now() - minutesAgo * 60000);
      await prisma.authEvent.updateMany({ data: { occurredAt } });
      await prisma.authEvent.createMany({
        data: Array.from({ length: count - 1 }, () => ({ type: 'LOGIN_FAILED' as const, ip, occurredAt })),
      });
    };

    it('tras 20 fallos en 15 minutos responde 429, aunque la clave sea correcta', async () => {
      await createTestUser(prisma);
      await failFromThisIp(20);
      const res = await login('70000001', TEST_PASSWORD).expect(429);
      expect(res.body.message).toBe('Demasiados intentos desde esta conexión. Intente más tarde.');
      expect(Number(res.headers['retry-after'])).toBeGreaterThan(0);
      // No toca la cuenta ni deja eventos nuevos: no se pueden usar para alargar el bloqueo.
      expect(await prisma.authEvent.count()).toBe(20);
    });

    it('19 fallos todavía permiten entrar', async () => {
      await createTestUser(prisma);
      await failFromThisIp(19);
      await login('70000001', TEST_PASSWORD).expect(200);
    });

    it('los fallos de hace más de 15 minutos no cuentan', async () => {
      await createTestUser(prisma);
      await failFromThisIp(20, 16);
      await login('70000001', TEST_PASSWORD).expect(200);
    });

    it('los fallos de otra IP no cuentan', async () => {
      await createTestUser(prisma);
      await prisma.authEvent.createMany({
        data: Array.from({ length: 30 }, () => ({ type: 'LOGIN_FAILED' as const, ip: '203.0.113.7' })),
      });
      await login('70000001', TEST_PASSWORD).expect(200);
    });
  });

  it('valida el cuerpo', async () => {
    await request(app.getHttpServer()).post('/auth/login').send({ documentNumber: '1' }).expect(400);
  });
});
