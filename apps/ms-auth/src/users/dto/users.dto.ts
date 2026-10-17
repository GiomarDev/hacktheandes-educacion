import { IsEmail, IsIn, IsOptional, IsString, IsUUID, Length } from 'class-validator';
import type { Role } from '@app/common';

const ROLES: Role[] = ['MINEDU_ADMIN', 'DRE_SPECIALIST', 'UGEL_SPECIALIST', 'DIRECTOR', 'SECRETARY', 'TUTOR', 'TEACHER', 'AUXILIAR', 'PSYCHOLOGIST'];

export class CreateUserDto {
  @IsIn(['DNI', 'CE', 'PASSPORT']) documentType: 'DNI' | 'CE' | 'PASSPORT';
  @IsString() @Length(6, 15) documentNumber: string;
  @IsString() @Length(1, 100) firstName: string;
  @IsString() @Length(1, 100) lastName: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() @Length(6, 20) phone?: string;
  @IsString() @Length(10, 128) temporaryPassword: string;
}

export class GrantRoleDto {
  @IsIn(ROLES) role: Role;
  @IsOptional() @IsUUID() schoolId?: string;
  @IsOptional() @IsUUID() ugelId?: string;
  @IsOptional() @IsUUID() dreId?: string;
}
