import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { dateOnly, InternalKeyGuard, Public, todayInLima } from '@app/common';
import type { RiskSection } from '@app/common';
import { IsDateString, IsOptional, IsUUID, Matches } from 'class-validator';
import { PrismaService } from '../prisma.service.js';

class RiskQuery {
  @IsDateString({ strict: true }) @Matches(/^\d{4}-\d{2}-\d{2}$/) date: string;
}
class ContactQuery {
  @IsUUID() schoolId: string;
}
class SchoolQuery {
  @IsOptional() @IsUUID() ugelId?: string;
  @IsOptional() @IsUUID() dreId?: string;
}

@Public()
@UseGuards(InternalKeyGuard)
@Controller('internal')
export class RiskContextController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('schools')
  schools(@Query() query: SchoolQuery) {
    return this.prisma.school.findMany({
      where: { ugelId: query.ugelId, ugel: { dreId: query.dreId } },
      select: { id: true },
    });
  }

  @Get('risk/sections')
  all(@Query() query: RiskQuery) {
    return this.sections(query.date);
  }

  @Get('risk/sections/:id')
  async section(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: RiskQuery,
  ) {
    const sections = await this.sections(query.date, id);
    if (!sections.length)
      throw new NotFoundException('Sección no encontrada para ese año');
    return sections;
  }

  @Get('risk/grades/:id')
  async grade(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: RiskQuery,
  ) {
    const grade = await this.prisma.periodGrade.findUnique({
      where: { id },
      include: { enrollment: true },
    });
    if (!grade) throw new NotFoundException('Nota no encontrada');
    return this.sections(query.date, grade.enrollment.sectionId);
  }

  @Get('risk/access/:id')
  async access(@Param('id', ParseUUIDPipe) id: string) {
    const event = await this.prisma.accessEvent.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Acceso no encontrado');
    return {
      id: event.id,
      schoolId: event.schoolId,
      studentId: event.studentId,
      type: event.type,
      occurredAt: event.occurredAt,
    };
  }

  @Get('students/:id/contact-context')
  async contact(
    @Param('id', ParseUUIDPipe) studentId: string,
    @Query() query: ContactQuery,
  ) {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        studentId,
        year: Number(todayInLima().slice(0, 4)),
        status: 'ENROLLED',
        section: { schoolId: query.schoolId },
      },
      include: {
        section: { include: { school: { include: { ugel: true } } } },
        student: { include: { guardians: { include: { guardian: true } } } },
      },
    });
    if (!enrollment)
      throw new NotFoundException('Matrícula vigente no encontrada en esta IE');
    const { section } = enrollment;
    return {
      sectionId: section.id,
      tutorUserId: section.tutorUserId,
      auxiliarUserId: section.auxiliarUserId,
      school: {
        id: section.schoolId,
        ugelId: section.school.ugelId,
        dreId: section.school.ugel.dreId,
        hasPsychologist: section.school.hasPsychologist,
        attentionGoal: section.school.attentionGoal,
      },
      guardians: enrollment.student.guardians.map(
        ({ guardian, receivesAlerts }) => ({
          id: guardian.id,
          preferredChannel: guardian.preferredChannel,
          whatsappOptIn: guardian.whatsappOptIn,
          receivesAlerts,
        }),
      ),
    };
  }

  private async sections(date: string, id?: string): Promise<RiskSection[]> {
    const end = dateOnly(date);
    if (!Number.isFinite(end.getTime()))
      throw new NotFoundException('Fecha no válida');
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - 90);
    const sections = await this.prisma.section.findMany({
      where: { id, year: Number(date.slice(0, 4)) },
      include: {
        school: { include: { ugel: true } },
        enrollments: {
          where: { status: 'ENROLLED' },
          include: {
            attendanceRecords: {
              where: { date: { gte: start, lte: end } },
              orderBy: { date: 'asc' },
            },
            periodGrades: true,
            student: {
              select: {
                accessEvents: {
                  where: {
                    type: 'EXIT',
                    occurredAt: {
                      gte: start,
                      lt: new Date(end.getTime() + 2 * 86400000),
                    },
                  },
                  select: { occurredAt: true, schoolId: true },
                },
              },
            },
          },
        },
      },
    });
    return sections.map((s) => ({
      id: s.id,
      year: s.year,
      tutorUserId: s.tutorUserId,
      auxiliarUserId: s.auxiliarUserId,
      school: {
        id: s.schoolId,
        ugelId: s.school.ugelId,
        dreId: s.school.ugel.dreId,
        attentionGoal: s.school.attentionGoal,
        hasPsychologist: s.school.hasPsychologist,
      },
      students: s.enrollments.map((e) => ({
        studentId: e.studentId,
        enrollmentId: e.id,
        attendance: e.attendanceRecords.map((r) => ({
          date: r.date.toISOString().slice(0, 10),
          status: r.status,
          classSessionId: r.classSessionId,
        })),
        grades: e.periodGrades.map((g) => ({
          id: g.id,
          value: g.value,
          attendanceRate: Number(g.attendanceRate),
          periodId: g.periodId,
        })),
        exits: e.student.accessEvents
          .filter((a) => a.schoolId === s.schoolId)
          .map((a) =>
            new Intl.DateTimeFormat('en-CA', {
              timeZone: 'America/Lima',
            }).format(a.occurredAt),
          ),
      })),
    }));
  }
}
