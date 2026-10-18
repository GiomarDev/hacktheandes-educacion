import { Body, Controller, Get, HttpCode, Post, Query } from '@nestjs/common';
import { CurrentUser } from '@app/common';
import type { AuthUser } from '@app/common';
import { GradesService } from './grades.service.js';
import { GradeEntryDto, GradeSheetQuery } from './grades.dto.js';

@Controller('grades')
export class GradesController {
  constructor(private readonly grades: GradesService) {}

  @Post('entries')
  @HttpCode(200)
  record(@CurrentUser() user: AuthUser, @Body() dto: GradeEntryDto) {
    return this.grades.recordEntry(user, dto);
  }

  @Get()
  sheet(@CurrentUser() user: AuthUser, @Query() query: GradeSheetQuery) {
    return this.grades.sheet(user, query);
  }
}
