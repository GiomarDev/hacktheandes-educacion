import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '@app/common';
import type { AuthUser } from '@app/common';
import { ReportsService } from './reports.service.js';
import { PlansService } from './plans.service.js';
import { VisitsService } from './visits.service.js';
import {
  ApproveVersionDto,
  CreatePlanDto,
  CreateVersionDto,
  CreateVisitDto,
  GenerateReportDto,
  ListQuery,
  PlanContentDto,
  PlanStatusDto,
  ReviewReportDto,
  RevisionDto,
  UpdateVisitDto,
  VersionContentDto,
} from './api.dto.js';
@Controller()
export class ApiController {
  constructor(
    private readonly reports: ReportsService,
    private readonly plans: PlansService,
    private readonly visits: VisitsService,
  ) {}
  @Get('reports') reportList(
    @CurrentUser() u: AuthUser,
    @Query() q: ListQuery,
  ) {
    return this.reports.list(u, q);
  }
  @Get('reports/:id') reportDetail(
    @CurrentUser() u: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.reports.detail(u, id);
  }
  @Post('reports/generate') generate(
    @CurrentUser() u: AuthUser,
    @Body() dto: GenerateReportDto,
  ) {
    return this.reports.generate(u, dto);
  }
  @Post('reports/:id/submit') @HttpCode(200) submit(
    @CurrentUser() u: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RevisionDto,
  ) {
    return this.reports.transition(u, id, dto.revision);
  }
  @Post('reports/:id/review') @HttpCode(200) review(
    @CurrentUser() u: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewReportDto,
  ) {
    return this.reports.transition(u, id, dto.revision, dto);
  }
  @Get('support-plans') planList(
    @CurrentUser() u: AuthUser,
    @Query() q: ListQuery,
  ) {
    return this.plans.list(u, q);
  }
  @Get('support-plans/:id') planDetail(
    @CurrentUser() u: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.plans.detail(u, id);
  }
  @Post('support-plans') createPlan(
    @CurrentUser() u: AuthUser,
    @Body() dto: CreatePlanDto,
  ) {
    return this.plans.create(u, dto);
  }
  @Patch('support-plans/:id') updatePlan(
    @CurrentUser() u: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PlanContentDto,
  ) {
    return this.plans.update(u, id, dto);
  }
  @Patch('support-plans/:id/status') planStatus(
    @CurrentUser() u: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PlanStatusDto,
  ) {
    return this.plans.status(u, id, dto.status);
  }
  @Post('support-plans/:id/versions') createVersion(
    @CurrentUser() u: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateVersionDto,
  ) {
    return this.plans.version(u, id, dto);
  }
  @Patch('support-plans/:id/versions/:versionId') updateVersion(
    @CurrentUser() u: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('versionId', ParseUUIDPipe) versionId: string,
    @Body() dto: VersionContentDto,
  ) {
    return this.plans.version(u, id, dto, versionId);
  }
  @Post('support-plans/:id/versions/:versionId/approve') @HttpCode(200) approve(
    @CurrentUser() u: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('versionId', ParseUUIDPipe) versionId: string,
    @Body() dto: ApproveVersionDto,
  ) {
    return this.plans.approve(u, id, versionId, dto.expectedUpdatedAt);
  }
  @Get('monitoring-visits') visitList(
    @CurrentUser() u: AuthUser,
    @Query() q: ListQuery,
  ) {
    return this.visits.list(u, q);
  }
  @Get('monitoring-visits/:id') visitDetail(
    @CurrentUser() u: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.visits.detail(u, id);
  }
  @Post('monitoring-visits') createVisit(
    @CurrentUser() u: AuthUser,
    @Body() dto: CreateVisitDto,
  ) {
    return this.visits.create(u, dto);
  }
  @Patch('monitoring-visits/:id') updateVisit(
    @CurrentUser() u: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVisitDto,
  ) {
    return this.visits.update(u, id, dto);
  }
}
