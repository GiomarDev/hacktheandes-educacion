import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '@app/common';
import { PrismaService } from '../prisma.service.js';
import { SchoolAccessService } from '../school-access.service.js';
import { GradeEntryDto } from './grades.dto.js';
import { CALCULATION_METHOD, calculateAttendanceRate, calculatePeriodGrade } from './period-grade.js';

@Injectable()
export class GradesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: SchoolAccessService,
  ) {}

  async recordEntry(user: AuthUser, dto: GradeEntryDto) {
    const enrollment = await this.access.assertEnrollment(user, dto.enrollmentId, ['TEACHER', 'TUTOR']);
    const competency = await this.prisma.competency.findUnique({ where: { id: dto.competencyId } });
    if (!competency) throw new NotFoundException('Competencia no encontrada');
    const period = await this.prisma.academicPeriod.findUnique({ where: { id: dto.periodId } });
    if (!period || period.schoolId !== enrollment.section.schoolId) throw new BadRequestException('El periodo no es de esta IE');

    // Solo pone notas quien dicta el área en esa sección.
    const assignment = await this.prisma.teachingAssignment.findFirst({
      where: { sectionId: enrollment.sectionId, areaId: competency.areaId, teacherUserId: user.id },
    });
    if (!assignment) throw new ForbiddenException('No dicta esta área en la sección');

    const key = {
      enrollmentId: dto.enrollmentId,
      competencyId: dto.competencyId,
      periodId: dto.periodId,
      columnNumber: dto.columnNumber,
    };
    const data = { value: dto.value, isCompensatory: dto.isCompensatory ?? false, recordedByUserId: user.id };
    const entry = await this.prisma.gradeEntry.upsert({
      where: { enrollmentId_competencyId_periodId_columnNumber: key },
      create: { ...key, ...data },
      update: data,
    });
    const periodGrade = await this.recalculate(dto.enrollmentId, dto.competencyId, period);
    return { entry, periodGrade };
  }

  private async recalculate(enrollmentId: string, competencyId: string, period: { id: string; startDate: Date; endDate: Date }) {
    const entries = await this.prisma.gradeEntry.findMany({
      where: { enrollmentId, competencyId, periodId: period.id },
      select: { columnNumber: true, value: true },
    });
    const attendance = await this.prisma.attendanceRecord.findMany({
      where: { enrollmentId, classSessionId: null, date: { gte: period.startDate, lte: period.endDate } },
      select: { status: true },
    });
    const data = {
      value: calculatePeriodGrade(entries),
      calculationMethod: CALCULATION_METHOD,
      attendanceRate: calculateAttendanceRate(attendance.map((a) => a.status)),
      calculatedAt: new Date(),
    };
    return this.prisma.periodGrade.upsert({
      where: { enrollmentId_competencyId_periodId: { enrollmentId, competencyId, periodId: period.id } },
      create: { enrollmentId, competencyId, periodId: period.id, ...data },
      update: data,
    });
  }
}
