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
import { SourcesClient } from './clients.js';
import { DiagnosisService } from './diagnosis.service.js';
import { PrismaService } from './prisma.service.js';
import { ScopeService } from './scope.service.js';
import { ReportsService } from './reports.service.js';
import { PlansService } from './plans.service.js';
import { VisitsService } from './visits.service.js';
import {
  DocumentsController,
  DocumentsService,
  InternalDocumentPreferencesController,
  InternalDocumentsController,
} from './documents.js';
import { DocumentPreferencesService } from './document-preferences.js';
@Module({
  controllers: [
    HealthController,
    ApiController,
    DocumentsController,
    InternalDocumentsController,
    InternalDocumentPreferencesController,
  ],
  providers: [
    PrismaService,
    SourcesClient,
    ScopeService,
    DiagnosisService,
    ReportsService,
    PlansService,
    VisitsService,
    DocumentsService,
    DocumentPreferencesService,
    {
      provide: JwksKeyResolver,
      useFactory: () => new HttpJwksKeyResolver(requireEnv('AUTH_JWKS_URL')),
    },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_FILTER, useClass: PrismaErrorFilter },
  ],
})
export class AppModule {}
