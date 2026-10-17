import { IsBoolean, IsIn, IsInt, IsOptional, IsUUID, Max, Min, ValidateIf } from 'class-validator';

export class GradeEntryDto {
  @IsUUID() enrollmentId: string;
  @IsUUID() competencyId: string;
  @IsUUID() periodId: string;
  @IsInt() @Min(1) @Max(20) columnNumber: number;
  @ValidateIf((_o, v) => v !== null) @IsIn(['AD', 'A', 'B', 'C']) value: 'AD' | 'A' | 'B' | 'C' | null;
  @IsOptional() @IsBoolean() isCompensatory?: boolean;
}
