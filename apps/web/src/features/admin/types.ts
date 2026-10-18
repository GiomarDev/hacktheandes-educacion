import type { Role } from '@/features/auth/roles';

export interface UserRoleGrant {
  id: string;
  role: Role;
  schoolId: string | null;
  ugelId: string | null;
  dreId: string | null;
}

export interface UserAccount {
  id: string;
  documentType: 'DNI' | 'CE' | 'PASSPORT';
  documentNumber: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  roles: UserRoleGrant[];
}
