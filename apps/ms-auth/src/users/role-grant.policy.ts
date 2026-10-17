import type { AuthUser, Role, RoleClaim } from '@app/common';

export const SCHOOL_ROLES: Role[] = ['DIRECTOR', 'SECRETARY', 'TUTOR', 'TEACHER', 'AUXILIAR', 'PSYCHOLOGIST'];
const DIRECTOR_GRANTABLE: Role[] = ['TEACHER', 'TUTOR', 'AUXILIAR', 'SECRETARY', 'PSYCHOLOGIST'];

// target: UGEL y DRE de la IE del rol que se otorga (resueltos en ms-siagie).
export function canGrant(granter: AuthUser, grant: RoleClaim, target: { ugelId?: string; dreId?: string }): boolean {
  return granter.roles.some((claim) => {
    switch (claim.role) {
      case 'MINEDU_ADMIN':
        return true;
      case 'UGEL_SPECIALIST':
        return SCHOOL_ROLES.includes(grant.role) && !!target.ugelId && target.ugelId === claim.ugelId;
      case 'DIRECTOR':
        return DIRECTOR_GRANTABLE.includes(grant.role) && grant.schoolId === claim.schoolId;
      default:
        return false;
    }
  });
}

// Qué columna de alcance exige cada rol. Devuelve un mensaje si no cuadra.
export function scopeError(grant: RoleClaim): string | null {
  const has = { school: !!grant.schoolId, ugel: !!grant.ugelId, dre: !!grant.dreId };
  if (SCHOOL_ROLES.includes(grant.role)) return has.school && !has.ugel && !has.dre ? null : 'El rol requiere solo schoolId';
  if (grant.role === 'UGEL_SPECIALIST') return has.ugel && !has.school && !has.dre ? null : 'El rol requiere solo ugelId';
  if (grant.role === 'DRE_SPECIALIST') return has.dre && !has.school && !has.ugel ? null : 'El rol requiere solo dreId';
  return !has.school && !has.ugel && !has.dre ? null : 'MINEDU_ADMIN no lleva alcance';
}
