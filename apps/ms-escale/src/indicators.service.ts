import { Injectable } from '@nestjs/common';
import type { AuthUser } from '@app/common';
import type { Prisma } from './generated/prisma/client.js';
import type { IndicatorQuery } from './api.dto.js';
import { PrismaService } from './prisma.service.js';

const num = (d: Prisma.Decimal | null) => (d === null ? null : Number(d));

@Injectable()
export class IndicatorsService {
  constructor(private readonly prisma: PrismaService) {}

  definitions() {
    return this.prisma.indicatorDefinition.findMany({
      orderBy: { code: 'asc' },
      select: {
        code: true,
        name: true,
        formula: true,
        unit: true,
        source: true,
      },
    });
  }

  async list(user: AuthUser, q: IndicatorQuery) {
    const rows = await this.prisma.indicatorValue.findMany({
      where: {
        ...(q.code ? { indicator: { code: q.code } } : {}),
        geoLevel: q.geo_level,
        geoCode: q.geo_code,
        periodLabel: q.period,
        ...(q.dimension === 'none'
          ? { dimension: null }
          : q.dimension
            ? { dimension: q.dimension }
            : {}),
        AND: [this.scope(user)],
      },
      include: { indicator: true },
      orderBy: [
        { indicator: { code: 'asc' } },
        { geoLevel: 'asc' },
        { geoCode: 'asc' },
        { periodLabel: 'asc' },
        { dimension: 'asc' },
        { dimensionValue: 'asc' },
      ],
      take: 5000,
    });
    return rows.map((r) => ({
      code: r.indicator.code,
      name: r.indicator.name,
      unit: r.indicator.unit,
      source: r.indicator.source,
      geoLevel: r.geoLevel,
      geoCode: r.geoCode,
      geoName: r.geoName,
      periodLabel: r.periodLabel,
      dimension: r.dimension,
      dimensionValue: r.dimensionValue,
      value: Number(r.value),
      numerator: num(r.numerator),
      denominator: num(r.denominator),
      computedAt: r.computedAt,
    }));
  }

  // Los oficiales son datos abiertos; los calculados solo dentro del ámbito UGEL/DRE del usuario.
  private scope(user: AuthUser): Prisma.IndicatorValueWhereInput {
    if (user.roles.some((r) => r.role === 'MINEDU_ADMIN')) return {};
    const ugelIds = user.roles.flatMap((r) =>
      r.role === 'UGEL_SPECIALIST' && r.ugelId ? [r.ugelId] : [],
    );
    const dreIds = user.roles.flatMap((r) =>
      r.role === 'DRE_SPECIALIST' && r.dreId ? [r.dreId] : [],
    );
    return {
      OR: [
        { indicator: { source: 'OFFICIAL' } },
        ...(ugelIds.length ? [{ ugelId: { in: ugelIds } }] : []),
        ...(dreIds.length ? [{ dreId: { in: dreIds } }] : []),
      ],
    };
  }
}
