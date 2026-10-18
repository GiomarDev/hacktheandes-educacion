import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import {
  HttpJwksKeyResolver,
  JwksKeyResolver,
  JwtAuthGuard,
  PrismaErrorFilter,
  requireEnv,
} from '@app/common';
import { HealthController } from './health.controller.js';
import { PrismaService } from './prisma.service.js';
@Module({
  controllers: [HealthController],
  providers: [
    PrismaService,
    {
      provide: JwksKeyResolver,
      useFactory: () => new HttpJwksKeyResolver(requireEnv('AUTH_JWKS_URL')),
    },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_FILTER, useClass: PrismaErrorFilter },
  ],
})
export class AppModule {}
