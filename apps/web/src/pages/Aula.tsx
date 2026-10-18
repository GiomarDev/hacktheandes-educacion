import { Link, useSearchParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import {
  useSaveAttendance,
  useSectionStudents,
  useSections,
} from '../api/queries';
import { attendanceRangeQuery } from '../api/attendance';
import type { AttendanceStatus } from '../api/types';
import { AttendanceSheet } from '../features/AttendanceSheet';
import { formatDate, gradeLabel, isWeekend, todayInLima } from '../lib/format';
import {
  Card,
  CardHeader,
  Empty,
  ErrorNote,
  inputClass,
  Loading,
  PageHeader,
} from '../ui/kit';

export function AulaPage() {
  const today = todayInLima();
  const [params, setParams] = useSearchParams();
  const sections = useSections({ year: Number(today.slice(0, 4)) });
  const list = sections.data ?? [];
  const sectionId = params.get('seccion') ?? list[0]?.id;
  const date = params.get('fecha') ?? today;
  const section = list.find((s) => s.id === sectionId);
  const roster = useSectionStudents(sectionId);
  const existing = useQuery({
    ...attendanceRangeQuery(sectionId ?? '', date, date),
    enabled: !!sectionId,
  });
  const save = useSaveAttendance();

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    next.set(key, value);
    setParams(next, { replace: true });
  };

  if (sections.isPending) return <Loading />;
  if (sections.error) return <ErrorNote error={sections.error} />;
  if (!list.length)
    return (
      <>
        <PageHeader title="Mi aula" />
        <Card>
          <Empty title="No tienes secciones a cargo">
            Dirección asigna la tutoría, el auxiliar o la carga docente de cada
            sección.
          </Empty>
        </Card>
      </>
    );

  const initial = Object.fromEntries(
    (existing.data ?? []).map((m) => [m.enrollmentId, m.status]),
  ) as Record<string, AttendanceStatus>;

  return (
    <>
      <PageHeader
        eyebrow={section?.school.name}
        title="Pase de lista diario"
        subtitle="Marca a cada estudiante. Las faltas alimentan las alertas tempranas; nada se envía a la familia sin que un responsable lo decida."
      />
      <Card>
        <div className="flex flex-wrap items-end gap-3 border-b border-line px-4 py-3">
          <label className="min-w-[200px] flex-1">
            <span className="mb-1 block text-[12px] font-medium text-muted">
              Sección
            </span>
            <select
              className={inputClass}
              value={sectionId}
              onChange={(e) => set('seccion', e.target.value)}
            >
              {list.map((s) => (
                <option key={s.id} value={s.id}>
                  {gradeLabel(s.grade, s.name)} · {s.school.name} (
                  {s.enrolledCount})
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1 block text-[12px] font-medium text-muted">
              Fecha
            </span>
            <input
              type="date"
              className={inputClass}
              value={date}
              max={today}
              onChange={(e) => e.target.value && set('fecha', e.target.value)}
            />
          </label>
        </div>
        <CardHeader
          title={
            section
              ? `${gradeLabel(section.grade, section.name)} · ${formatDate(date)}`
              : 'Sección'
          }
          subtitle={
            existing.isPending
              ? 'Consultando los registros del día…'
              : existing.data?.length
                ? `Ya hay ${existing.data.length} registros para este día: puedes corregirlos y volver a guardar.`
                : isWeekend(date)
                  ? 'Es fin de semana: verifica que corresponda registrar asistencia.'
                  : 'Aún no se ha pasado lista este día.'
          }
          action={
            <Link
              to="/docente"
              className="text-[12px] text-gob hover:underline"
            >
              Volver a Hoy
            </Link>
          }
        />
        {roster.isPending || existing.isPending ? (
          <Loading />
        ) : roster.error ? (
          <ErrorNote error={roster.error} />
        ) : !roster.data?.length ? (
          <Empty title="Sección sin matrícula activa" />
        ) : (
          <AttendanceSheet
            key={`${sectionId}-${date}`}
            roster={roster.data}
            initial={initial}
            onSubmit={(records) =>
              save.mutateAsync({ sectionId: sectionId!, date, records })
            }
          />
        )}
      </Card>
    </>
  );
}
