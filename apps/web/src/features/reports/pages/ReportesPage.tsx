import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { useSession } from '@/features/auth/AuthProvider';
import { TERRITORIAL } from '@/features/auth/roles';
import {
  useGenerateReport,
  useReports,
  useReportTransition,
} from '@/features/reports/api';
import { useSchoolPeriods, useSchools } from '@/features/schools/api';
import type { Report } from '@/features/reports/types';
import {
  currentPeriod,
  formatDate,
  int,
  pct,
  periodLabel,
  REPORT_STATUS,
  REPORT_TYPE,
  todayInLima,
  plural,
} from '@/shared/lib/format';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  Empty,
  ErrorNote,
  Field,
  controlClass,
  inputClass,
  Loading,
  PageHeader,
} from '@/shared/ui/kit';

const REPORT_TYPES = [
  'MONTHLY_FOLLOWUP',
  'BIMESTER_ATTENDANCE',
  'ATTENTION_GOAL',
  'DROPOUT_JUSTIFICATION',
] as const;
const MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Setiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

type Payload = {
  school?: {
    activeEnrollments?: number;
    attendance?: {
      rate?: number;
      present?: number;
      late?: number;
      absent?: number;
      justified?: number;
      leftEarly?: number;
    };
    grades?: Record<string, number>;
    sectionsTotal?: number;
    reportedSectionDays?: number;
    exitsWithoutReason?: number;
  };
  alerts?: {
    alertsDetected?: number;
    casesOpened?: number;
    firstContacts?: number;
    averageDaysToFirstContact?: number | null;
  };
};

function Figures({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {items.map(([label, value]) => (
        <div key={label} className="rounded bg-canvas px-2.5 py-2">
          <dt className="text-[0.875rem] text-muted">{label}</dt>
          <dd className="font-sans tabular-nums text-[1.0625rem] font-medium">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function ReportFigures({ report }: { report: Report }) {
  const p = report.payload as Payload;
  const a = p.school?.attendance;
  if (report.type === 'BIMESTER_ATTENDANCE') {
    const grades = p.school?.grades ?? {};
    const graded = Object.values(grades).reduce((n, v) => n + v, 0);
    return (
      <div className="space-y-2">
        <Figures
          items={[
            ['Matrícula activa', int(p.school?.activeEnrollments)],
            ['Asistencia del bimestre', pct(a?.rate, 1)],
            ['Presentes', int((a?.present ?? 0) + (a?.leftEarly ?? 0))],
            ['Tardanzas', int(a?.late)],
            ['Faltas', int(a?.absent)],
            ['Faltas justificadas', int(a?.justified)],
          ]}
        />
        <div>
          <div className="mb-1 text-[0.875rem] font-medium text-muted">
            Notas del periodo por competencia ({int(graded)})
          </div>
          <Figures
            items={(['AD', 'A', 'B', 'C'] as const).map((g) => [
              g,
              graded
                ? `${int(grades[g] ?? 0)} · ${pct((100 * (grades[g] ?? 0)) / graded, 0)}`
                : '—',
            ])}
          />
        </div>
      </div>
    );
  }
  return (
    <Figures
      items={[
        ['Matrícula activa', int(p.school?.activeEnrollments)],
        ['Asistencia', pct(a?.rate, 1)],
        ['Alertas detectadas', int(p.alerts?.alertsDetected)],
        ['Casos abiertos', int(p.alerts?.casesOpened)],
        ['Primeros contactos', int(p.alerts?.firstContacts)],
        ['Días al primer contacto', p.alerts?.averageDaysToFirstContact ?? '—'],
      ]}
    />
  );
}

export function ReportesPage() {
  const { active } = useSession();
  const today = todayInLima();
  const year = Number(today.slice(0, 4));
  const schools = useSchools();
  const reports = useReports({ year });
  const generate = useGenerateReport();
  const transition = useReportTransition();
  const isTerritorial = TERRITORIAL.includes(active.role);
  const canGenerate = active.role === 'DIRECTOR' || active.role === 'SECRETARY';
  const [type, setType] = useState<string>('MONTHLY_FOLLOWUP');
  const [month, setMonth] = useState(Number(today.slice(5, 7)));
  const periods = useSchoolPeriods(
    canGenerate ? active.schoolId : undefined,
    year,
  );
  // Solo bimestres ya iniciados: SIMON rechaza los que aún no comienzan.
  const bimesters = (periods.data ?? []).filter(
    (p) => p.type === 'BIMESTER' && p.startDate <= today,
  );
  const [periodId, setPeriodId] = useState<string>();
  const selectedPeriod = periodId ?? currentPeriod(bimesters, today)?.id;
  const periodName = new Map(
    (periods.data ?? []).map((p) => [p.id, periodLabel(p)]),
  );
  const isBimester = type === 'BIMESTER_ATTENDANCE';
  const [open, setOpen] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const schoolName = new Map((schools.data ?? []).map((s) => [s.id, s.name]));

  async function submit(event: FormEvent) {
    event.preventDefault();
    const created = await generate.mutateAsync({
      schoolId: active.schoolId!,
      year,
      type,
      ...(isBimester ? { periodId: selectedPeriod } : { month }),
    });
    setOpen(created.id);
  }

  return (
    <>
      <PageHeader
        title="Reportes SIMON"
        subtitle={
          isTerritorial
            ? 'Reportes que las IEs de tu ámbito envían para revisión de la UGEL'
            : 'Reportes generados automáticamente con los registros de SIAGIE y Alerta: revisa y envía a tu UGEL'
        }
      />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card>
          <CardHeader
            title={`Reportes ${year}`}
            subtitle={plural(reports.data?.length ?? 0, 'reporte', 'reportes')}
          />
          {reports.isPending ? (
            <Loading />
          ) : reports.error ? (
            <ErrorNote error={reports.error} />
          ) : !reports.data.length ? (
            <Empty title="Aún no hay reportes">
              {canGenerate
                ? 'Genera el primero con el formulario.'
                : 'Aparecerán cuando las IEs los generen.'}
            </Empty>
          ) : (
            <ul className="divide-y divide-line">
              {reports.data.map((r) => (
                <li key={r.id} className="px-4 py-3">
                  <button
                    className="flex w-full items-center gap-3 text-left"
                    onClick={() => setOpen(open === r.id ? null : r.id)}
                    aria-expanded={open === r.id}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">
                        {REPORT_TYPE[r.type]} ·{' '}
                        {r.month
                          ? MONTHS[r.month - 1]
                          : ((r.periodId && periodName.get(r.periodId)) ??
                            'bimestre')}{' '}
                        {r.year}
                      </div>
                      <div className="text-[0.9375rem] text-faint">
                        {schoolName.get(r.schoolId) ?? 'IE'} · revisión{' '}
                        {r.revision} · generado{' '}
                        {formatDate(r.generatedAt ?? r.createdAt)}
                      </div>
                    </div>
                    <Badge tone={REPORT_STATUS[r.status].tone}>
                      {REPORT_STATUS[r.status].label}
                    </Badge>
                  </button>
                  {open === r.id && (
                    <div className="mt-3 space-y-3">
                      <ReportFigures report={r} />
                      {r.reviewNotes && (
                        <p className="rounded border border-high/30 bg-high-soft px-3 py-2 text-[0.9375rem]">
                          Observación de la UGEL: {r.reviewNotes}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {active.role === 'DIRECTOR' &&
                          (r.status === 'DRAFT' || r.status === 'OBSERVED') && (
                            <Button
                              variant="primary"
                              busy={transition.isPending}
                              onClick={() =>
                                transition.mutate({
                                  id: r.id,
                                  action: 'submit',
                                  revision: r.revision,
                                })
                              }
                            >
                              Enviar a la UGEL
                            </Button>
                          )}
                        {active.role === 'UGEL_SPECIALIST' &&
                          r.status === 'SUBMITTED' && (
                            <>
                              <Button
                                variant="primary"
                                busy={transition.isPending}
                                onClick={() =>
                                  transition.mutate({
                                    id: r.id,
                                    action: 'review',
                                    revision: r.revision,
                                    status: 'REVIEWED',
                                  })
                                }
                              >
                                Dar conformidad
                              </Button>
                              <input
                                className={`${controlClass} h-9 max-w-xs min-w-0 flex-1`}
                                placeholder="Observación (obligatoria para observar)"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                              />
                              <Button
                                disabled={!notes.trim()}
                                onClick={() =>
                                  transition.mutate({
                                    id: r.id,
                                    action: 'review',
                                    revision: r.revision,
                                    status: 'OBSERVED',
                                    notes,
                                  })
                                }
                              >
                                Observar
                              </Button>
                            </>
                          )}
                      </div>
                      {transition.error ? (
                        <ErrorNote error={transition.error} />
                      ) : null}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
        {canGenerate && (
          <Card>
            <CardHeader
              title="Generar reporte"
              subtitle="Se calcula con los datos registrados hasta hoy"
            />
            <form
              onSubmit={(e) => void submit(e).catch(() => undefined)}
              className="space-y-3 px-4 py-3"
            >
              <Field label="Tipo">
                <select
                  className={inputClass}
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  {REPORT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {REPORT_TYPE[t]}
                    </option>
                  ))}
                </select>
              </Field>
              {isBimester ? (
                <Field label="Bimestre" hint="Solo bimestres ya iniciados.">
                  <select
                    className={inputClass}
                    value={selectedPeriod ?? ''}
                    disabled={!bimesters.length}
                    onChange={(e) => setPeriodId(e.target.value)}
                  >
                    {bimesters.map((p) => (
                      <option key={p.id} value={p.id}>
                        {periodLabel(p)} ({formatDate(p.startDate)} –{' '}
                        {formatDate(p.endDate)})
                      </option>
                    ))}
                  </select>
                  {periods.data && !bimesters.length && (
                    <span className="mt-1 block text-[0.875rem] text-high">
                      La IE no tiene bimestres iniciados este año.
                    </span>
                  )}
                </Field>
              ) : (
                <Field label="Mes" hint="Solo meses ya iniciados.">
                  <select
                    className={inputClass}
                    value={month}
                    onChange={(e) => setMonth(Number(e.target.value))}
                  >
                    {MONTHS.slice(0, Number(today.slice(5, 7))).map((m, i) => (
                      <option key={m} value={i + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                </Field>
              )}
              {generate.error ? <ErrorNote error={generate.error} /> : null}
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                busy={generate.isPending}
                disabled={isBimester && !selectedPeriod}
              >
                Generar
              </Button>
            </form>
          </Card>
        )}
      </div>
    </>
  );
}
