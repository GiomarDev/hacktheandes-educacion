import { Type } from 'class-transformer';
import {
  IsArray,
  ArrayMaxSize,
  ArrayNotEmpty,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  Matches,
} from 'class-validator';
import { SchoolYearQuery } from '@app/common';
export class ListQuery {
  @IsOptional() @IsUUID() schoolId?: string;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2100)
  year?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 50;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) offset = 0;
}
export class GenerateReportDto extends SchoolYearQuery {
  @IsIn([
    'MONTHLY_FOLLOWUP',
    'BIMESTER_ATTENDANCE',
    'ATTENTION_GOAL',
    'DROPOUT_JUSTIFICATION',
  ])
  type:
    | 'MONTHLY_FOLLOWUP'
    | 'BIMESTER_ATTENDANCE'
    | 'ATTENTION_GOAL'
    | 'DROPOUT_JUSTIFICATION';
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(12) month?: number;
  @IsOptional() @IsUUID() periodId?: string;
}
export class RevisionDto {
  @IsInt() @Min(1) revision: number;
}
export class ReviewReportDto extends RevisionDto {
  @IsIn(['REVIEWED', 'OBSERVED']) status: 'REVIEWED' | 'OBSERVED';
  @ValidateIf((o) => o.status === 'OBSERVED' || o.notes !== undefined)
  @IsString()
  @Matches(/\S/)
  @MaxLength(4000)
  notes?: string;
}
export class PlanContentDto {
  @IsString() @Matches(/\S/) @MaxLength(10000) barriers: string;
  @ValidateIf((o) => o.diagnosis !== undefined)
  @IsString()
  @MaxLength(10000)
  diagnosis?: string;
  @IsOptional() @IsString() @MaxLength(10000) strengths?: string;
}
export class CreatePlanDto extends PlanContentDto {
  @IsUUID() schoolId: string;
  @IsUUID() studentId: string;
  @IsInt() @Min(1900) @Max(2100) year: number;
}
export class PlanStatusDto {
  @IsIn(['ACTIVE', 'ARCHIVED']) status: 'ACTIVE' | 'ARCHIVED';
}
export class VersionContentDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @Matches(/\S/, { each: true })
  @MaxLength(2000, { each: true })
  goals: string[];
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @MaxLength(2000, { each: true })
  adjustments: string[];
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @Matches(/\S/, { each: true })
  @MaxLength(2000, { each: true })
  strategies: string[];
  @IsOptional() @IsString() @MaxLength(10000) progressNotes?: string;
}
export class CreateVersionDto extends VersionContentDto {
  @IsUUID() periodId: string;
}
export class CreateVisitDto {
  @IsUUID() schoolId: string;
  @IsUUID() sectionId: string;
  @IsUUID() observedTeacherUserId: string;
  @IsDateString({ strict: true })
  @Matches(/T.*(?:Z|[+-]\d{2}:\d{2})$/)
  visitedAt: string;
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/)
  @MaxLength(20)
  protocolVersion: string;
}
export class UpdateVisitDto {
  @IsIn(['DONE', 'FEEDBACK_GIVEN']) status: 'DONE' | 'FEEDBACK_GIVEN';
  @ValidateIf((o) => o.status === 'DONE' || o.observations !== undefined)
  @IsString()
  @Matches(/\S/)
  @MaxLength(10000)
  observations?: string;
  @ValidateIf((o) => o.status === 'FEEDBACK_GIVEN' || o.feedback !== undefined)
  @IsString()
  @Matches(/\S/)
  @MaxLength(10000)
  feedback?: string;
  @ValidateIf(
    (o) =>
      o.status === 'FEEDBACK_GIVEN' || o.improvementCommitment !== undefined,
  )
  @IsString()
  @Matches(/\S/)
  @MaxLength(10000)
  improvementCommitment?: string;
}

export class ApproveVersionDto {
  @IsDateString({ strict: true }) expectedUpdatedAt: string;
}
