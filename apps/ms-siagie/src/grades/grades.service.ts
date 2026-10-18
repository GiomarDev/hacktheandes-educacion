import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { todayInLima } from '@app/common';
import type { AuthUser } from '@app/common';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma.service.js';
import { SchoolAccessService } from '../school-access.service.js';
import { GradeEntryDto } from './grades.dto.js';
import {
  CALCULATION_METHOD,
  calculateAttendanceRate,
  calculatePeriodGrade,
} from './period-grade.js';

@Injectable()
export class GradesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: SchoolAccessService,
  ) {}

  async recordEntry(user: AuthUser, dto: GradeEntryDto) {
    const enrollment = await this.access.assertEnrollment(
      user,
      dto.enrollmentId,
      ['TEACHER', 'TUTOR'],
    );
    const competency = await this.prisma.competency.findUnique({
      where: { id: dto.competencyId },
    });
    if (!competency) throw new NotFoundException('Competencia no encontrada');
    const period = await this.prisma.academicPeriod.findUnique({
      where: { id: dto.periodId },
    });
    if (
      !period ||
      period.schoolId !== enrollment.section.schoolId ||
      period.year !== enrollment.year
    ) {
      throw new BadRequestException(
        'El periodo no corresponde a la IE y al año de la matrícula',
      );
    }
    if (enrollment.status !== 'ENROLLED')
      throw new BadRequestException('La matrícula no está vigente');

    // Solo pone notas quien dicta el área en esa sección.
    const assignment = await this.prisma.teachingAssignment.findFirst({
      where: {
        sectionId: enrollment.sectionId,
        areaId: competency.areaId,
        teacherUserId: user.id,
      },
    });
    if (!assignment)
      throw new ForbiddenException('No dicta esta área en la sección');

    const key = {
      enrollmentId: dto.enrollmentId,
      competencyId: dto.competencyId,
      periodId: dto.periodId,
      columnNumber: dto.columnNumber,
    };
    const data = {
      value: dto.value,
      isCompensatory: dto.isCompensatory ?? false,
      recordedByUserId: user.id,
    };
    return this.prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`${dto.enrollmentId}:${dto.competencyId}:${dto.periodId}`}))`;
        const entry = await tx.gradeEntry.upsert({
          where: { enrollmentId_competencyId_periodId_columnNumber: key },
          create: { ...key, ...data },
          update: data,
        });
        const periodGrade = await this.recalculate(
          tx,
          dto.enrollmentId,
          dto.competencyId,
          period,
        );
        await tx.outboxEvent.create({
          data: {
            type: 'GRADE_RECORDED',
            resourceId: periodGrade.id,
            date: todayInLima(),
          },
        });
        return { entry, periodGrade };
      },
      { timeout: 15000 },
    );
  }

  private async recalculate(
    tx: Prisma.TransactionClient,
    enrollmentId: string,
    competencyId: string,
    period: { id: string; startDate: Date; endDate: Date },
  ) {
    const entries = await tx.gradeEntry.findMany({
      where: { enrollmentId, competencyId, periodId: period.id },
      select: { columnNumber: true, value: true },
    });
    const attendance = await tx.attendanceRecord.findMany({
      where: {
        enrollmentId,
        classSessionId: null,
        date: { gte: period.startDate, lte: period.endDate },
      },
      select: { status: true },
    });
    const data = {
      value: calculatePeriodGrade(entries),
      calculationMethod: CALCULATION_METHOD,
      attendanceRate: calculateAttendanceRate(attendance.map((a) => a.status)),
      calculatedAt: new Date(),
    };
    return tx.periodGrade.upsert({
      where: {
        enrollmentId_competencyId_periodId: {
          enrollmentId,
          competencyId,
          periodId: period.id,
        },
      },
      create: { enrollmentId, competencyId, periodId: period.id, ...data },
      update: data,
    });
  }
}
