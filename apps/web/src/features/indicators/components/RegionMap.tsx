import type { IndicatorValue } from '@/features/indicators/types';
import { cx } from '@/shared/ui/kit';

// Cartograma de mosaico: cada región ocupa una celda en su posición aproximada (costa a la izquierda).
const TILES: Record<string, { c: number; r: number; short: string }> = {
  '24': { c: 0, r: 0, short: 'TUM' },
  '16': { c: 3, r: 0, short: 'LOR' },
  '20': { c: 0, r: 1, short: 'PIU' },
  '01': { c: 1, r: 1, short: 'AMA' },
  '22': { c: 2, r: 1, short: 'SMA' },
  '14': { c: 0, r: 2, short: 'LAM' },
  '06': { c: 1, r: 2, short: 'CAJ' },
  '10': { c: 2, r: 2, short: 'HUC' },
  '25': { c: 3, r: 2, short: 'UCA' },
  '13': { c: 0, r: 3, short: 'LAL' },
  '02': { c: 1, r: 3, short: 'ANC' },
  '19': { c: 2, r: 3, short: 'PAS' },
  '07': { c: 0, r: 4, short: 'CAL' },
  '15': { c: 1, r: 4, short: 'LIM' },
  '12': { c: 2, r: 4, short: 'JUN' },
  '08': { c: 3, r: 4, short: 'CUS' },
  '17': { c: 4, r: 4, short: 'MDD' },
  '11': { c: 0, r: 5, short: 'ICA' },
  '09': { c: 1, r: 5, short: 'HUV' },
  '05': { c: 2, r: 5, short: 'AYA' },
  '03': { c: 3, r: 5, short: 'APU' },
  '04': { c: 1, r: 6, short: 'ARE' },
  '18': { c: 2, r: 6, short: 'MOQ' },
  '21': { c: 3, r: 6, short: 'PUN' },
  '23': { c: 2, r: 7, short: 'TAC' },
};

export const RISK_SCALE = [
  { label: 'Crítico', fill: '#C8102E', text: '#fff' },
  { label: 'Alto', fill: '#F0633B', text: '#fff' },
  { label: 'Medio', fill: '#E6A316', text: '#1A2332' },
  { label: 'Bajo', fill: '#78B04B', text: '#fff' },
  { label: 'Estable', fill: '#2B8A3E', text: '#fff' },
];

// Quintiles del propio conjunto: el quinto más alto es "crítico".
export function riskBuckets(values: number[]) {
  const sorted = [...values].sort((a, b) => b - a);
  const cut = (q: number) =>
    sorted[Math.max(0, Math.ceil(q * sorted.length) - 1)] ?? 0;
  const thresholds = [cut(0.2), cut(0.4), cut(0.6), cut(0.8)];
  return (v: number) => {
    const i = thresholds.findIndex((t) => v >= t);
    return i === -1 ? 4 : i;
  };
}

export function RegionMap({
  values,
  selected,
  onSelect,
}: {
  values: IndicatorValue[];
  selected?: string | null;
  onSelect?(code: string | null): void;
}) {
  const byCode = new Map(values.map((v) => [v.geoCode, v]));
  const bucket = riskBuckets(values.map((v) => v.value));
  const size = 54;
  const gap = 4;
  return (
    <div className="flex flex-wrap items-start gap-6">
      <svg
        viewBox={`0 0 ${5 * (size + gap)} ${8 * (size + gap)}`}
        className="w-full max-w-[320px]"
        role="img"
        aria-label="Mapa de deserción por región"
      >
        {Object.entries(TILES).map(([code, t]) => {
          const v = byCode.get(code);
          const scale = v
            ? RISK_SCALE[bucket(v.value)]
            : { fill: '#E1E5EB', text: '#8A95A8' };
          const active = selected === code;
          return (
            <g
              key={code}
              transform={`translate(${t.c * (size + gap)} ${t.r * (size + gap)})`}
              className={cx(onSelect && 'cursor-pointer')}
              onClick={() => onSelect?.(active ? null : code)}
            >
              <title>
                {v ? `${v.geoName}: ${v.value.toFixed(2)} %` : code}
              </title>
              <rect
                width={size}
                height={size}
                rx={4}
                fill={scale.fill}
                stroke={active ? '#1A2332' : 'none'}
                strokeWidth={active ? 3 : 0}
                opacity={selected && !active ? 0.55 : 1}
              />
              <text
                x={size / 2}
                y={22}
                textAnchor="middle"
                fontSize={12}
                fontWeight={600}
                fill={scale.text}
              >
                {t.short}
              </text>
              <text
                x={size / 2}
                y={39}
                textAnchor="middle"
                fontSize={12}
                fontFamily="var(--font-sans)"
                fill={scale.text}
              >
                {v ? v.value.toFixed(1) : '—'}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="space-y-1.5 text-[0.9375rem]">
        {RISK_SCALE.map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <span
              className="size-3 rounded-sm"
              style={{ background: s.fill }}
            />
            {s.label}
          </div>
        ))}
        <p className="max-w-[160px] pt-2 text-[0.875rem] text-faint">
          Quintiles de la tasa entre las 25 regiones. Clic en una región para
          ver su detalle.
        </p>
      </div>
    </div>
  );
}
