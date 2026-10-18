import { IsDateString, IsIn, IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class CreateEnrollmentDto {
  @IsUUID() studentId: string;
  @IsUUID() sectionId: string;
  @IsDateString({ strict: true }) enrolledAt: string;
}

export class UpdateEnrollmentStatusDto {
  @IsIn(['ENROLLED', 'TRANSFERRED_OUT', 'WITHDRAWN', 'COMPLETED', 'DECEASED'])
  status: 'ENROLLED' | 'TRANSFERRED_OUT' | 'WITHDRAWN' | 'COMPLETED' | 'DECEASED';

  @IsOptional() @IsString() @Length(3, 250) statusReason?: string;
}
