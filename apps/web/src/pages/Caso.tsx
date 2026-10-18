import { useState } from 'react';
import type { FormEvent } from 'react';
import { useParams } from 'react-router';
import { MessageSquare, Phone } from 'lucide-react';
import { useCase, useCaseAction, useSendMessage } from '../api/queries';
import { useStudentNames } from '../api/attendance';
import { useSession } from '../auth/AuthProvider';
import { TERRITORIAL } from '../auth/roles';
import { ApiError } from '../api/client';
import {
  ACTION_TYPE,
  alertEvidence,
  alertType,
  CASE_STATUS,
  daysUntil,
  formatDate,
  fullName,
  SEVERITY,
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

const MANUAL_ACTIONS = [
  'NOTE',
  'CALL',
  'MEETING',
  'REFERRAL_PSYCHOLOGIST',
  'REFERRAL_DEMUNA',
  'REFERRAL_CEM',
  'REFERRAL_JUNTOS',
];
const NEXT_STATUS = [
  'CONTACTING',
  'REFERRED',
  'CLOSED_RETURNED',
  'CLOSED_TRANSFERRED',
  'CLOSED_DROPPED_OUT',
];

export function CasoPage() {
  const { id = '' } = useParams();
  const record = useCase(id);
  const names = useStudentNames();
  const { user, active } = useSession();
  const action = useCaseAction(id);
  const message = useSendMessage(id);
  const [type, setType] = useState('CALL');
  const [status, setStatus] = useState('CONTACTING');
  const [notes, setNotes] = useState('');
  const [requestId] = useState(() => crypto.randomUUID());
  const [feedback, setFeedback] = useState<string | null>(null);

  if (record.isPending) return <Loading />;
  if (record.error) return <ErrorNote error={record.error} />;
  const c = record.data;
  const closed = !!c.closedAt;
  // Igual que ms-alerta: gestiona el responsable, la dirección de la IE o una autoridad del ámbito.
  const canManage =
    c.ownerUserId === user.id ||
    TERRITORIAL.includes(active.role) ||
    (active.role === 'DIRECTOR' && active.schoolId === c.schoolId);
  const enrollment = names.get(c.studentId);
  const name = enrollment
    ? fullName(enrollment.student)
    : 'Caso de seguimiento';
  const due = daysUntil(c.dueAt);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setFeedback(null);
    await action.mutateAsync(
      type === 'STATUS_CHANGE' ? { type, notes, status } : { type, notes },
    );
    setNotes('');
    setFeedback('Acción registrada en la bitácora');
  }

  async function contactFamily() {
    setFeedback(null);
    try {
      await message.mutateAsync({ requestId });
      setFeedback(
        'Mensaje encolado: el proveedor simulado registrará la entrega y la respuesta.',
      );
    } catch (e) {
      if (e instanceof ApiError && e.status === 422)
        setFeedback(
          'No hay apoderados habilitados para recibir mensajes escritos.',
        );
      else throw e;
    }
  }

  return (
    <>
      <PageHeader
        eyebrow={`Caso de seguimiento · abierto ${formatDate(c.openedAt, true)}`}
        title={name}
        subtitle={
          closed
            ? `Cerrado ${formatDate(c.closedAt)}: ${c.closeReason ?? ''}`
            : `Responsable: ${c.ownerRole.toLowerCase()} · escalamiento nivel ${c.escalationLevel} · ${due <= 0 ? 'plazo vencido' : `vence en ${due} día(s)`}`
        }
        action={
          <Badge tone={CASE_STATUS[c.status].tone}>
            {CASE_STATUS[c.status].label}
          </Badge>
        }
      />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          <Card>
            <CardHeader title="Alertas que originaron el caso" />
            {!c.alerts.length ? (
              <Empty title="Sin alertas vinculadas" />
            ) : (
              <ul className="divide-y divide-line">
                {c.alerts.map((a) => (
                  <li
                    key={a.id}
                    className="flex flex-wrap items-center gap-2 px-4 py-3"
                  >
                    <Badge tone={SEVERITY[a.severity].tone}>
                      {SEVERITY[a.severity].label}
                    </Badge>
                    <span className="font-medium">{alertType(a.type)}</span>
                    <span className="text-[12px] text-faint">
                      {alertEvidence(a.data) ?? ''} ·{' '}
                      {formatDate(a.detectedAt, true)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card>
            <CardHeader
              title="Bitácora"
              subtitle="Acciones, mensajes y respuestas de la familia"
            />
            {!c.actions.length && !c.notifications.length ? (
              <Empty title="Sin acciones registradas">
                Registra la primera llamada, reunión o nota.
              </Empty>
            ) : (
              <ol className="space-y-0 px-4 py-3">
                {c.actions.map((a) => (
                  <li
                    key={a.id}
                    className="relative border-l border-line pb-4 pl-4 last:pb-0"
                  >
                    <span className="absolute top-1 -left-[4.5px] size-2 rounded-full bg-gob" />
                    <div className="text-[12px] text-faint">
                      {formatDate(a.performedAt, true)}
                    </div>
                    <div className="font-medium">
                      {ACTION_TYPE[a.type] ?? a.type}
                    </div>
                    {a.notes && (
                      <p className="mt-0.5 text-[12.5px] whitespace-pre-line text-muted">
                        {a.notes}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            )}
            {c.notifications.length > 0 && (
              <div className="border-t border-line px-4 py-3 text-[12px] text-muted">
                Mensajes a apoderados:{' '}
                {c.notifications
                  .map((n) => `${n.channel} ${n.status.toLowerCase()}`)
                  .join(' · ')}
                {c.responses.length
                  ? ` · ${c.responses.length} respuesta(s)`
                  : ''}
              </div>
            )}
          </Card>
        </div>
        <div className="space-y-4">
          {!closed && !canManage && (
            <Card>
              <CardHeader
                title="Seguimiento a cargo del responsable"
                subtitle={`Lo gestiona ${c.ownerRole.toLowerCase()}; dirección puede reasignarlo o intervenir.`}
              />
            </Card>
          )}
          {!closed && canManage && (
            <Card>
              <CardHeader
                title="Contactar a la familia"
                subtitle="Envío simulado: no sale ningún mensaje real"
              />
              <div className="space-y-2 px-4 py-3">
                <Button
                  variant="primary"
                  className="w-full"
                  busy={message.isPending}
                  onClick={() => void contactFamily()}
                >
                  <MessageSquare className="size-4" aria-hidden /> Enviar
                  mensaje de acompañamiento
                </Button>
                <p className="text-[11.5px] text-faint">
                  Usa un texto neutro y solo llega a apoderados que aceptaron
                  recibir alertas.
                </p>
              </div>
            </Card>
          )}
          {!closed && canManage && (
            <Card>
              <CardHeader title="Registrar acción" />
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
                    {MANUAL_ACTIONS.map((t) => (
                      <option key={t} value={t}>
                        {ACTION_TYPE[t]}
                      </option>
                    ))}
                    <option value="STATUS_CHANGE">
                      Cambiar estado del caso
                    </option>
                  </select>
                </Field>
                {type === 'STATUS_CHANGE' && (
                  <Field label="Nuevo estado">
                    <select
                      className={inputClass}
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      {NEXT_STATUS.map((s) => (
                        <option key={s} value={s}>
                          {CASE_STATUS[s].label}
                        </option>
                      ))}
                    </select>
                  </Field>
                )}
                <Field
                  label={
                    status.startsWith('CLOSED_') && type === 'STATUS_CHANGE'
                      ? 'Motivo del cierre'
                      : 'Notas'
                  }
                  hint={
                    status.startsWith('CLOSED_') && type === 'STATUS_CHANGE'
                      ? 'Hasta 250 caracteres.'
                      : 'Sin datos sensibles innecesarios.'
                  }
                >
                  <textarea
                    className={`${inputClass} h-24 py-2`}
                    required
                    maxLength={
                      type === 'STATUS_CHANGE' && status.startsWith('CLOSED_')
                        ? 250
                        : 2000
                    }
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </Field>
                {action.error ? <ErrorNote error={action.error} /> : null}
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  busy={action.isPending}
                >
                  <Phone className="size-4" aria-hidden /> Registrar
                </Button>
              </form>
            </Card>
          )}
          {message.error ? <ErrorNote error={message.error} /> : null}
          {feedback && (
            <div
              role="status"
              className="rounded border border-stable/30 bg-stable-soft px-3 py-2 text-[12.5px] text-stable"
            >
              {feedback}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
