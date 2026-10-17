import { Module } from '@nestjs/common';
import { HealthController } from './health.controller.js';
import { PrismaService } from './prisma.service.js';
import { JwksController } from './keys/jwks.controller.js';
import { KeysService } from './keys/keys.service.js';
import { AuthController } from './auth/auth.controller.js';
import { AuthService } from './auth/auth.service.js';
import { TokensService } from './auth/tokens.service.js';

@Module({
  controllers: [HealthController, JwksController, AuthController],
  providers: [PrismaService, KeysService, TokensService, AuthService],
})
export class AppModule {}
