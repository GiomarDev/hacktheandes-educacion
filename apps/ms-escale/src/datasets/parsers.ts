import { readCsv } from './csv.js';
import { findRegion, NATIONAL, REGIONS, sameName } from './regions.js';

export const DATASETS = [
  'DROPOUT_BY_REGION_SIAGIE',
  'DROPOUT_RATE_SECONDARY_ESCALE',
] as const;
export type DatasetCode = (typeof DATASETS)[number];

export interface ParsedValue {
  code: string;
  geoLevel: 'NATIONAL' | 'DRE';
  geoCode: string;
  geoName: string;
  periodLabel: string;
  dimension: string | null;
  dimensionValue: string | null;
  value: number;
  numerator: number | null;
  denominator: number | null;
}

export class DatasetError extends Error {}

const round4 = (n: number) => Math.round(n * 10000) / 10000;

// Año lectivo t y t+1, por ejemplo "2023-2024".
export function isSchoolYearPair(period: string): boolean {
  const match = /^(\d{4})-(\d{4})$/.exec(period);
  return !!match && Number(match[2]) === Number(match[1]) + 1;
}

export function parseDataset(
  dataset: DatasetCode,
  content: string,
  options: { period?: string } = {},
): ParsedValue[] {
  const rows = readCsv(content);
  if (rows.length < 2) throw new DatasetError('El archivo no tiene filas');
  if (dataset === 'DROPOUT_BY_REGION_SIAGIE') {
    // El CSV no trae columna de periodo: sin él, un archivo nuevo sobrescribiría otro año.
    if (!options.period || !isSchoolYearPair(options.period))
      throw new DatasetError(
        'Indique el periodo del archivo con la forma 2023-2024',
      );
    return dropoutByRegion(rows, options.period);
  }
  return escaleSecondarySeries(rows);
}

// Lima se reporta entera (15) o dividida (15LM y 15LP), nunca de ambas formas.
function assertFullCoverage(codes: Set<string>) {
  const lima = ['15', '15LM', '15LP'].filter((c) => codes.has(c));
  if (codes.has('15') && lima.length > 1)
    throw new DatasetError('Lima aparece entera y dividida a la vez');
  const missing = REGIONS.filter((r) => {
    if (r.code === '15') return !codes.has('15') && lima.length !== 2;
    if (r.code === '15LM' || r.code === '15LP')
      return !codes.has('15') && !codes.has(r.code);
    return !codes.has(r.code);
  });
  if (missing.length)
    throw new DatasetError(
      `Faltan regiones para el total nacional: ${missing.map((r) => r.name).join(', ')}`,
    );
}

// docs/desercion_por_region_siagie_2023_2024.csv: conteos por región; el total nacional es la suma.
function dropoutByRegion(
  [header, ...rows]: string[][],
  periodLabel: string,
): ParsedValue[] {
  const levels = [
    { code: 'DROPOUT_RATE_SEC_SIAGIE', key: 'secundaria' },
    { code: 'DROPOUT_RATE_PRI_SIAGIE', key: 'primaria' },
  ];
  const col = (name: string) => {
    const i = header.indexOf(name);
    if (i < 0) throw new DatasetError(`Falta la columna ${name}`);
    return i;
  };
  const regionCol = col('region');
  const out: ParsedValue[] = [];
  const seen = new Set<string>();
  for (const level of levels) {
    const students = col(`estudiantes_${level.key}`);
    const dropouts = col(`desertores_${level.key}`);
    const pct = col(`${level.key}_pct`);
    let totalStudents = 0;
    let totalDropouts = 0;
    const codes = new Set<string>();
    for (const row of rows) {
      const region = findRegion(row[regionCol] ?? '');
      if (!region)
        throw new DatasetError(`Región desconocida: ${row[regionCol]}`);
      const s = integer(row[students], region.name);
      const d = integer(row[dropouts], region.name);
      const p = decimal(row[pct], region.name);
      if (s <= 0 || d > s)
        throw new DatasetError(`Cifras inconsistentes en ${region.name}`);
      if (Math.abs((100 * d) / s - p) > 0.01)
        throw new DatasetError(
          `El porcentaje de ${region.name} (${p}) no cuadra con desertores/estudiantes`,
        );
      const key = `${level.code}:${region.code}`;
      if (seen.has(key))
        throw new DatasetError(`Región repetida: ${region.name}`);
      seen.add(key);
      codes.add(region.code);
      totalStudents += s;
      totalDropouts += d;
      out.push(value(level.code, 'DRE', region, p, d, s));
    }
    assertFullCoverage(codes);
    out.push(
      value(
        level.code,
        'NATIONAL',
        NATIONAL,
        round4((100 * totalDropouts) / totalStudents),
        totalDropouts,
        totalStudents,
      ),
    );
  }
  return out.map((v) => ({ ...v, periodLabel }));
}

const DIMENSIONS = [
  { name: 'Femenino', dimension: 'sex', value: 'F' },
  { name: 'Masculino', dimension: 'sex', value: 'M' },
  { name: 'Urbana', dimension: 'area', value: 'URBAN' },
  { name: 'Rural', dimension: 'area', value: 'RURAL' },
  { name: 'Pública', dimension: 'management', value: 'PUBLIC' },
  { name: 'Privada', dimension: 'management', value: 'PRIVATE' },
];

// docs/tasa_desercion_secundaria_escale.csv: tasas (sin conteos) por categoría y año lectivo.
function escaleSecondarySeries([header, ...rows]: string[][]): ParsedValue[] {
  const periods = header.slice(1);
  if (!periods.length || periods.some((p) => !/^\d{4}-\d{4}$/.test(p)))
    throw new DatasetError('Los periodos deben tener la forma 2023-2024');
  const out: ParsedValue[] = [];
  const seen = new Set<string>();
  for (const [category, ...cells] of rows) {
    const dim = DIMENSIONS.find((d) => sameName(d.name, category));
    const region =
      category === 'PER' ? NATIONAL : dim ? NATIONAL : findRegion(category);
    if (!region) throw new DatasetError(`Categoría desconocida: ${category}`);
    const key = `${region.code}:${dim?.value ?? ''}`;
    if (seen.has(key))
      throw new DatasetError(`Categoría repetida: ${category}`);
    seen.add(key);
    periods.forEach((period, i) => {
      if (!cells[i]) return;
      out.push({
        ...value(
          'DROPOUT_RATE_SEC_ESCALE',
          region === NATIONAL ? 'NATIONAL' : 'DRE',
          region,
          decimal(cells[i], category),
          null,
          null,
        ),
        periodLabel: period,
        dimension: dim?.dimension ?? null,
        dimensionValue: dim?.value ?? null,
      });
    });
  }
  return out;
}

function value(
  code: string,
  geoLevel: ParsedValue['geoLevel'],
  geo: { code: string; name: string },
  v: number,
  numerator: number | null,
  denominator: number | null,
): ParsedValue {
  return {
    code,
    geoLevel,
    geoCode: geo.code,
    geoName: geo.name,
    periodLabel: '',
    dimension: null,
    dimensionValue: null,
    value: v,
    numerator,
    denominator,
  };
}

function integer(raw: string | undefined, where: string): number {
  if (!raw || !/^\d+$/.test(raw))
    throw new DatasetError(`Cifra no válida en ${where}: ${raw ?? ''}`);
  return Number(raw);
}

function decimal(raw: string | undefined, where: string): number {
  if (!raw || !/^\d+(\.\d+)?$/.test(raw))
    throw new DatasetError(`Porcentaje no válido en ${where}: ${raw ?? ''}`);
  const n = Number(raw);
  if (n > 100) throw new DatasetError(`Porcentaje mayor a 100 en ${where}`);
  return n;
}
