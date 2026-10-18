import type { AuthUser, RoleClaim } from '@app/common';
import { canGrant, canViewScope } from './role-grant.policy.js';

const as = (roles: RoleClaim[]): AuthUser => ({ id: 'granter', name: 'G', roles });
const inUgel1 = { ugelId: 'ugel-1', dreId: 'dre-1' };

describe('canGrant', () => {
  it('MINEDU_ADMIN otorga cualquier rol', () => {
    expect(canGrant(as([{ role: 'MINEDU_ADMIN' }]), { role: 'UGEL_SPECIALIST', ugelId: 'ugel-9' }, {})).toBe(true);
  });

  it('UGEL_SPECIALIST otorga roles de IE en IEs de su UGEL', () => {
    const ugel = as([{ role: 'UGEL_SPECIALIST', ugelId: 'ugel-1' }]);
    expect(canGrant(ugel, { role: 'DIRECTOR', schoolId: 's1' }, inUgel1)).toBe(true);
    expect(canGrant(ugel, { role: 'DIRECTOR', schoolId: 's2' }, { ugelId: 'ugel-2', dreId: 'dre-1' })).toBe(false);
  });

  it('UGEL_SPECIALIST no otorga roles territoriales', () => {
    const ugel = as([{ role: 'UGEL_SPECIALIST', ugelId: 'ugel-1' }]);
    expect(canGrant(ugel, { role: 'UGEL_SPECIALIST', ugelId: 'ugel-1' }, { dreId: 'dre-1' })).toBe(false);
  });

  it('DIRECTOR otorga roles de personal en su IE', () => {
    const director = as([{ role: 'DIRECTOR', schoolId: 's1' }]);
    for (const role of ['TEACHER', 'TUTOR', 'AUXILIAR', 'SECRETARY', 'PSYCHOLOGIST'] as const) {
      expect(canGrant(director, { role, schoolId: 's1' }, inUgel1)).toBe(true);
    }
  });

  it('DIRECTOR no otorga DIRECTOR ni roles en otra IE', () => {
    const director = as([{ role: 'DIRECTOR', schoolId: 's1' }]);
    expect(canGrant(director, { role: 'DIRECTOR', schoolId: 's1' }, inUgel1)).toBe(false);
    expect(canGrant(director, { role: 'TEACHER', schoolId: 's2' }, inUgel1)).toBe(false);
  });

  it('un docente no otorga nada', () => {
    expect(canGrant(as([{ role: 'TEACHER', schoolId: 's1' }]), { role: 'TEACHER', schoolId: 's1' }, inUgel1)).toBe(false);
  });
});

describe('canViewScope', () => {
  it('la DRE ve IEs y UGELs de su región', () => {
    const dre = as([{ role: 'DRE_SPECIALIST', dreId: 'dre-1' }]);
    expect(canViewScope(dre, { schoolId: 's1' }, inUgel1)).toBe(true);
    expect(canViewScope(dre, { ugelId: 'ugel-1' }, inUgel1)).toBe(true);
    expect(canViewScope(dre, { dreId: 'dre-2' }, { dreId: 'dre-2' })).toBe(false);
  });

  it('la UGEL no ve la DRE aunque sea la suya', () => {
    const ugel = as([{ role: 'UGEL_SPECIALIST', ugelId: 'ugel-1' }]);
    expect(canViewScope(ugel, { dreId: 'dre-1' }, { dreId: 'dre-1' })).toBe(false);
  });

  it('la dirección solo ve su IE', () => {
    const director = as([{ role: 'DIRECTOR', schoolId: 's1' }]);
    expect(canViewScope(director, { schoolId: 's1' }, inUgel1)).toBe(true);
    expect(canViewScope(director, { schoolId: 's2' }, inUgel1)).toBe(false);
    expect(canViewScope(director, { ugelId: 'ugel-1' }, inUgel1)).toBe(false);
  });
});
