import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { AuthUser } from '@app/common';
import { SourcesClient } from './clients.js';
import { PrismaService } from './prisma.service.js';
import { ScopeService } from './scope.service.js';
import { authority, schoolRole } from './policy.js';
import { CreateVisitDto, ListQuery, UpdateVisitDto } from './api.dto.js';
@Injectable()
export class VisitsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sources: SourcesClient,
    private readonly scope: ScopeService,
  ) {}
  async list(user: AuthUser, q: ListQuery) {
    if (q.schoolId) await this.scope.school(user, q.schoolId);
    const visits = await this.prisma.monitoringVisit.findMany({
      where: {
        ...(await this.scope.filter(user)),
        ...(q.schoolId ? { schoolId: q.schoolId } : {}),
        ...(q.year
          ? {
              visitedAt: {
                gte: new Date(`${q.year}-01-01T00:00:00-05:00`),
                lt: new Date(`${q.year + 1}-01-01T00:00:00-05:00`),
              },
            }
          : {}),
      },
      take: q.limit,
      skip: q.offset,
      orderBy: [{ visitedAt: 'desc' }, { id: 'asc' }],
    });
    const visible = [];
    for (const visit of visits) {
      const school = await this.sources.school(visit.schoolId);
      if (
        authority(user, school) ||
        visit.observerUserId === user.id ||
        (visit.observedTeacherUserId === user.id &&
          schoolRole(user, visit.schoolId, ['TUTOR', 'TEACHER']))
      )
        visible.push(visit);
    }
    return visible;
  }
  async detail(user: AuthUser, id: string) {
    const visit = await this.prisma.monitoringVisit.findUnique({
      where: { id },
    });
    if (!visit) throw new NotFoundException('Visita no encontrada');
    const school = await this.scope.school(user, visit.schoolId);
    if (
      !authority(user, school) &&
      visit.observerUserId !== user.id &&
      !(
        visit.observedTeacherUserId === user.id &&
        schoolRole(user, visit.schoolId, ['TUTOR', 'TEACHER'])
      )
    )
      throw new ForbiddenException('Sin acceso a esta visita');
    return visit;
  }
  async create(user: AuthUser, dto: CreateVisitDto) {
    const school = await this.scope.school(user, dto.schoolId);
    if (!authority(user, school))
      throw new ForbiddenException(
        'La visita corresponde a dirección o supervisión territorial',
      );
    const section = await this.sources.section(dto.sectionId);
    if (section.schoolId !== dto.schoolId)
      throw new BadRequestException('Sección de otra IE');
    const date = new Date(dto.visitedAt);
    const year = Number(
      new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Lima',
        year: 'numeric',
      }).format(date),
    );
    if (section.year !== year)
      throw new BadRequestException(
        'La visita debe corresponder al año de la sección',
      );
    if (
      section.tutorUserId !== dto.observedTeacherUserId &&
      !section.teacherUserIds.includes(dto.observedTeacherUserId)
    )
      throw new UnprocessableEntityException(
        'El docente no está asignado a la sección',
      );
    return this.prisma.$transaction(async (tx) => {
      const visit = await tx.monitoringVisit.create({
        data: { ...dto, observerUserId: user.id, visitedAt: date },
      });
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'VISIT_SCHEDULED',
          entityId: visit.id,
        },
      });
      return visit;
    });
  }
  async update(user: AuthUser, id: string, dto: UpdateVisitDto) {
    const original = await this.detail(user, id);
    if (original.observerUserId !== user.id)
      throw new ForbiddenException(
        'Solo el observador original registra la visita',
      );
    return this.prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${id}))`;
        const current = await tx.monitoringVisit.findUniqueOrThrow({
          where: { id },
        });
        if (current.visitedAt > new Date())
          throw new BadRequestException('La visita aún no ha ocurrido');
        if (
          dto.status === 'DONE'
            ? current.status !== 'SCHEDULED'
            : current.status !== 'DONE'
        )
          throw new ConflictException('Transición de visita inválida');
        if (
          dto.status === 'DONE' &&
          (dto.feedback !== undefined ||
            dto.improvementCommitment !== undefined)
        )
          throw new BadRequestException(
            'Registre la devolución después de completar la visita',
          );
        if (dto.status === 'FEEDBACK_GIVEN' && dto.observations !== undefined)
          throw new BadRequestException(
            'Las observaciones de la visita ya se registraron',
          );
        const updated = await tx.monitoringVisit.update({
          where: { id },
          data: dto,
        });
        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: 'VISIT_STATUS_CHANGED',
            entityId: id,
            metadata: { from: current.status, to: dto.status },
          },
        });
        return updated;
      },
      { timeout: 15000 },
    );
  }
}
