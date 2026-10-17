import { Module } from '@nestjs/common';
import { HealthController } from './health.controller.js';
import { PrismaService } from './prisma.service.js';
import { JwksController } from './keys/jwks.controller.js';
import { KeysService } from './keys/keys.service.js';

@Module({
  controllers: [HealthController, JwksController],
  providers: [PrismaService, KeysService],
})
export class AppModule {}
