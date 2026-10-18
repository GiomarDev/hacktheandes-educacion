import { Link } from 'react-router';
import { CalendarCheck, ChevronRight, Clock, FolderOpen } from 'lucide-react';
import { useSession } from '../auth/AuthProvider';
import { useAlerts, useCases, useSections } from '../api/queries';
import { attendanceRate, useSectionsData } from '../api/attendance';
import type { Alert, Enrollment } from '../api/types';
import {
  ageOf,
  alertEvidence,
  alertType,
  daysUntil,
  formatDate,
  fullName,
  gradeLabel,
  greeting,
  isWeekend,
  pct,
  SEVERITY,
  timeAgo,
  todayInLima,
  weekStart,
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

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('');
}

export function DocenteHoyPage() {
  const { user } = useSession();
  const today = todayInLima();
  const year = Number(today.slice(0, 4));
  const sections = useSections({ year });
  const list = sections.data ?? [];
  const { rosters, attendance } = useSectionsData(
    list,
    weekStart(today),
    today,
  );
  const alerts = useAlerts({ status: 'OPEN' });
  const cases = useCases();

  const students = new Map<string, Enrollment>();
  rosters.forEach((r) => r.data?.forEach((e) => students.set(e.studentId, e)));
  const sectionName = new Map(
    list.map((s) => [s.id, gradeLabel(s.grade, s.name)]),
  );

  const weekMarks = attendance.flatMap((a) => a.data ?? []);
  const rate = attendanceRate(weekMarks);
  const pendingRollCall = isWeekend(today)
    ? []
    : list.filter(
        (s, i) =>
          s.enrolledCount > 0 &&
          !(attendance[i]?.data ?? []).some((m) => m.date === today),
      );

  // Una tarjeta por estudiante: su alerta más severa y reciente.
  const byStudent = new Map<string, Alert[]>();
  for (const a of alerts.data ?? []) {
    if (!a.studentId) continue;
    byStudent.set(a.studentId, [...(byStudent.get(a.studentId) ?? []), a]);
  }
  const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  const attention = [...byStudent.entries()]
    .map(([studentId, list]) => ({
      studentId,
      alerts: list.sort(
        (a, b) =>
          order[a.severity] - order[b.severity] ||
          b.detectedAt.localeCompare(a.detectedAt),
      ),
    }))
    .sort((a, b) => order[a.alerts[0].severity] - order[b.alerts[0].severity]);

  const myCases = (cases.data ?? []).filter(
    (c) => !c.closedAt && c.ownerUserId === user.id,
  );
  const caseOf = new Map(
    (cases.data ?? []).filter((c) => !c.closedAt).map((c) => [c.studentId, c]),
  );
  const firstName = user.name.split(' ')[0];
  const schools = [...new Set(list.map((s) => s.school.name))];

  return (
    <>
      <PageHeader
        eyebrow={formatDate(today)}
        title={`${greeting()}, ${firstName}`}
        subtitle={
          list.length
            ? `${schools.join(' · ')} · ${list.map((s) => gradeLabel(s.grade, s.name)).join(', ')}`
            : 'Tus secciones aparecerán aquí cuando dirección te asigne una.'
        }
        action={
          <Link to="/docente/aula">
            <Button variant="primary">
              <CalendarCheck className="size-4" aria-hidden /> Pasar lista
            </Button>
          </Link>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          label="Alumnos a mi cargo"
          value={list.reduce((n, s) => n + s.enrolledCount, 0)}
          hint={`${list.length} sección(es)`}
        />
        <Kpi
          label="Asistencia esta semana"
          value={pct(rate, 0)}
          tone={rate !== null && rate < 85 ? 'high' : 'stable'}
          hint={
            weekMarks.length
              ? `${weekMarks.length} registros desde el lunes`
              : 'Sin registros esta semana'
          }
        />
        <Kpi
          label="Requieren atención"
          value={attention.length}
          tone={attention.length ? 'critical' : 'ink'}
          hint="Con alerta abierta"
        />
        <Kpi
          label="Pendientes"
          value={pendingRollCall.length + myCases.length}
          hint={`${pendingRollCall.length} pase(s) de lista · ${myCases.length} caso(s)`}
        />
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <CardHeader
            title="Alumnos que requieren tu atención"
            subtitle="Detectados por las reglas de asistencia y notas de Alerta Escuela"
            action={
              <Badge tone={attention.length ? 'critical' : 'neutral'}>
                {attention.length} casos
              </Badge>
            }
          />
          {alerts.isPending || sections.isPending ? (
            <Loading />
          ) : alerts.error ? (
            <ErrorNote error={alerts.error} />
          ) : attention.length === 0 ? (
            <Empty title="Nadie con alertas abiertas">
              Cuando un estudiante acumule faltas o tardanzas aparecerá aquí.
            </Empty>
          ) : (
            <ul className="divide-y divide-line">
              {attention.slice(0, 8).map(({ studentId, alerts: list }) => {
                const enrollment = students.get(studentId);
                const top = list[0];
                const name = enrollment
                  ? fullName(enrollment.student)
                  : 'Estudiante';
                const relatedCase = caseOf.get(studentId);
                return (
                  <li key={studentId} className="flex gap-3 px-4 py-3.5">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-critical-soft text-[12px] font-semibold text-critical">
                      {initials(name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-semibold">{name}</span>
                        <span className="text-[12px] text-faint">
                          {enrollment
                            ? `${ageOf(enrollment.student.birthDate)} años · `
                            : ''}
                          {top.sectionId ? sectionName.get(top.sectionId) : ''}
                        </span>
                        <Badge tone={SEVERITY[top.severity].tone}>
                          {alertType(top.type)}
                        </Badge>
                      </div>
                      <p className="mt-1 text-[12.5px] text-muted">
                        {alertEvidence(top.data) ??
                          'Revisar la evidencia en el caso.'}{' '}
                        · detectada {timeAgo(top.detectedAt)}
                        {list.length > 1
                          ? ` · ${list.length} alertas abiertas`
                          : ''}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {relatedCase && (
                          <Link to={`/casos/${relatedCase.id}`}>
                            <Button variant="primary">
                              <FolderOpen className="size-3.5" aria-hidden />{' '}
                              Atender caso
                            </Button>
                          </Link>
                        )}
                        <Link to={`/estudiantes/${studentId}`}>
                          <Button>Ver ficha</Button>
                        </Link>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Pendientes" subtitle="Lo que requiere tu acción" />
          {sections.error ? <ErrorNote error={sections.error} /> : null}
          <ul className="divide-y divide-line">
            {pendingRollCall.map((s) => (
              <li key={s.id}>
                <Link
                  to={`/docente/aula?seccion=${s.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-canvas"
                >
                  <span className="rounded bg-critical-soft px-1.5 py-0.5 font-mono text-[10px] font-medium text-critical">
                    HOY
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">
                      Pasar lista · {gradeLabel(s.grade, s.name)}
                    </div>
                    <div className="text-[12px] text-faint">
                      {s.enrolledCount} estudiantes · {s.school.name}
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-faint" aria-hidden />
                </Link>
              </li>
            ))}
            {myCases.map((c) => {
              const days = daysUntil(c.dueAt);
              const enrollment = students.get(c.studentId);
              return (
                <li key={c.id}>
                  <Link
                    to={`/casos/${c.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-canvas"
                  >
                    <span
                      className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-medium ${days <= 0 ? 'bg-critical-soft text-critical' : 'bg-medium-soft text-[#9a6a00]'}`}
                    >
                      {days <= 0
                        ? 'VENCIDO'
                        : `${days} DÍA${days === 1 ? '' : 'S'}`}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">Contactar a la familia</div>
                      <div className="text-[12px] text-faint">
                        {enrollment ? fullName(enrollment.student) : 'Caso'} ·
                        plazo {formatDate(c.dueAt, true)}
                      </div>
                    </div>
                    <Clock className="size-4 text-faint" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
          {!pendingRollCall.length &&
            !myCases.length &&
            !sections.isPending && (
              <Empty title="Todo al día">
                No tienes pases de lista ni casos pendientes.
              </Empty>
            )}
        </Card>
      </div>
    </>
  );
}
