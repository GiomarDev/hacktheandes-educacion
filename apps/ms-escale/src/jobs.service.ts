import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { dateOnly, todayInLima } from '@app/common';
import { StatsService } from './stats.service.js';

// Una vez al día calcula el día anterior (Lima). Se revisa cada hora; repetir es idempotente.
// Un día con fallas se sigue reintentando después de la medianoche, hasta una semana.
const RETRY_DAYS = 7;
const DAY_MS = 86400000;

@Injectable()
export class JobsService implements OnModuleInit, OnModuleDestroy {
  private timer?: ReturnType<typeof setInterval>;
  private lastDate?: string;
  private readonly pending = new Set<string>();
  private readonly logger = new Logger(JobsService.name);
  constructor(private readonly stats: StatsService) {}
  onModuleInit() {
    if (process.env.BACKGROUND_JOBS_ENABLED === 'false') return;
    this.timer = setInterval(() => void this.tick(), 3600000);
    this.timer.unref();
  }
  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
  async tick() {
    const today = dateOnly(todayInLima()).getTime();
    const yesterday = new Date(today - DAY_MS).toISOString().slice(0, 10);
    const oldest = new Date(today - RETRY_DAYS * DAY_MS)
      .toISOString()
      .slice(0, 10);
    for (const date of this.pending)
      if (date < oldest) this.pending.delete(date);
    if (this.lastDate !== yesterday) this.pending.add(yesterday);
    for (const date of [...this.pending].sort()) {
      try {
        const result = await this.stats.compute(date);
        if (result.failed) continue;
        this.pending.delete(date);
        if (date === yesterday) this.lastDate = yesterday;
      } catch {
        this.logger.warn('Agregado diario pendiente de reintento');
      }
    }
  }
}
