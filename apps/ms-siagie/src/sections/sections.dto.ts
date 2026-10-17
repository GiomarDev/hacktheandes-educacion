import { IsIn, IsInt, IsOptional, IsString, IsUUID, Length, Max, Min } from 'class-validator';

export class CreateSectionDto {
  @IsUUID() schoolId: string;
  @IsInt() @Min(2020) @Max(2100) year: number;
  @IsInt() @Min(1) @Max(6) grade: number;
  @IsString() @Length(1, 5) name: string;
  @IsIn(['MORNING', 'AFTERNOON']) shift: 'MORNING' | 'AFTERNOON';
  @IsUUID() tutorUserId: string;
  @IsOptional() @IsUUID() auxiliarUserId?: string;
  @IsInt() @Min(1) @Max(60) capacity: number;
}
