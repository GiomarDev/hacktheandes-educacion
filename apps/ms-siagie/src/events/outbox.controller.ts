import { Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { InternalKeyGuard, Public } from '@app/common';
import { OutboxService } from './outbox.service.js';

@Public()
@UseGuards(InternalKeyGuard)
@Controller('internal/events')
export class OutboxController {
  constructor(private readonly outbox: OutboxService) {}
  @Post('dispatch')
  @HttpCode(200)
  dispatch() {
    return this.outbox.flush();
  }
}
