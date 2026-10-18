import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { AddressInfo } from 'node:net';
import argon2 from 'argon2';
import request from 'supertest';
import { pgConnectionFromUrl } from '@app/common';
import type { RoleClaim } from '@app/common';
import { PrismaService as AuthPrisma } from '../../ms-auth/src/prisma.service.js';
import { PrismaService } from '../src/prisma.service.js';

export async function start(module: unknown) {
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
export type Started = Awaited<ReturnType<typeof start>>;

// El catálogo de indicadores viene de la migración: no se borra.
export async function cleanEscaleTables(prisma: PrismaService) {
  const { schema } = pgConnectionFromUrl(process.env.ESCALE_DATABASE_URL!);
  if (!schema.endsWith('_test'))
    throw new Error(`Se aborta: ${schema} no es un schema de pruebas`);
  await prisma.$executeRawUnsafe(
    `TRUNCATE "${schema}"."indicator_values", "${schema}"."dataset_imports", "${schema}"."school_daily_stats" CASCADE`,
  );
}

// Crea usuarios sintéticos en auth_test e inicia sesión con cada uno.
export async function loginAs(
  auth: Started,
  identities: Record<string, { id: string; claim: RoleClaim }>,
  documentPrefix = '7200000',
) {
  const db = auth.app.get(AuthPrisma);
  await db.$executeRawUnsafe(
    'TRUNCATE "auth_test"."auth_events", "auth_test"."refresh_tokens", "auth_test"."user_roles", "auth_test"."users" CASCADE',
  );
  const password = 'Prueba-Escale-2026';
  const passwordHash = await argon2.hash(password);
  const entries = Object.entries(identities);
  await db.user.createMany({
    data: entries.map(([, { id }], i) => ({
      id,
      documentType: 'DNI',
      documentNumber: `${documentPrefix}${i}`,
      firstName: 'Personal',
      lastName: 'Sintético',
      passwordHash,
    })),
  });
  await db.userRole.createMany({
    data: entries.map(([, { id, claim }]) => ({ userId: id, ...claim })),
  });
  const tokens: Record<string, string> = {};
  for (const [i, [name]] of entries.entries())
    tokens[name] = (
      await request(auth.url)
        .post('/auth/login')
        .send({ documentNumber: `${documentPrefix}${i}`, password })
        .expect(200)
    ).body.accessToken;
  return tokens;
}
