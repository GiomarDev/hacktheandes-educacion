import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { dateOnly, todayInLima } from '@app/common';
import { StatsService } from './stats.service.js';

// Una vez al día calcula el día anterior (Lima). Se revisa cada hora; repetir es idempotente.
@Injectable()
export class JobsService implements OnModuleInit, OnModuleDestroy {
  private timer?: ReturnType<typeof setInterval>;
  private lastDate?: string;
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
    const yesterday = new Date(dateOnly(todayInLima()).getTime() - 86400000)
      .toISOString()
      .slice(0, 10);
    if (this.lastDate === yesterday) return;
    try {
      const result = await this.stats.compute(yesterday);
      if (!result.failed) this.lastDate = yesterday;
    } catch {
      this.logger.warn('Agregado diario pendiente de reintento');
    }
  }
}
