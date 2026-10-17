import { BadRequestException, Body, Controller, NotFoundException, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { CurrentUser, dateOnly } from '@app/common';
import type { AuthUser } from '@app/common';
import { PrismaService } from '../prisma.service.js';
import { SchoolAccessService } from '../school-access.service.js';
import { CreateEnrollmentDto, UpdateEnrollmentStatusDto } from './enrollments.dto.js';

const MANAGERS = ['DIRECTOR', 'SECRETARY'] as const;

@Controller('enrollments')
export class EnrollmentsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: SchoolAccessService,
  ) {}

  @Post()
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateEnrollmentDto) {
    const section = await this.access.assertSection(user, dto.sectionId, [...MANAGERS]);
    if (!(await this.prisma.student.findUnique({ where: { id: dto.studentId } }))) {
      throw new NotFoundException('Estudiante no encontrado');
    }
    return this.prisma.enrollment.create({
      data: { studentId: dto.studentId, sectionId: section.id, year: section.year, enrolledAt: dateOnly(dto.enrolledAt) },
    });
  }

  // La UGEL pide justificar cada baja: sin motivo no se acepta.
  @Patch(':id/status')
  async updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEnrollmentStatusDto,
  ) {
    await this.access.assertEnrollment(user, id, [...MANAGERS]);
    if (dto.status !== 'ENROLLED' && !dto.statusReason) {
      throw new BadRequestException('statusReason es obligatorio para dar de baja una matrícula');
    }
    return this.prisma.enrollment.update({
      where: { id },
      data: { status: dto.status, statusReason: dto.statusReason ?? null, statusChangedAt: new Date() },
    });
  }
}
