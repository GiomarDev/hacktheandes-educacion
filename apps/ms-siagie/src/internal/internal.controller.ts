import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { InternalKeyGuard, Public } from '@app/common';
import { PrismaService } from '../prisma.service.js';

// Consultas de otros servicios (por ejemplo, ms-auth al otorgar un rol). Sin JWT, con llave interna.
@Public()
@UseGuards(InternalKeyGuard)
@Controller('internal')
export class InternalController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('schools/:id')
  async school(@Param('id', ParseUUIDPipe) id: string) {
    const school = await this.prisma.school.findUnique({
      where: { id },
      include: { ugel: true },
    });
    if (!school) throw new NotFoundException('IE no encontrada');
    return {
      id: school.id,
      ugelId: school.ugelId,
      dreId: school.ugel.dreId,
    };
  }

  @Get('ugels/:id')
  async ugel(@Param('id', ParseUUIDPipe) id: string) {
    const ugel = await this.prisma.ugel.findUnique({ where: { id } });
    if (!ugel) throw new NotFoundException('UGEL no encontrada');
    return { id: ugel.id, dreId: ugel.dreId };
  }

  // Secciones a cargo de una persona (tutoría, auxiliar o carga docente): ms-alerta filtra casos con esto.
  @Get('staff/:userId/sections')
  async staffSections(@Param('userId', ParseUUIDPipe) userId: string) {
    const sections = await this.prisma.section.findMany({
      where: {
        OR: [
          { tutorUserId: userId },
          { auxiliarUserId: userId },
          { teachingAssignments: { some: { teacherUserId: userId } } },
        ],
      },
      select: { id: true },
    });
    return sections.map((s) => s.id);
  }

  @Get('dres/:id')
  async dre(@Param('id', ParseUUIDPipe) id: string) {
    const dre = await this.prisma.dre.findUnique({ where: { id } });
    if (!dre) throw new NotFoundException('DRE no encontrada');
    return { id: dre.id };
  }
}
