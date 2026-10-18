import { Controller, Get, UseGuards } from '@nestjs/common';
import { InternalKeyGuard, Public } from '@app/common';
import type { EscaleSchool } from '@app/common';
import { PrismaService } from '../prisma.service.js';

// Catálogo de IEs con su UGEL y DRE para los agregados de ms-escale. Sin datos personales.
@Public()
@UseGuards(InternalKeyGuard)
@Controller('internal/escale')
export class EscaleContextController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('schools')
  async schools(): Promise<EscaleSchool[]> {
    const schools = await this.prisma.school.findMany({
      include: { ugel: { include: { dre: true } } },
      orderBy: { modularCode: 'asc' },
    });
    return schools.map((s) => ({
      id: s.id,
      modularCode: s.modularCode,
      name: s.name,
      ugel: { id: s.ugel.id, code: s.ugel.code, name: s.ugel.name },
      dre: { id: s.ugel.dre.id, code: s.ugel.dre.code, name: s.ugel.dre.name },
    }));
  }
}
