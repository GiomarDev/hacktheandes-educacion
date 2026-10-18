import { PageSkeleton } from '../ui/motion';
import { Link, useParams } from 'react-router';
import { useCases, useStudentSummary } from '../api/queries';
import { ageOf, CASE_STATUS, formatDate, fullName, pct } from '../lib/format';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  Empty,
  ErrorNote,
  Kpi,
  PageHeader,
} from '../ui/kit';

const GRADE_TONE = {
  AD: 'stable',
  A: 'stable',
  B: 'medium',
  C: 'critical',
} as const;

export function EstudiantePage() {
  const { id } = useParams();
  const summary = useStudentSummary(id);
  const cases = useCases();
  if (summary.isPending) return <PageSkeleton />;
  if (summary.error) return <ErrorNote error={summary.error} />;
  const { student, attendance, periodGrades, enrollment } = summary.data;
  const studentCases = (cases.data ?? []).filter((c) => c.studentId === id);
  const periods = [...new Set(periodGrades.map((g) => g.periodNumber))].sort();
  const competencies = [
    ...new Set(periodGrades.map((g) => g.competencyCode)),
  ].sort();

  return (
    <>
      <PageHeader
        eyebrow="Ficha del estudiante · consulta registrada en auditoría"
        title={fullName(student)}
        subtitle={`${ageOf(student.birthDate)} años · Código ${student.studentCode} · Matrícula ${enrollment.year} (${enrollment.status === 'ENROLLED' ? 'vigente' : enrollment.status.toLowerCase()})`}
      />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          label="Asistencia del año"
          value={pct(attendance.rate, 1)}
          tone={attendance.rate < 85 ? 'critical' : 'stable'}
        />
        <Kpi
          label="Faltas"
          value={attendance.absent}
          tone={attendance.absent >= 3 ? 'critical' : 'ink'}
          hint={`${attendance.justified} justificadas`}
        />
        <Kpi label="Tardanzas" value={attendance.late} />
        <Kpi label="Días presentes" value={attendance.present} />
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Calificaciones por competencia"
            subtitle="Escala literal AD · A · B · C por bimestre"
          />
          {!periodGrades.length ? (
            <Empty title="Sin calificaciones registradas" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[0.9375rem]">
                <thead>
                  <tr className="border-b border-line text-left text-[0.875rem] text-faint">
                    <th className="px-4 py-2 font-medium">Competencia</th>
                    {periods.map((p) => (
                      <th key={p} className="px-3 py-2 text-center font-medium">
                        B{p}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {competencies.map((c) => (
                    <tr key={c} className="border-b border-line last:border-0">
                      <td className="px-4 py-2 font-sans tabular-nums">{c}</td>
                      {periods.map((p) => {
                        const value = periodGrades.find(
                          (g) => g.competencyCode === c && g.periodNumber === p,
                        )?.value;
                        return (
                          <td key={p} className="px-3 py-2 text-center">
                            {value ? (
                              <Badge
                                tone={
                                  GRADE_TONE[
                                    value as keyof typeof GRADE_TONE
                                  ] ?? 'neutral'
                                }
                              >
                                {value}
                              </Badge>
                            ) : (
                              '—'
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
        <Card>
          <CardHeader
            title="Casos de seguimiento"
            subtitle="Acompañamiento a la familia desde Alerta Escuela"
          />
          {cases.error ? (
            <ErrorNote error={cases.error} />
          ) : !studentCases.length ? (
            <Empty title="Sin casos abiertos ni cerrados" />
          ) : (
            <ul className="divide-y divide-line">
              {studentCases.map((c) => (
                <li key={c.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <Badge tone={CASE_STATUS[c.status].tone}>
                      {CASE_STATUS[c.status].label}
                    </Badge>
                    <div className="mt-1 text-[0.9375rem] text-faint">
                      Abierto {formatDate(c.openedAt)} ·{' '}
                      {c.firstContactAt
                        ? `primer contacto ${formatDate(c.firstContactAt)}`
                        : 'sin contacto aún'}
                    </div>
                  </div>
                  <Link viewTransition to={`/casos/${c.id}`}>
                    <Button>Ver caso</Button>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
