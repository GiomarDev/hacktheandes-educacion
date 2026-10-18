import { PageSkeleton } from '../ui/motion';
import { Link, useParams } from 'react-router';
import { CalendarCheck, FileText } from 'lucide-react';
import { useSession } from '../auth/AuthProvider';
import {
  useAlerts,
  useCases,
  useReports,
  useSchool,
  useSections,
} from '../api/queries';
import { attendanceRate, useSectionsData } from '../api/attendance';
import {
  alertType,
  formatDate,
  gradeLabel,
  int,
  isWeekend,
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
  Kpi,
  Loading,
  PageHeader,
} from '../ui/kit';

function daysAgo(date: string, n: number) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

export function EscuelaPage() {
  const { id } = useParams();
  const { active } = useSession();
  const today = todayInLima();
  const school = useSchool(id);
  const sections = useSections({
    schoolId: id,
    year: Number(today.slice(0, 4)),
  });
  const { attendance } = useSectionsData(
    sections.data ?? [],
    daysAgo(today, 13),
    today,
  );
  const alerts = useAlerts({ schoolId: id, status: 'OPEN' });
  const cases = useCases({ schoolId: id });
  const reports = useReports({ schoolId: id });
  const canReadAlerts = active.role !== 'SECRETARY';

  if (school.isPending) return <PageSkeleton />;
  if (school.error) return <ErrorNote error={school.error} />;
  const s = school.data;
  const list = sections.data ?? [];
  const enrolled = list.reduce((n, x) => n + x.enrolledCount, 0);
  const marks = attendance.flatMap((a) => a.data ?? []);
  const rate = attendanceRate(marks);
  const openCases = (cases.data ?? []).filter((c) => !c.closedAt);
  const byType = new Map<string, number>();
  for (const a of alerts.data ?? [])
    byType.set(a.type, (byType.get(a.type) ?? 0) + 1);
  const maxType = Math.max(1, ...byType.values());
  const isDirector = active.role === 'DIRECTOR' || active.role === 'SECRETARY';

  return (
    <>
      <PageHeader
        eyebrow={
          <span className="normal-case">
            <span className="font-sans tabular-nums">{s.modularCode}</span> ·{' '}
            {s.ugel?.name ?? 'UGEL'} · {s.department}
          </span>
        }
        title={s.name}
        subtitle={`${s.level === 'SECONDARY' ? 'Secundaria' : 'Primaria'} ${s.management === 'PUBLIC' ? 'pública' : 'privada'} · área ${s.area === 'RURAL' ? 'rural' : 'urbana'} · ${s.district}, ${s.province}${s.hasPsychologist ? ' · cuenta con psicólogo' : ''}`}
        action={
          isDirector ? (
            <div className="flex gap-2">
              <Link viewTransition to="/docente/aula">
                <Button>
                  <CalendarCheck className="size-4" aria-hidden /> Pase de lista
                </Button>
              </Link>
              {active.role === 'DIRECTOR' && (
                <Link viewTransition to="/reportes">
                  <Button variant="primary">
                    <FileText className="size-4" aria-hidden /> Reportes
                  </Button>
                </Link>
              )}
            </div>
          ) : null
        }
      />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          label="Matriculados activos"
          value={int(enrolled)}
          hint={`${list.length} secciones · meta ${s.attentionGoal}`}
        />
        <Kpi
          label="Asistencia · 14 días"
          value={pct(rate, 1)}
          tone={rate !== null && rate < 85 ? 'high' : 'stable'}
          hint={`${int(marks.length)} registros diarios`}
        />
        <Kpi
          label="Alertas abiertas"
          value={canReadAlerts ? (alerts.data?.length ?? '—') : '—'}
          tone="critical"
        />
        <Kpi
          label="Casos abiertos"
          value={canReadAlerts ? openCases.length : '—'}
          tone="gob"
          hint={
            canReadAlerts
              ? `${openCases.filter((c) => c.firstContactAt).length} con familia contactada`
              : undefined
          }
        />
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader
            title="Secciones"
            subtitle="Asistencia diaria de los últimos 14 días y pase de lista de hoy"
          />
          {sections.isPending ? (
            <Loading />
          ) : sections.error ? (
            <ErrorNote error={sections.error} />
          ) : !list.length ? (
            <Empty title="Sin secciones registradas este año" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[460px] text-[0.9375rem]">
                <thead>
                  <tr className="border-b border-line text-left text-[0.875rem] text-faint">
                    <th className="px-4 py-2 font-medium">Sección</th>
                    <th className="px-3 py-2 font-medium">Matrícula</th>
                    <th className="px-3 py-2 font-medium">Asistencia</th>
                    <th className="px-3 py-2 font-medium">Hoy</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((sec, i) => {
                    const m = attendance[i]?.data ?? [];
                    const r = attendanceRate(m);
                    const reported = m.some((x) => x.date === today);
                    return (
                      <tr
                        key={sec.id}
                        className="border-b border-line last:border-0"
                      >
                        <td className="px-4 py-2.5 font-medium">
                          {gradeLabel(sec.grade, sec.name)}{' '}
                          <span className="text-faint">
                            ·{' '}
                            {sec.shift === 'MORNING'
                              ? 'mañana'
                              : sec.shift.toLowerCase()}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-sans tabular-nums">
                          {sec.enrolledCount}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-20 overflow-hidden rounded bg-soft">
                              <div
                                className={
                                  r !== null && r < 85
                                    ? 'h-full bg-high'
                                    : 'h-full bg-stable'
                                }
                                style={{ width: `${r ?? 0}%` }}
                              />
                            </div>
                            <span className="font-sans tabular-nums">
                              {pct(r, 0)}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          {reported ? (
                            <Badge tone="stable">Reportado</Badge>
                          ) : isWeekend(today) ? (
                            <Badge>Fin de semana</Badge>
                          ) : (
                            <Badge tone="high">Sin pase de lista</Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
        <div className="space-y-4">
          {canReadAlerts && (
            <Card>
              <CardHeader
                title="Factores de riesgo detectados"
                subtitle="Alertas abiertas por regla de Alerta Escuela"
              />
              {alerts.isPending ? (
                <Loading />
              ) : alerts.error ? (
                <ErrorNote error={alerts.error} />
              ) : !byType.size ? (
                <Empty title="Sin alertas abiertas" />
              ) : (
                <ul className="space-y-3 px-4 py-4">
                  {[...byType.entries()]
                    .sort((a, b) => b[1] - a[1])
                    .map(([type, n]) => (
                      <li key={type}>
                        <div className="mb-1 flex justify-between text-[0.9375rem]">
                          <span>{alertType(type)}</span>
                          <span className="font-sans tabular-nums">{n}</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded bg-soft">
                          <div
                            className="h-full bg-critical"
                            style={{ width: `${(100 * n) / maxType}%` }}
                          />
                        </div>
                      </li>
                    ))}
                </ul>
              )}
              <div className="border-t border-line px-4 py-2.5">
                <Link
                  viewTransition
                  to="/alertas"
                  className="text-[0.9375rem] text-gob hover:underline"
                >
                  Ir al centro de alertas →
                </Link>
              </div>
            </Card>
          )}
          <Card>
            <CardHeader
              title="Reportes SIMON"
              subtitle="Seguimiento enviado a la UGEL"
            />
            {reports.isPending ? (
              <Loading />
            ) : reports.error ? (
              <ErrorNote error={reports.error} />
            ) : !reports.data.length ? (
              <Empty title="Sin reportes generados" />
            ) : (
              <ul className="divide-y divide-line">
                {reports.data.slice(0, 5).map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center gap-2 px-4 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">{REPORT_TYPE[r.type]}</div>
                      <div className="text-[0.9375rem] text-faint">
                        {r.month ? `Mes ${r.month}` : 'Bimestre'} · {r.year} ·{' '}
                        {formatDate(r.createdAt)}
                      </div>
                    </div>
                    <Badge tone={REPORT_STATUS[r.status].tone}>
                      {REPORT_STATUS[r.status].label}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
