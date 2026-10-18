import { useState } from 'react';
import type { FormEvent } from 'react';
import { useSession } from '../auth/AuthProvider';
import { TERRITORIAL } from '../auth/roles';
import {
  useGenerateReport,
  useReports,
  useReportTransition,
  useSchools,
} from '../api/queries';
import type { Report } from '../api/types';
import {
  formatDate,
  int,
  pct,
  REPORT_STATUS,
  REPORT_TYPE,
  todayInLima,
} from '../lib/format';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  Empty,
  ErrorNote,
  Field,
  inputClass,
  Loading,
  PageHeader,
} from '../ui/kit';

const MONTHLY_TYPES = [
  'MONTHLY_FOLLOWUP',
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
    attendance?: { rate?: number };
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

function ReportFigures({ report }: { report: Report }) {
  const p = report.payload as Payload;
  const items = [
    ['Matrícula activa', int(p.school?.activeEnrollments)],
    ['Asistencia', pct(p.school?.attendance?.rate, 1)],
    ['Alertas detectadas', int(p.alerts?.alertsDetected)],
    ['Casos abiertos', int(p.alerts?.casesOpened)],
    ['Primeros contactos', int(p.alerts?.firstContacts)],
    ['Días al primer contacto', p.alerts?.averageDaysToFirstContact ?? '—'],
  ];
  return (
    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {items.map(([label, value]) => (
        <div key={label as string} className="rounded bg-canvas px-2.5 py-2">
          <dt className="text-[11px] text-muted">{label}</dt>
          <dd className="font-mono text-[14px] font-medium">{value}</dd>
        </div>
      ))}
    </dl>
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
  const [open, setOpen] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const schoolName = new Map((schools.data ?? []).map((s) => [s.id, s.name]));

  async function submit(event: FormEvent) {
    event.preventDefault();
    const created = await generate.mutateAsync({
      schoolId: active.schoolId!,
      year,
      type,
      month,
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
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card>
          <CardHeader
            title={`Reportes ${year}`}
            subtitle={`${reports.data?.length ?? 0} reportes`}
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
                        {r.month ? MONTHS[r.month - 1] : 'bimestre'} {r.year}
                      </div>
                      <div className="text-[12px] text-faint">
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
                        <p className="rounded border border-high/30 bg-high-soft px-3 py-2 text-[12.5px]">
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
                                className={`${inputClass} max-w-xs flex-1`}
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
                  {MONTHLY_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {REPORT_TYPE[t]}
                    </option>
                  ))}
                </select>
              </Field>
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
              {generate.error ? <ErrorNote error={generate.error} /> : null}
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                busy={generate.isPending}
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
