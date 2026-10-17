import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module.js';
import { PrismaService } from '../../src/prisma.service.js';

export async function createAuthApp(): Promise<{ app: INestApplication; prisma: PrismaService }> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  await app.init();
  return { app, prisma: app.get(PrismaService) };
}

export async function cleanAuthTables(prisma: PrismaService): Promise<void> {
  await prisma.authEvent.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.user.deleteMany();
}

export const TEST_PASSWORD = 'Clave-Prueba-1';

export async function createTestUser(
  prisma: PrismaService,
  overrides: Partial<{ documentNumber: string; status: 'ACTIVE' | 'INACTIVE' | 'LOCKED'; lockedUntil: Date | null; failedLoginAttempts: number }> = {},
) {
  const argon2 = await import('argon2');
  return prisma.user.create({
    data: {
      documentType: 'DNI',
      documentNumber: overrides.documentNumber ?? '70000001',
      firstName: 'Ana',
      lastName: 'Prueba',
      passwordHash: await argon2.hash(TEST_PASSWORD, { type: argon2.argon2id }),
      status: overrides.status ?? 'ACTIVE',
      lockedUntil: overrides.lockedUntil ?? null,
      failedLoginAttempts: overrides.failedLoginAttempts ?? 0,
      roles: { create: { role: 'DIRECTOR', schoolId: '019a0000-0000-7000-8000-000000000001' } },
    },
  });
}
