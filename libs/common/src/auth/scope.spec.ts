import { AuthUser } from './roles.js';
import { canAccessSchool, schoolIdsOf } from './scope.js';

const school = { id: 'school-a', ugelId: 'ugel-1', dreId: 'dre-1' };
const user = (roles: AuthUser['roles']): AuthUser => ({ id: 'u', name: 'U', roles });

describe('canAccessSchool', () => {
  it('MINEDU_ADMIN accede a cualquier IE', () => {
    expect(canAccessSchool(user([{ role: 'MINEDU_ADMIN' }]), school)).toBe(true);
  });

  it('DRE_SPECIALIST solo a IEs de su DRE', () => {
    expect(canAccessSchool(user([{ role: 'DRE_SPECIALIST', dreId: 'dre-1' }]), school)).toBe(true);
    expect(canAccessSchool(user([{ role: 'DRE_SPECIALIST', dreId: 'dre-2' }]), school)).toBe(false);
  });

  it('UGEL_SPECIALIST solo a IEs de su UGEL', () => {
    expect(canAccessSchool(user([{ role: 'UGEL_SPECIALIST', ugelId: 'ugel-1' }]), school)).toBe(true);
    expect(canAccessSchool(user([{ role: 'UGEL_SPECIALIST', ugelId: 'ugel-2' }]), school)).toBe(false);
  });

  it('un rol de IE solo a su IE', () => {
    expect(canAccessSchool(user([{ role: 'DIRECTOR', schoolId: 'school-a' }]), school)).toBe(true);
    expect(canAccessSchool(user([{ role: 'DIRECTOR', schoolId: 'school-b' }]), school)).toBe(false);
  });

  it('sin roles no accede', () => {
    expect(canAccessSchool(user([]), school)).toBe(false);
  });

  it('filtra por roles cuando se piden', () => {
    const teacher = user([{ role: 'TEACHER', schoolId: 'school-a' }]);
    expect(canAccessSchool(teacher, school, ['DIRECTOR', 'SECRETARY'])).toBe(false);
    expect(canAccessSchool(teacher, school, ['TEACHER'])).toBe(true);
  });
});

describe('schoolIdsOf', () => {
  it('devuelve las IEs de los roles de IE, filtrando por rol', () => {
    const u = user([
      { role: 'DIRECTOR', schoolId: 'a' },
      { role: 'TEACHER', schoolId: 'b' },
      { role: 'UGEL_SPECIALIST', ugelId: 'x' },
    ]);
    expect(schoolIdsOf(u)).toEqual(['a', 'b']);
    expect(schoolIdsOf(u, ['TEACHER'])).toEqual(['b']);
  });
});
