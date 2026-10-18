import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { IsDateString, IsOptional, Matches } from 'class-validator';
import { dateOnly, InternalKeyGuard, Public } from '@app/common';
import type { EscaleSchool } from '@app/common';
import { PrismaService } from '../prisma.service.js';

class EscaleSchoolsQuery {
  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date?: string;
}

// Catálogo de IEs con su UGEL y DRE para los agregados de ms-escale. Sin datos personales.
@Public()
@UseGuards(InternalKeyGuard)
@Controller('internal/escale')
export class EscaleContextController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('schools')
  async schools(@Query() q: EscaleSchoolsQuery): Promise<EscaleSchool[]> {
    const day = q.date ? dateOnly(q.date) : undefined;
    const schools = await this.prisma.school.findMany({
      include: {
        ugel: { include: { dre: true } },
        // Con fecha: ¿cae dentro de algún periodo académico de la IE?
        periods: {
          where: day
            ? { startDate: { lte: day }, endDate: { gte: day } }
            : { id: { in: [] } },
          select: { id: true },
          take: 1,
        },
      },
      orderBy: { modularCode: 'asc' },
    });
    return schools.map((s) => ({
      id: s.id,
      modularCode: s.modularCode,
      name: s.name,
      ugel: { id: s.ugel.id, code: s.ugel.code, name: s.ugel.name },
      dre: { id: s.ugel.dre.id, code: s.ugel.dre.code, name: s.ugel.dre.name },
      ...(day ? { inSession: s.periods.length > 0 } : {}),
    }));
  }
}
