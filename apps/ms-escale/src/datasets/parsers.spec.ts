import { readFileSync } from 'node:fs';
import { DatasetError, parseDataset } from './parsers.js';

const doc = (name: string) => readFileSync(`docs/${name}`, 'utf8');
const regionCsv = doc('desercion_por_region_siagie_2023_2024.csv');
const escaleCsv = doc('tasa_desercion_secundaria_escale.csv');

describe('DROPOUT_BY_REGION_SIAGIE', () => {
  const values = parseDataset('DROPOUT_BY_REGION_SIAGIE', regionCsv, {
    period: '2023-2024',
  });
  const find = (code: string, geoCode: string) =>
    values.find((v) => v.code === code && v.geoCode === geoCode);

  it('genera 25 regiones por nivel más el total nacional', () => {
    for (const code of ['DROPOUT_RATE_SEC_SIAGIE', 'DROPOUT_RATE_PRI_SIAGIE']) {
      const rows = values.filter((v) => v.code === code);
      expect(rows.filter((v) => v.geoLevel === 'DRE')).toHaveLength(25);
      expect(rows.filter((v) => v.geoLevel === 'NATIONAL')).toHaveLength(1);
    }
    expect(values.every((v) => v.periodLabel === '2023-2024')).toBe(true);
  });

  it('el total nacional cuadra con la suma del archivo', () => {
    expect(find('DROPOUT_RATE_SEC_SIAGIE', '00')).toMatchObject({
      geoName: 'Perú',
      numerator: 72282,
      denominator: 2842831,
      value: 2.5426,
    });
    expect(find('DROPOUT_RATE_PRI_SIAGIE', '00')).toMatchObject({
      numerator: 64463,
      denominator: 3721852,
      value: 1.732,
    });
  });

  it('usa el código de departamento del ubigeo', () => {
    expect(find('DROPOUT_RATE_SEC_SIAGIE', '25')).toMatchObject({
      geoName: 'Ucayali',
      numerator: 3385,
      denominator: 66211,
      value: 5.11,
      dimension: null,
      dimensionValue: null,
    });
    expect(find('DROPOUT_RATE_PRI_SIAGIE', '02')?.geoName).toBe('Áncash');
    expect(find('DROPOUT_RATE_SEC_SIAGIE', '15')?.geoName).toBe('Lima');
  });

  it('rechaza un porcentaje que no cuadra con desertores/estudiantes', () => {
    const broken = regionCsv.replace(
      '1,Ucayali,66211,3385,5.11',
      '1,Ucayali,66211,3385,6.11',
    );
    expect(() =>
      parseDataset('DROPOUT_BY_REGION_SIAGIE', broken, { period: '2023-2024' }),
    ).toThrow(DatasetError);
  });

  it('rechaza columnas faltantes y cifras no numéricas', () => {
    expect(() =>
      parseDataset('DROPOUT_BY_REGION_SIAGIE', 'rank,region\n1,Ucayali', {
        period: '2023-2024',
      }),
    ).toThrow(DatasetError);
    expect(() =>
      parseDataset(
        'DROPOUT_BY_REGION_SIAGIE',
        regionCsv.replace('66211', 'abc'),
        { period: '2023-2024' },
      ),
    ).toThrow(DatasetError);
  });
});

describe('DROPOUT_BY_REGION_SIAGIE: periodo y cobertura', () => {
  const parse = (csv: string, period?: string) =>
    parseDataset('DROPOUT_BY_REGION_SIAGIE', csv, { period });

  it('exige el periodo y lo usa en todos los valores', () => {
    expect(() => parse(regionCsv)).toThrow('periodo');
    expect(() => parse(regionCsv, '2024')).toThrow('periodo');
    expect(() => parse(regionCsv, '2024-2026')).toThrow('periodo');
    expect(
      parse(regionCsv, '2024-2025').every((v) => v.periodLabel === '2024-2025'),
    ).toBe(true);
  });

  it('rechaza un archivo al que le faltan regiones', () => {
    const partial = regionCsv
      .split('\n')
      .filter((l) => !l.includes(',Puno,'))
      .join('\n');
    expect(() => parse(partial, '2023-2024')).toThrow('Puno');
  });

  it('no cuenta Lima dos veces', () => {
    const doubled = `${regionCsv.trimEnd()}\n26,Lima Metropolitana,10,1,10.00,10,1,10.00\n`;
    expect(() => parse(doubled, '2023-2024')).toThrow('Lima');
  });
});

describe('DROPOUT_RATE_SECONDARY_ESCALE', () => {
  const values = parseDataset('DROPOUT_RATE_SECONDARY_ESCALE', escaleCsv);
  const find = (geoCode: string, period: string, dimensionValue?: string) =>
    values.find(
      (v) =>
        v.geoCode === geoCode &&
        v.periodLabel === period &&
        (v.dimensionValue ?? undefined) === dimensionValue,
    );

  it('reconoce el total nacional y sus dimensiones aunque falten tildes', () => {
    expect(find('00', '2023-2024')).toMatchObject({
      code: 'DROPOUT_RATE_SEC_ESCALE',
      geoLevel: 'NATIONAL',
      value: 2.5,
      numerator: null,
      denominator: null,
      dimension: null,
    });
    expect(find('00', '2024-2025', 'F')).toMatchObject({
      dimension: 'sex',
      value: 2.6,
    });
    expect(find('00', '2013-2014', 'RURAL')).toMatchObject({
      dimension: 'area',
      value: 7,
    });
    expect(find('00', '2013-2014', 'PUBLIC')).toMatchObject({
      dimension: 'management',
      value: 6.1,
    });
  });

  it('reconoce regiones con caracteres perdidos y Lima dividida', () => {
    expect(find('03', '2013-2014')).toMatchObject({
      geoLevel: 'DRE',
      geoName: 'Apurímac',
      value: 4.1,
    });
    expect(find('10', '2024-2025')?.geoName).toBe('Huánuco');
    expect(find('15LM', '2013-2014')?.geoName).toBe('Lima Metropolitana');
    expect(find('15LP', '2013-2014')?.geoName).toBe('Lima Provincias');
  });

  it('lee los 12 periodos', () => {
    const periods = new Set(values.map((v) => v.periodLabel));
    expect(periods.size).toBe(12);
  });

  it('omite celdas vacías', () => {
    const csv = escaleCsv.replace(/^Ucayali,10\.2,/m, 'Ucayali,,');
    const parsed = parseDataset('DROPOUT_RATE_SECONDARY_ESCALE', csv);
    expect(
      parsed.find((v) => v.geoCode === '25' && v.periodLabel === '2013-2014'),
    ).toBeUndefined();
    expect(parsed).toHaveLength(values.length - 1);
  });

  it('rechaza una categoría repetida', () => {
    const ucayali = escaleCsv.split('\n').find((l) => l.startsWith('Ucayali'))!;
    expect(() =>
      parseDataset(
        'DROPOUT_RATE_SECONDARY_ESCALE',
        `${escaleCsv.trimEnd()}\n${ucayali}\n`,
      ),
    ).toThrow('repetida');
  });

  it('rechaza una categoría desconocida', () => {
    expect(() =>
      parseDataset(
        'DROPOUT_RATE_SECONDARY_ESCALE',
        `${escaleCsv.trimEnd()}\nAtlantida,1,1,1,1,1,1,1,1,1,1,1,1\n`,
      ),
    ).toThrow('Atlantida');
  });
});
