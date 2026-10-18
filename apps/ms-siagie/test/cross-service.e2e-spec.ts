import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AddressInfo } from 'node:net';
import request from 'supertest';
import argon2 from 'argon2';
import { todayInLima } from '@app/common';
import { SEED_IDS } from '@app/fixtures';
import { AppModule as AuthModule } from '../../ms-auth/src/app.module.js';
import { PrismaService as AuthPrisma } from '../../ms-auth/src/prisma.service.js';
import { seedAuth } from '../../ms-auth/prisma/seed.js';
import { AppModule as SiagieModule } from '../src/app.module.js';
import { PrismaService as SiagiePrisma } from '../src/prisma.service.js';
import { seedSiagie } from '../prisma/seed.js';
import { cleanSiagieTables } from './helpers/db.js';

async function start(
  module: unknown,
): Promise<{ app: INestApplication; url: string }> {
  const moduleRef = await Test.createTestingModule({
    imports: [module as never],
  }).compile();
  const app = moduleRef.createNestApplication();
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

describe('ms-auth + ms-siagie de punta a punta', () => {
  let auth: { app: INestApplication; url: string };
  let siagie: { app: INestApplication; url: string };
  let authPrisma: AuthPrisma;
  let siagiePrisma: SiagiePrisma;
  const originalJwksUrl = process.env.AUTH_JWKS_URL;
  const password = process.env.SEED_PASSWORD!;

  const login = async (documentNumber: string, pass = password) =>
    (
      await request(auth.url)
        .post('/auth/login')
        .send({ documentNumber, password: pass })
        .expect(200)
    ).body.accessToken as string;

  beforeAll(async () => {
    auth = await start(AuthModule);
    process.env.AUTH_JWKS_URL = `${auth.url}/.well-known/jwks.json`;
    siagie = await start(SiagieModule);
    authPrisma = auth.app.get(AuthPrisma);
    siagiePrisma = siagie.app.get(SiagiePrisma);
    await authPrisma.$executeRawUnsafe(
      'TRUNCATE "auth_test"."auth_events", "auth_test"."refresh_tokens", "auth_test"."user_roles", "auth_test"."users" CASCADE',
    );
    await cleanSiagieTables(siagiePrisma);
    await seedAuth(authPrisma, password);
    await seedSiagie(siagiePrisma);
  });

  afterAll(async () => {
    await siagie?.app.close();
    await auth?.app.close();
    if (originalJwksUrl === undefined) delete process.env.AUTH_JWKS_URL;
    else process.env.AUTH_JWKS_URL = originalJwksUrl;
  });

  it('repetir los seeds conserva IDs, cantidades y la contraseña existente', async () => {
    const before = await authPrisma.user.findUniqueOrThrow({
      where: { id: SEED_IDS.users.director },
    });
    const roleCount = await authPrisma.userRole.count();
    await seedAuth(authPrisma, 'Otra-clave-que-no-debe-reemplazar-la-actual');
    await seedSiagie(siagiePrisma);
    expect(await authPrisma.user.count()).toBe(10);
    expect(await authPrisma.userRole.count()).toBe(roleCount);
    expect(
      (await authPrisma.user.findUniqueOrThrow({ where: { id: before.id } }))
        .passwordHash,
    ).toBe(before.passwordHash);
    expect(await siagiePrisma.student.count()).toBe(60);
    expect(await siagiePrisma.guardian.count()).toBe(60);
    expect(await siagiePrisma.enrollment.count()).toBe(60);
    expect(await siagiePrisma.section.count()).toBe(2);
    expect(await siagiePrisma.academicPeriod.count()).toBe(4);
    expect(await siagiePrisma.competency.count()).toBe(4);
  });

  it('el director entra con login real y ve los 30 alumnos de 1.° A', async () => {
    const token = await login(SEED_IDS.documents.director);
    const res = await request(siagie.url)
      .get(`/sections/${SEED_IDS.sections.a1}/students`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body).toHaveLength(30);
  });

  it('un director de otra IE no ve esa sección', async () => {
    await authPrisma.user.create({
      data: {
        documentType: 'DNI',
        documentNumber: '79990001',
        firstName: 'Otro',
        lastName: 'Director',
        passwordHash: await argon2.hash(password, { type: argon2.argon2id }),
        roles: {
          create: {
            role: 'DIRECTOR',
            schoolId: '01920000-0000-7000-8000-00000000ffff',
          },
        },
      },
    });
    const token = await login('79990001');
    await request(siagie.url)
      .get(`/sections/${SEED_IDS.sections.a1}/students`)
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('el pase de lista del auxiliar aparece en el resumen y queda auditado', async () => {
    const auxiliar = await login(SEED_IDS.documents.auxiliar);
    const students = await request(siagie.url)
      .get(`/sections/${SEED_IDS.sections.a1}/students`)
      .set('Authorization', `Bearer ${auxiliar}`)
      .expect(200);
    const [first] = students.body;
    await request(siagie.url)
      .post('/attendance/bulk')
      .set('Authorization', `Bearer ${auxiliar}`)
      .send({
        sectionId: SEED_IDS.sections.a1,
        date: todayInLima(),
        records: [{ enrollmentId: first.id, status: 'PRESENT' }],
      })
      .expect(200);

    const director = await login(SEED_IDS.documents.director);
    const summary = await request(siagie.url)
      .get(`/students/${first.studentId}/summary`)
      .set('Authorization', `Bearer ${director}`)
      .expect(200);
    expect(summary.body.attendance.present).toBe(1);
    expect(summary.body.enrollment.id).toBe(first.id);
    const audit = await siagie.app.get(SiagiePrisma).auditLog.findFirst({
      where: {
        action: 'VIEW_STUDENT',
        entityId: first.studentId,
        userId: SEED_IDS.users.director,
      },
    });
    expect(audit).not.toBeNull();
  });

  it('con ms-auth caído, el token ya emitido sigue funcionando en ms-siagie', async () => {
    const token = await login(SEED_IDS.documents.director);
    await request(siagie.url)
      .get(`/sections/${SEED_IDS.sections.a1}/students`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    await auth.app.close();
    await request(siagie.url)
      .get(`/sections/${SEED_IDS.sections.a1}/students`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });
});
