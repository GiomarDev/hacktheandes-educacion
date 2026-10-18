import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class ListQuery {
  @IsOptional() @IsUUID() schoolId?: string;
  @IsOptional()
  @IsIn([
    'OPEN',
    'ACKNOWLEDGED',
    'RESOLVED',
    'DISMISSED',
    'CONTACTING',
    'CONTACTED',
    'REFERRED',
    'CLOSED_RETURNED',
    'CLOSED_TRANSFERRED',
    'CLOSED_DROPPED_OUT',
  ])
  status?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 50;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) offset = 0;
}
export class AlertStatusDto {
  @IsIn(['ACKNOWLEDGED', 'RESOLVED', 'DISMISSED']) status:
    'ACKNOWLEDGED' | 'RESOLVED' | 'DISMISSED';
}
export class CaseActionDto {
  @IsIn([
    'NOTE',
    'CALL',
    'MEETING',
    'REFERRAL_PSYCHOLOGIST',
    'REFERRAL_DEMUNA',
    'REFERRAL_CEM',
    'REFERRAL_JUNTOS',
    'STATUS_CHANGE',
  ])
  type:
    | 'NOTE'
    | 'CALL'
    | 'MEETING'
    | 'REFERRAL_PSYCHOLOGIST'
    | 'REFERRAL_DEMUNA'
    | 'REFERRAL_CEM'
    | 'REFERRAL_JUNTOS'
    | 'STATUS_CHANGE';
  @IsString() @Length(1, 2000) @Matches(/\S/) notes: string;
  @IsOptional()
  @IsIn([
    'CONTACTING',
    'REFERRED',
    'CLOSED_RETURNED',
    'CLOSED_TRANSFERRED',
    'CLOSED_DROPPED_OUT',
  ])
  status?:
    | 'CONTACTING'
    | 'REFERRED'
    | 'CLOSED_RETURNED'
    | 'CLOSED_TRANSFERRED'
    | 'CLOSED_DROPPED_OUT';
}
export class SendMessageDto {
  @IsUUID() requestId: string;
  @IsOptional() @IsString() @Length(1, 2000) @Matches(/\S/) body?: string;
}
const REASONS = [
  'HEALTH',
  'WORK',
  'MOVING',
  'ECONOMIC',
  'BULLYING',
  'FAMILY',
  'ACADEMIC',
  'MIGRATION',
  'OTHER',
] as const;
export class GuardianResponseDto {
  @IsUUID() providerEventId: string;
  @IsString() @Length(1, 100) providerMessageId: string;
  @IsString() @Length(1, 2000) @Matches(/\S/) rawText: string;
  @IsOptional() @IsIn(REASONS) classifiedReason?: (typeof REASONS)[number];
}
export class CreateRuleDto {
  @IsString() @Length(1, 40) @Matches(/^[A-Z0-9_]+$/) code: string;
  @IsIn([
    'ABSENCES_IN_WINDOW',
    'CONSECUTIVE_ABSENCES',
    'LATE_COUNT',
    'SECTION_SILENT',
    'GRADE_WITHOUT_ATTENDANCE',
    'LEFT_WITHOUT_EXIT',
    'ATTENTION_GOAL_GAP',
  ])
  type:
    | 'ABSENCES_IN_WINDOW'
    | 'CONSECUTIVE_ABSENCES'
    | 'LATE_COUNT'
    | 'SECTION_SILENT'
    | 'GRADE_WITHOUT_ATTENDANCE'
    | 'LEFT_WITHOUT_EXIT'
    | 'ATTENTION_GOAL_GAP';
  @IsObject() params: Record<string, number>;
  @IsIn(['LOW', 'MEDIUM', 'HIGH']) severity: 'LOW' | 'MEDIUM' | 'HIGH';
  @IsOptional() @IsUUID() schoolId?: string;
}
export class UpdateRuleDto {
  @IsOptional() @IsObject() params?: Record<string, number>;
  @IsOptional() @IsIn(['LOW', 'MEDIUM', 'HIGH']) severity?:
    'LOW' | 'MEDIUM' | 'HIGH';
  @IsOptional() @IsBoolean() isActive?: boolean;
}
