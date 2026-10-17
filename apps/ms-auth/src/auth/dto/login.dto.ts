import { IsIn, IsOptional, IsString, Length } from 'class-validator';

export class LoginDto {
  @IsOptional()
  @IsIn(['DNI', 'CE', 'PASSPORT'])
  documentType: 'DNI' | 'CE' | 'PASSPORT' = 'DNI';

  @IsString()
  @Length(6, 15)
  documentNumber: string;

  @IsString()
  @Length(1, 128)
  password: string;
}
