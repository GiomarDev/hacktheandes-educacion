import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { HttpJwksKeyResolver, JwksKeyResolver, JwtAuthGuard, PrismaErrorFilter, requireEnv } from '@app/common';
import { HealthController } from './health.controller.js';
import { PrismaService } from './prisma.service.js';
import { SchoolAccessService } from './school-access.service.js';
import { GeoController } from './geo/geo.controller.js';
import { GeoService } from './geo/geo.service.js';
import { InternalController } from './internal/internal.controller.js';
import { SectionsController } from './sections/sections.controller.js';
import { StudentsController } from './students/students.controller.js';
import { EnrollmentsController } from './enrollments/enrollments.controller.js';
import { AttendanceController } from './attendance/attendance.controller.js';
import { AttendanceService } from './attendance/attendance.service.js';
import { GradesController } from './grades/grades.controller.js';
import { GradesService } from './grades/grades.service.js';

@Module({
  controllers: [
    HealthController,
    GeoController,
    InternalController,
    SectionsController,
    StudentsController,
    EnrollmentsController,
    AttendanceController,
    GradesController,
  ],
  providers: [
    PrismaService,
    SchoolAccessService,
    GeoService,
    AttendanceService,
    GradesService,
    { provide: JwksKeyResolver, useFactory: () => new HttpJwksKeyResolver(requireEnv('AUTH_JWKS_URL')) },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_FILTER, useClass: PrismaErrorFilter },
  ],
})
export class AppModule {}
