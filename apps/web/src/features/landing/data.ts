// Datos oficiales estáticos para la landing pública (sin sesión, no consulta la API).
// Generado desde docs/desercion_por_region_siagie_2023_2024.csv y docs/tasa_desercion_secundaria_escale.csv.
import type { IndicatorValue } from '@/features/indicators/types';

export const DROPOUTS_SECONDARY = 72282;
export const DROPOUTS_PRIMARY = 64463;
export const STUDENTS_SECONDARY = 2842831;
export const STUDENTS_PRIMARY = 3721852;
// (72 282 + 64 463) / 365 ≈ 375 estudiantes por día que dejan el colegio (SIAGIE 2023-2024).
export const DROPOUTS_PER_DAY = Math.round(
  (DROPOUTS_SECONDARY + DROPOUTS_PRIMARY) / 365,
);

export const REGION_DROPOUT_SECONDARY: IndicatorValue[] = [
  region('25', 'Ucayali', 5.11, 3385, 66211),
  region('07', 'Callao', 3.56, 2984, 83703),
  region('13', 'La Libertad', 3.43, 5991, 174599),
  region('24', 'Tumbes', 3.4, 796, 23416),
  region('16', 'Loreto', 3.2, 3905, 122023),
  region('14', 'Lambayeque', 3.14, 3703, 117937),
  region('20', 'Piura', 3.14, 6131, 195528),
  region('02', 'Áncash', 2.88, 3056, 106164),
  region('22', 'San Martín', 2.84, 2647, 93168),
  region('15', 'Lima', 2.78, 22591, 812370),
  region('06', 'Cajamarca', 2.73, 3823, 139854),
  region('17', 'Madre de Dios', 2.26, 446, 19699),
  region('12', 'Junín', 2.18, 2720, 124969),
  region('11', 'Ica', 2.15, 1796, 83517),
  region('01', 'Amazonas', 2.15, 986, 45871),
  region('19', 'Pasco', 2.1, 533, 25406),
  region('09', 'Huancavelica', 1.57, 567, 36153),
  region('05', 'Ayacucho', 1.4, 886, 63492),
  region('10', 'Huánuco', 1.36, 1080, 79392),
  region('08', 'Cusco', 1.34, 1589, 118401),
  region('18', 'Moquegua', 1.08, 168, 15580),
  region('03', 'Apurímac', 1.02, 434, 42368),
  region('04', 'Arequipa', 0.94, 1152, 122313),
  region('23', 'Tacna', 0.89, 263, 29506),
  region('21', 'Puno', 0.64, 650, 101191),
];

export const ESCALE_NATIONAL_SECONDARY = [
  { period: '2013-2014', value: 5.3 },
  { period: '2014-2015', value: 4.3 },
  { period: '2015-2016', value: 4.1 },
  { period: '2016-2017', value: 4.0 },
  { period: '2017-2018', value: 4.0 },
  { period: '2018-2019', value: 3.5 },
  { period: '2019-2020', value: 2.5 },
  { period: '2020-2021', value: 1.9 },
  { period: '2021-2022', value: 3.0 },
  { period: '2022-2023', value: 2.6 },
  { period: '2023-2024', value: 2.5 },
  { period: '2024-2025', value: 2.7 },
];

function region(
  geoCode: string,
  geoName: string,
  value: number,
  numerator: number,
  denominator: number,
): IndicatorValue {
  return {
    code: 'DROPOUT_RATE_SEC_SIAGIE',
    name: 'Deserción en secundaria (SIAGIE)',
    unit: '%',
    source: 'OFFICIAL',
    geoLevel: 'DRE',
    geoCode,
    geoName,
    periodLabel: '2023-2024',
    dimension: null,
    dimensionValue: null,
    value,
    numerator,
    denominator,
  };
}
