import { IsIn } from 'class-validator';
import type { Role } from '@app/common';
import { ROLES } from '../../users/dto/users.dto.js';

export class OnboardingDto {
  @IsIn(ROLES) role: Role;
}
