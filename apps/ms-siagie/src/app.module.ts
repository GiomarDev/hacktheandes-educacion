import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { HttpJwksKeyResolver, JwksKeyResolver, JwtAuthGuard, PrismaErrorFilter, requireEnv } from '@app/common';
import { HealthController } from './health.controller.js';
import { PrismaService } from './prisma.service.js';
import { SchoolAccessService } from './school-access.service.js';
import { GeoController } from './geo/geo.controller.js';
import { GeoService } from './geo/geo.service.js';
import { InternalController } from './internal/internal.controller.js';

@Module({
  controllers: [HealthController, GeoController, InternalController],
  providers: [
    PrismaService,
    SchoolAccessService,
    GeoService,
    { provide: JwksKeyResolver, useFactory: () => new HttpJwksKeyResolver(requireEnv('AUTH_JWKS_URL')) },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_FILTER, useClass: PrismaErrorFilter },
  ],
})
export class AppModule {}
