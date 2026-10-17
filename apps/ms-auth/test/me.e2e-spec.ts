import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma.service.js';
import { cleanAuthTables, createAuthApp, createTestUser, TEST_PASSWORD } from './helpers/app.js';

describe('rutas autenticadas de ms-auth', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const http = () => request(app.getHttpServer());
  const loginWith = async (password = TEST_PASSWORD) =>
    (await http().post('/auth/login').send({ documentNumber: '70000001', password }).expect(200)).body;

  beforeAll(async () => {
    ({ app, prisma } = await createAuthApp());
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await cleanAuthTables(prisma);
    await createTestUser(prisma);
  });

  it('GET /auth/me devuelve el usuario del token', async () => {
    const { accessToken } = await loginWith();
    const res = await http().get('/auth/me').set('Authorization', `Bearer ${accessToken}`).expect(200);
    expect(res.body).toMatchObject({ name: 'Ana Prueba', roles: [{ role: 'DIRECTOR' }] });
    expect(res.body.id).toBeTruthy();
  });

  it('GET /auth/me sin token: 401', async () => {
    await http().get('/auth/me').expect(401);
  });

  it('un token firmado con una llave retirada hace tiempo ya no sirve', async () => {
    const { accessToken } = await loginWith();
    await prisma.signingKey.updateMany({
      data: { isActive: false, rotatedAt: new Date(Date.now() - 3600_000) },
    });
    try {
      await http().get('/auth/me').set('Authorization', `Bearer ${accessToken}`).expect(401);
    } finally {
      await prisma.signingKey.updateMany({ data: { isActive: true, rotatedAt: null } });
    }
  });

  it('las rutas públicas siguen sin pedir token', async () => {
    await http().get('/health').expect(200);
    await http().get('/.well-known/jwks.json').expect(200);
  });

  describe('POST /auth/change-password', () => {
    it('con la contraseña actual errónea: 401', async () => {
      const { accessToken } = await loginWith();
      await http()
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ currentPassword: 'no-es', newPassword: 'Nueva-Clave-2026' })
        .expect(401);
    });

    it('cambia la contraseña y cierra las sesiones abiertas', async () => {
      const { accessToken, refreshToken } = await loginWith();
      await http()
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ currentPassword: TEST_PASSWORD, newPassword: 'Nueva-Clave-2026' })
        .expect(204);
      await loginWith('Nueva-Clave-2026');
      await http().post('/auth/refresh').send({ refreshToken }).expect(401);
      expect(await prisma.authEvent.count({ where: { type: 'PASSWORD_CHANGED' } })).toBe(1);
      const user = await prisma.user.findFirstOrThrow();
      expect(user.mustChangePassword).toBe(false);
    });

    it('5 contraseñas actuales erróneas bloquean la cuenta', async () => {
      const { accessToken } = await loginWith();
      for (let i = 0; i < 5; i++) {
        await http()
          .post('/auth/change-password')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ currentPassword: 'adivinando', newPassword: 'Nueva-Clave-2026' })
          .expect(401);
      }
      const user = await prisma.user.findFirstOrThrow();
      expect(user.status).toBe('LOCKED');
      await http()
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ currentPassword: TEST_PASSWORD, newPassword: 'Nueva-Clave-2026' })
        .expect(401);
    });

    it('rechaza una contraseña nueva corta', async () => {
      const { accessToken } = await loginWith();
      await http()
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ currentPassword: TEST_PASSWORD, newPassword: 'corta' })
        .expect(400);
    });
  });
});
