import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwksKeyResolver, JwtAuthGuard } from '@app/common';
import { LocalJwksKeyResolver } from './keys/local-jwks-key-resolver.js';
import { HealthController } from './health.controller.js';
import { PrismaService } from './prisma.service.js';
import { JwksController } from './keys/jwks.controller.js';
import { KeysService } from './keys/keys.service.js';
import { AuthController } from './auth/auth.controller.js';
import { AuthService } from './auth/auth.service.js';
import { TokensService } from './auth/tokens.service.js';

@Module({
  controllers: [HealthController, JwksController, AuthController],
  providers: [
    PrismaService,
    KeysService,
    TokensService,
    AuthService,
    { provide: JwksKeyResolver, useClass: LocalJwksKeyResolver },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
