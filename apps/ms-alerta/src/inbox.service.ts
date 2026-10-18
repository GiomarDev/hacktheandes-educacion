import { ConflictException, Injectable } from '@nestjs/common';
import { SchoolEventDto } from '@app/common';
import { PrismaService } from './prisma.service.js';
import { SiagieClient } from './clients.js';
import { EngineService } from './rules/engine.service.js';

@Injectable()
export class InboxService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly siagie: SiagieClient,
    private readonly engine: EngineService,
  ) {}
  async receive(dto: SchoolEventDto) {
    await this.prisma.inboxEvent.createMany({
      data: [dto],
      skipDuplicates: true,
    });
    const stored = await this.prisma.inboxEvent.findUniqueOrThrow({
      where: { id: dto.id },
    });
    if (
      stored.type !== dto.type ||
      stored.resourceId !== dto.resourceId ||
      stored.date !== dto.date
    )
      throw new ConflictException(
        'El ID del evento ya corresponde a otro recurso',
      );
    return { accepted: true, eventId: dto.id };
  }
  async process() {
    const now = new Date();
    const pending = await this.prisma.inboxEvent.findMany({
      where: {
        processedAt: null,
        nextAttemptAt: { lte: now },
        OR: [{ lockedUntil: null }, { lockedUntil: { lt: now } }],
      },
      take: 50,
      orderBy: { createdAt: 'asc' },
    });
    let processed = 0;
    for (const event of pending) {
      const claim = await this.prisma.inboxEvent.updateMany({
        where: {
          id: event.id,
          processedAt: null,
          OR: [{ lockedUntil: null }, { lockedUntil: { lt: now } }],
        },
        data: {
          attempts: { increment: 1 },
          lockedUntil: new Date(now.getTime() + 120000),
        },
      });
      if (!claim.count) continue;
      try {
        if (event.type === 'ACCESS_RECORDED')
          await this.engine.accessNotice(event.resourceId);
        else {
          const sections =
            event.type === 'GRADE_RECORDED'
              ? await this.siagie.grade(event.resourceId, event.date)
              : await this.siagie.sections(event.date, event.resourceId);
          await this.engine.evaluate(sections, event.date);
        }
        await this.prisma.inboxEvent.update({
          where: { id: event.id },
          data: { processedAt: new Date(), lockedUntil: null, error: null },
        });
        processed++;
      } catch {
        await this.prisma.inboxEvent.update({
          where: { id: event.id },
          data: {
            lockedUntil: null,
            error: 'No se pudo evaluar el evento; pendiente de reintento',
            nextAttemptAt: new Date(Date.now() + 60000),
          },
        });
      }
    }
    return processed;
  }
}
