import { useState } from 'react';
import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { useSession } from '../auth/AuthProvider';
import { roleLabel } from '../auth/roles';
import { useAlerts, useCases, useIndicators, useSchools } from '../api/queries';
import type { IndicatorValue } from '../api/types';
import { RegionMap } from '../features/RegionMap';
import { TrendChart } from '../features/TrendChart';
import { int, pct } from '../lib/format';
import {
  Badge,
  Card,
  CardHeader,
  cx,
  Empty,
  ErrorNote,
  Kpi,
  Loading,
  PageHeader,
} from '../ui/kit';

const LEVELS = [
  { code: 'DROPOUT_RATE_SEC_SIAGIE', label: 'Secundaria' },
  { code: 'DROPOUT_RATE_PRI_SIAGIE', label: 'Primaria' },
];
const UGEL_CODES = [
  { code: 'ATTENDANCE_RATE', label: 'Asistencia' },
  { code: 'SILENT_SECTIONS_RATE', label: 'Aulas en silencio' },
  { code: 'CASES_CONTACTED_RATE', label: 'Casos contactados' },
];

export function PanoramaPage() {
  const { active } = useSession();
  const [level, setLevel] = useState(0);
  const [region, setRegion] = useState<string | null>(null);
  const national = useIndicators({ geo_level: 'NATIONAL', dimension: 'none' });
  const regional = useIndicators({
    code: LEVELS[level].code,
    geo_level: 'DRE',
  });
  const regionSeries = useIndicators({
    code: 'DROPOUT_RATE_SEC_ESCALE',
    geo_code: region ?? undefined,
    dimension: 'none',
  });
  const ugel = useIndicators({ geo_level: 'UGEL' });
  const schools = useSchools();
  const alerts = useAlerts({ status: 'OPEN' });
  const cases = useCases();

  const nat = (code: string, period?: string) =>
    (national.data ?? [])
      .filter((v) => v.code === code && (!period || v.periodLabel === period))
      .sort((a, b) => b.periodLabel.localeCompare(a.periodLabel))[0];
  const secSiagie = nat('DROPOUT_RATE_SEC_SIAGIE');
  const priSiagie = nat('DROPOUT_RATE_PRI_SIAGIE');
  const escaleSeries = (national.data ?? [])
    .filter((v) => v.code === 'DROPOUT_RATE_SEC_ESCALE')
    .sort((a, b) => a.periodLabel.localeCompare(b.periodLabel));
  const escaleLatest = escaleSeries.at(-1);
  const escalePrev = escaleSeries.at(-2);

  const openCases = (cases.data ?? []).filter((c) => !c.closedAt);
  const contacted = openCases.filter((c) => c.firstContactAt).length;
  const alertsBySchool = new Map<string, number>();
  for (const a of alerts.data ?? [])
    alertsBySchool.set(a.schoolId, (alertsBySchool.get(a.schoolId) ?? 0) + 1);
  const rankedSchools = [...(schools.data ?? [])].sort(
    (a, b) =>
      (alertsBySchool.get(b.id) ?? 0) - (alertsBySchool.get(a.id) ?? 0) ||
      a.name.localeCompare(b.name),
  );

  // Último periodo calculado por UGEL.
  const ugelRows = new Map<
    string,
    { name: string; period: string; values: Record<string, IndicatorValue> }
  >();
  for (const v of ugel.data ?? []) {
    const row = ugelRows.get(v.geoCode);
    if (!row || v.periodLabel > row.period)
      ugelRows.set(v.geoCode, {
        name: v.geoName,
        period: v.periodLabel,
        values: { [v.code]: v },
      });
    else if (v.periodLabel === row.period) row.values[v.code] = v;
  }
  const selected = (regional.data ?? []).find((v) => v.geoCode === region);
  const regionTrend = (regionSeries.data ?? [])
    .filter((v) => region && v.geoCode === region)
    .sort((a, b) => a.periodLabel.localeCompare(b.periodLabel));

  return (
    <>
      <PageHeader
        eyebrow={`${roleLabel(active.role)} · ámbito ${active.role === 'MINEDU_ADMIN' ? 'nacional' : active.role === 'DRE_SPECIALIST' ? 'regional' : 'de la UGEL'}`}
        title="Panorama de continuidad educativa"
        subtitle="Deserción oficial (SIAGIE y ESCALE) junto a las alertas y casos operativos de tu ámbito."
      />

      {(alerts.data?.length ?? 0) > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-md border border-critical/25 bg-critical-soft px-4 py-3">
          <span className="font-mono text-[20px] font-medium text-critical">
            {alertsBySchool.size}
          </span>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-ink">
              {alertsBySchool.size === 1
                ? 'institución educativa con alertas abiertas'
                : 'instituciones educativas con alertas abiertas'}
            </div>
            <div className="text-[12px] text-muted">
              {alerts.data?.length} alertas · {openCases.length} casos abiertos,{' '}
              {contacted} con la familia contactada
            </div>
          </div>
          <Link
            to="/alertas"
            className="text-[12.5px] font-medium text-critical hover:underline"
          >
            Ver todas las alertas →
          </Link>
        </div>
      )}

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          label={`Deserción secundaria · ${secSiagie?.periodLabel ?? ''}`}
          value={pct(secSiagie?.value, 2)}
          tone="critical"
          hint={
            secSiagie
              ? `${int(secSiagie.numerator)} de ${int(secSiagie.denominator)} · SIAGIE`
              : 'Importar datos en Fuentes'
          }
        />
        <Kpi
          label={`Deserción primaria · ${priSiagie?.periodLabel ?? ''}`}
          value={pct(priSiagie?.value, 2)}
          tone="high"
          hint={
            priSiagie
              ? `${int(priSiagie.numerator)} de ${int(priSiagie.denominator)} · SIAGIE`
              : '—'
          }
        />
        <Kpi
          label={`Interanual secundaria · ${escaleLatest?.periodLabel ?? ''}`}
          value={pct(escaleLatest?.value, 1)}
          hint={
            escaleLatest && escalePrev
              ? `${escaleLatest.value >= escalePrev.value ? '+' : ''}${(escaleLatest.value - escalePrev.value).toFixed(1)} pp vs ${escalePrev.periodLabel} · ESCALE`
              : 'ESCALE'
          }
        />
        <Kpi
          label="IE en tu ámbito"
          value={int(schools.data?.length)}
          tone="gob"
          hint={`${alertsBySchool.size} con alertas abiertas`}
        />
      </div>

      <div className="mb-4 grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader
            title="Mapa de deserción por región"
            subtitle="25 regiones · SIAGIE 2023-2024 · fuente: datos abiertos MINEDU"
            action={
              <div
                role="tablist"
                className="flex rounded border border-line p-0.5"
              >
                {LEVELS.map((l, i) => (
                  <button
                    key={l.code}
                    role="tab"
                    aria-selected={level === i}
                    onClick={() => setLevel(i)}
                    className={cx(
                      'rounded px-2.5 py-1 text-[12px] font-medium',
                      level === i ? 'bg-ink text-white' : 'text-muted',
                    )}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            }
          />
          <div className="p-4">
            {regional.isPending ? (
              <Loading />
            ) : regional.error ? (
              <ErrorNote error={regional.error} />
            ) : !regional.data.length ? (
              <Empty title="Sin datos oficiales importados">
                MINEDU puede cargarlos desde Fuentes.
              </Empty>
            ) : (
              <RegionMap
                values={regional.data}
                selected={region}
                onSelect={setRegion}
              />
            )}
          </div>
        </Card>
        <Card>
          {selected ? (
            <>
              <CardHeader
                title={selected.geoName}
                subtitle={`${LEVELS[level].label} · ${selected.periodLabel}`}
                action={
                  <button
                    className="text-[12px] text-gob hover:underline"
                    onClick={() => setRegion(null)}
                  >
                    Ver Perú
                  </button>
                }
              />
              <div className="grid grid-cols-2 gap-3 px-4 pt-4">
                <Kpi
                  label="Tasa de deserción"
                  value={pct(selected.value, 2)}
                  tone="critical"
                />
                <Kpi
                  label="Desertores"
                  value={int(selected.numerator)}
                  hint={`de ${int(selected.denominator)} estudiantes`}
                />
              </div>
              <div className="p-4">
                <div className="mb-2 text-[12px] font-medium text-muted">
                  Tasa interanual en secundaria · ESCALE
                </div>
                {regionTrend.length ? (
                  <TrendChart
                    series={[
                      {
                        label: selected.geoName,
                        color: '#C8102E',
                        points: regionTrend.map((v) => ({
                          period: v.periodLabel,
                          value: v.value,
                        })),
                      },
                      {
                        label: 'Perú',
                        color: '#8A95A8',
                        points: escaleSeries.map((v) => ({
                          period: v.periodLabel,
                          value: v.value,
                        })),
                      },
                    ]}
                  />
                ) : (
                  <Empty title="Sin serie ESCALE para esta región" />
                )}
              </div>
            </>
          ) : (
            <>
              <CardHeader
                title="Tendencia nacional"
                subtitle="Tasa de deserción interanual en secundaria · ESCALE 2013–2025"
              />
              <div className="p-4">
                {national.isPending ? (
                  <Loading />
                ) : escaleSeries.length ? (
                  <TrendChart
                    series={[
                      {
                        label: 'Perú',
                        color: '#C8102E',
                        points: escaleSeries.map((v) => ({
                          period: v.periodLabel,
                          value: v.value,
                        })),
                      },
                    ]}
                  />
                ) : (
                  <Empty title="Sin serie importada" />
                )}
                <p className="mt-3 text-[11.5px] text-faint">
                  TD = (M<sub>t</sub> − (M<sub>t</sub> ∩ M<sub>t+1</sub>) − A5S
                  <sub>t</sub> − F<sub>t</sub>) / M<sub>t</sub> × 100 · fórmula
                  oficial del MINEDU.
                </p>
              </div>
            </>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <Card>
          <CardHeader
            title="Indicadores por UGEL"
            subtitle="Calculados de los registros diarios de SIAGIE y Alerta · último mes"
          />
          {ugel.isPending ? (
            <Loading />
          ) : ugel.error ? (
            <ErrorNote error={ugel.error} />
          ) : !ugelRows.size ? (
            <Empty title="Aún no hay agregados de tu ámbito">
              Se calculan cada día con el pase de lista de las IEs.
            </Empty>
          ) : (
            <ul className="divide-y divide-line">
              {[...ugelRows.entries()].map(([code, row]) => (
                <li key={code} className="px-4 py-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-semibold">{row.name}</span>
                    <span className="font-mono text-[11px] text-faint">
                      {row.period}
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {UGEL_CODES.map((u) => {
                      const v = row.values[u.code];
                      return (
                        <div
                          key={u.code}
                          className="rounded bg-canvas px-2.5 py-2"
                        >
                          <div className="text-[11px] text-muted">
                            {u.label}
                          </div>
                          <div className="font-mono text-[16px] font-medium">
                            {pct(v?.value, 1)}
                          </div>
                          {v?.denominator !== null && v && (
                            <div className="text-[10.5px] text-faint">
                              {int(v.numerator)} / {int(v.denominator)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <CardHeader
            title="Instituciones educativas"
            subtitle="Ordenadas por alertas abiertas · clic para ver el detalle"
            action={
              <Link
                to="/escuelas"
                className="text-[12px] text-gob hover:underline"
              >
                Ver todas →
              </Link>
            }
          />
          {schools.isPending ? (
            <Loading />
          ) : schools.error ? (
            <ErrorNote error={schools.error} />
          ) : !rankedSchools.length ? (
            <Empty title="Sin IEs en tu ámbito" />
          ) : (
            <ul className="divide-y divide-line">
              {rankedSchools.slice(0, 8).map((s, i) => {
                const n = alertsBySchool.get(s.id) ?? 0;
                return (
                  <li key={s.id}>
                    <Link
                      to={`/escuelas/${s.id}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-canvas"
                    >
                      <span className="w-5 font-mono text-[11px] text-faint">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{s.name}</div>
                        <div className="text-[12px] text-faint">
                          <span className="font-mono">{s.modularCode}</span> ·{' '}
                          {s.province}, {s.department} ·{' '}
                          {s.area === 'RURAL' ? 'Rural' : 'Urbana'}
                        </div>
                      </div>
                      {n ? (
                        <Badge tone="critical">{n} alertas</Badge>
                      ) : (
                        <Badge tone="stable">Sin alertas</Badge>
                      )}
                      <ChevronRight className="size-4 text-faint" aria-hidden />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
