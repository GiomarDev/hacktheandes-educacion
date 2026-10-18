import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { pgConnectionFromUrl, requireEnv } from '@app/common';
import { PrismaClient } from './generated/prisma/client.js';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const { connectionString, schema } = pgConnectionFromUrl(requireEnv('AUTH_DATABASE_URL'));
    super({ adapter: new PrismaPg({ connectionString }, { schema }) });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
