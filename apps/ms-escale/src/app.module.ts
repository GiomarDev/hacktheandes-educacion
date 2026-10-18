import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import {
  HttpJwksKeyResolver,
  JwksKeyResolver,
  JwtAuthGuard,
  PrismaErrorFilter,
  requireEnv,
} from '@app/common';
import { ApiController } from './api.controller.js';
import { HealthController } from './health.controller.js';
import { ImportsService } from './imports.service.js';
import { IndicatorsService } from './indicators.service.js';
import { PrismaService } from './prisma.service.js';
import { SourcesClient } from './clients.js';
import { StatsService } from './stats.service.js';
import { JobsService } from './jobs.service.js';
@Module({
  controllers: [HealthController, ApiController],
  providers: [
    PrismaService,
    ImportsService,
    IndicatorsService,
    SourcesClient,
    StatsService,
    JobsService,
    {
      provide: JwksKeyResolver,
      useFactory: () => new HttpJwksKeyResolver(requireEnv('AUTH_JWKS_URL')),
    },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_FILTER, useClass: PrismaErrorFilter },
  ],
})
export class AppModule {}
