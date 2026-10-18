import { ForbiddenException, Injectable } from '@nestjs/common';
import { canAccessSchool } from '@app/common';
import type { AuthUser } from '@app/common';
import { SiagieClient } from './clients.js';

@Injectable()
export class ScopeService {
  constructor(private readonly siagie: SiagieClient) {}
  async assertSchool(user: AuthUser, schoolId: string) {
    const school = await this.siagie.school(schoolId);
    if (!canAccessSchool(user, school))
      throw new ForbiddenException('No tiene acceso a esta IE');
    return school;
  }
  async filter(user: AuthUser): Promise<{ schoolId?: { in: string[] } }> {
    if (user.roles.some((r) => r.role === 'MINEDU_ADMIN')) return {};
    const ids = new Set(
      user.roles.flatMap((r) => (r.schoolId ? [r.schoolId] : [])),
    );
    for (const claim of user.roles) {
      const query =
        claim.role === 'UGEL_SPECIALIST' && claim.ugelId
          ? `ugelId=${claim.ugelId}`
          : claim.role === 'DRE_SPECIALIST' && claim.dreId
            ? `dreId=${claim.dreId}`
            : null;
      if (query)
        for (const school of await this.siagie.schoolIds(query))
          ids.add(school.id);
    }
    return { schoolId: { in: [...ids] } };
  }
  async assertManage(
    user: AuthUser,
    record: { schoolId: string; ownerUserId: string },
  ) {
    const school = await this.assertSchool(user, record.schoolId);
    if (
      record.ownerUserId === user.id ||
      user.roles.some(
        (r) =>
          r.role === 'MINEDU_ADMIN' ||
          (r.role === 'DIRECTOR' && r.schoolId === record.schoolId) ||
          (r.role === 'UGEL_SPECIALIST' && r.ugelId === school.ugelId) ||
          (r.role === 'DRE_SPECIALIST' && r.dreId === school.dreId),
      )
    )
      return;
    throw new ForbiddenException(
      'Solo el responsable o la autoridad de su ámbito puede gestionar el caso',
    );
  }
}
