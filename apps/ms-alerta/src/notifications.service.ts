import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { AuthUser } from '@app/common';
import { SiagieClient } from './clients.js';
import { PrismaService } from './prisma.service.js';
import { ScopeService } from './scope.service.js';
import { addBusinessDays } from './rules/risk-rules.js';
import { eligibleGuardians } from './rules/engine.service.js';
import type { ReasonCategory } from './generated/prisma/client.js';

export abstract class NotificationProvider {
  abstract send(id: string): Promise<string>;
}
@Injectable()
export class ConsoleProvider extends NotificationProvider {
  private readonly logger = new Logger(ConsoleProvider.name);
  async send(id: string) {
    this.logger.log(`Notificación simulada: ${id}`);
    return `console:${id}`;
  }
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly siagie: SiagieClient,
    private readonly scope: ScopeService,
    private readonly provider: NotificationProvider,
  ) {}

  async sendCaseMessage(
    user: AuthUser,
    caseId: string,
    requestId: string,
    body = 'La IE desea conversar con usted para acompañar la asistencia de su estudiante. ¿Podría indicarnos cómo podemos ayudar?',
  ) {
    const record = await this.prisma.case.findUnique({ where: { id: caseId } });
    if (!record) throw new NotFoundException('Caso no encontrado');
    await this.scope.assertManage(user, record);
    if (record.closedAt) throw new BadRequestException('El caso está cerrado');
    const prefix = `case:${caseId}:${requestId}:`;
    const existing = await this.prisma.notification.findMany({
      where: { dedupeKey: { startsWith: prefix } },
    });
    if (existing.length) {
      if (existing.some((n) => n.body !== body))
        throw new ConflictException(
          'El requestId ya corresponde a otro mensaje',
        );
      return existing;
    }
    const contacts = eligibleGuardians(
      await this.siagie.contact(record.studentId, record.schoolId),
    );
    if (!contacts.length)
      throw new UnprocessableEntityException(
        'No hay apoderados habilitados para recibir mensajes por su canal preferido',
      );
    await this.prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${caseId}))`;
        const current = await tx.case.findUniqueOrThrow({
          where: { id: caseId },
        });
        if (
          current.ownerUserId !== record.ownerUserId &&
          record.ownerUserId === user.id
        )
          throw new ConflictException(
            'El responsable cambió; actualice el caso',
          );
        if (current.closedAt)
          throw new BadRequestException('El caso está cerrado');
        const duplicates = await tx.notification.findMany({
          where: { dedupeKey: { startsWith: prefix } },
        });
        if (duplicates.length) {
          if (duplicates.some((n) => n.body !== body))
            throw new ConflictException(
              'El requestId ya corresponde a otro mensaje',
            );
          return;
        }
        await tx.notification.createMany({
          data: contacts.map((g) => ({
            recipientType: 'GUARDIAN' as const,
            guardianId: g.id,
            channel: g.preferredChannel as 'WHATSAPP' | 'SMS',
            templateCode: 'ABSENCE_CONTACT',
            body,
            caseId,
            dedupeKey: `${prefix}${g.id}`,
          })),
        });
        await tx.caseAction.create({
          data: {
            caseId,
            type: 'MESSAGE_DRAFTED',
            performedByUserId: user.id,
            metadata: { requestId, recipients: contacts.length },
          },
        });
        if (current.status === 'OPEN' || current.status === 'CONTACTING')
          await tx.case.update({
            where: { id: caseId },
            data: { status: 'CONTACTING', dueAt: addBusinessDays(new Date()) },
          });
      },
      { timeout: 15000 },
    );
    await this.dispatch();
    return this.prisma.notification.findMany({
      where: { dedupeKey: { startsWith: prefix } },
    });
  }

  async dispatch() {
    const now = new Date();
    const pending = await this.prisma.notification.findMany({
      where: {
        status: { in: ['QUEUED', 'FAILED'] },
        nextAttemptAt: { lte: now },
        OR: [{ lockedUntil: null }, { lockedUntil: { lt: now } }],
        AND: [{ OR: [{ caseId: null }, { case: { closedAt: null } }] }],
      },
      take: 50,
      orderBy: { createdAt: 'asc' },
    });
    let sent = 0;
    for (const notification of pending) {
      const claim = await this.prisma.notification.updateMany({
        where: {
          id: notification.id,
          status: { in: ['QUEUED', 'FAILED'] },
          OR: [{ lockedUntil: null }, { lockedUntil: { lt: now } }],
          AND: [{ OR: [{ caseId: null }, { case: { closedAt: null } }] }],
        },
        data: {
          lockedUntil: new Date(now.getTime() + 120000),
          attempts: { increment: 1 },
        },
      });
      if (!claim.count) continue;
      try {
        // Revalidar consentimiento antes del intento, también en reintentos de una cola antigua.
        if (notification.guardianId) {
          let studentId: string | undefined;
          let schoolId: string | undefined;
          if (notification.caseId) {
            const record = await this.prisma.case.findUniqueOrThrow({
              where: { id: notification.caseId },
            });
            if (record.closedAt) throw new Error('El caso está cerrado');
            studentId = record.studentId;
            schoolId = record.schoolId;
          } else if (notification.alertId) {
            const alert = await this.prisma.alert.findUniqueOrThrow({
              where: { id: notification.alertId },
            });
            studentId = alert.studentId ?? undefined;
            schoolId = alert.schoolId;
          }
          if (!studentId || !schoolId)
            throw new Error('Falta contexto de destino');
          const context = await this.siagie.contact(studentId, schoolId);
          if (
            !eligibleGuardians(context).some(
              (g) =>
                g.id === notification.guardianId &&
                g.preferredChannel === notification.channel,
            )
          )
            throw new Error('Destino no habilitado');
        }
        const messageId = await this.provider.send(notification.id);
        await this.prisma.$transaction(
          async (tx) => {
            await tx.notification.update({
              where: { id: notification.id },
              data: {
                status: 'SENT',
                providerMessageId: messageId,
                sentAt: new Date(),
                lockedUntil: null,
                error: null,
              },
            });
            if (notification.caseId)
              await tx.caseAction.create({
                data: {
                  caseId: notification.caseId,
                  type: 'MESSAGE_SENT',
                  metadata: {
                    notificationId: notification.id,
                    provider: 'console',
                  },
                },
              });
          },
          { timeout: 15000 },
        );
        sent++;
      } catch {
        await this.prisma.notification.update({
          where: { id: notification.id },
          data: {
            status: 'FAILED',
            error:
              'No se pudo entregar la notificación simulada o el destino ya no está habilitado',
            lockedUntil: null,
            nextAttemptAt: new Date(Date.now() + 60000),
          },
        });
      }
    }
    return sent;
  }

  async receiveResponse(dto: {
    providerEventId: string;
    providerMessageId: string;
    rawText: string;
    classifiedReason?: ReasonCategory;
  }) {
    const notification = await this.prisma.notification.findUnique({
      where: { providerMessageId: dto.providerMessageId },
    });
    if (
      !notification ||
      notification.recipientType !== 'GUARDIAN' ||
      !notification.caseId ||
      !['SENT', 'DELIVERED', 'READ'].includes(notification.status)
    )
      throw new NotFoundException('Notificación de contacto no encontrada');
    return this.prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${notification.caseId!}))`;
        const existing = await tx.guardianResponse.findUnique({
          where: { providerEventId: dto.providerEventId },
        });
        if (existing) {
          if (
            existing.notificationId !== notification.id ||
            existing.rawText !== dto.rawText ||
            existing.classifiedReason !== (dto.classifiedReason ?? null)
          )
            throw new ConflictException('El evento del proveedor ya fue usado');
          return existing;
        }
        const response = await tx.guardianResponse.create({
          data: {
            providerEventId: dto.providerEventId,
            notificationId: notification.id,
            caseId: notification.caseId,
            rawText: dto.rawText,
            classifiedReason: dto.classifiedReason,
          },
        });
        const record = await tx.case.findUniqueOrThrow({
          where: { id: notification.caseId! },
        });
        if (!record.closedAt) {
          await tx.case.update({
            where: { id: record.id },
            data: {
              status: record.status === 'REFERRED' ? 'REFERRED' : 'CONTACTED',
              firstContactAt: record.firstContactAt ?? new Date(),
              reasonCategory: dto.classifiedReason ?? record.reasonCategory,
            },
          });
          await tx.caseAction.create({
            data: {
              caseId: record.id,
              type: 'STATUS_CHANGE',
              metadata: {
                source: 'GUARDIAN_RESPONSE',
                responseId: response.id,
              },
            },
          });
        }
        await tx.notification.update({
          where: { id: notification.id },
          data: {
            status: 'DELIVERED',
            deliveredAt: notification.deliveredAt ?? new Date(),
          },
        });
        return response;
      },
      { timeout: 15000 },
    );
  }
}
