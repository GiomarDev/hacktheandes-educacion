import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { todayInLima } from '@app/common';
import type { AuthUser } from '@app/common';
import { createHash } from 'node:crypto';
import { SourcesClient } from './clients.js';
import { PrismaService } from './prisma.service.js';
import { ScopeService } from './scope.service.js';
import { reportReader, schoolRole } from './policy.js';
import { GenerateReportDto, ListQuery, ReviewReportDto } from './api.dto.js';
import type { Prisma } from './generated/prisma/client.js';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sources: SourcesClient,
    private readonly scope: ScopeService,
  ) {}
  async list(user: AuthUser, q: ListQuery) {
    // Se restringen las claims antes de resolver el ámbito, también en cuentas con varios roles.
    const reader: AuthUser = {
      ...user,
      roles: user.roles.filter((r) =>
        [
          'DIRECTOR',
          'SECRETARY',
          'UGEL_SPECIALIST',
          'DRE_SPECIALIST',
          'MINEDU_ADMIN',
        ].includes(r.role),
      ),
    };
    if (!reader.roles.length)
      throw new ForbiddenException('Rol sin acceso a reportes');
    if (
      q.schoolId &&
      !reportReader(user, await this.scope.school(user, q.schoolId))
    )
      throw new ForbiddenException('Rol sin acceso a reportes de esta IE');
    return this.prisma.selfReport.findMany({
      where: {
        ...(await this.scope.filter(reader)),
        ...(q.schoolId ? { schoolId: q.schoolId } : {}),
        year: q.year,
      },
      take: q.limit,
      skip: q.offset,
      orderBy: [{ generatedAt: 'desc' }, { id: 'asc' }],
    });
  }
  async detail(user: AuthUser, id: string) {
    const report = await this.prisma.selfReport.findUnique({ where: { id } });
    if (!report) throw new NotFoundException('Reporte no encontrado');
    if (!reportReader(user, await this.scope.school(user, report.schoolId)))
      throw new ForbiddenException('Rol sin acceso a reportes');
    return report;
  }
  async generate(user: AuthUser, dto: GenerateReportDto) {
    await this.scope.school(user, dto.schoolId);
    if (!schoolRole(user, dto.schoolId, ['DIRECTOR', 'SECRETARY']))
      throw new ForbiddenException(
        'Generación reservada a dirección y secretaría',
      );
    let from: string, to: string;
    if (dto.type === 'BIMESTER_ATTENDANCE') {
      if (!dto.periodId || dto.month !== undefined)
        throw new BadRequestException(
          'Indique un periodo bimestral y omita month',
        );
      const p = await this.sources.period(dto.periodId);
      if (
        p.schoolId !== dto.schoolId ||
        p.year !== dto.year ||
        p.type !== 'BIMESTER'
      )
        throw new BadRequestException('Bimestre de otra IE, año o tipo');
      from = p.startDate;
      to = p.endDate;
    } else {
      if (!dto.month || dto.periodId !== undefined)
        throw new BadRequestException('Indique month y omita periodId');
      from = `${dto.year}-${String(dto.month).padStart(2, '0')}-01`;
      to = new Date(Date.UTC(dto.year, dto.month, 0))
        .toISOString()
        .slice(0, 10);
    }
    const today = todayInLima();
    if (from > today || to < from)
      throw new BadRequestException('El rango aún no comienza o es inválido');
    if (to > today) to = today;
    const siagieQuery = new URLSearchParams({
      schoolId: dto.schoolId,
      year: String(dto.year),
      from,
      to,
      ...(dto.periodId ? { periodId: dto.periodId } : {}),
    });
    const [school, alerts] = await Promise.all([
      this.sources.schoolReport(siagieQuery),
      this.sources.alerts(
        new URLSearchParams({ schoolId: dto.schoolId, from, to }),
      ),
    ]);
    const payload: Prisma.InputJsonObject = {
      schemaVersion: 1,
      range: { from, to, timezone: 'America/Lima' },
      school: school as unknown as Prisma.InputJsonObject,
      alerts: alerts as unknown as Prisma.InputJsonObject,
      coverage: [
        'Matrícula y estados de casos: fotografía actual; no reconstrucción histórica.',
        'Asistencia: solo registros diarios recibidos. Sin registro no equivale a ausencia.',
        'Notas: periodos que se superponen al rango; sin identificación individual.',
      ],
    };
    const dedupeKey = createHash('sha256')
      .update(
        JSON.stringify([
          dto.schoolId,
          dto.year,
          dto.type,
          dto.month ?? null,
          dto.periodId ?? null,
        ]),
      )
      .digest('hex');
    return this.prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${dedupeKey}))`;
        const current = await tx.selfReport.findUnique({
          where: { dedupeKey },
        });
        if (current && !['DRAFT', 'OBSERVED'].includes(current.status))
          throw new ConflictException(
            'El reporte enviado o revisado es inmutable',
          );
        const report = current
          ? await tx.selfReport.update({
              where: { id: current.id },
              data: {
                payload,
                status: 'DRAFT',
                revision: { increment: 1 },
                generatedAt: new Date(),
                submittedByUserId: null,
                submittedAt: null,
                reviewedByUserId: null,
                reviewedAt: null,
                reviewNotes: null,
              },
            })
          : await tx.selfReport.create({
              data: {
                schoolId: dto.schoolId,
                year: dto.year,
                type: dto.type,
                month: dto.month,
                periodId: dto.periodId,
                payload,
                dedupeKey,
              },
            });
        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: 'REPORT_GENERATED',
            entityId: report.id,
            metadata: {
              revision: report.revision,
              previousStatus: current?.status ?? null,
            },
          },
        });
        return report;
      },
      { timeout: 15000 },
    );
  }
  async transition(
    user: AuthUser,
    id: string,
    revision: number,
    review?: ReviewReportDto,
  ) {
    const original = await this.detail(user, id);
    const school = await this.scope.school(user, original.schoolId);
    if (review) {
      if (
        !user.roles.some(
          (r) => r.role === 'UGEL_SPECIALIST' && r.ugelId === school.ugelId,
        )
      )
        throw new ForbiddenException(
          'La revisión corresponde a la UGEL de la IE',
        );
    } else if (!schoolRole(user, original.schoolId, ['DIRECTOR']))
      throw new ForbiddenException('El envío corresponde a dirección');
    return this.prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${original.dedupeKey}))`;
        const current = await tx.selfReport.findUniqueOrThrow({
          where: { id },
        });
        if (current.revision !== revision)
          throw new ConflictException(
            'El reporte cambió; actualice la revisión',
          );
        if (review && current.submittedByUserId === user.id)
          throw new ForbiddenException('No puede revisar su propio envío');
        if (
          review
            ? current.status !== 'SUBMITTED'
            : !['DRAFT', 'OBSERVED'].includes(current.status)
        )
          throw new ConflictException('Transición de reporte inválida');
        const report = await tx.selfReport.update({
          where: { id },
          data: {
            revision: { increment: 1 },
            ...(review
              ? {
                  status: review.status,
                  reviewedByUserId: user.id,
                  reviewedAt: new Date(),
                  reviewNotes: review.notes ?? null,
                }
              : {
                  status: 'SUBMITTED' as const,
                  submittedByUserId: user.id,
                  submittedAt: new Date(),
                  reviewedByUserId: null,
                  reviewedAt: null,
                  reviewNotes: null,
                }),
          },
        });
        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: 'REPORT_STATUS_CHANGED',
            entityId: id,
            metadata: {
              from: current.status,
              to: report.status,
              revision: report.revision,
            },
          },
        });
        return report;
      },
      { timeout: 15000 },
    );
  }
}
