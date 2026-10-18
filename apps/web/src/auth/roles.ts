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

export type NavIcon =
  | 'today'
  | 'classroom'
  | 'grades'
  | 'alerts'
  | 'panorama'
  | 'schools'
  | 'reports'
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
  if (role === 'MINEDU_ADMIN')
    items.push({ to: '/fuentes', label: 'Fuentes', icon: 'sources' });
  return items;
}
