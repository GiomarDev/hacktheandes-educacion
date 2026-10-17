import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsDateString, IsIn, IsInt, IsOptional, IsString, IsUUID, Length, Max, Min, ValidateNested } from 'class-validator';

export const ATTENDANCE_STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'JUSTIFIED', 'LEFT_EARLY'] as const;
export type AttendanceStatusValue = (typeof ATTENDANCE_STATUSES)[number];

export class CreateClassSessionDto {
  @IsUUID() sectionId: string;
  @IsOptional() @IsUUID() areaId?: string;
  @IsDateString({ strict: true }) date: string;
  @IsInt() @Min(1) @Max(8) periodNumber: number;
}

export class AttendanceItemDto {
  @IsUUID() enrollmentId: string;
  @IsIn(ATTENDANCE_STATUSES) status: AttendanceStatusValue;
  @IsOptional() @IsString() @Length(1, 250) justification?: string;
}

export class BulkAttendanceDto {
  @IsUUID() sectionId: string;
  @IsDateString({ strict: true }) date: string;
  @IsOptional() @IsUUID() classSessionId?: string;
  @ValidateNested({ each: true }) @Type(() => AttendanceItemDto) @ArrayMinSize(1) @ArrayMaxSize(60)
  records: AttendanceItemDto[];
}
