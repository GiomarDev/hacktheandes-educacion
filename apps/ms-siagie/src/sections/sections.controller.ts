import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { CurrentUser } from '@app/common';
import type { AuthUser, Role } from '@app/common';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma.service.js';
import {
  SCHOOL_WIDE_READERS,
  SchoolAccessService,
} from '../school-access.service.js';
import { CreateSectionDto } from './sections.dto.js';

class ListSectionsQuery {
  @IsOptional() @IsUUID() schoolId?: string;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2100)
  year?: number;
}

const CLASSROOM_STAFF: Role[] = ['TUTOR', 'TEACHER', 'AUXILIAR'];

@Controller('sections')
export class SectionsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: SchoolAccessService,
  ) {}

  @Post()
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateSectionDto) {
    await this.access.assertSchool(user, dto.schoolId, [
      'DIRECTOR',
      'SECRETARY',
    ]);
    return this.prisma.section.create({ data: dto });
  }

  // Secciones a cargo: toda la IE para dirección, secretaría, psicología y autoridades (con schoolId);
  // solo las propias para tutor, docente y auxiliar.
  @Get()
  async list(@CurrentUser() user: AuthUser, @Query() query: ListSectionsQuery) {
    const scopes: Prisma.SectionWhereInput[] = [];
    if (query.schoolId) {
      const school = await this.access.assertSchool(user, query.schoolId);
      const wide = user.roles.some(
        (r) =>
          SCHOOL_WIDE_READERS.includes(r.role) &&
          (r.role === 'MINEDU_ADMIN' ||
            r.schoolId === school.id ||
            r.ugelId === school.ugelId ||
            r.dreId === school.ugel.dreId),
      );
      if (wide) scopes.push({ schoolId: school.id });
    } else {
      const wideSchools = user.roles
        .filter((r) => SCHOOL_WIDE_READERS.includes(r.role) && r.schoolId)
        .map((r) => r.schoolId!);
      if (wideSchools.length) scopes.push({ schoolId: { in: wideSchools } });
    }
    const staffSchools = user.roles
      .filter((r) => CLASSROOM_STAFF.includes(r.role) && r.schoolId)
      .map((r) => r.schoolId!);
    if (staffSchools.length)
      scopes.push({
        schoolId: { in: staffSchools },
        OR: [
          { tutorUserId: user.id },
          { auxiliarUserId: user.id },
          { teachingAssignments: { some: { teacherUserId: user.id } } },
        ],
      });
    if (!scopes.length) return [];
    const sections = await this.prisma.section.findMany({
      where: {
        AND: [
          { OR: scopes },
          query.schoolId ? { schoolId: query.schoolId } : {},
          query.year ? { year: query.year } : {},
        ],
      },
      include: {
        school: { select: { id: true, name: true, modularCode: true } },
        _count: { select: { enrollments: { where: { status: 'ENROLLED' } } } },
      },
      orderBy: [{ year: 'desc' }, { grade: 'asc' }, { name: 'asc' }],
    });
    return sections.map(({ _count, ...s }) => ({
      ...s,
      enrolledCount: _count.enrollments,
    }));
  }

  @Get(':id/students')
  async students(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const section = await this.access.assertSection(user, id);
    await this.access.assertSectionReader(user, section);
    return this.prisma.enrollment.findMany({
      where: { sectionId: id, status: 'ENROLLED' },
      include: { student: true },
      orderBy: [
        { student: { paternalLastName: 'asc' } },
        { student: { firstName: 'asc' } },
      ],
    });
  }

  // Áreas que se dictan en la sección, con sus competencias; "mine" marca las que dicta el usuario.
  @Get(':id/areas')
  async areas(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const section = await this.access.assertSection(user, id);
    await this.access.assertSectionReader(user, section);
    const assignments = await this.prisma.teachingAssignment.findMany({
      where: { sectionId: id },
      include: {
        area: {
          include: {
            competencies: {
              select: { id: true, code: true, name: true },
              orderBy: { code: 'asc' },
            },
          },
        },
      },
      orderBy: { area: { name: 'asc' } },
    });
    const areas = new Map<
      string,
      (typeof assignments)[number]['area'] & {
        teacherUserIds: string[];
        mine: boolean;
      }
    >();
    for (const a of assignments) {
      const area = areas.get(a.areaId) ?? {
        ...a.area,
        teacherUserIds: [],
        mine: false,
      };
      area.teacherUserIds.push(a.teacherUserId);
      area.mine ||= a.teacherUserId === user.id;
      areas.set(a.areaId, area);
    }
    return [...areas.values()].map(
      ({ id, code, name, level, competencies, teacherUserIds, mine }) => ({
        id,
        code,
        name,
        level,
        competencies,
        teacherUserIds,
        mine,
      }),
    );
  }
}
