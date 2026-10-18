import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { useSession } from '@/features/auth/AuthProvider';
import { useCreatePlan, usePlans } from '@/features/plans/api';
import { useStudentNames } from '@/features/attendance/api';
import {
  formatDate,
  fullName,
  PLAN_STATUS,
  plural,
  todayInLima,
} from '@/shared/lib/format';
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
} from '@/shared/ui/kit';

// Pueden crear planes el tutor de la sección, psicología y dirección (SIMON verifica la asignación).
export const PLAN_WRITERS = ['TUTOR', 'PSYCHOLOGIST', 'DIRECTOR'];

export function PlanesPage() {
  const { active } = useSession();
  const year = Number(todayInLima().slice(0, 4));
  const plans = usePlans({ year, schoolId: active.schoolId });
  const names = useStudentNames();
  const create = useCreatePlan();
  const navigate = useNavigate();
  const canCreate = PLAN_WRITERS.includes(active.role);
  const [studentId, setStudentId] = useState('');
  const [barriers, setBarriers] = useState('');
  const [strengths, setStrengths] = useState('');
  const [diagnosis, setDiagnosis] = useState('');

  const withPlan = new Set((plans.data ?? []).map((p) => p.studentId));
  const candidates = [...names.values()]
    .filter((e) => !withPlan.has(e.studentId) && e.status === 'ENROLLED')
    .sort((a, b) => fullName(a.student).localeCompare(fullName(b.student)));
  const nameOf = (id: string) => {
    const e = names.get(id);
    return e ? fullName(e.student) : 'Estudiante';
  };

  async function submit(event: FormEvent) {
    event.preventDefault();
    const plan = await create.mutateAsync({
      schoolId: active.schoolId!,
      studentId,
      year,
      barriers,
      ...(strengths.trim() ? { strengths } : {}),
      ...(diagnosis.trim() ? { diagnosis } : {}),
    });
    navigate(`/planes/${plan.id}`, { viewTransition: true });
  }

  return (
    <>
      <PageHeader
        title="Planes de apoyo"
        subtitle="Acompañamiento individual por bimestre. El diagnóstico se guarda cifrado y solo lo leen el tutor, psicología y dirección."
      />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader
            title={`Planes ${year}`}
            subtitle={`${plural(plans.data?.length ?? 0, 'plan visible', 'planes visibles')} para ti`}
          />
          {plans.isPending ? (
            <Loading />
          ) : plans.error ? (
            <ErrorNote error={plans.error} />
          ) : !plans.data.length ? (
            <Empty title="Aún no hay planes de apoyo">
              {canCreate
                ? 'Crea el primero para un estudiante que lo necesite.'
                : 'Aparecerán cuando tutoría, psicología o dirección los creen.'}
            </Empty>
          ) : (
            <ul className="divide-y divide-line">
              {plans.data.map((p) => (
                <li key={p.id}>
                  <Link
                    viewTransition
                    to={`/planes/${p.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-soft"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">{nameOf(p.studentId)}</div>
                      <div className="truncate text-[0.9375rem] text-faint">
                        {p.barriers}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge tone={PLAN_STATUS[p.status].tone}>
                        {PLAN_STATUS[p.status].label}
                      </Badge>
                      <div className="mt-1 text-[0.875rem] text-faint">
                        {formatDate(p.updatedAt)}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
        {canCreate && (
          <Card>
            <CardHeader
              title="Nuevo plan"
              subtitle="Un plan por estudiante y año"
            />
            <form
              onSubmit={(e) => void submit(e).catch(() => undefined)}
              className="space-y-3 px-4 py-3"
            >
              <Field label="Estudiante">
                <select
                  className={inputClass}
                  required
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                >
                  <option value="">Elige un estudiante</option>
                  {candidates.map((e) => (
                    <option key={e.studentId} value={e.studentId}>
                      {fullName(e.student)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label="Barreras para el aprendizaje"
                hint="Lo comparten todos los lectores del plan, incluidos los docentes."
              >
                <textarea
                  className={`${inputClass} h-24 py-2`}
                  required
                  maxLength={10000}
                  value={barriers}
                  onChange={(e) => setBarriers(e.target.value)}
                />
              </Field>
              <Field label="Fortalezas (opcional)">
                <textarea
                  className={`${inputClass} h-20 py-2`}
                  maxLength={10000}
                  value={strengths}
                  onChange={(e) => setStrengths(e.target.value)}
                />
              </Field>
              <Field
                label="Diagnóstico reservado (opcional)"
                hint="Se cifra y no lo ven docentes ni secretaría. No lo escribas en los otros campos."
              >
                <textarea
                  className={`${inputClass} h-20 py-2`}
                  maxLength={10000}
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                />
              </Field>
              {create.error ? <ErrorNote error={create.error} /> : null}
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                busy={create.isPending}
                disabled={!studentId || !barriers.trim()}
              >
                Crear plan
              </Button>
            </form>
          </Card>
        )}
      </div>
    </>
  );
}
