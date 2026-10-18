import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { pgConnectionFromUrl, requireEnv } from '@app/common';
import { PrismaClient } from './generated/prisma/client.js';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const { connectionString, schema } = pgConnectionFromUrl(
      requireEnv('ALERTA_DATABASE_URL'),
    );
    super({ adapter: new PrismaPg({ connectionString }, { schema }) });
  }
  async onModuleInit() {
    await this.$connect();
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
