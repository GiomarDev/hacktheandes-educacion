import { Body, Controller, Get, HttpCode, Post, Query } from '@nestjs/common';
import { CurrentUser } from '@app/common';
import type { AuthUser } from '@app/common';
import { AttendanceService } from './attendance.service.js';
import {
  AttendanceRangeQuery,
  BulkAttendanceDto,
  CreateClassSessionDto,
} from './attendance.dto.js';

@Controller()
export class AttendanceController {
  constructor(private readonly attendance: AttendanceService) {}

  @Post('class-sessions')
  createClassSession(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateClassSessionDto,
  ) {
    return this.attendance.createClassSession(user, dto);
  }

  // Asistencia diaria registrada (sin las listas por hora), para precargar y resumir.
  @Get('attendance')
  range(@CurrentUser() user: AuthUser, @Query() query: AttendanceRangeQuery) {
    return this.attendance.range(user, query);
  }

  @Post('attendance/bulk')
  @HttpCode(200)
  bulk(@CurrentUser() user: AuthUser, @Body() dto: BulkAttendanceDto) {
    return this.attendance.bulk(user, dto);
  }
}
