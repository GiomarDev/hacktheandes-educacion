import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  InternalKeyGuard,
  Public,
  SchoolYearQuery,
  SchoolReportQuery,
  reportingRange,
} from '@app/common';
import type { SchoolReportSnapshot } from '@app/common';
import { PrismaService } from '../prisma.service.js';

@Public()
@UseGuards(InternalKeyGuard)
@Controller('internal/simon')
export class SimonContextController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('students/:id')
  async student(
    @Param('id', ParseUUIDPipe) studentId: string,
    @Query() q: SchoolYearQuery,
  ) {
    const e = await this.prisma.enrollment.findUnique({
      where: { studentId_year: { studentId, year: q.year } },
      include: { section: { include: { teachingAssignments: true } } },
    });
    if (!e || e.section.schoolId !== q.schoolId)
      throw new NotFoundException('Matrícula no encontrada en esta IE y año');
    return {
      studentId,
      schoolId: q.schoolId,
      year: e.year,
      enrollmentId: e.id,
      status: e.status,
      sectionId: e.sectionId,
      tutorUserId: e.section.tutorUserId,
      teacherUserIds: e.section.teachingAssignments.map((a) => a.teacherUserId),
    };
  }
  @Get('periods/:id')
  async period(@Param('id', ParseUUIDPipe) id: string) {
    const p = await this.prisma.academicPeriod.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Periodo no encontrado');
    return {
      id: p.id,
      schoolId: p.schoolId,
      year: p.year,
      type: p.type,
      number: p.number,
      startDate: p.startDate.toISOString().slice(0, 10),
      endDate: p.endDate.toISOString().slice(0, 10),
    };
  }
  @Get('sections/:id')
  async section(@Param('id', ParseUUIDPipe) id: string) {
    const s = await this.prisma.section.findUnique({
      where: { id },
      include: { teachingAssignments: true },
    });
    if (!s) throw new NotFoundException('Sección no encontrada');
    return {
      id: s.id,
      schoolId: s.schoolId,
      year: s.year,
      tutorUserId: s.tutorUserId,
      teacherUserIds: s.teachingAssignments.map((a) => a.teacherUserId),
    };
  }
  @Get('reports')
  async report(@Query() q: SchoolReportQuery): Promise<SchoolReportSnapshot> {
    const range = reportingRange(q.from, q.to);
    if (Number(q.from.slice(0, 4)) !== q.year)
      throw new BadRequestException(
        'El rango debe pertenecer al año solicitado',
      );
    const school = await this.prisma.school.findUnique({
      where: { id: q.schoolId },
    });
    if (!school) throw new NotFoundException('IE no encontrada');
    if (q.periodId) {
      const period = await this.period(q.periodId);
      if (
        period.schoolId !== q.schoolId ||
        period.year !== q.year ||
        q.from < period.startDate ||
        q.to > period.endDate
      )
        throw new BadRequestException('Periodo incompatible');
    }
    const [enrollments, records, grades, sectionsTotal] = await Promise.all([
      this.prisma.enrollment.findMany({
        where: { year: q.year, section: { schoolId: q.schoolId } },
        select: { status: true, statusChangedAt: true, statusReason: true },
      }),
      this.prisma.attendanceRecord.findMany({
        where: {
          classSessionId: null,
          date: range.dates,
          enrollment: { year: q.year, section: { schoolId: q.schoolId } },
        },
        select: {
          status: true,
          date: true,
          enrollment: { select: { sectionId: true } },
        },
      }),
      this.prisma.periodGrade.findMany({
        where: {
          enrollment: { year: q.year, section: { schoolId: q.schoolId } },
          period: {
            ...(q.periodId ? { id: q.periodId } : {}),
            startDate: { lte: range.dates.lte },
            endDate: { gte: range.dates.gte },
          },
        },
        select: { value: true },
      }),
      this.prisma.section.count({
        where: { schoolId: q.schoolId, year: q.year },
      }),
    ]);
    const count = (status: string) =>
      records.filter((r) => r.status === status).length;
    const attended = count('PRESENT') + count('LATE') + count('LEFT_EARLY');
    const exits = enrollments.filter(
      (e) =>
        e.status !== 'ENROLLED' &&
        e.statusChangedAt &&
        e.statusChangedAt >= range.timestamps.gte &&
        e.statusChangedAt < range.timestamps.lt,
    );
    const distribution = (values: string[]) =>
      values.reduce<Record<string, number>>((out, v) => {
        out[v] = (out[v] ?? 0) + 1;
        return out;
      }, {});
    return {
      schoolId: q.schoolId,
      from: q.from,
      to: q.to,
      snapshotAt: new Date().toISOString(),
      totalEnrollments: enrollments.length,
      activeEnrollments: enrollments.filter((e) => e.status === 'ENROLLED')
        .length,
      attentionGoal: school.attentionGoal,
      sectionsTotal,
      reportedSectionDays: new Set(
        records.map((r) => `${r.enrollment.sectionId}:${r.date.toISOString()}`),
      ).size,
      attendance: {
        present: count('PRESENT'),
        absent: count('ABSENT'),
        late: count('LATE'),
        justified: count('JUSTIFIED'),
        leftEarly: count('LEFT_EARLY'),
        observedEnrollmentDays: records.length,
        attendedEnrollmentDays: attended,
        rate: records.length
          ? Math.round((10000 * attended) / records.length) / 100
          : 0,
      },
      exits: distribution(exits.map((e) => e.status)),
      exitsWithReason: exits.filter((e) => e.statusReason?.trim()).length,
      exitsWithoutReason: exits.filter((e) => !e.statusReason?.trim()).length,
      grades: distribution(grades.flatMap((g) => (g.value ? [g.value] : []))),
    };
  }
}
