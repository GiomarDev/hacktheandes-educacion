import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module.js';
import { PrismaService } from '../../src/prisma.service.js';
import { startTestJwks } from './tokens.js';

export async function createSiagieApp(): Promise<{ app: INestApplication; prisma: PrismaService }> {
  await startTestJwks();
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  await app.init();
  return { app, prisma: app.get(PrismaService) };
}
