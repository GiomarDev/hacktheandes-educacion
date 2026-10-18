import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { todayInLima } from '@app/common';
import { SiagieClient } from './clients.js';
import { EngineService } from './rules/engine.service.js';
import { InboxService } from './inbox.service.js';
import { NotificationsService } from './notifications.service.js';

@Injectable()
export class JobsService implements OnModuleInit, OnModuleDestroy {
  private timer?: ReturnType<typeof setInterval>;
  private running = false;
  private lastScan = 0;
  private readonly logger = new Logger(JobsService.name);
  constructor(
    private readonly inbox: InboxService,
    private readonly engine: EngineService,
    private readonly siagie: SiagieClient,
    private readonly notifications: NotificationsService,
  ) {}
  onModuleInit() {
    if (process.env.BACKGROUND_JOBS_ENABLED === 'false') return;
    this.timer = setInterval(() => {
      void this.run(false).catch(() =>
        this.logger.warn('Seguimiento pendiente de reintento'),
      );
    }, 60000);
    this.timer.unref();
  }
  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
  async run(scan = true) {
    if (this.running) return { busy: true };
    this.running = true;
    try {
      const processed = await this.inbox.process();
      let detected = 0;
      let scanFailed = false;
      if (scan || Date.now() - this.lastScan >= 3600000) {
        try {
          const date = todayInLima();
          const hour = Number(
            new Intl.DateTimeFormat('en-GB', {
              timeZone: 'America/Lima',
              hour: '2-digit',
              hourCycle: 'h23',
            }).format(new Date()),
          );
          detected = await this.engine.evaluate(
            await this.siagie.sections(date),
            date,
            hour >= 13,
          );
          this.lastScan = Date.now();
        } catch {
          scanFailed = true;
          this.logger.warn('Evaluación global pendiente de reintento');
        }
      }
      const escalated = await this.engine.escalate();
      const sent = await this.notifications.dispatch();
      return { processed, detected, escalated, sent, scanFailed };
    } finally {
      this.running = false;
    }
  }
}
