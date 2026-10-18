import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma.service.js';
import { hashRefreshToken } from '../src/auth/tokens.service.js';
import { cleanAuthTables, createAuthApp, createTestUser, TEST_PASSWORD } from './helpers/app.js';

describe('refresh y logout', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const http = () => request(app.getHttpServer());
  const refresh = (refreshToken: string) => http().post('/auth/refresh').send({ refreshToken });
  const loginTokens = async () =>
    (await http().post('/auth/login').send({ documentNumber: '70000001', password: TEST_PASSWORD }).expect(200)).body;

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

  it('rota el refresh token y registra el evento', async () => {
    const { refreshToken } = await loginTokens();
    const res = await refresh(refreshToken).expect(200);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.expiresIn).toBe(900);
    expect(res.body.refreshToken).not.toBe(refreshToken);
    expect(await prisma.authEvent.count({ where: { type: 'REFRESH' } })).toBe(1);
  });

  it('reutilizar un token rotado revoca toda la familia', async () => {
    const { refreshToken: a } = await loginTokens();
    const { refreshToken: b } = (await refresh(a).expect(200)).body;
    await refresh(a).expect(401);
    expect(await prisma.authEvent.count({ where: { type: 'TOKEN_REUSE_DETECTED' } })).toBe(1);
    await refresh(b).expect(401);
  });

  it('dos refresh simultáneos con el mismo token se tratan como reutilización', async () => {
    const { refreshToken } = await loginTokens();
    const results = await Promise.all([refresh(refreshToken), refresh(refreshToken)]);
    const statuses = results.map((r) => r.status).sort();
    expect(statuses).toEqual([200, 401]);
    const winner = results.find((r) => r.status === 200)!;
    await refresh(winner.body.refreshToken).expect(401);
  });

  it('rechaza un token vencido', async () => {
    const { refreshToken } = await loginTokens();
    await prisma.refreshToken.update({
      where: { tokenHash: hashRefreshToken(refreshToken) },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    await refresh(refreshToken).expect(401);
  });

  it('rechaza un token inventado', async () => {
    await refresh('token-que-no-existe').expect(401);
  });

  it('logout revoca la sesión', async () => {
    const { refreshToken } = await loginTokens();
    await http().post('/auth/logout').send({ refreshToken }).expect(204);
    await refresh(refreshToken).expect(401);
    expect(await prisma.authEvent.count({ where: { type: 'LOGOUT' } })).toBe(1);
  });
});
