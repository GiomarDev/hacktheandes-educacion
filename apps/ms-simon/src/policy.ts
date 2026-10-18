import { canAccessSchool } from '@app/common';
import type {
  AuthUser,
  PlanStudentContext,
  Role,
  SchoolScope,
} from '@app/common';

export const schoolRole = (user: AuthUser, schoolId: string, roles: Role[]) =>
  user.roles.some((r) => r.schoolId === schoolId && roles.includes(r.role));
export const authority = (user: AuthUser, school: SchoolScope) =>
  canAccessSchool(user, school, [
    'DIRECTOR',
    'UGEL_SPECIALIST',
    'DRE_SPECIALIST',
    'MINEDU_ADMIN',
  ]);
export const reportReader = (user: AuthUser, school: SchoolScope) =>
  canAccessSchool(user, school, [
    'DIRECTOR',
    'SECRETARY',
    'UGEL_SPECIALIST',
    'DRE_SPECIALIST',
    'MINEDU_ADMIN',
  ]);
export const assignedTutor = (user: AuthUser, context: PlanStudentContext) =>
  user.id === context.tutorUserId &&
  schoolRole(user, context.schoolId, ['TUTOR']);
export const assignedTeacher = (user: AuthUser, context: PlanStudentContext) =>
  context.teacherUserIds.includes(user.id) &&
  schoolRole(user, context.schoolId, ['TEACHER']);
export const planWriter = (user: AuthUser, context: PlanStudentContext) =>
  assignedTutor(user, context) ||
  schoolRole(user, context.schoolId, ['DIRECTOR', 'PSYCHOLOGIST']);
export const planReader = (user: AuthUser, context: PlanStudentContext) =>
  planWriter(user, context) ||
  assignedTeacher(user, context) ||
  schoolRole(user, context.schoolId, ['SECRETARY']);
