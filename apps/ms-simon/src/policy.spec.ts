import type { AuthUser, PlanStudentContext, Role } from '@app/common';
import {
  assignedTutor,
  planReader,
  planWriter,
  reportReader,
} from './policy.js';
const c: PlanStudentContext = {
  studentId: 'student',
  schoolId: 'ie',
  year: 2026,
  enrollmentId: 'enrollment',
  status: 'ENROLLED',
  sectionId: 'section',
  tutorUserId: 'tutor',
  teacherUserIds: ['teacher'],
};
const user = (role: Role, id = 'staff', schoolId = 'ie'): AuthUser => ({
  id,
  name: id,
  roles: [{ role, schoolId }],
});
describe('acceso a planes y reportes', () => {
  it('solo el tutor asignado tiene permisos de tutor', () => {
    expect(assignedTutor(user('TUTOR', 'tutor'), c)).toBe(true);
    expect(planReader(user('TUTOR', 'otro'), c)).toBe(false);
    expect(planWriter(user('TUTOR', 'tutor', 'otra'), c)).toBe(false);
  });
  it('el docente asignado colabora sin leer el diagnóstico', () => {
    expect(planReader(user('TEACHER', 'teacher'), c)).toBe(true);
    expect(planWriter(user('TEACHER', 'teacher'), c)).toBe(false);
    expect(planReader(user('TEACHER', 'otro'), c)).toBe(false);
  });
  it('secretaría lee sin acceso al diagnóstico y auxiliar no accede', () => {
    expect(planReader(user('SECRETARY'), c)).toBe(true);
    expect(planWriter(user('SECRETARY'), c)).toBe(false);
    expect(planReader(user('AUXILIAR'), c)).toBe(false);
  });
  it.each(['DIRECTOR', 'PSYCHOLOGIST'] as const)(
    '%s escribe solo en su IE',
    (role) => {
      expect(planWriter(user(role), c)).toBe(true);
      expect(planWriter(user(role, 'staff', 'otra'), c)).toBe(false);
    },
  );
  it('MINEDU y UGEL no heredan permisos individuales', () => {
    for (const role of [
      'MINEDU_ADMIN',
      'UGEL_SPECIALIST',
      'DRE_SPECIALIST',
    ] as const)
      expect(planReader(user(role), c)).toBe(false);
  });
  it('las claims de otra IE no amplían el acceso de un docente a reportes', () => {
    const u = user('TEACHER', 'teacher');
    u.roles.push({ role: 'DIRECTOR', schoolId: 'otra' });
    expect(reportReader(u, { id: 'ie', ugelId: 'ugel', dreId: 'dre' })).toBe(
      false,
    );
  });
});
