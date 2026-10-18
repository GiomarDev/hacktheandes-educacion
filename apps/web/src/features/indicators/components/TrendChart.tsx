// Serie temporal simple en SVG (sin dependencias). Cada serie: puntos ordenados por periodo.
export interface Series {
  label: string;
  color: string;
  points: { period: string; value: number }[];
}

export function TrendChart({
  series,
  height = 180,
}: {
  series: Series[];
  height?: number;
}) {
  const periods = [
    ...new Set(series.flatMap((s) => s.points.map((p) => p.period))),
  ].sort();
  if (!periods.length) return null;
  const values = series.flatMap((s) => s.points.map((p) => p.value));
  const max = Math.ceil(Math.max(...values) + 0.5);
  const width = 560;
  const pad = { l: 34, r: 22, t: 12, b: 26 };
  const x = (period: string) =>
    pad.l +
    (periods.indexOf(period) * (width - pad.l - pad.r)) /
      Math.max(1, periods.length - 1);
  const y = (v: number) => pad.t + (1 - v / max) * (height - pad.t - pad.b);
  const ticks = [0, max / 2, max];
  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        role="img"
        aria-label="Tendencia de la tasa de deserción"
      >
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={pad.l}
              x2={width - pad.r}
              y1={y(t)}
              y2={y(t)}
              stroke="#E1E5EB"
            />
            <text
              x={pad.l - 6}
              y={y(t) + 4}
              textAnchor="end"
              fontSize={12}
              fill="#627589"
            >
              {t.toFixed(1)}
            </text>
          </g>
        ))}
        {periods.map((p, i) =>
          i % 2 === 0 || i === periods.length - 1 ? (
            <text
              key={p}
              x={x(p)}
              y={height - 8}
              textAnchor="middle"
              fontSize={12}
              fill="#627589"
            >
              {p.slice(2, 4)}-{p.slice(7, 9)}
            </text>
          ) : null,
        )}
        {series.map((s) => (
          <g key={s.label}>
            <polyline
              fill="none"
              stroke={s.color}
              strokeWidth={2}
              points={s.points
                .map((p) => `${x(p.period)},${y(p.value)}`)
                .join(' ')}
            />
            {s.points.map((p) => (
              <circle
                key={p.period}
                cx={x(p.period)}
                cy={y(p.value)}
                r={2.5}
                fill={s.color}
              >
                <title>{`${s.label} ${p.period}: ${p.value} %`}</title>
              </circle>
            ))}
          </g>
        ))}
      </svg>
      <div className="mt-1 flex flex-wrap gap-4 text-[0.875rem] text-muted">
        {series.map((s) => (
          <span key={s.label} className="flex items-center gap-1.5">
            <span className="h-0.5 w-4" style={{ background: s.color }} />{' '}
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
