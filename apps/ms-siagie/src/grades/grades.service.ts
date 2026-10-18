import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { canAccessSchool, todayInLima } from '@app/common';
import type { AuthUser } from '@app/common';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma.service.js';
import {
  SCHOOL_WIDE_READERS,
  SchoolAccessService,
} from '../school-access.service.js';
import { GradeEntryDto, GradeSheetQuery } from './grades.dto.js';
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

  // Registro de un área en una sección y periodo: columnas y nota del periodo por estudiante.
  // Lo leen la dirección y autoridades del ámbito, el tutor de la sección y quien dicta el área.
  async sheet(user: AuthUser, query: GradeSheetQuery) {
    const section = await this.access.assertSection(user, query.sectionId);
    const school = {
      id: section.schoolId,
      ugelId: section.school.ugelId,
      dreId: section.school.ugel.dreId,
    };
    const isTutor = user.roles.some(
      (r) =>
        r.role === 'TUTOR' &&
        r.schoolId === section.schoolId &&
        section.tutorUserId === user.id,
    );
    if (!canAccessSchool(user, school, SCHOOL_WIDE_READERS) && !isTutor) {
      const assignment = await this.prisma.teachingAssignment.findFirst({
        where: {
          sectionId: section.id,
          areaId: query.areaId,
          teacherUserId: user.id,
        },
      });
      if (!assignment)
        throw new ForbiddenException('No dicta esta área en la sección');
    }
    const area = await this.prisma.curricularArea.findUnique({
      where: { id: query.areaId },
      include: {
        competencies: {
          select: { id: true, code: true, name: true },
          orderBy: { code: 'asc' },
        },
      },
    });
    if (!area) throw new NotFoundException('Área no encontrada');
    const period = await this.prisma.academicPeriod.findUnique({
      where: { id: query.periodId },
    });
    if (
      !period ||
      period.schoolId !== section.schoolId ||
      period.year !== section.year
    )
      throw new BadRequestException(
        'El periodo no corresponde a la IE y al año de la sección',
      );
    const competencyId = { in: area.competencies.map((c) => c.id) };
    const enrollments = await this.prisma.enrollment.findMany({
      where: { sectionId: section.id, status: 'ENROLLED' },
      select: {
        id: true,
        student: {
          select: {
            id: true,
            firstName: true,
            paternalLastName: true,
            maternalLastName: true,
          },
        },
        gradeEntries: {
          where: { periodId: period.id, competencyId },
          select: {
            competencyId: true,
            columnNumber: true,
            value: true,
            isCompensatory: true,
          },
          orderBy: [{ competencyId: 'asc' }, { columnNumber: 'asc' }],
        },
        periodGrades: {
          where: { periodId: period.id, competencyId },
          select: {
            competencyId: true,
            value: true,
            calculationMethod: true,
            attendanceRate: true,
          },
        },
      },
      orderBy: [
        { student: { paternalLastName: 'asc' } },
        { student: { firstName: 'asc' } },
      ],
    });
    return {
      area: { id: area.id, code: area.code, name: area.name },
      period: {
        id: period.id,
        type: period.type,
        number: period.number,
        year: period.year,
      },
      competencies: area.competencies,
      rows: enrollments.map(({ id, student, gradeEntries, periodGrades }) => ({
        enrollmentId: id,
        student,
        entries: gradeEntries,
        periodGrades: periodGrades.map((g) => ({
          ...g,
          attendanceRate: Number(g.attendanceRate),
        })),
      })),
    };
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
