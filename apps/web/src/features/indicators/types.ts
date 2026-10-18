export interface IndicatorValue {
  code: string;
  name: string;
  unit: string;
  source: 'OFFICIAL' | 'COMPUTED';
  geoLevel: 'NATIONAL' | 'DRE' | 'UGEL' | 'DISTRICT' | 'SCHOOL';
  geoCode: string;
  geoName: string;
  periodLabel: string;
  dimension: string | null;
  dimensionValue: string | null;
  value: number;
  numerator: number | null;
  denominator: number | null;
}
