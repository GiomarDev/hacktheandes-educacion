import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { JwksKeyResolver, JwtAuthGuard, PrismaErrorFilter } from '@app/common';
import { SiagieClient } from './siagie/siagie.client.js';
import { UsersController } from './users/users.controller.js';
import { UsersService } from './users/users.service.js';
import { LocalJwksKeyResolver } from './keys/local-jwks-key-resolver.js';
import { HealthController } from './health.controller.js';
import { PrismaService } from './prisma.service.js';
import { JwksController } from './keys/jwks.controller.js';
import { KeysService } from './keys/keys.service.js';
import { AuthController } from './auth/auth.controller.js';
import { AuthService } from './auth/auth.service.js';
import { TokensService } from './auth/tokens.service.js';
import { InternalStaffController } from './users/internal-staff.controller.js';

@Module({
  controllers: [
    HealthController,
    JwksController,
    AuthController,
    UsersController,
    InternalStaffController,
  ],
  providers: [
    PrismaService,
    KeysService,
    TokensService,
    AuthService,
    UsersService,
    SiagieClient,
    { provide: JwksKeyResolver, useClass: LocalJwksKeyResolver },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_FILTER, useClass: PrismaErrorFilter },
  ],
})
export class AppModule {}
