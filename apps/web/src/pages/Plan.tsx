import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useParams } from 'react-router';
import { Lock } from 'lucide-react';
import { useSession } from '../auth/AuthProvider';
import {
  useApproveVersion,
  useCreateVersion,
  usePlan,
  usePlanStatus,
  useSchoolPeriods,
  useUpdatePlan,
  useUpdateVersion,
} from '../api/queries';
import { useStudentNames } from '../api/attendance';
import type { SupportPlanDetail, SupportPlanVersion } from '../api/types';
import {
  formatDate,
  fullName,
  periodLabel,
  PLAN_STATUS,
  toLines,
  todayInLima,
  currentPeriod,
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

const textarea = `${inputClass} h-24 py-2`;

function Lines({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div className="text-[0.875rem] font-medium text-muted">{title}</div>
      {items.length ? (
        <ul className="mt-1 list-disc space-y-0.5 pl-5 text-[1rem]">
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-[0.9375rem] text-faint">Sin entradas.</p>
      )}
    </div>
  );
}

type VersionDraft = {
  goals: string;
  adjustments: string;
  strategies: string;
  progressNotes: string;
};
const draftOf = (v?: SupportPlanVersion): VersionDraft => ({
  goals: v?.goals.join('\n') ?? '',
  adjustments: v?.adjustments.join('\n') ?? '',
  strategies: v?.strategies.join('\n') ?? '',
  progressNotes: v?.progressNotes ?? '',
});
const bodyOf = (d: VersionDraft) => ({
  goals: toLines(d.goals),
  adjustments: toLines(d.adjustments),
  strategies: toLines(d.strategies),
  ...(d.progressNotes.trim() ? { progressNotes: d.progressNotes } : {}),
});

function VersionForm({
  initial,
  periods,
  defaultPeriodId,
  submitLabel,
  busy,
  error,
  onSubmit,
  onCancel,
}: {
  initial?: SupportPlanVersion;
  periods?: { id: string; label: string }[];
  defaultPeriodId?: string;
  submitLabel: string;
  busy: boolean;
  error: unknown;
  onSubmit: (draft: VersionDraft, periodId?: string) => Promise<unknown>;
  onCancel?: () => void;
}) {
  const [draft, setDraft] = useState(() => draftOf(initial));
  const [periodId, setPeriodId] = useState(
    defaultPeriodId ?? periods?.[0]?.id ?? '',
  );
  const set = (key: keyof VersionDraft) => (value: string) =>
    setDraft((d) => ({ ...d, [key]: value }));
  const valid =
    toLines(draft.goals).length > 0 &&
    toLines(draft.strategies).length > 0 &&
    (!periods || !!periodId);

  async function submit(event: FormEvent) {
    event.preventDefault();
    await onSubmit(draft, periods ? periodId : undefined);
  }

  return (
    <form
      onSubmit={(e) => void submit(e).catch(() => undefined)}
      className="space-y-3 px-4 py-3"
    >
      {periods && (
        <Field label="Bimestre">
          <select
            className={inputClass}
            value={periodId}
            onChange={(e) => setPeriodId(e.target.value)}
          >
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </Field>
      )}
      <Field label="Metas" hint="Una por línea.">
        <textarea
          className={textarea}
          value={draft.goals}
          onChange={(e) => set('goals')(e.target.value)}
        />
      </Field>
      <Field label="Adecuaciones (opcional)" hint="Una por línea.">
        <textarea
          className={textarea}
          value={draft.adjustments}
          onChange={(e) => set('adjustments')(e.target.value)}
        />
      </Field>
      <Field label="Estrategias" hint="Una por línea.">
        <textarea
          className={textarea}
          value={draft.strategies}
          onChange={(e) => set('strategies')(e.target.value)}
        />
      </Field>
      <Field label="Avances (opcional)">
        <textarea
          className={`${inputClass} h-20 py-2`}
          maxLength={10000}
          value={draft.progressNotes}
          onChange={(e) => set('progressNotes')(e.target.value)}
        />
      </Field>
      {error ? <ErrorNote error={error} /> : null}
      <div className="flex gap-2">
        <Button type="submit" variant="primary" busy={busy} disabled={!valid}>
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}

function BaseCard({
  plan,
  canEdit,
}: {
  plan: SupportPlanDetail;
  canEdit: boolean;
}) {
  const update = useUpdatePlan(plan.id);
  const [editing, setEditing] = useState(false);
  const [barriers, setBarriers] = useState(plan.barriers);
  const [strengths, setStrengths] = useState(plan.strengths ?? '');
  const [diagnosis, setDiagnosis] = useState(plan.diagnosis ?? '');
  const readsDiagnosis = 'diagnosis' in plan;

  async function save(event: FormEvent) {
    event.preventDefault();
    await update.mutateAsync({
      barriers,
      strengths,
      ...(readsDiagnosis ? { diagnosis } : {}),
    });
    setEditing(false);
  }

  return (
    <Card>
      <CardHeader
        title="Situación del estudiante"
        action={
          canEdit &&
          !editing && (
            <Button variant="ghost" onClick={() => setEditing(true)}>
              Editar
            </Button>
          )
        }
      />
      {editing ? (
        <form
          onSubmit={(e) => void save(e).catch(() => undefined)}
          className="space-y-3 px-4 py-3"
        >
          <Field label="Barreras para el aprendizaje">
            <textarea
              className={textarea}
              required
              maxLength={10000}
              value={barriers}
              onChange={(e) => setBarriers(e.target.value)}
            />
          </Field>
          <Field label="Fortalezas">
            <textarea
              className={textarea}
              maxLength={10000}
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
            />
          </Field>
          {readsDiagnosis && (
            <Field
              label="Diagnóstico reservado"
              hint="Déjalo vacío para quitarlo."
            >
              <textarea
                className={textarea}
                maxLength={10000}
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
              />
            </Field>
          )}
          {update.error ? <ErrorNote error={update.error} /> : null}
          <div className="flex gap-2">
            <Button
              type="submit"
              variant="primary"
              busy={update.isPending}
              disabled={!barriers.trim()}
            >
              Guardar
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setEditing(false)}
            >
              Cancelar
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-3 px-4 py-3 text-[1rem]">
          <div>
            <div className="text-[0.875rem] font-medium text-muted">
              Barreras
            </div>
            <p className="mt-1 whitespace-pre-line">{plan.barriers}</p>
          </div>
          <div>
            <div className="text-[0.875rem] font-medium text-muted">
              Fortalezas
            </div>
            <p className="mt-1 whitespace-pre-line">
              {plan.strengths || (
                <span className="text-faint">Sin registrar.</span>
              )}
            </p>
          </div>
          {readsDiagnosis && (
            <div className="rounded border border-line bg-canvas px-3 py-2">
              <div className="flex items-center gap-1 text-[0.875rem] font-medium text-muted">
                <Lock className="size-3" aria-hidden /> Diagnóstico reservado
                (tu lectura queda registrada)
              </div>
              <p className="mt-1 whitespace-pre-line">
                {plan.diagnosis || (
                  <span className="text-faint">Sin diagnóstico.</span>
                )}
              </p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

export function PlanPage() {
  const { id } = useParams();
  const { user, active } = useSession();
  const plan = usePlan(id);
  const names = useStudentNames();
  const periods = useSchoolPeriods(plan.data?.schoolId, plan.data?.year);
  const status = usePlanStatus(id ?? '');
  const createVersion = useCreateVersion(id ?? '');
  const updateVersion = useUpdateVersion(id ?? '');
  const approve = useApproveVersion(id ?? '');
  const [editingVersion, setEditingVersion] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  if (plan.isPending) return <Loading />;
  if (plan.error) return <ErrorNote error={plan.error} />;
  const p = plan.data;
  const archived = p.status === 'ARCHIVED';
  // Quien recibe el diagnóstico es tutor asignado, psicología o dirección: edita la base y el estado.
  const isWriter = 'diagnosis' in p;
  // El docente asignado también redacta versiones (SIMON lo verifica).
  const canDraft = !archived && (isWriter || active.role === 'TEACHER');
  const isTutor = active.role === 'TUTOR' && p.tutorUserId === user.id;
  const enrollment = names.get(p.studentId);
  const periodName = new Map(
    (periods.data ?? []).map((x) => [x.id, periodLabel(x)]),
  );
  const today = todayInLima();
  const used = new Set(p.versions.map((v) => v.periodId));
  const freeBimesters = (periods.data ?? []).filter(
    (x) => x.type === 'BIMESTER' && !used.has(x.id),
  );
  // Propone el bimestre en curso (o el último iniciado) entre los que aún no tienen versión.
  const suggestedPeriod = currentPeriod(freeBimesters, today)?.id;
  const freePeriods = freeBimesters.map((x) => ({
    id: x.id,
    label: `${periodLabel(x)}${x.startDate > today ? ' (aún no inicia)' : ''}`,
  }));
  const hasApproved = p.versions.some((v) => v.approvedAt);

  return (
    <>
      <PageHeader
        eyebrow={
          <Link to="/planes" className="hover:underline">
            Planes de apoyo
          </Link>
        }
        title={enrollment ? fullName(enrollment.student) : 'Plan de apoyo'}
        subtitle={`Año ${p.year} · creado ${formatDate(p.createdAt)}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={PLAN_STATUS[p.status].tone}>
              {PLAN_STATUS[p.status].label}
            </Badge>
            {isWriter && p.status === 'DRAFT' && (
              <Button
                variant="primary"
                busy={status.isPending}
                disabled={!hasApproved}
                title={
                  hasApproved
                    ? undefined
                    : 'Necesita al menos una versión aprobada'
                }
                onClick={() => status.mutate('ACTIVE')}
              >
                Activar
              </Button>
            )}
            {isWriter && !archived && (
              <Button
                busy={status.isPending}
                onClick={() => status.mutate('ARCHIVED')}
              >
                Archivar
              </Button>
            )}
          </div>
        }
      />
      {status.error ? <ErrorNote error={status.error} /> : null}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <BaseCard plan={p} canEdit={isWriter && !archived} />
        <Card>
          <CardHeader
            title="Versiones por bimestre"
            subtitle="La versión aprobada por el tutor queda fija."
            action={
              canDraft &&
              !adding &&
              freePeriods.length > 0 && (
                <Button variant="ghost" onClick={() => setAdding(true)}>
                  Nueva versión
                </Button>
              )
            }
          />
          {adding && (
            <div className="border-b border-line">
              <VersionForm
                periods={freePeriods}
                defaultPeriodId={suggestedPeriod}
                submitLabel="Crear versión"
                busy={createVersion.isPending}
                error={createVersion.error}
                onCancel={() => setAdding(false)}
                onSubmit={async (draft, periodId) => {
                  await createVersion.mutateAsync({
                    periodId: periodId!,
                    ...bodyOf(draft),
                  });
                  setAdding(false);
                }}
              />
            </div>
          )}
          {!p.versions.length ? (
            <Empty title="Aún no hay versiones">
              Cada bimestre se redacta una versión con metas, adecuaciones y
              estrategias.
            </Empty>
          ) : (
            <ul className="divide-y divide-line">
              {[...p.versions].reverse().map((v) => (
                <li key={v.id} className="py-1">
                  <div className="flex flex-wrap items-center gap-2 px-4 pt-2">
                    <span className="font-medium">
                      Versión {v.version} ·{' '}
                      {periodName.get(v.periodId) ?? 'bimestre'}
                    </span>
                    {v.approvedAt ? (
                      <Badge tone="stable">
                        Aprobada {formatDate(v.approvedAt)}
                      </Badge>
                    ) : (
                      <Badge>Por aprobar</Badge>
                    )}
                    <span className="flex-1" />
                    {!v.approvedAt && canDraft && editingVersion !== v.id && (
                      <Button
                        variant="ghost"
                        onClick={() => setEditingVersion(v.id)}
                      >
                        Editar
                      </Button>
                    )}
                    {!v.approvedAt && isTutor && !archived && (
                      <Button
                        variant="primary"
                        busy={approve.isPending}
                        onClick={() =>
                          approve.mutate({
                            versionId: v.id,
                            expectedUpdatedAt: v.updatedAt,
                          })
                        }
                      >
                        Aprobar
                      </Button>
                    )}
                  </div>
                  {editingVersion === v.id ? (
                    <VersionForm
                      initial={v}
                      submitLabel="Guardar versión"
                      busy={updateVersion.isPending}
                      error={updateVersion.error}
                      onCancel={() => setEditingVersion(null)}
                      onSubmit={async (draft) => {
                        await updateVersion.mutateAsync({
                          versionId: v.id,
                          ...bodyOf(draft),
                        });
                        setEditingVersion(null);
                      }}
                    />
                  ) : (
                    <div className="grid gap-3 px-4 py-3 md:grid-cols-3">
                      <Lines title="Metas" items={v.goals} />
                      <Lines title="Adecuaciones" items={v.adjustments} />
                      <Lines title="Estrategias" items={v.strategies} />
                      {v.progressNotes && (
                        <p className="text-[0.9375rem] whitespace-pre-line text-muted md:col-span-3">
                          Avances: {v.progressNotes}
                        </p>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
          {approve.error ? <ErrorNote error={approve.error} /> : null}
        </Card>
      </div>
    </>
  );
}
