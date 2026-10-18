import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { DEFAULT_RULES } from './risk-rules.js';

@Injectable()
export class RulesService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}
  async onModuleInit() {
    await this.prisma.riskRule.createMany({
      data: DEFAULT_RULES.map((r) => ({ ...r, params: { ...r.params } })),
      skipDuplicates: true,
    });
  }
}
