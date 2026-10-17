import { BadRequestException, ForbiddenException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import argon2 from 'argon2';
import type { AuthUser } from '@app/common';
import { PrismaService } from '../prisma.service.js';
import { SiagieClient } from '../siagie/siagie.client.js';
import { canGrant, scopeError } from './role-grant.policy.js';
import { CreateUserDto, GrantRoleDto } from './dto/users.dto.js';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly siagie: SiagieClient,
  ) {}

  async create(dto: CreateUserDto): Promise<{ id: string }> {
    const { temporaryPassword, ...data } = dto;
    const user = await this.prisma.user.create({
      data: {
        ...data,
        passwordHash: await argon2.hash(temporaryPassword, { type: argon2.argon2id }),
        mustChangePassword: true,
      },
      select: { id: true },
    });
    return user;
  }

  async grantRole(granter: AuthUser, userId: string, grant: GrantRoleDto) {
    const isAdmin = granter.roles.some((r) => r.role === 'MINEDU_ADMIN');
    if (userId === granter.id && !isAdmin) throw new ForbiddenException('No puede otorgarse roles a sí mismo');
    const error = scopeError(grant);
    if (error) throw new BadRequestException(error);
    await this.prisma.user.findUniqueOrThrow({ where: { id: userId } }).catch(() => {
      throw new NotFoundException('Usuario no encontrado');
    });

    const target = await this.resolveTarget(grant);
    if (!canGrant(granter, grant, target)) throw new ForbiddenException('No puede otorgar este rol');

    return this.prisma.userRole.create({
      data: { userId, role: grant.role, schoolId: grant.schoolId, ugelId: grant.ugelId, dreId: grant.dreId },
    });
  }

  async revokeRole(granter: AuthUser, userId: string, roleId: string): Promise<void> {
    const role = await this.prisma.userRole.findFirst({ where: { id: roleId, userId } });
    if (!role) throw new NotFoundException('Rol no encontrado');
    const claim = { role: role.role, schoolId: role.schoolId ?? undefined, ugelId: role.ugelId ?? undefined, dreId: role.dreId ?? undefined };
    if (!canGrant(granter, claim, await this.resolveTarget(claim))) throw new ForbiddenException('No puede quitar este rol');
    await this.prisma.userRole.update({ where: { id: roleId }, data: { isActive: false } });
  }

  // Verifica en ms-siagie que el alcance existe y devuelve su UGEL y DRE para la política.
  private async resolveTarget(grant: { schoolId?: string; ugelId?: string; dreId?: string }) {
    if (grant.schoolId) {
      const school = await this.siagie.getSchool(grant.schoolId);
      if (!school) throw new UnprocessableEntityException('La IE no existe');
      return { ugelId: school.ugelId, dreId: school.dreId };
    }
    if (grant.ugelId) {
      const ugel = await this.siagie.getUgel(grant.ugelId);
      if (!ugel) throw new UnprocessableEntityException('La UGEL no existe');
      return { ugelId: ugel.id, dreId: ugel.dreId };
    }
    if (grant.dreId) {
      const dre = await this.siagie.getDre(grant.dreId);
      if (!dre) throw new UnprocessableEntityException('La DRE no existe');
      return { dreId: dre.id };
    }
    return {};
  }
}
