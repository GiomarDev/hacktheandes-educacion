import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  InternalKeyGuard,
  Public,
  SchoolEventDto,
  todayInLima,
} from '@app/common';
import { GuardianResponseDto } from './api.dto.js';
import { InboxService } from './inbox.service.js';
import { JobsService } from './jobs.service.js';
import { NotificationsService } from './notifications.service.js';

@Public()
@UseGuards(InternalKeyGuard)
@Controller()
export class InternalController {
  constructor(
    private readonly inbox: InboxService,
    private readonly jobs: JobsService,
    private readonly notifications: NotificationsService,
  ) {}
  @Post('internal/events')
  @HttpCode(202)
  receive(@Body() dto: SchoolEventDto) {
    if (dto.date > todayInLima())
      throw new BadRequestException('El evento no puede ser futuro');
    return this.inbox.receive(dto);
  }
  @Post('internal/jobs/run')
  @HttpCode(200)
  run() {
    return this.jobs.run();
  }
  @Post('webhooks/notifications')
  @HttpCode(200)
  response(@Body() dto: GuardianResponseDto) {
    return this.notifications.receiveResponse(dto);
  }
}
