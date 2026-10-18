import { Body, Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { CurrentUser } from '@app/common';
import type { AuthUser } from '@app/common';
import { QrService } from './qr.service.js';
import { AccessEventDto } from './access.dto.js';

@Controller()
export class AccessController {
  constructor(private readonly qr: QrService) {}

  @Post('students/:id/qr')
  issue(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.qr.issue(user, id);
  }

  @Post('access-events')
  register(@CurrentUser() user: AuthUser, @Body() dto: AccessEventDto) {
    return this.qr.registerAccess(user, dto);
  }
}
