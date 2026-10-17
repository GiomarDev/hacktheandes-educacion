import { BadRequestException, Injectable } from '@nestjs/common';
import { dateOnly, todayInLima } from '@app/common';
import type { AuthUser } from '@app/common';
import { PrismaService } from '../prisma.service.js';
import { SchoolAccessService } from '../school-access.service.js';
import { BulkAttendanceDto, CreateClassSessionDto } from './attendance.dto.js';

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: SchoolAccessService,
  ) {}

  async createClassSession(user: AuthUser, dto: CreateClassSessionDto) {
    await this.access.assertSection(user, dto.sectionId, ['TEACHER', 'TUTOR', 'AUXILIAR']);
    this.assertNotFuture(dto.date);
    return this.prisma.classSession.create({
      data: { ...dto, date: dateOnly(dto.date), teacherUserId: user.id },
    });
  }

  // Se valida todo antes de escribir: o se guarda la lista completa o nada.
  async bulk(user: AuthUser, dto: BulkAttendanceDto): Promise<{ saved: number }> {
    await this.access.assertSection(user, dto.sectionId, ['TUTOR', 'TEACHER', 'AUXILIAR', 'DIRECTOR']);
    this.assertNotFuture(dto.date);
    const date = dateOnly(dto.date);

    if (dto.classSessionId) {
      const session = await this.prisma.classSession.findUnique({ where: { id: dto.classSessionId } });
      if (!session || session.sectionId !== dto.sectionId || session.date.getTime() !== date.getTime()) {
        throw new BadRequestException('La hora de clase no corresponde a esta sección y fecha');
      }
    }

    const ids = [...new Set(dto.records.map((r) => r.enrollmentId))];
    if (ids.length !== dto.records.length) throw new BadRequestException('Hay matrículas repetidas en la lista');
    const valid = await this.prisma.enrollment.findMany({
      where: { id: { in: ids }, sectionId: dto.sectionId, status: 'ENROLLED' },
      select: { id: true },
    });
    const validIds = new Set(valid.map((e) => e.id));
    const invalidEnrollmentIds = ids.filter((id) => !validIds.has(id));
    if (invalidEnrollmentIds.length) {
      throw new BadRequestException({
        message: 'Hay matrículas que no son de esta sección o no están vigentes',
        invalidEnrollmentIds,
      });
    }

    // Pocas consultas aunque la lista sea larga: una lectura, un createMany y un updateMany por estado.
    // La unique NULLS NOT DISTINCT de la tabla impide duplicados aun con peticiones simultáneas.
    const classSessionId = dto.classSessionId ?? null;
    const recordedAt = new Date();
    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.attendanceRecord.findMany({
        where: { enrollmentId: { in: ids }, date, classSessionId },
        select: { id: true, enrollmentId: true },
      });
      const existingId = new Map(existing.map((e) => [e.enrollmentId, e.id]));
      const toCreate = dto.records.filter((r) => !existingId.has(r.enrollmentId));
      if (toCreate.length) {
        await tx.attendanceRecord.createMany({
          data: toCreate.map((r) => ({
            enrollmentId: r.enrollmentId,
            date,
            classSessionId,
            status: r.status,
            justification: r.justification ?? null,
            source: 'MANUAL' as const,
            recordedByUserId: user.id,
            recordedAt,
          })),
        });
      }
      const groups = new Map<string, { status: (typeof dto.records)[number]['status']; justification: string | null; ids: string[] }>();
      for (const r of dto.records) {
        const id = existingId.get(r.enrollmentId);
        if (!id) continue;
        const justification = r.justification ?? null;
        const key = `${r.status}|${justification ?? ''}`;
        const group = groups.get(key) ?? { status: r.status, justification, ids: [] };
        group.ids.push(id);
        groups.set(key, group);
      }
      for (const g of groups.values()) {
        await tx.attendanceRecord.updateMany({
          where: { id: { in: g.ids } },
          data: { status: g.status, justification: g.justification, source: 'MANUAL', recordedByUserId: user.id, recordedAt },
        });
      }
    }, { timeout: 15000 });
    return { saved: dto.records.length };
  }

  private assertNotFuture(isoDate: string): void {
    if (isoDate > todayInLima()) throw new BadRequestException('No se puede registrar asistencia de una fecha futura');
  }
}
