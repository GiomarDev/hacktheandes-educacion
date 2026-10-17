import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { CurrentUser } from '@app/common';
import type { AuthUser } from '@app/common';
import { PrismaService } from '../prisma.service.js';
import { SchoolAccessService } from '../school-access.service.js';
import { CreateSectionDto } from './sections.dto.js';

@Controller('sections')
export class SectionsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: SchoolAccessService,
  ) {}

  @Post()
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateSectionDto) {
    await this.access.assertSchool(user, dto.schoolId, ['DIRECTOR', 'SECRETARY']);
    return this.prisma.section.create({ data: dto });
  }

  @Get(':id/students')
  async students(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    await this.access.assertSection(user, id);
    return this.prisma.enrollment.findMany({
      where: { sectionId: id, status: 'ENROLLED' },
      include: { student: true },
      orderBy: [{ student: { paternalLastName: 'asc' } }, { student: { firstName: 'asc' } }],
    });
  }
}
