import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { InternalKeyGuard, Public } from '@app/common';
import { IsUUID } from 'class-validator';
import { PrismaService } from '../prisma.service.js';

class StaffQuery {
  @IsUUID() schoolId: string;
  @IsUUID() ugelId: string;
}

@Public()
@UseGuards(InternalKeyGuard)
@Controller('internal/staff')
export class InternalStaffController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list(@Query() query: StaffQuery) {
    return this.prisma.userRole.findMany({
      where: {
        user: { status: 'ACTIVE' },
        OR: [
          {
            schoolId: query.schoolId,
            role: { in: ['DIRECTOR', 'PSYCHOLOGIST'] },
          },
          { ugelId: query.ugelId, role: 'UGEL_SPECIALIST' },
        ],
      },
      select: { userId: true, role: true },
      orderBy: { userId: 'asc' },
    });
  }
}
