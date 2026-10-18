import { ForbiddenException, Injectable } from '@nestjs/common';
import { canAccessSchool } from '@app/common';
import type { AuthUser } from '@app/common';
import { SourcesClient } from './clients.js';
@Injectable()
export class ScopeService {
  constructor(private readonly sources: SourcesClient) {}
  async school(user: AuthUser, id: string) {
    const school = await this.sources.school(id);
    if (!canAccessSchool(user, school))
      throw new ForbiddenException('No tiene acceso a esta IE');
    return school;
  }
  async filter(user: AuthUser) {
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
        for (const school of await this.sources.schoolIds(query))
          ids.add(school.id);
    }
    return { schoolId: { in: [...ids] } };
  }
}
