import { SetMetadata } from '@nestjs/common';
import { Role } from './roles.js';

export const IS_PUBLIC = 'auth:isPublic';
export const ROLES = 'auth:roles';

export const Public = () => SetMetadata(IS_PUBLIC, true);
export const Roles = (...roles: Role[]) => SetMetadata(ROLES, roles);
