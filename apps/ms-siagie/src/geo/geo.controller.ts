import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { CurrentUser, Roles } from '@app/common';
import type { AuthUser } from '@app/common';
import { PrismaService } from '../prisma.service.js';
import { SchoolAccessService } from '../school-access.service.js';
import { GeoService } from './geo.service.js';
import { CreateDreDto, CreateSchoolDto, CreateUgelDto, ListPeriodsQuery, ListSchoolsQuery } from './dto/geo.dto.js';

@Controller()
export class GeoController {
  constructor(
    private readonly geo: GeoService,
    private readonly access: SchoolAccessService,
    private readonly prisma: PrismaService,
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

  // Periodos académicos (bimestres o trimestres) de la IE: los usan el registro de notas y el reporte bimestral.
  @Get('schools/:id/periods')
  async listPeriods(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Query() query: ListPeriodsQuery) {
    await this.access.assertSchool(user, id);
    const periods = await this.prisma.academicPeriod.findMany({
      where: { schoolId: id, ...(query.year ? { year: query.year } : {}) },
      orderBy: [{ year: 'desc' }, { type: 'asc' }, { number: 'asc' }],
    });
    return periods.map((p) => ({
      id: p.id,
      schoolId: p.schoolId,
      year: p.year,
      type: p.type,
      number: p.number,
      startDate: p.startDate.toISOString().slice(0, 10),
      endDate: p.endDate.toISOString().slice(0, 10),
    }));
  }
}
