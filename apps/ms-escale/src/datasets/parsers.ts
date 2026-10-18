import { readCsv } from './csv.js';
import { findRegion, NATIONAL, sameName } from './regions.js';

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

export function parseDataset(
  dataset: DatasetCode,
  content: string,
): ParsedValue[] {
  const rows = readCsv(content);
  if (rows.length < 2) throw new DatasetError('El archivo no tiene filas');
  return dataset === 'DROPOUT_BY_REGION_SIAGIE'
    ? dropoutByRegion(rows)
    : escaleSecondarySeries(rows);
}

// docs/desercion_por_region_siagie_2023_2024.csv: conteos por región; el total nacional es la suma.
function dropoutByRegion([header, ...rows]: string[][]): ParsedValue[] {
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
      totalStudents += s;
      totalDropouts += d;
      out.push(value(level.code, 'DRE', region, p, d, s));
    }
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
  return out;
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
    periodLabel: '2023-2024',
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
