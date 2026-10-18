import { useState } from 'react';
import type { FormEvent } from 'react';
import { useSearchParams } from 'react-router';
import { useSession } from '../auth/AuthProvider';
import { roleLabel } from '../auth/roles';
import type { Role } from '../auth/roles';
import {
  useCreateUser,
  useGrantRole,
  useRevokeRole,
  useRules,
  useSchools,
  useUpdateRule,
  useUsers,
} from '../api/queries';
import type { RiskRule, UserAccount } from '../api/types';
import { formatDate, SEVERITY } from '../lib/format';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  cx,
  Empty,
  ErrorNote,
  Field,
  controlClass,
  inputClass,
  Loading,
  PageHeader,
} from '../ui/kit';

// Coincide con ms-auth: dirección otorga roles de su IE salvo DIRECTOR; UGEL y MINEDU también DIRECTOR.
const DIRECTOR_GRANTABLE: Role[] = [
  'TEACHER',
  'TUTOR',
  'AUXILIAR',
  'SECRETARY',
  'PSYCHOLOGIST',
];
const SCHOOL_GRANTABLE: Role[] = ['DIRECTOR', ...DIRECTOR_GRANTABLE];
// Rango de cada parámetro, igual que la validación de ms-alerta.
const PARAMS: Record<string, { label: string; min: number; max: number }> = {
  count: { label: 'Veces', min: 1, max: 60 },
  windowSchoolDays: { label: 'Ventana (días lectivos)', min: 1, max: 60 },
  minAttendanceRate: { label: 'Asistencia mínima (%)', min: 0, max: 100 },
  minGap: { label: 'Brecha mínima', min: 1, max: 10000 },
};
const RULE_TYPE: Record<string, string> = {
  ABSENCES_IN_WINDOW: 'Faltas en una ventana de días',
  CONSECUTIVE_ABSENCES: 'Faltas consecutivas',
  LATE_COUNT: 'Tardanzas reiteradas',
  SECTION_SILENT: 'Aula sin pase de lista',
  GRADE_WITHOUT_ATTENDANCE: 'Nota sin asistencia suficiente',
  LEFT_WITHOUT_EXIT: 'Ingreso sin salida registrada',
  ATTENTION_GOAL_GAP: 'Brecha en la meta de atención',
};
const STATUS_LABEL: Record<UserAccount['status'], string> = {
  ACTIVE: 'Activa',
  INACTIVE: 'Inactiva',
  LOCKED: 'Bloqueada',
};

function NewUserForm({ schoolId, roles }: { schoolId: string; roles: Role[] }) {
  const create = useCreateUser();
  const [form, setForm] = useState({
    documentNumber: '',
    firstName: '',
    lastName: '',
    email: '',
    temporaryPassword: '',
    role: roles[0],
  });
  const [done, setDone] = useState<string | null>(null);
  const set = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function submit(event: FormEvent) {
    event.preventDefault();
    setDone(null);
    await create.mutateAsync({
      documentType: 'DNI',
      documentNumber: form.documentNumber,
      firstName: form.firstName,
      lastName: form.lastName,
      ...(form.email.trim() ? { email: form.email.trim() } : {}),
      temporaryPassword: form.temporaryPassword,
      grant: { role: form.role, schoolId },
    });
    setDone(`${form.firstName} ${form.lastName}`);
    setForm((f) => ({
      ...f,
      documentNumber: '',
      firstName: '',
      lastName: '',
      email: '',
      temporaryPassword: '',
    }));
  }

  return (
    <form
      onSubmit={(e) => void submit(e).catch(() => undefined)}
      className="space-y-3 px-4 py-3"
    >
      <Field label="DNI">
        <input
          className={inputClass}
          required
          inputMode="numeric"
          pattern="\d{8}"
          title="8 dígitos"
          value={form.documentNumber}
          onChange={(e) => set('documentNumber')(e.target.value)}
        />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Nombres">
          <input
            className={inputClass}
            required
            maxLength={100}
            value={form.firstName}
            onChange={(e) => set('firstName')(e.target.value)}
          />
        </Field>
        <Field label="Apellidos">
          <input
            className={inputClass}
            required
            maxLength={100}
            value={form.lastName}
            onChange={(e) => set('lastName')(e.target.value)}
          />
        </Field>
      </div>
      <Field label="Correo (opcional)">
        <input
          type="email"
          className={inputClass}
          value={form.email}
          onChange={(e) => set('email')(e.target.value)}
        />
      </Field>
      <Field label="Rol en la IE">
        <select
          className={inputClass}
          value={form.role}
          onChange={(e) => set('role')(e.target.value)}
        >
          {roles.map((r) => (
            <option key={r} value={r}>
              {roleLabel(r)}
            </option>
          ))}
        </select>
      </Field>
      <Field
        label="Contraseña temporal"
        hint="De 10 a 128 caracteres. Entrégala en persona: se pedirá cambiarla al primer ingreso."
      >
        <input
          className={inputClass}
          required
          minLength={10}
          maxLength={128}
          autoComplete="new-password"
          value={form.temporaryPassword}
          onChange={(e) => set('temporaryPassword')(e.target.value)}
        />
      </Field>
      {create.error ? <ErrorNote error={create.error} /> : null}
      {done && (
        <p role="status" className="text-[0.9375rem] text-stable">
          Cuenta de {done} creada.
        </p>
      )}
      <Button
        type="submit"
        variant="primary"
        className="w-full"
        busy={create.isPending}
      >
        Crear cuenta
      </Button>
    </form>
  );
}

function UserRow({
  account,
  schoolId,
  grantable,
  self,
}: {
  account: UserAccount;
  schoolId?: string;
  grantable: Role[];
  self: boolean;
}) {
  const grant = useGrantRole();
  const revoke = useRevokeRole();
  const missing = grantable.filter(
    (r) => !account.roles.some((x) => x.role === r),
  );
  const [role, setRole] = useState<Role | ''>('');
  const error = grant.error ?? revoke.error;
  return (
    <li className="px-4 py-3">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="font-medium">
            {account.firstName} {account.lastName}
            {self && <span className="text-faint"> (tú)</span>}
          </div>
          <div className="text-[0.9375rem] text-faint">
            DNI {account.documentNumber} · {STATUS_LABEL[account.status]}
            {account.mustChangePassword ? ' · debe cambiar su contraseña' : ''}
            {' · '}
            {account.lastLoginAt
              ? `último ingreso ${formatDate(account.lastLoginAt)}`
              : 'nunca ingresó'}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {account.roles.map((r) => (
            <span
              key={r.id}
              className="inline-flex items-center gap-1 rounded bg-soft px-1.5 py-0.5 text-[0.875rem] font-medium text-muted"
            >
              {roleLabel(r.role)}
              {!self && grantable.includes(r.role) && (
                <button
                  className="text-faint hover:text-critical"
                  aria-label={`Quitar ${roleLabel(r.role)} a ${account.firstName}`}
                  disabled={revoke.isPending}
                  onClick={() =>
                    revoke.mutate({ userId: account.id, roleId: r.id })
                  }
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
      </div>
      {!self && schoolId && missing.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          <select
            className={`${controlClass} h-8 w-auto text-[0.9375rem]`}
            aria-label={`Rol para ${account.firstName}`}
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
          >
            <option value="">Agregar rol…</option>
            {missing.map((r) => (
              <option key={r} value={r}>
                {roleLabel(r)}
              </option>
            ))}
          </select>
          <Button
            disabled={!role}
            busy={grant.isPending}
            onClick={() =>
              role &&
              grant.mutate(
                { userId: account.id, role, schoolId },
                { onSuccess: () => setRole('') },
              )
            }
          >
            Agregar
          </Button>
        </div>
      )}
      {error ? <ErrorNote error={error} /> : null}
    </li>
  );
}

function UsersTab() {
  const { user, active } = useSession();
  const schools = useSchools(active.ugelId);
  const [chosen, setChosen] = useState('');
  const schoolId = active.schoolId ?? (chosen || schools.data?.[0]?.id);
  const users = useUsers({ schoolId });
  const grantable =
    active.role === 'DIRECTOR' ? DIRECTOR_GRANTABLE : SCHOOL_GRANTABLE;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
      <Card>
        <CardHeader
          title="Cuentas de la IE"
          subtitle="Personas con algún rol vigente en la IE"
          action={
            !active.schoolId && (
              <select
                className={`${controlClass} h-8 w-auto text-[0.9375rem]`}
                aria-label="IE"
                value={schoolId ?? ''}
                onChange={(e) => setChosen(e.target.value)}
              >
                {(schools.data ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            )
          }
        />
        {!schoolId ? (
          schools.isPending ? (
            <Loading />
          ) : (
            <Empty title="No hay IEs en tu ámbito" />
          )
        ) : users.isPending ? (
          <Loading />
        ) : users.error ? (
          <ErrorNote error={users.error} />
        ) : !users.data.length ? (
          <Empty title="La IE aún no tiene cuentas" />
        ) : (
          <ul className="divide-y divide-line">
            {users.data.map((u) => (
              <UserRow
                key={u.id}
                account={u}
                schoolId={schoolId}
                grantable={grantable}
                self={u.id === user.id}
              />
            ))}
          </ul>
        )}
      </Card>
      {schoolId && (
        <Card>
          <CardHeader
            title="Nueva cuenta"
            subtitle="Crea la cuenta y le da un rol en esta IE"
          />
          <NewUserForm key={schoolId} schoolId={schoolId} roles={grantable} />
        </Card>
      )}
    </div>
  );
}

function RuleRow({ rule, editable }: { rule: RiskRule; editable: boolean }) {
  const update = useUpdateRule();
  const [params, setParams] = useState(rule.params);
  const [severity, setSeverity] = useState(rule.severity);
  const dirty =
    severity !== rule.severity ||
    Object.entries(params).some(([k, v]) => rule.params[k] !== v);
  return (
    <li className="px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-0 flex-1">
          <div className="font-medium">{RULE_TYPE[rule.type] ?? rule.type}</div>
          <div className="font-sans tabular-nums text-[0.875rem] text-faint">
            {rule.code} · {rule.schoolId ? 'de la IE' : 'global'}
          </div>
        </div>
        <Badge tone={rule.isActive ? 'stable' : 'neutral'}>
          {rule.isActive ? 'Activa' : 'Pausada'}
        </Badge>
        {editable && (
          <Button
            variant="ghost"
            busy={update.isPending}
            onClick={() =>
              update.mutate({ id: rule.id, isActive: !rule.isActive })
            }
          >
            {rule.isActive ? 'Pausar' : 'Reactivar'}
          </Button>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-end gap-3">
        {Object.entries(params).map(([key, value]) => {
          const meta = PARAMS[key];
          return (
            <label key={key}>
              <span className="mb-1 block text-[0.875rem] text-muted">
                {meta?.label ?? key}
              </span>
              <input
                type="number"
                className={`${controlClass} h-8 w-28`}
                disabled={!editable}
                min={meta?.min}
                max={meta?.max}
                value={value}
                onChange={(e) =>
                  setParams((p) => ({ ...p, [key]: Number(e.target.value) }))
                }
              />
            </label>
          );
        })}
        <label>
          <span className="mb-1 block text-[0.875rem] text-muted">
            Severidad
          </span>
          <select
            className={`${controlClass} h-8 w-auto`}
            disabled={!editable}
            value={severity}
            onChange={(e) =>
              setSeverity(e.target.value as RiskRule['severity'])
            }
          >
            {(['LOW', 'MEDIUM', 'HIGH'] as const).map((s) => (
              <option key={s} value={s}>
                {SEVERITY[s].label}
              </option>
            ))}
          </select>
        </label>
        {editable && dirty && (
          <Button
            variant="primary"
            busy={update.isPending}
            onClick={() => update.mutate({ id: rule.id, params, severity })}
          >
            Guardar
          </Button>
        )}
      </div>
      {update.error ? <ErrorNote error={update.error} /> : null}
    </li>
  );
}

function RulesTab() {
  const { active } = useSession();
  const rules = useRules();
  // MINEDU configura las globales; dirección solo las de su IE.
  const canEdit = (r: RiskRule) =>
    active.role === 'MINEDU_ADMIN' ||
    (active.role === 'DIRECTOR' && r.schoolId === active.schoolId);
  return (
    <Card>
      <CardHeader
        title="Reglas de alerta temprana"
        subtitle="Umbrales con los que ms-alerta revisa la asistencia, las notas y los ingresos"
      />
      {rules.isPending ? (
        <Loading />
      ) : rules.error ? (
        <ErrorNote error={rules.error} />
      ) : !rules.data.length ? (
        <Empty title="No hay reglas configuradas" />
      ) : (
        <ul className="divide-y divide-line">
          {rules.data.map((r) => (
            <RuleRow
              key={`${r.id}-${r.updatedAt}`}
              rule={r}
              editable={canEdit(r)}
            />
          ))}
        </ul>
      )}
    </Card>
  );
}

export function AdminPage() {
  const { active } = useSession();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'reglas' ? 'reglas' : 'usuarios';
  const tabs = [
    ['usuarios', 'Usuarios'],
    ['reglas', 'Reglas de alerta'],
  ] as const;
  return (
    <>
      <PageHeader
        title="Administración"
        subtitle={
          active.role === 'DIRECTOR'
            ? 'Cuentas y roles del personal de tu IE, y las reglas de alerta.'
            : 'Cuentas y roles por IE de tu ámbito, y las reglas de alerta.'
        }
      />
      <div role="tablist" className="mb-4 flex gap-1">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setParams({ tab: key }, { replace: true })}
            className={cx(
              'rounded px-3 py-1.5 text-[0.9375rem] font-medium',
              tab === key
                ? 'bg-ink text-white'
                : 'text-muted hover:bg-soft hover:text-ink',
            )}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === 'usuarios' ? <UsersTab /> : <RulesTab />}
    </>
  );
}
