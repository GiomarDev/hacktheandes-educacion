import { useSearchParams } from 'react-router';
import { useSession } from '../auth/AuthProvider';
import {
  useGradeSheet,
  useRecordGrade,
  useSchoolPeriods,
  useSectionAreas,
  useSections,
} from '../api/queries';
import { GradeSheet } from '../features/GradeSheet';
import {
  currentPeriod,
  formatDate,
  gradeLabel,
  periodLabel,
  todayInLima,
  plural,
} from '../lib/format';
import {
  Badge,
  Card,
  CardHeader,
  Empty,
  ErrorNote,
  inputClass,
  Loading,
  PageHeader,
} from '../ui/kit';

export function NotasPage() {
  const { active } = useSession();
  const today = todayInLima();
  const year = Number(today.slice(0, 4));
  const [params, setParams] = useSearchParams();
  const sections = useSections({ year, schoolId: active.schoolId });
  const list = sections.data ?? [];
  const sectionId = params.get('seccion') ?? list[0]?.id;
  const section = list.find((s) => s.id === sectionId);
  const periods = useSchoolPeriods(section?.schoolId, year);
  const areas = useSectionAreas(sectionId);
  const areaList = areas.data ?? [];
  const periodId =
    params.get('periodo') ?? currentPeriod(periods.data ?? [], today)?.id;
  const areaId =
    params.get('area') ?? (areaList.find((a) => a.mine) ?? areaList[0])?.id;
  const area = areaList.find((a) => a.id === areaId);
  const period = periods.data?.find((p) => p.id === periodId);
  const sheet = useGradeSheet({ sectionId, areaId, periodId });
  const record = useRecordGrade();
  // Solo pone notas quien dicta el área (el backend lo exige igual).
  const editable =
    !!area?.mine && (active.role === 'TEACHER' || active.role === 'TUTOR');

  const set = (key: string, value: string, reset: string[] = []) => {
    const next = new URLSearchParams(params);
    next.set(key, value);
    for (const k of reset) next.delete(k);
    setParams(next, { replace: true });
  };

  if (sections.isPending) return <Loading />;
  if (sections.error) return <ErrorNote error={sections.error} />;
  if (!list.length)
    return (
      <>
        <PageHeader title="Registro de notas" />
        <Card>
          <Empty title="No tienes secciones a cargo">
            Dirección asigna la tutoría y la carga docente de cada sección.
          </Empty>
        </Card>
      </>
    );

  return (
    <>
      <PageHeader
        eyebrow={section?.school.name}
        title="Registro de notas"
        subtitle="Calificaciones por competencia (AD, A, B, C). Cada nota se guarda al elegirla y SIAGIE recalcula la del periodo."
      />
      <Card>
        <div className="grid gap-3 border-b border-line px-4 py-3 sm:grid-cols-3">
          <label>
            <span className="mb-1 block text-[12px] font-medium text-muted">
              Sección
            </span>
            <select
              className={inputClass}
              value={sectionId}
              onChange={(e) => set('seccion', e.target.value, ['area'])}
            >
              {list.map((s) => (
                <option key={s.id} value={s.id}>
                  {gradeLabel(s.grade, s.name)} · {s.school.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1 block text-[12px] font-medium text-muted">
              Periodo
            </span>
            <select
              className={inputClass}
              value={periodId ?? ''}
              disabled={!periods.data?.length}
              onChange={(e) => set('periodo', e.target.value)}
            >
              {(periods.data ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {periodLabel(p)} ({formatDate(p.startDate)} –{' '}
                  {formatDate(p.endDate)})
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1 block text-[12px] font-medium text-muted">
              Área
            </span>
            <select
              className={inputClass}
              value={areaId ?? ''}
              disabled={!areaList.length}
              onChange={(e) => set('area', e.target.value)}
            >
              {areaList.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                  {a.mine ? ' (la dictas)' : ''}
                </option>
              ))}
            </select>
          </label>
        </div>
        <CardHeader
          title={
            area && period
              ? `${area.name} · ${periodLabel(period)}`
              : 'Calificaciones'
          }
          subtitle={
            sheet.data
              ? `${plural(sheet.data.rows.length, 'estudiante', 'estudiantes')} con matrícula activa`
              : undefined
          }
          action={
            area && (
              <Badge tone={editable ? 'gob' : 'neutral'}>
                {editable ? 'Puedes editar' : 'Solo lectura'}
              </Badge>
            )
          }
        />
        {periods.isPending || areas.isPending ? (
          <Loading />
        ) : periods.error ? (
          <ErrorNote error={periods.error} />
        ) : areas.error ? (
          <ErrorNote error={areas.error} />
        ) : !periods.data?.length ? (
          <Empty title="La IE no tiene periodos académicos este año">
            Secretaría registra los bimestres o trimestres del año lectivo.
          </Empty>
        ) : !areaList.length ? (
          <Empty title="La sección no tiene carga docente">
            Dirección asigna qué docente dicta cada área.
          </Empty>
        ) : sheet.isPending ? (
          <Loading />
        ) : sheet.error ? (
          <ErrorNote error={sheet.error} />
        ) : !sheet.data.rows.length ? (
          <Empty title="Sección sin matrícula activa" />
        ) : (
          <GradeSheet
            key={`${sectionId}-${areaId}-${periodId}`}
            sheet={sheet.data}
            editable={editable}
            onSave={(change) =>
              record.mutateAsync({ ...change, periodId: periodId! })
            }
          />
        )}
      </Card>
    </>
  );
}
