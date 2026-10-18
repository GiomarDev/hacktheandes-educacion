import { AuthUser, Role } from './roles.js';

export interface SchoolScope {
  id: string;
  ugelId: string;
  dreId: string;
}

export function canAccessSchool(user: AuthUser, school: SchoolScope, roles?: Role[]): boolean {
  return user.roles.some((claim) => {
    if (roles && !roles.includes(claim.role)) return false;
    switch (claim.role) {
      case 'MINEDU_ADMIN':
        return true;
      case 'DRE_SPECIALIST':
        return claim.dreId === school.dreId;
      case 'UGEL_SPECIALIST':
        return claim.ugelId === school.ugelId;
      default:
        return claim.schoolId === school.id;
    }
  });
}

export function schoolIdsOf(user: AuthUser, roles?: Role[]): string[] {
  return user.roles
    .filter((claim) => claim.schoolId && (!roles || roles.includes(claim.role)))
    .map((claim) => claim.schoolId!);
}
