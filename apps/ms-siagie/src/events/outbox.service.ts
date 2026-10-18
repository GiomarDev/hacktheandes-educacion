import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { requireEnv } from '@app/common';
import { PrismaService } from '../prisma.service.js';

@Injectable()
export class OutboxService implements OnModuleInit, OnModuleDestroy {
  private timer?: ReturnType<typeof setInterval>;
  private running = false;
  private readonly logger = new Logger(OutboxService.name);
  constructor(private readonly prisma: PrismaService) {}
  onModuleInit() {
    if (process.env.BACKGROUND_JOBS_ENABLED === 'false') return;
    this.timer = setInterval(() => {
      void this.flush().catch(() =>
        this.logger.warn('Outbox pendiente de reintento'),
      );
    }, 60000);
    this.timer.unref();
  }
  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
  async flush() {
    if (this.running) return { delivered: 0 };
    this.running = true;
    let delivered = 0;
    try {
      const now = new Date();
      const pending = await this.prisma.outboxEvent.findMany({
        where: {
          deliveredAt: null,
          nextAttemptAt: { lte: now },
          OR: [{ lockedUntil: null }, { lockedUntil: { lt: now } }],
        },
        take: 50,
        orderBy: { createdAt: 'asc' },
      });
      for (const event of pending) {
        const claim = await this.prisma.outboxEvent.updateMany({
          where: {
            id: event.id,
            deliveredAt: null,
            OR: [{ lockedUntil: null }, { lockedUntil: { lt: now } }],
          },
          data: {
            attempts: { increment: 1 },
            lockedUntil: new Date(now.getTime() + 30000),
          },
        });
        if (!claim.count) continue;
        try {
          const response = await fetch(
            `${requireEnv('ALERTA_URL')}/internal/events`,
            {
              method: 'POST',
              headers: {
                'content-type': 'application/json',
                'x-internal-key': requireEnv('INTERNAL_API_KEY'),
              },
              body: JSON.stringify({
                id: event.id,
                type: event.type,
                resourceId: event.resourceId,
                date: event.date,
              }),
              signal: AbortSignal.timeout(5000),
            },
          );
          if (!response.ok) throw new Error('Receptor no disponible');
          const body = (await response.json()) as {
            accepted?: boolean;
            eventId?: string;
          };
          if (body.accepted !== true || body.eventId !== event.id)
            throw new Error('Acuse inválido');
          await this.prisma.outboxEvent.update({
            where: { id: event.id },
            data: { deliveredAt: new Date(), lockedUntil: null, error: null },
          });
          delivered++;
        } catch {
          await this.prisma.outboxEvent.update({
            where: { id: event.id },
            data: {
              lockedUntil: null,
              error:
                'ms-alerta no confirmó la recepción; pendiente de reintento',
              nextAttemptAt: new Date(
                Date.now() +
                  Math.min(3600000, 60000 * 2 ** Math.min(event.attempts, 6)),
              ),
            },
          });
          break; // Evitar cincuenta timeouts si ms-alerta está caído.
        }
      }
      return { delivered };
    } finally {
      this.running = false;
    }
  }
}
