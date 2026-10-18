export type Role =
  | 'MINEDU_ADMIN'
  | 'DRE_SPECIALIST'
  | 'UGEL_SPECIALIST'
  | 'DIRECTOR'
  | 'SECRETARY'
  | 'TUTOR'
  | 'TEACHER'
  | 'AUXILIAR'
  | 'PSYCHOLOGIST';

export interface RoleClaim {
  role: Role;
  schoolId?: string;
  ugelId?: string;
  dreId?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  roles: RoleClaim[];
}

const LABELS: Record<Role, string> = {
  MINEDU_ADMIN: 'MINEDU',
  DRE_SPECIALIST: 'Especialista DRE',
  UGEL_SPECIALIST: 'Especialista UGEL',
  DIRECTOR: 'Dirección',
  SECRETARY: 'Secretaría',
  TUTOR: 'Tutoría',
  TEACHER: 'Docente',
  AUXILIAR: 'Auxiliar',
  PSYCHOLOGIST: 'Psicología',
};
export const roleLabel = (role: Role) => LABELS[role];

export const CLASSROOM: Role[] = ['TUTOR', 'TEACHER', 'AUXILIAR'];
export const TERRITORIAL: Role[] = [
  'MINEDU_ADMIN',
  'DRE_SPECIALIST',
  'UGEL_SPECIALIST',
];
// Coincide con ms-alerta: quién ve alertas y casos (el personal de aula, solo de sus secciones).
const ALERT_READERS: Role[] = [
  ...TERRITORIAL,
  'DIRECTOR',
  'PSYCHOLOGIST',
  ...CLASSROOM,
];
const REPORT_USERS: Role[] = [...TERRITORIAL, 'DIRECTOR', 'SECRETARY'];
// Coincide con ms-siagie: el registro lo leen dirección, tutoría y quien dicta (el auxiliar no).
const GRADE_READERS: Role[] = ['DIRECTOR', 'SECRETARY', 'TUTOR', 'TEACHER'];
// Coinciden con ms-simon: planes para el personal de la IE (no auxiliar ni autoridades);
// visitas para quien agenda y para el docente observado.
const PLAN_READERS: Role[] = [
  'DIRECTOR',
  'PSYCHOLOGIST',
  'SECRETARY',
  'TUTOR',
  'TEACHER',
];
const VISIT_USERS: Role[] = [...TERRITORIAL, 'DIRECTOR', 'TUTOR', 'TEACHER'];
// Coincide con ms-auth: administran cuentas MINEDU, UGEL y dirección.
const ADMINS: Role[] = ['MINEDU_ADMIN', 'UGEL_SPECIALIST', 'DIRECTOR'];

export type NavIcon =
  | 'today'
  | 'classroom'
  | 'grades'
  | 'alerts'
  | 'panorama'
  | 'schools'
  | 'reports'
  | 'plans'
  | 'visits'
  | 'admin'
  | 'sources';
export interface NavItem {
  to: string;
  label: string;
  icon: NavIcon;
}

export function homeFor(claim: RoleClaim): string {
  if (CLASSROOM.includes(claim.role)) return '/docente';
  if (TERRITORIAL.includes(claim.role)) return '/panorama';
  return `/escuelas/${claim.schoolId}`;
}

export function navFor(claim: RoleClaim): NavItem[] {
  const items: NavItem[] = [];
  const { role } = claim;
  if (CLASSROOM.includes(role)) {
    items.push({ to: '/docente', label: 'Hoy', icon: 'today' });
    items.push({ to: '/docente/aula', label: 'Mi aula', icon: 'classroom' });
  } else if (TERRITORIAL.includes(role)) {
    items.push({ to: '/panorama', label: 'Panorama', icon: 'panorama' });
  } else {
    items.push({
      to: `/escuelas/${claim.schoolId}`,
      label: 'Escuela',
      icon: 'schools',
    });
    if (role !== 'PSYCHOLOGIST')
      items.push({ to: '/docente/aula', label: 'Aulas', icon: 'classroom' });
  }
  if (GRADE_READERS.includes(role))
    items.push({ to: '/notas', label: 'Notas', icon: 'grades' });
  if (ALERT_READERS.includes(role))
    items.push({ to: '/alertas', label: 'Alertas', icon: 'alerts' });
  if (TERRITORIAL.includes(role))
    items.push({ to: '/escuelas', label: 'Escuelas', icon: 'schools' });
  if (REPORT_USERS.includes(role))
    items.push({ to: '/reportes', label: 'Reportes', icon: 'reports' });
  if (PLAN_READERS.includes(role))
    items.push({ to: '/planes', label: 'Planes', icon: 'plans' });
  if (VISIT_USERS.includes(role))
    items.push({ to: '/visitas', label: 'Visitas', icon: 'visits' });
  if (role === 'MINEDU_ADMIN')
    items.push({ to: '/fuentes', label: 'Fuentes', icon: 'sources' });
  if (ADMINS.includes(role))
    items.push({ to: '/admin', label: 'Admin', icon: 'admin' });
  return items;
}
