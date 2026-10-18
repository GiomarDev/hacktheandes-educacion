import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUser, dateOnly, todayInLima } from '@app/common';
import type { AuthUser } from '@app/common';
import { PrismaService } from '../prisma.service.js';
import { SchoolAccessService } from '../school-access.service.js';
import {
  CreateEnrollmentDto,
  UpdateEnrollmentStatusDto,
} from './enrollments.dto.js';

const MANAGERS = ['DIRECTOR', 'SECRETARY'] as const;

@Controller('enrollments')
export class EnrollmentsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: SchoolAccessService,
  ) {}

  @Post()
  async create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateEnrollmentDto,
  ) {
    const section = await this.access.assertSection(user, dto.sectionId, [
      ...MANAGERS,
    ]);
    if (
      !(await this.prisma.student.findUnique({ where: { id: dto.studentId } }))
    ) {
      throw new NotFoundException('Estudiante no encontrado');
    }
    // Sin traslado registrado, un estudiante con matrícula vigente en otra IE no se puede matricular aquí.
    const active = await this.prisma.enrollment.findFirst({
      where: {
        studentId: dto.studentId,
        status: 'ENROLLED',
        section: { schoolId: { not: section.schoolId } },
      },
    });
    if (active)
      throw new ConflictException(
        'El estudiante tiene matrícula vigente en otra IE; registre primero el traslado',
      );
    return this.prisma.enrollment.create({
      data: {
        studentId: dto.studentId,
        sectionId: section.id,
        year: section.year,
        enrolledAt: dateOnly(dto.enrolledAt),
      },
    });
  }

  // La UGEL pide justificar cada baja: sin motivo no se acepta.
  @Patch(':id/status')
  async updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEnrollmentStatusDto,
  ) {
    const enrollment = await this.access.assertEnrollment(user, id, [
      ...MANAGERS,
    ]);
    if (dto.status !== 'ENROLLED' && !dto.statusReason) {
      throw new BadRequestException(
        'statusReason es obligatorio para dar de baja una matrícula',
      );
    }
    return this.prisma.$transaction(
      async (tx) => {
        if (dto.status === 'ENROLLED') {
          const other = await tx.enrollment.findFirst({
            where: {
              studentId: enrollment.studentId,
              id: { not: id },
              status: 'ENROLLED',
              section: { schoolId: { not: enrollment.section.schoolId } },
            },
          });
          if (other)
            throw new ConflictException(
              'El estudiante tiene matrícula vigente en otra IE; registre primero el traslado',
            );
        }
        const updated = await tx.enrollment.update({
          where: { id },
          data: {
            status: dto.status,
            statusReason: dto.statusReason ?? null,
            statusChangedAt: new Date(),
          },
        });
        // El carné corresponde al año actual: corregir una matrícula histórica no lo revoca.
        if (
          dto.status !== 'ENROLLED' &&
          enrollment.year === Number(todayInLima().slice(0, 4))
        ) {
          await tx.qrCredential.updateMany({
            where: { studentId: enrollment.studentId, revokedAt: null },
            data: { revokedAt: new Date() },
          });
        }
        return updated;
      },
      { timeout: 15000 },
    );
  }
}
