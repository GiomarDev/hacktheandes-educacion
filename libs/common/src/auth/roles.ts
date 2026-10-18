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

export const JWT_ISSUER = 'hacktheandes-auth';
