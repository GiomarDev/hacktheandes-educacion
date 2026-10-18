import { Injectable, Logger } from '@nestjs/common';
import type { ContactContext, RiskSection } from '@app/common';
import { StaffClient, SiagieClient } from '../clients.js';
import { PrismaService } from '../prisma.service.js';
import type { Role } from '../generated/prisma/client.js';
import { addBusinessDays, evaluateRules } from './risk-rules.js';
import type { Signal } from './risk-rules.js';

@Injectable()
export class EngineService {
  private readonly logger = new Logger(EngineService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly siagie: SiagieClient,
    private readonly staff: StaffClient,
  ) {}

  async evaluate(
    sections: RiskSection[],
    date: string,
    evaluateSilence = false,
  ) {
    const rules = await this.prisma.riskRule.findMany({
      where: { isActive: true },
    });
    const signals = evaluateRules(sections, rules, date, evaluateSilence);
    for (const signal of signals) await this.persist(signal);
    return signals.length;
  }

  private async persist(signal: Signal) {
    const { section } = signal;
    await this.prisma.$transaction(
      async (tx) => {
        // El mismo estudiante puede aparecer simultáneamente en varios eventos/reglas.
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`${section.school.id}:${signal.studentId ?? section.id}`}))`;
        const exact = await tx.alert.findUnique({
          where: { dedupeKey: signal.dedupeKey },
        });
        if (exact) {
          if (exact.status === 'OPEN' || exact.status === 'ACKNOWLEDGED')
            await tx.alert.update({
              where: { id: exact.id },
              data: { data: signal.data },
            });
          return;
        }
        const active = await tx.alert.findFirst({
          where: {
            ruleId: signal.ruleId,
            schoolId: section.school.id,
            sectionId: section.id,
            studentId: signal.studentId ?? null,
            status: { in: ['OPEN', 'ACKNOWLEDGED'] },
          },
        });
        if (active) {
          await tx.alert.update({
            where: { id: active.id },
            data: { data: signal.data },
          });
          return;
        }
        let caseId: string | undefined;
        if (signal.studentId) {
          let record = await tx.case.findFirst({
            where: {
              studentId: signal.studentId,
              schoolId: section.school.id,
              closedAt: null,
            },
          });
          if (record) {
            await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${record.id}))`;
            const current = await tx.case.findUniqueOrThrow({
              where: { id: record.id },
            });
            record = current.closedAt ? null : current;
          }
          if (!record) {
            record = await tx.case.create({
              data: {
                studentId: signal.studentId,
                schoolId: section.school.id,
                sectionId: section.id,
                ownerUserId: section.auxiliarUserId ?? section.tutorUserId,
                ownerRole: section.auxiliarUserId ? 'AUXILIAR' : 'TUTOR',
                dueAt: addBusinessDays(new Date()),
              },
            });
            await tx.caseAction.create({
              data: {
                caseId: record.id,
                type: 'STATUS_CHANGE',
                metadata: { to: 'OPEN', source: 'RISK_RULE' },
              },
            });
          }
          caseId = record.id;
        }
        await tx.alert.create({
          data: {
            ruleId: signal.ruleId,
            type: signal.type,
            severity: signal.severity,
            schoolId: section.school.id,
            sectionId: section.id,
            studentId: signal.studentId,
            caseId,
            data: signal.data,
            dedupeKey: signal.dedupeKey,
          },
        });
      },
      { timeout: 15000 },
    );
  }

  async accessNotice(eventId: string) {
    const event = await this.siagie.access(eventId);
    const context = await this.siagie.contact(event.studentId, event.schoolId);
    const key = `access:${event.id}`;
    await this.prisma.$transaction(
      async (tx) => {
        const alert = await tx.alert.upsert({
          where: { dedupeKey: key },
          update: {},
          create: {
            type: event.type === 'ENTRY' ? 'ACCESS_ENTRY' : 'ACCESS_EXIT',
            severity: 'LOW',
            schoolId: event.schoolId,
            sectionId: context.sectionId,
            studentId: event.studentId,
            dedupeKey: key,
            data: { occurredAt: event.occurredAt },
          },
        });
        const recipients = eligibleGuardians(context).map((g) => ({
          recipientType: 'GUARDIAN' as const,
          guardianId: g.id,
          channel: g.preferredChannel as 'WHATSAPP' | 'SMS',
          suffix: g.id,
        }));
        await tx.notification.createMany({
          data: [
            ...recipients.map((r) => ({
              recipientType: r.recipientType,
              guardianId: r.guardianId,
              channel: r.channel,
              alertId: alert.id,
              templateCode: `${event.type}_NOTICE`,
              body:
                event.type === 'ENTRY'
                  ? 'Se registró el ingreso de su estudiante a la IE.'
                  : 'Se registró la salida de su estudiante de la IE.',
              dedupeKey: `${key}:${r.suffix}`,
            })),
            ...(context.auxiliarUserId
              ? [
                  {
                    recipientType: 'USER' as const,
                    userId: context.auxiliarUserId,
                    channel: 'IN_APP' as const,
                    alertId: alert.id,
                    templateCode: `${event.type}_NOTICE`,
                    body: 'Se registró un movimiento en la puerta de la IE.',
                    dedupeKey: `${key}:${context.auxiliarUserId}`,
                  },
                ]
              : []),
          ],
          skipDuplicates: true,
        });
      },
      { timeout: 15000 },
    );
  }

  async escalate(now = new Date()) {
    const overdue = await this.prisma.case.findMany({
      where: {
        status: { in: ['OPEN', 'CONTACTING'] },
        dueAt: { lte: now },
        escalationLevel: { lt: 3 },
        closedAt: null,
      },
      take: 100,
    });
    let escalated = 0;
    for (const record of overdue) {
      try {
        const context = await this.siagie.contact(
          record.studentId,
          record.schoolId,
        );
        const people = await this.staff.list(
          record.schoolId,
          context.school.ugelId,
        );
        const level = record.escalationLevel + 1;
        const role: Role =
          level === 1
            ? 'DIRECTOR'
            : level === 2 &&
                context.school.hasPsychologist &&
                people.some((p) => p.role === 'PSYCHOLOGIST')
              ? 'PSYCHOLOGIST'
              : level === 2
                ? 'DIRECTOR'
                : 'UGEL_SPECIALIST';
        const owner = people.find((p) => p.role === role);
        if (!owner) {
          this.logger.warn(
            `Caso ${record.id}: responsable de escalamiento pendiente`,
          );
          continue;
        }
        const changed = await this.prisma.$transaction(
          async (tx) => {
            await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${record.id}))`;
            const result = await tx.case.updateMany({
              where: {
                id: record.id,
                escalationLevel: record.escalationLevel,
                status: { in: ['OPEN', 'CONTACTING'] },
                dueAt: { lte: now },
              },
              data: {
                ownerUserId: owner.userId,
                ownerRole: role,
                escalationLevel: level,
                dueAt: addBusinessDays(now),
              },
            });
            if (!result.count) return false;
            const action = await tx.caseAction.create({
              data: {
                caseId: record.id,
                type: 'ESCALATED',
                metadata: {
                  from: record.escalationLevel,
                  to: level,
                  ownerRole: role,
                },
              },
            });
            await tx.notification.create({
              data: {
                recipientType: 'USER',
                userId: owner.userId,
                channel: 'IN_APP',
                templateCode: 'ESCALATION',
                body: 'Tiene un caso escolar pendiente de seguimiento.',
                caseId: record.id,
                dedupeKey: `escalation:${action.id}`,
              },
            });
            return true;
          },
          { timeout: 15000 },
        );
        if (changed) escalated++;
      } catch {
        // Un caso sin contexto resoluble no impide atender los demás casos de la tanda.
        this.logger.warn(
          `Caso ${record.id}: escalamiento pendiente de reintento`,
        );
      }
    }
    return escalated;
  }
}

export function eligibleGuardians(context: ContactContext) {
  return context.guardians.filter(
    (g) =>
      g.receivesAlerts &&
      (g.preferredChannel === 'SMS' ||
        (g.preferredChannel === 'WHATSAPP' && g.whatsappOptIn)),
  );
}
