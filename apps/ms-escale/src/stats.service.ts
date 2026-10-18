import { Injectable, Logger } from '@nestjs/common';
import { dateOnly } from '@app/common';
import type { EscaleSchool } from '@app/common';
import { SourcesClient } from './clients.js';
import { PrismaService } from './prisma.service.js';

const round4 = (n: number) => Math.round(n * 10000) / 10000;

// Lunes a viernes. Los feriados aún no se descuentan.
export function isSchoolDay(date: string): boolean {
  const day = dateOnly(date).getUTCDay();
  return day !== 0 && day !== 6;
}

@Injectable()
export class StatsService {
  private readonly logger = new Logger(StatsService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly sources: SourcesClient,
  ) {}

  async compute(date: string) {
    if (!isSchoolDay(date))
      return { date, skipped: true, schools: 0, computed: 0, failed: 0 };
    const schools = await this.sources.schools();
    let computed = 0;
    let failed = 0;
    for (const school of schools) {
      try {
        await this.computeSchool(school, date);
        computed++;
      } catch {
        // Sin detalles: la URL o el cuerpo podrían incluir datos de conexión.
        failed++;
      }
    }
    if (failed) this.logger.warn(`Agregado diario incompleto: ${failed} IE`);
    if (computed) await this.computeUgelMonth(date.slice(0, 7), schools);
    return { date, skipped: false, schools: schools.length, computed, failed };
  }

  // present = PRESENT + LEFT_EARLY y absent = ABSENT + JUSTIFIED: así la tasa coincide con la de SIAGIE.
  private async computeSchool(school: EscaleSchool, date: string) {
    // allSettled: si una fuente falla, no se deja la otra petición colgando.
    const [reportResult, alertsResult] = await Promise.allSettled([
      this.sources.schoolReport(school.id, date),
      this.sources.alerts(school.id, date),
    ]);
    if (reportResult.status === 'rejected') throw reportResult.reason;
    if (alertsResult.status === 'rejected') throw alertsResult.reason;
    const report = reportResult.value;
    const alerts = alertsResult.value;
    const a = report.attendance;
    const data = {
      ugelId: school.ugel.id,
      dreId: school.dre.id,
      enrolled: report.activeEnrollments,
      present: a.present + a.leftEarly,
      late: a.late,
      absent: a.absent + a.justified,
      sectionsTotal: report.sectionsTotal,
      sectionsReported: report.reportedSectionDays,
      openCases: alerts.currentlyOpenCases,
      contactedCases: alerts.currentlyContactedOpenCases,
    };
    await this.prisma.schoolDailyStat.upsert({
      where: { schoolId_date: { schoolId: school.id, date: dateOnly(date) } },
      create: { schoolId: school.id, date: dateOnly(date), ...data },
      update: data,
    });
  }

  private async computeUgelMonth(month: string, schools: EscaleSchool[]) {
    const start = dateOnly(`${month}-01`);
    const end = new Date(start);
    end.setUTCMonth(end.getUTCMonth() + 1);
    const stats = await this.prisma.schoolDailyStat.findMany({
      where: { date: { gte: start, lt: end } },
    });
    const ugels = new Map(schools.map((s) => [s.ugel.id, s]));
    const definitions = await this.prisma.indicatorDefinition.findMany({
      where: {
        code: {
          in: [
            'ATTENDANCE_RATE',
            'SILENT_SECTIONS_RATE',
            'CASES_CONTACTED_RATE',
          ],
        },
      },
    });
    const idOf = new Map(definitions.map((d) => [d.code, d.id]));
    const values = [];
    for (const [ugelId, school] of ugels) {
      const rows = stats.filter((s) => s.ugelId === ugelId);
      if (!rows.length) continue;
      const sum = (f: (r: (typeof rows)[number]) => number, list = rows) =>
        list.reduce((n, r) => n + f(r), 0);
      const lastDay = Math.max(...rows.map((r) => r.date.getTime()));
      const latest = rows.filter((r) => r.date.getTime() === lastDay);
      const attended = sum((r) => r.present + r.late);
      const ratios: [string, number, number][] = [
        ['ATTENDANCE_RATE', attended, attended + sum((r) => r.absent)],
        [
          'SILENT_SECTIONS_RATE',
          sum((r) => r.sectionsTotal - r.sectionsReported),
          sum((r) => r.sectionsTotal),
        ],
        [
          'CASES_CONTACTED_RATE',
          sum((r) => r.contactedCases, latest),
          sum((r) => r.openCases, latest),
        ],
      ];
      for (const [code, numerator, denominator] of ratios) {
        if (!denominator) continue;
        values.push({
          indicatorId: idOf.get(code)!,
          geoLevel: 'UGEL' as const,
          geoCode: school.ugel.code,
          geoName: school.ugel.name,
          periodLabel: month,
          value: round4((100 * numerator) / denominator),
          numerator,
          denominator,
          ugelId,
          dreId: school.dre.id,
        });
      }
    }
    await this.prisma.$transaction([
      this.prisma.indicatorValue.deleteMany({
        where: {
          indicatorId: { in: [...idOf.values()] },
          geoLevel: 'UGEL',
          periodLabel: month,
        },
      }),
      this.prisma.indicatorValue.createMany({ data: values }),
    ]);
  }
}
