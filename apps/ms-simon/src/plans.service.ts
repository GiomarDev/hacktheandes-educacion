import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '@app/common';
import { randomUUID } from 'node:crypto';
import { SourcesClient } from './clients.js';
import { PrismaService } from './prisma.service.js';
import { DiagnosisService } from './diagnosis.service.js';
import { ScopeService } from './scope.service.js';
import {
  assignedTeacher,
  assignedTutor,
  planReader,
  planWriter,
} from './policy.js';
import {
  CreatePlanDto,
  CreateVersionDto,
  ListQuery,
  PlanContentDto,
  VersionContentDto,
} from './api.dto.js';

@Injectable()
export class PlansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sources: SourcesClient,
    private readonly scope: ScopeService,
    private readonly diagnosis: DiagnosisService,
  ) {}
  private async context(
    user: AuthUser,
    plan: { studentId: string; schoolId: string; year: number },
    write = false,
    version = false,
  ) {
    const c = await this.sources.student(
      plan.studentId,
      plan.schoolId,
      plan.year,
    );
    if (
      !(write
        ? planWriter(user, c) || (version && assignedTeacher(user, c))
        : planReader(user, c))
    )
      throw new ForbiddenException('Sin acceso al plan de este estudiante');
    return c;
  }
  private async find(id: string) {
    const plan = await this.prisma.supportPlan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Plan no encontrado');
    return plan;
  }
  async list(user: AuthUser, q: ListQuery) {
    const scoped: AuthUser = {
      ...user,
      roles: user.roles.filter((r) =>
        ['DIRECTOR', 'PSYCHOLOGIST', 'SECRETARY', 'TUTOR', 'TEACHER'].includes(
          r.role,
        ),
      ),
    };
    if (!scoped.roles.length)
      throw new ForbiddenException('Rol sin acceso a planes individuales');
    if (q.schoolId) await this.scope.school(scoped, q.schoolId);
    const plans = await this.prisma.supportPlan.findMany({
      where: {
        ...(await this.scope.filter(scoped)),
        ...(q.schoolId ? { schoolId: q.schoolId } : {}),
        year: q.year,
      },
      omit: { diagnosisEncrypted: true },
      take: q.limit,
      skip: q.offset,
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
    });
    const visible = [];
    for (const plan of plans) {
      const c = await this.sources.student(
        plan.studentId,
        plan.schoolId,
        plan.year,
      );
      if (planReader(user, c)) visible.push(plan);
    }
    return visible;
  }
  async detail(user: AuthUser, id: string) {
    const plan = await this.find(id);
    const c = await this.context(user, plan);
    const { diagnosisEncrypted, ...safe } = plan;
    const versions = await this.prisma.supportPlanVersion.findMany({
      where: { planId: id },
      orderBy: { version: 'asc' },
    });
    if (!planWriter(user, c))
      return { ...safe, tutorUserId: c.tutorUserId, versions };
    const diagnosis =
      diagnosisEncrypted === null
        ? null
        : this.diagnosis.decrypt(diagnosisEncrypted, plan);
    await this.prisma.auditLog.create({
      data: { userId: user.id, action: 'PLAN_DIAGNOSIS_READ', entityId: id },
    });
    return { ...safe, tutorUserId: c.tutorUserId, diagnosis, versions };
  }
  async create(user: AuthUser, dto: CreatePlanDto) {
    const c = await this.context(user, dto, true);
    if (c.status !== 'ENROLLED')
      throw new BadRequestException(
        'El estudiante debe tener matrícula vigente',
      );
    const identity = {
      id: randomUUID(),
      schoolId: dto.schoolId,
      studentId: dto.studentId,
      year: dto.year,
    };
    const plan = await this.prisma.$transaction(async (tx) => {
      const p = await tx.supportPlan.create({
        data: {
          ...identity,
          tutorUserId: c.tutorUserId,
          barriers: dto.barriers,
          strengths: dto.strengths,
          diagnosisEncrypted:
            dto.diagnosis === undefined
              ? null
              : this.diagnosis.encrypt(dto.diagnosis, identity),
        },
        omit: { diagnosisEncrypted: true },
      });
      await tx.auditLog.create({
        data: { userId: user.id, action: 'PLAN_CREATED', entityId: p.id },
      });
      return p;
    });
    return plan;
  }
  async update(user: AuthUser, id: string, dto: PlanContentDto) {
    const original = await this.find(id);
    const c = await this.context(user, original, true);
    return this.prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${id}))`;
        const plan = await tx.supportPlan.findUniqueOrThrow({ where: { id } });
        if (plan.status === 'ARCHIVED')
          throw new ConflictException('El plan está archivado');
        const updated = await tx.supportPlan.update({
          where: { id },
          data: {
            barriers: dto.barriers,
            strengths: dto.strengths,
            tutorUserId: c.tutorUserId,
            ...(dto.diagnosis !== undefined
              ? {
                  diagnosisEncrypted: this.diagnosis.encrypt(
                    dto.diagnosis,
                    plan,
                  ),
                }
              : {}),
          },
          omit: { diagnosisEncrypted: true },
        });
        await tx.auditLog.create({
          data: { userId: user.id, action: 'PLAN_UPDATED', entityId: id },
        });
        return updated;
      },
      { timeout: 15000 },
    );
  }
  async status(user: AuthUser, id: string, status: 'ACTIVE' | 'ARCHIVED') {
    await this.context(user, await this.find(id), true);
    return this.prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${id}))`;
        const plan = await tx.supportPlan.findUniqueOrThrow({ where: { id } });
        if (plan.status === 'ARCHIVED' || plan.status === status)
          throw new ConflictException('Transición de plan inválida');
        if (
          status === 'ACTIVE' &&
          !(await tx.supportPlanVersion.count({
            where: { planId: id, approvedAt: { not: null } },
          }))
        )
          throw new ConflictException(
            'Se requiere una versión aprobada por el tutor',
          );
        const updated = await tx.supportPlan.update({
          where: { id },
          data: { status },
          omit: { diagnosisEncrypted: true },
        });
        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: 'PLAN_STATUS_CHANGED',
            entityId: id,
            metadata: { from: plan.status, to: status },
          },
        });
        return updated;
      },
      { timeout: 15000 },
    );
  }
  async version(
    user: AuthUser,
    planId: string,
    dto: CreateVersionDto | VersionContentDto,
    versionId?: string,
  ) {
    const plan = await this.find(planId);
    await this.context(user, plan, true, true);
    if ('periodId' in dto) {
      const period = await this.sources.period(dto.periodId);
      if (
        period.schoolId !== plan.schoolId ||
        period.year !== plan.year ||
        period.type !== 'BIMESTER'
      )
        throw new BadRequestException(
          'El periodo debe ser un bimestre de la IE y año del plan',
        );
    }
    return this.prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${planId}))`;
        const current = await tx.supportPlan.findUniqueOrThrow({
          where: { id: planId },
        });
        if (current.status === 'ARCHIVED')
          throw new ConflictException('El plan está archivado');
        const data = {
          goals: dto.goals,
          adjustments: dto.adjustments,
          strategies: dto.strategies,
          progressNotes: dto.progressNotes,
        };
        let version;
        if (versionId) {
          const old = await tx.supportPlanVersion.findFirst({
            where: { id: versionId, planId },
          });
          if (!old) throw new NotFoundException('Versión no encontrada');
          if (old.approvedAt)
            throw new ConflictException('La versión aprobada es inmutable');
          version = await tx.supportPlanVersion.update({
            where: { id: versionId },
            data,
          });
        } else {
          const max = await tx.supportPlanVersion.aggregate({
            where: { planId },
            _max: { version: true },
          });
          version = await tx.supportPlanVersion.create({
            data: {
              ...data,
              planId,
              periodId: (dto as CreateVersionDto).periodId,
              version: (max._max.version ?? 0) + 1,
              generatedBy: 'HUMAN',
            },
          });
        }
        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: versionId ? 'PLAN_VERSION_UPDATED' : 'PLAN_VERSION_CREATED',
            entityId: version.id,
            metadata: { planId },
          },
        });
        return version;
      },
      { timeout: 15000 },
    );
  }
  async approve(
    user: AuthUser,
    planId: string,
    versionId: string,
    expectedUpdatedAt: string,
  ) {
    const c = await this.context(user, await this.find(planId), true);
    if (!assignedTutor(user, c))
      throw new ForbiddenException(
        'La aprobación corresponde al tutor asignado',
      );
    return this.prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${planId}))`;
        const plan = await tx.supportPlan.findUniqueOrThrow({
          where: { id: planId },
        });
        if (plan.status === 'ARCHIVED')
          throw new ConflictException('El plan está archivado');
        const version = await tx.supportPlanVersion.findFirst({
          where: { id: versionId, planId },
        });
        if (!version) throw new NotFoundException('Versión no encontrada');
        if (version.approvedAt)
          throw new ConflictException('La versión ya fue aprobada');
        if (
          version.updatedAt.getTime() !== new Date(expectedUpdatedAt).getTime()
        )
          throw new ConflictException(
            'La versión cambió; revise su contenido antes de aprobar',
          );
        const updated = await tx.supportPlanVersion.update({
          where: { id: versionId },
          data: { approvedAt: new Date(), approvedByUserId: user.id },
        });
        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: 'PLAN_VERSION_APPROVED',
            entityId: versionId,
            metadata: { planId },
          },
        });
        return updated;
      },
      { timeout: 15000 },
    );
  }
}
