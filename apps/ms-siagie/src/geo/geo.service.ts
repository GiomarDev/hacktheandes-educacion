import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { schoolIdsOf } from '@app/common';
import type { AuthUser } from '@app/common';
import { PrismaService } from '../prisma.service.js';
import { CreateDreDto, CreateSchoolDto, CreateUgelDto } from './dto/geo.dto.js';
import type { Prisma } from '../generated/prisma/client.js';

@Injectable()
export class GeoService {
  constructor(private readonly prisma: PrismaService) {}

  createDre(dto: CreateDreDto) {
    return this.prisma.dre.create({ data: dto });
  }

  async createUgel(dto: CreateUgelDto) {
    await this.prisma.dre.findUniqueOrThrow({ where: { id: dto.dreId } });
    return this.prisma.ugel.create({ data: dto });
  }

  async createSchool(user: AuthUser, dto: CreateSchoolDto) {
    const ugel = await this.prisma.ugel.findUnique({ where: { id: dto.ugelId } });
    if (!ugel) throw new NotFoundException('UGEL no encontrada');
    const allowed = user.roles.some(
      (r) => r.role === 'MINEDU_ADMIN' || (r.role === 'UGEL_SPECIALIST' && r.ugelId === ugel.id),
    );
    if (!allowed) throw new ForbiddenException('Solo puede crear IEs en su UGEL');
    return this.prisma.school.create({ data: dto });
  }

  listSchools(user: AuthUser, ugelId?: string) {
    const scopes: Prisma.SchoolWhereInput[] = [];
    for (const claim of user.roles) {
      if (claim.role === 'MINEDU_ADMIN') scopes.push({});
      else if (claim.role === 'DRE_SPECIALIST') scopes.push({ ugel: { dreId: claim.dreId } });
      else if (claim.role === 'UGEL_SPECIALIST') scopes.push({ ugelId: claim.ugelId });
    }
    const ids = schoolIdsOf(user);
    if (ids.length) scopes.push({ id: { in: ids } });
    if (!scopes.length) return [];
    return this.prisma.school.findMany({
      where: { AND: [{ OR: scopes }, ugelId ? { ugelId } : {}] },
      orderBy: { name: 'asc' },
    });
  }
}
