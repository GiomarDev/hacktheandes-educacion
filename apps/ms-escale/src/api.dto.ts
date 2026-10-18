import {
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
} from 'class-validator';
import { DATASETS } from './datasets/parsers.js';
import type { DatasetCode } from './datasets/parsers.js';

const GEO_LEVELS = ['NATIONAL', 'DRE', 'UGEL', 'DISTRICT', 'SCHOOL'] as const;

export class ImportDto {
  @IsIn(DATASETS) dataset: DatasetCode;
  @IsString() @Length(1, 200) @Matches(/^[\w .-]+\.csv$/i) fileName: string;
  @IsString() @Length(1, 2_000_000) content: string;
  @IsOptional() @IsString() @Length(1, 150) name?: string;
  @IsOptional() @IsUrl() @Length(1, 500) sourceUrl?: string;
}

export class IndicatorQuery {
  @IsOptional() @IsString() @Length(1, 50) code?: string;
  @IsOptional() @IsIn(GEO_LEVELS) geo_level?: (typeof GEO_LEVELS)[number];
  @IsOptional() @IsString() @Length(1, 20) geo_code?: string;
  @IsOptional() @IsString() @Length(1, 20) period?: string;
  // "none" devuelve solo los totales (sin dimensión).
  @IsOptional() @IsString() @Length(1, 30) dimension?: string;
}
