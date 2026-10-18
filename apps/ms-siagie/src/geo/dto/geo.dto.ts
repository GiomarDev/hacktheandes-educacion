import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, IsUUID, Length, Matches, Max, Min } from 'class-validator';

export class CreateDreDto {
  @IsString() @Length(1, 10) code: string;
  @IsString() @Length(1, 150) name: string;
  @IsString() @Length(1, 60) department: string;
}

export class CreateUgelDto {
  @IsString() @Length(1, 10) code: string;
  @IsString() @Length(1, 150) name: string;
  @IsUUID() dreId: string;
}

export class CreateSchoolDto {
  @Matches(/^\d{7}$/) modularCode: string;
  @IsOptional() @IsString() @Length(1, 10) localCode?: string;
  @IsString() @Length(1, 200) name: string;
  @IsIn(['INITIAL', 'PRIMARY', 'SECONDARY']) level: 'INITIAL' | 'PRIMARY' | 'SECONDARY';
  @IsIn(['PUBLIC', 'PRIVATE', 'PUBLIC_BY_AGREEMENT']) management: 'PUBLIC' | 'PRIVATE' | 'PUBLIC_BY_AGREEMENT';
  @IsIn(['URBAN', 'RURAL']) area: 'URBAN' | 'RURAL';
  @IsUUID() ugelId: string;
  @Matches(/^\d{6}$/) ubigeo: string;
  @IsString() @Length(1, 60) department: string;
  @IsString() @Length(1, 60) province: string;
  @IsString() @Length(1, 60) district: string;
  @IsOptional() @IsString() @Length(1, 250) address?: string;
  @IsInt() @Min(0) attentionGoal: number;
  @IsBoolean() hasPsychologist: boolean;
  @IsBoolean() directorHasTeachingLoad: boolean;
}

export class ListSchoolsQuery {
  @IsOptional() @IsUUID() ugelId?: string;
}

export class ListPeriodsQuery {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1900) @Max(2100) year?: number;
}
