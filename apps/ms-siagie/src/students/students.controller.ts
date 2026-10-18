import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { CurrentUser, dateOnly, Roles } from '@app/common';
import type { AuthUser } from '@app/common';
import { SchoolAccessService } from '../school-access.service.js';
import { calculateAttendanceRate } from '../grades/period-grade.js';
import { PrismaService } from '../prisma.service.js';
import { CreateStudentDto } from './students.dto.js';

@Controller('students')
export class StudentsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: SchoolAccessService,
  ) {}

  // El estudiante aún no pertenece a una IE: el alcance se controla al matricularlo.
  @Post()
  @Roles('DIRECTOR', 'SECRETARY')
  create(@Body() dto: CreateStudentDto) {
    const { guardians, birthDate, ...student } = dto;
    return this.prisma.$transaction(async (tx) => {
      const created = await tx.student.create({
        data: { ...student, birthDate: dateOnly(birthDate) },
      });
      for (const g of guardians) {
        const { relationship, isPrimary, receivesAlerts, ...guardian } = g;
        // Un apoderado ya registrado (quizá por otra IE) solo se vincula: no se cambian su teléfono ni su consentimiento.
        const saved =
          (await tx.guardian.findUnique({
            where: {
              documentType_documentNumber: {
                documentType: g.documentType,
                documentNumber: g.documentNumber,
              },
            },
          })) ??
          (await tx.guardian.create({
            data: {
              ...guardian,
              optInAt: guardian.whatsappOptIn ? new Date() : null,
            },
          }));
        await tx.studentGuardian.create({
          data: {
            studentId: created.id,
            guardianId: saved.id,
            relationship,
            isPrimary,
            receivesAlerts,
          },
        });
      }
      return created;
    });
  }

  // Ver la ficha de un menor queda registrado en audit_logs.
  @Get(':id/summary')
  async summary(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const enrollment = await this.access.assertStudent(user, id);
    await this.access.assertSectionReader(user, enrollment.section);
    const [student, attendance, periodGrades] = await Promise.all([
      this.prisma.student.findUniqueOrThrow({ where: { id } }),
      this.prisma.attendanceRecord.groupBy({
        by: ['status'],
        where: { enrollmentId: enrollment.id, classSessionId: null },
        _count: { _all: true },
      }),
      this.prisma.periodGrade.findMany({
        where: { enrollmentId: enrollment.id },
        include: { competency: true, period: true },
        orderBy: [
          { period: { number: 'asc' } },
          { competency: { code: 'asc' } },
        ],
      }),
    ]);
    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'VIEW_STUDENT',
        entity: 'student',
        entityId: id,
      },
    });
    const count = (status: string) =>
      attendance.find((a) => a.status === status)?._count._all ?? 0;
    const statuses = attendance.flatMap((a) =>
      Array<typeof a.status>(a._count._all).fill(a.status),
    );
    const { section: _section, ...enrollmentData } = enrollment;
    return {
      student,
      enrollment: enrollmentData,
      attendance: {
        present: count('PRESENT'),
        absent: count('ABSENT'),
        late: count('LATE'),
        justified: count('JUSTIFIED'),
        rate: calculateAttendanceRate(statuses),
      },
      periodGrades: periodGrades.map((g) => ({
        competencyCode: g.competency.code,
        periodNumber: g.period.number,
        value: g.value,
      })),
    };
  }
}
