import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CurrentUser, Roles } from '@app/common';
import type { AuthUser } from '@app/common';
import { ImportDto, IndicatorQuery } from './api.dto.js';
import { ImportsService } from './imports.service.js';
import { IndicatorsService } from './indicators.service.js';

@Controller()
export class ApiController {
  constructor(
    private readonly imports: ImportsService,
    private readonly indicators: IndicatorsService,
  ) {}
  @Roles('MINEDU_ADMIN') @Post('imports') importDataset(
    @CurrentUser() u: AuthUser,
    @Body() dto: ImportDto,
  ) {
    return this.imports.import(u, dto);
  }
  @Roles('MINEDU_ADMIN') @Get('imports') importList() {
    return this.imports.list();
  }
  @Get('indicator-definitions') definitions() {
    return this.indicators.definitions();
  }
  @Get('indicators') indicatorList(
    @CurrentUser() u: AuthUser,
    @Query() q: IndicatorQuery,
  ) {
    return this.indicators.list(u, q);
  }
}
