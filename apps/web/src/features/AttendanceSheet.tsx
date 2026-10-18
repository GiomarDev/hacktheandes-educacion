import { useState } from 'react';
import { CheckCheck } from 'lucide-react';
import type { AttendanceStatus, Enrollment } from '../api/types';
import { ATTENDANCE_LABEL, fullName } from '../lib/format';
import { Button, cx, ErrorNote } from '../ui/kit';

const OPTIONS: AttendanceStatus[] = ['PRESENT', 'ABSENT', 'LATE', 'JUSTIFIED'];
const SELECTED: Record<AttendanceStatus, string> = {
  PRESENT: 'border-stable bg-stable text-white',
  ABSENT: 'border-critical bg-critical text-white',
  LATE: 'border-medium bg-medium text-white',
  JUSTIFIED: 'border-gob bg-gob text-white',
  LEFT_EARLY: 'border-high bg-high text-white',
};

export interface AttendanceSheetProps {
  roster: Enrollment[];
  initial: Record<string, AttendanceStatus>;
  onSubmit(
    records: { enrollmentId: string; status: AttendanceStatus }[],
  ): Promise<unknown> | void;
  disabled?: boolean;
}

export function AttendanceSheet({
  roster,
  initial,
  onSubmit,
  disabled,
}: AttendanceSheetProps) {
  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>(initial);
  const [error, setError] = useState<unknown>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const missing = roster.filter((e) => !marks[e.id]).length;

  const mark = (enrollmentId: string, status: AttendanceStatus) => {
    setSaved(false);
    setMarks((m) => ({ ...m, [enrollmentId]: status }));
  };

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await onSubmit(
        roster.map((e) => ({ enrollmentId: e.id, status: marks[e.id] })),
      );
      setSaved(true);
    } catch (e) {
      // Lo marcado se conserva para reintentar.
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  const counts = OPTIONS.map(
    (s) => [s, roster.filter((e) => marks[e.id] === s).length] as const,
  );

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
        <Button
          onClick={() => {
            setSaved(false);
            setMarks((m) =>
              Object.fromEntries(
                roster.map((e) => [e.id, m[e.id] ?? 'PRESENT']),
              ),
            );
          }}
          disabled={disabled}
        >
          <CheckCheck className="size-4" aria-hidden /> Todos presentes
        </Button>
        <div className="ml-auto flex flex-wrap gap-3 text-[12px] text-muted">
          {counts.map(([status, n]) => (
            <span key={status}>
              <span className="font-mono font-medium text-ink">{n}</span>{' '}
              {ATTENDANCE_LABEL[status].label.toLowerCase()}
            </span>
          ))}
        </div>
      </div>
      <ul className="divide-y divide-line">
        {roster.map((e, i) => {
          const name = fullName(e.student);
          return (
            <li
              key={e.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5"
            >
              <span className="w-6 font-mono text-[11px] text-faint">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="min-w-[180px] flex-1 font-medium">{name}</span>
              <div role="radiogroup" aria-label={name} className="flex gap-1.5">
                {OPTIONS.map((status) => {
                  const checked = marks[e.id] === status;
                  return (
                    <button
                      key={status}
                      type="button"
                      role="radio"
                      aria-checked={checked}
                      aria-label={`${name}: ${ATTENDANCE_LABEL[status].label}`}
                      title={ATTENDANCE_LABEL[status].label}
                      disabled={disabled}
                      onClick={() => mark(e.id, status)}
                      className={cx(
                        'size-8 rounded border font-mono text-[12px] font-semibold transition-colors disabled:opacity-50',
                        checked
                          ? SELECTED[status]
                          : 'border-line bg-card text-muted hover:bg-soft',
                      )}
                    >
                      {ATTENDANCE_LABEL[status].short}
                    </button>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>
      {error ? <ErrorNote error={error} /> : null}
      <div className="sticky bottom-14 flex flex-wrap items-center gap-3 border-t border-line bg-card px-4 py-3 md:bottom-0">
        <span
          className={cx('text-[12.5px]', missing ? 'text-high' : 'text-stable')}
        >
          {missing
            ? `Falta marcar a ${missing} estudiante${missing === 1 ? '' : 's'}`
            : saved
              ? 'Pase de lista guardado'
              : 'Lista completa'}
        </span>
        <Button
          variant="primary"
          className="ml-auto"
          disabled={disabled || missing > 0}
          busy={busy}
          onClick={() => void save()}
        >
          Guardar pase de lista
        </Button>
      </div>
    </div>
  );
}
