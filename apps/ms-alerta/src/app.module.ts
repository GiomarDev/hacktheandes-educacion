import { ReportingController } from './reporting.controller.js';
import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import {
  HttpJwksKeyResolver,
  JwksKeyResolver,
  JwtAuthGuard,
  PrismaErrorFilter,
  requireEnv,
} from '@app/common';
import { PrismaService } from './prisma.service.js';
import { HealthController } from './health.controller.js';
import { ApiController } from './api.controller.js';
import { InternalController } from './internal.controller.js';
import { SiagieClient, StaffClient } from './clients.js';
import { ScopeService } from './scope.service.js';
import { RulesService } from './rules/rules.service.js';
import { EngineService } from './rules/engine.service.js';
import { InboxService } from './inbox.service.js';
import {
  ConsoleProvider,
  NotificationProvider,
  NotificationsService,
} from './notifications.service.js';
import { JobsService } from './jobs.service.js';

@Module({
  controllers: [
    ReportingController,
    HealthController,
    ApiController,
    InternalController,
  ],
  providers: [
    PrismaService,
    SiagieClient,
    StaffClient,
    ScopeService,
    RulesService,
    EngineService,
    InboxService,
    NotificationsService,
    JobsService,
    { provide: NotificationProvider, useClass: ConsoleProvider },
    {
      provide: JwksKeyResolver,
      useFactory: () => new HttpJwksKeyResolver(requireEnv('AUTH_JWKS_URL')),
    },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_FILTER, useClass: PrismaErrorFilter },
  ],
})
export class AppModule {}
