import { IsIn, IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class AccessEventDto {
  @IsOptional() @IsString() @Length(10, 100) token?: string;
  @IsOptional() @IsUUID() studentId?: string;
  @IsIn(['ENTRY', 'EXIT']) type: 'ENTRY' | 'EXIT';
  @IsOptional() @IsString() @Length(1, 50) deviceId?: string;
}
