import { Transform } from 'class-transformer';
import { IsEmail, IsIn, IsOptional, IsString, IsUUID, Length, Matches } from 'class-validator';
import type { Role } from '@app/common';

export const ROLES: Role[] = ['MINEDU_ADMIN', 'DRE_SPECIALIST', 'UGEL_SPECIALIST', 'DIRECTOR', 'SECRETARY', 'TUTOR', 'TEACHER', 'AUXILIAR', 'PSYCHOLOGIST'];

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

// Exactamente uno: la IE, la UGEL o la DRE cuyas cuentas se listan.
export class ListUsersQuery {
  @IsOptional() @IsUUID() schoolId?: string;
  @IsOptional() @IsUUID() ugelId?: string;
  @IsOptional() @IsUUID() dreId?: string;
}

// Celular peruano: 9 dígitos que empiezan con 9, con o sin +51; se guarda como +51XXXXXXXXX.
export class UpdatePhoneDto {
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    const digits = value.replace(/[\s-]/g, '').replace(/^\+51/, '');
    return /^9\d{8}$/.test(digits) ? `+51${digits}` : value;
  })
  @IsString()
  @Matches(/^\+519\d{8}$/, { message: 'Ingrese un celular peruano de 9 dígitos que empiece con 9' })
  phone: string;
}
