import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '@app/common';
import type { AuthUser } from '@app/common';
import { PrismaService } from './prisma.service.js';
import { ScopeService } from './scope.service.js';
import { NotificationsService } from './notifications.service.js';
import {
  AlertStatusDto,
  CaseActionDto,
  CreateRuleDto,
  ListQuery,
  SendMessageDto,
  UpdateRuleDto,
} from './api.dto.js';
import { addBusinessDays, paramsError } from './rules/risk-rules.js';
import type { AlertStatus, CaseStatus } from './generated/prisma/client.js';

@Controller()
export class ApiController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: ScopeService,
    private readonly notifications: NotificationsService,
  ) {}

  @Get('alerts')
  async alerts(@CurrentUser() user: AuthUser, @Query() query: ListQuery) {
    if (
      query.status &&
      !['OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED'].includes(query.status)
    )
      throw new BadRequestException('Estado de alerta inválido');
    if (query.schoolId) await this.scope.assertSchool(user, query.schoolId);
    return this.prisma.alert.findMany({
      where: {
        ...(await this.scope.filter(user)),
        ...(query.schoolId ? { schoolId: query.schoolId } : {}),
        status: query.status as AlertStatus | undefined,
      },
      orderBy: [{ detectedAt: 'desc' }, { id: 'asc' }],
      take: query.limit,
      skip: query.offset,
    });
  }

  @Patch('alerts/:id')
  async updateAlert(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AlertStatusDto,
  ) {
    const alert = await this.prisma.alert.findUnique({
      where: { id },
      include: { case: true },
    });
    if (!alert) throw new NotFoundException('Alerta no encontrada');
    await this.scope.assertManage(
      user,
      alert.case ?? { schoolId: alert.schoolId, ownerUserId: '' },
    );
    return this.prisma.alert.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  @Get('cases')
  async cases(@CurrentUser() user: AuthUser, @Query() query: ListQuery) {
    if (
      query.status &&
      ![
        'OPEN',
        'CONTACTING',
        'CONTACTED',
        'REFERRED',
        'CLOSED_RETURNED',
        'CLOSED_TRANSFERRED',
        'CLOSED_DROPPED_OUT',
      ].includes(query.status)
    )
      throw new BadRequestException('Estado de caso inválido');
    if (query.schoolId) await this.scope.assertSchool(user, query.schoolId);
    return this.prisma.case.findMany({
      where: {
        ...(await this.scope.filter(user)),
        ...(query.schoolId ? { schoolId: query.schoolId } : {}),
        status: query.status as CaseStatus | undefined,
      },
      orderBy: [{ openedAt: 'desc' }, { id: 'asc' }],
      take: query.limit,
      skip: query.offset,
    });
  }

  @Get('cases/:id')
  async detail(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const record = await this.prisma.case.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Caso no encontrado');
    await this.scope.assertSchool(user, record.schoolId);
    return this.prisma.case.findUniqueOrThrow({
      where: { id },
      include: {
        alerts: true,
        actions: { orderBy: { performedAt: 'asc' }, take: 100 },
        notifications: { orderBy: { createdAt: 'desc' }, take: 100 },
        responses: { orderBy: { receivedAt: 'desc' }, take: 100 },
      },
    });
  }

  @Post('cases/:id/actions')
  async action(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CaseActionDto,
  ) {
    const record = await this.prisma.case.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Caso no encontrado');
    await this.scope.assertManage(user, record);
    if ((dto.type === 'STATUS_CHANGE') !== !!dto.status)
      throw new BadRequestException('Indique status solo para STATUS_CHANGE');
    if (dto.status?.startsWith('CLOSED_') && dto.notes.length > 250)
      throw new BadRequestException(
        'El motivo de cierre admite hasta 250 caracteres',
      );
    return this.prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${id}))`;
        const current = await tx.case.findUniqueOrThrow({ where: { id } });
        if (
          current.ownerUserId !== record.ownerUserId &&
          record.ownerUserId === user.id
        )
          throw new ConflictException(
            'El responsable cambió; actualice el caso',
          );
        if (current.closedAt)
          throw new BadRequestException('El caso está cerrado');
        if (current.firstContactAt && dto.status === 'CONTACTING')
          throw new BadRequestException(
            'Ya se registró contacto con la familia',
          );
        const closed = !!dto.status?.startsWith('CLOSED_');
        const referral = dto.type.startsWith('REFERRAL_');
        await tx.case.update({
          where: { id },
          data: {
            ...(dto.status
              ? { status: dto.status }
              : referral
                ? { status: 'REFERRED' as const }
                : {}),
            ...(closed
              ? { closedAt: new Date(), closeReason: dto.notes }
              : ['CALL', 'MEETING'].includes(dto.type)
                ? { dueAt: addBusinessDays(new Date()) }
                : {}),
          },
        });
        if (closed) {
          await tx.alert.updateMany({
            where: { caseId: id, status: { in: ['OPEN', 'ACKNOWLEDGED'] } },
            data: { status: 'RESOLVED' },
          });
          await tx.notification.updateMany({
            where: { caseId: id, status: { in: ['QUEUED', 'FAILED'] } },
            data: {
              status: 'FAILED',
              error: 'Entrega cancelada por cierre del caso',
              lockedUntil: null,
            },
          });
        }
        return tx.caseAction.create({
          data: {
            caseId: id,
            type: dto.type,
            notes: dto.notes,
            performedByUserId: user.id,
            metadata: dto.status
              ? { from: current.status, to: dto.status }
              : {},
          },
        });
      },
      { timeout: 15000 },
    );
  }

  @Post('cases/:id/send-message')
  @HttpCode(200)
  send(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.notifications.sendCaseMessage(
      user,
      id,
      dto.requestId,
      dto.body,
    );
  }

  @Get('rules')
  async rules(@CurrentUser() user: AuthUser) {
    const filter = await this.scope.filter(user);
    return this.prisma.riskRule.findMany({
      where: filter.schoolId
        ? { OR: [{ schoolId: null }, { schoolId: filter.schoolId }] }
        : {},
      orderBy: { code: 'asc' },
      take: 100,
    });
  }
  private async assertRuleManager(user: AuthUser, schoolId: string | null) {
    if (user.roles.some((r) => r.role === 'MINEDU_ADMIN')) return;
    if (
      !schoolId ||
      !user.roles.some((r) => r.role === 'DIRECTOR' && r.schoolId === schoolId)
    )
      throw new ForbiddenException(
        'Solo MINEDU configura reglas globales; dirección configura su IE',
      );
    await this.scope.assertSchool(user, schoolId);
  }
  @Post('rules')
  async createRule(@CurrentUser() user: AuthUser, @Body() dto: CreateRuleDto) {
    await this.assertRuleManager(user, dto.schoolId ?? null);
    const error = paramsError(dto.type, dto.params);
    if (error) throw new BadRequestException(error);
    return this.prisma.riskRule.create({ data: dto });
  }
  @Patch('rules/:id')
  async updateRule(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRuleDto,
  ) {
    const rule = await this.prisma.riskRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException('Regla no encontrada');
    await this.assertRuleManager(user, rule.schoolId);
    if (dto.params) {
      const error = paramsError(rule.type, dto.params);
      if (error) throw new BadRequestException(error);
    }
    return this.prisma.riskRule.update({ where: { id }, data: dto });
  }
}
