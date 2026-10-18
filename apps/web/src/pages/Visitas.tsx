import { useState } from 'react';
import type { FormEvent } from 'react';
import { useSession } from '../auth/AuthProvider';
import { TERRITORIAL } from '../auth/roles';
import {
  useCreateVisit,
  useSchools,
  useSectionAreas,
  useSections,
  useUpdateVisit,
  useUsers,
  useVisits,
} from '../api/queries';
import type { MonitoringVisit } from '../api/types';
import {
  formatDate,
  gradeLabel,
  todayInLima,
  VISIT_STATUS,
  plural,
} from '../lib/format';
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
} from '../ui/kit';

// Agendan dirección y las autoridades del ámbito; el observador es quien agenda.
const SCHEDULERS = ['DIRECTOR', ...TERRITORIAL];
const PROTOCOL = 'MINEDU-2026';

function StageForm({ visit }: { visit: MonitoringVisit }) {
  const update = useUpdateVisit();
  const [observations, setObservations] = useState('');
  const [feedback, setFeedback] = useState('');
  const [commitment, setCommitment] = useState('');
  const done = visit.status === 'DONE';
  const happened = new Date(visit.visitedAt) <= new Date();

  async function submit(event: FormEvent) {
    event.preventDefault();
    await update.mutateAsync(
      done
        ? {
            id: visit.id,
            status: 'FEEDBACK_GIVEN',
            feedback,
            improvementCommitment: commitment,
          }
        : { id: visit.id, status: 'DONE', observations },
    );
  }

  if (!done && !happened)
    return (
      <p className="text-[0.9375rem] text-faint">
        Podrás registrar lo observado cuando llegue la fecha de la visita.
      </p>
    );
  return (
    <form
      onSubmit={(e) => void submit(e).catch(() => undefined)}
      className="space-y-2"
    >
      {done ? (
        <>
          <Field label="Devolución al docente">
            <textarea
              className={`${inputClass} h-20 py-2`}
              required
              maxLength={10000}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
          </Field>
          <Field label="Compromiso de mejora">
            <textarea
              className={`${inputClass} h-16 py-2`}
              required
              maxLength={10000}
              value={commitment}
              onChange={(e) => setCommitment(e.target.value)}
            />
          </Field>
        </>
      ) : (
        <Field label="Lo observado en el aula">
          <textarea
            className={`${inputClass} h-20 py-2`}
            required
            maxLength={10000}
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
          />
        </Field>
      )}
      {update.error ? <ErrorNote error={update.error} /> : null}
      <Button
        type="submit"
        variant="primary"
        busy={update.isPending}
        disabled={
          done ? !feedback.trim() || !commitment.trim() : !observations.trim()
        }
      >
        {done ? 'Registrar devolución' : 'Registrar observación'}
      </Button>
    </form>
  );
}

function ScheduleForm({ schoolId }: { schoolId: string }) {
  const year = Number(todayInLima().slice(0, 4));
  const sections = useSections({ schoolId, year });
  const [sectionId, setSectionId] = useState('');
  const section = sections.data?.find((s) => s.id === sectionId);
  const areas = useSectionAreas(sectionId || undefined);
  const users = useUsers({ schoolId });
  const [teacherId, setTeacherId] = useState('');
  const [when, setWhen] = useState('');
  const create = useCreateVisit();
  const nameOf = new Map(
    (users.data ?? []).map((u) => [u.id, `${u.firstName} ${u.lastName}`]),
  );
  // Solo se puede observar a quien tiene la sección: su tutor o un docente asignado.
  const candidates = section
    ? [
        ...new Set([
          section.tutorUserId,
          ...(areas.data ?? []).flatMap((a) => a.teacherUserIds),
        ]),
      ]
    : [];

  async function submit(event: FormEvent) {
    event.preventDefault();
    await create.mutateAsync({
      schoolId,
      sectionId,
      observedTeacherUserId: teacherId,
      visitedAt: `${when}:00-05:00`,
      protocolVersion: PROTOCOL,
    });
    setTeacherId('');
    setWhen('');
  }

  return (
    <form
      onSubmit={(e) => void submit(e).catch(() => undefined)}
      className="space-y-3 px-4 py-3"
    >
      <Field label="Sección">
        <select
          className={inputClass}
          required
          value={sectionId}
          onChange={(e) => {
            setSectionId(e.target.value);
            setTeacherId('');
          }}
        >
          <option value="">Elige una sección</option>
          {(sections.data ?? []).map((s) => (
            <option key={s.id} value={s.id}>
              {gradeLabel(s.grade, s.name)}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Docente observado">
        <select
          className={inputClass}
          required
          disabled={!section}
          value={teacherId}
          onChange={(e) => setTeacherId(e.target.value)}
        >
          <option value="">Elige al docente</option>
          {candidates.map((id) => (
            <option key={id} value={id}>
              {nameOf.get(id) ?? 'Docente sin cuenta visible'}
              {id === section?.tutorUserId ? ' (tutoría)' : ''}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Fecha y hora (Lima)">
        <input
          type="datetime-local"
          className={inputClass}
          required
          value={when}
          onChange={(e) => setWhen(e.target.value)}
        />
      </Field>
      {create.error ? <ErrorNote error={create.error} /> : null}
      <Button
        type="submit"
        variant="primary"
        className="w-full"
        busy={create.isPending}
        disabled={!sectionId || !teacherId || !when}
      >
        Agendar visita
      </Button>
    </form>
  );
}

export function VisitasPage() {
  const { user, active } = useSession();
  const year = Number(todayInLima().slice(0, 4));
  const isTerritorial = TERRITORIAL.includes(active.role);
  const canSchedule = SCHEDULERS.includes(active.role);
  const schools = useSchools(active.ugelId);
  const [chosenSchool, setChosenSchool] = useState('');
  const schoolId = active.schoolId ?? (chosenSchool || undefined);
  const visits = useVisits({ year, schoolId });
  // Los nombres de docentes y secciones solo se resuelven en la IE elegida.
  const users = useUsers({ schoolId }, canSchedule);
  const sections = useSections({ schoolId, year });
  const [open, setOpen] = useState<string | null>(null);
  const teacherName = new Map(
    (users.data ?? []).map((u) => [u.id, `${u.firstName} ${u.lastName}`]),
  );
  const sectionName = new Map(
    (sections.data ?? []).map((s) => [s.id, gradeLabel(s.grade, s.name)]),
  );
  const schoolName = new Map((schools.data ?? []).map((s) => [s.id, s.name]));

  return (
    <>
      <PageHeader
        title="Visitas de monitoreo"
        subtitle={
          canSchedule
            ? 'Agenda la observación de aula, registra lo observado y deja la devolución con un compromiso de mejora.'
            : 'Tus visitas de monitoreo: lo observado y la devolución de quien te visitó.'
        }
        action={
          isTerritorial && (
            <select
              className={`${controlClass} h-9 w-auto`}
              aria-label="IE"
              value={chosenSchool}
              onChange={(e) => setChosenSchool(e.target.value)}
            >
              <option value="">Todas las IEs del ámbito</option>
              {(schools.data ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )
        }
      />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card>
          <CardHeader
            title={`Visitas ${year}`}
            subtitle={plural(visits.data?.length ?? 0, 'visita', 'visitas')}
          />
          {visits.isPending ? (
            <Loading />
          ) : visits.error ? (
            <ErrorNote error={visits.error} />
          ) : !visits.data.length ? (
            <Empty title="No hay visitas registradas" />
          ) : (
            <ul className="divide-y divide-line">
              {visits.data.map((v) => {
                const mine = v.observerUserId === user.id;
                return (
                  <li key={v.id} className="px-4 py-3">
                    <button
                      className="flex w-full items-center gap-3 text-left"
                      aria-expanded={open === v.id}
                      onClick={() => setOpen(open === v.id ? null : v.id)}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-medium">
                          {v.observedTeacherUserId === user.id
                            ? 'Tu clase'
                            : (teacherName.get(v.observedTeacherUserId) ??
                              'Docente')}{' '}
                          · {sectionName.get(v.sectionId) ?? 'sección'}
                        </div>
                        <div className="text-[0.9375rem] text-faint">
                          {isTerritorial &&
                            `${schoolName.get(v.schoolId) ?? 'IE'} · `}
                          {formatDate(v.visitedAt, true)}
                          {mine ? ' · la observas tú' : ''}
                        </div>
                      </div>
                      <Badge tone={VISIT_STATUS[v.status].tone}>
                        {VISIT_STATUS[v.status].label}
                      </Badge>
                    </button>
                    {open === v.id && (
                      <div className="mt-3 space-y-3 text-[1rem]">
                        {v.observations && (
                          <div>
                            <div className="text-[0.875rem] font-medium text-muted">
                              Observación
                            </div>
                            <p className="mt-1 whitespace-pre-line">
                              {v.observations}
                            </p>
                          </div>
                        )}
                        {v.feedback && (
                          <div>
                            <div className="text-[0.875rem] font-medium text-muted">
                              Devolución
                            </div>
                            <p className="mt-1 whitespace-pre-line">
                              {v.feedback}
                            </p>
                            <div className="mt-2 text-[0.875rem] font-medium text-muted">
                              Compromiso de mejora
                            </div>
                            <p className="mt-1 whitespace-pre-line">
                              {v.improvementCommitment}
                            </p>
                          </div>
                        )}
                        {mine && v.status !== 'FEEDBACK_GIVEN' && (
                          <StageForm visit={v} />
                        )}
                        {!v.observations && !mine && (
                          <p className="text-[0.9375rem] text-faint">
                            Aún no se registra lo observado.
                          </p>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
        {canSchedule && (
          <Card>
            <CardHeader
              title="Agendar visita"
              subtitle={
                schoolId
                  ? 'Quedarás como observador'
                  : 'Elige primero una IE arriba'
              }
            />
            {schoolId ? (
              <ScheduleForm key={schoolId} schoolId={schoolId} />
            ) : (
              <Empty title="Sin IE elegida" />
            )}
          </Card>
        )}
      </div>
    </>
  );
}
