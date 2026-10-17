import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { CurrentUser, Roles } from '@app/common';
import type { AuthUser } from '@app/common';
import { SchoolAccessService } from '../school-access.service.js';
import { GeoService } from './geo.service.js';
import { CreateDreDto, CreateSchoolDto, CreateUgelDto, ListSchoolsQuery } from './dto/geo.dto.js';

@Controller()
export class GeoController {
  constructor(
    private readonly geo: GeoService,
    private readonly access: SchoolAccessService,
  ) {}

  @Post('dres')
  @Roles('MINEDU_ADMIN')
  createDre(@Body() dto: CreateDreDto) {
    return this.geo.createDre(dto);
  }

  @Post('ugels')
  @Roles('MINEDU_ADMIN')
  createUgel(@Body() dto: CreateUgelDto) {
    return this.geo.createUgel(dto);
  }

  @Post('schools')
  @Roles('MINEDU_ADMIN', 'UGEL_SPECIALIST')
  createSchool(@CurrentUser() user: AuthUser, @Body() dto: CreateSchoolDto) {
    return this.geo.createSchool(user, dto);
  }

  @Get('schools')
  listSchools(@CurrentUser() user: AuthUser, @Query() query: ListSchoolsQuery) {
    return this.geo.listSchools(user, query.ugelId);
  }

  @Get('schools/:id')
  getSchool(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.access.assertSchool(user, id);
  }
}
