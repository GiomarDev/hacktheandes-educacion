import { Type } from 'class-transformer';
import { ArrayMaxSize, IsBoolean, IsDateString, IsIn, IsOptional, IsString, Length, Matches, ValidateNested } from 'class-validator';

const DOC_TYPES = ['DNI', 'CE', 'PASSPORT'] as const;
type DocType = (typeof DOC_TYPES)[number];

export class GuardianInputDto {
  @IsIn(DOC_TYPES) documentType: DocType;
  @IsString() @Length(6, 15) documentNumber: string;
  @IsString() @Length(1, 100) firstName: string;
  @IsString() @Length(1, 100) lastName: string;
  @Matches(/^\+\d{8,15}$/) phone: string;
  @IsBoolean() whatsappOptIn: boolean;
  @IsIn(['WHATSAPP', 'SMS', 'CALL']) preferredChannel: 'WHATSAPP' | 'SMS' | 'CALL';
  @IsIn(['MOTHER', 'FATHER', 'GRANDPARENT', 'SIBLING', 'OTHER'])
  relationship: 'MOTHER' | 'FATHER' | 'GRANDPARENT' | 'SIBLING' | 'OTHER';
  @IsBoolean() isPrimary: boolean;
  @IsBoolean() receivesAlerts: boolean;
}

export class CreateStudentDto {
  @IsString() @Length(1, 20) studentCode: string;
  @IsIn(DOC_TYPES) documentType: DocType;
  @IsString() @Length(6, 15) documentNumber: string;
  @IsString() @Length(1, 100) firstName: string;
  @IsString() @Length(1, 100) paternalLastName: string;
  @IsString() @Length(1, 100) maternalLastName: string;
  @IsDateString({ strict: true }) birthDate: string;
  @IsIn(['F', 'M']) sex: 'F' | 'M';
  @IsOptional() @IsString() @Length(1, 50) motherTongue?: string;
  @IsBoolean() hasSpecialNeeds: boolean;
  @ValidateNested({ each: true }) @Type(() => GuardianInputDto) @ArrayMaxSize(5) guardians: GuardianInputDto[];
}
