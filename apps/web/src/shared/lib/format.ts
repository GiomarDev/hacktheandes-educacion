import type { Tone } from '@/shared/ui/kit';

export const ALERT_TYPE: Record<string, string> = {
  ABSENCE_PATTERN: 'Patrón de inasistencia',
  SECTION_SILENT: 'Aula sin pase de lista',
  ACCESS_ENTRY: 'Ingreso registrado',
  ACCESS_EXIT: 'Salida registrada',
  GRADE_WITHOUT_ATTENDANCE: 'Nota sin asistencia',
  LEFT_WITHOUT_EXIT: 'Salida anticipada sin registro',
  ATTENTION_GOAL_GAP: 'Brecha en la meta de atención',
};
export const alertType = (t: string) => ALERT_TYPE[t] ?? t;

export const SEVERITY: Record<string, { label: string; tone: Tone }> = {
  HIGH: { label: 'Alta', tone: 'critical' },
  MEDIUM: { label: 'Media', tone: 'high' },
  LOW: { label: 'Baja', tone: 'medium' },
};

export const ALERT_STATUS: Record<string, { label: string; tone: Tone }> = {
  OPEN: { label: 'Abierta', tone: 'critical' },
  ACKNOWLEDGED: { label: 'En atención', tone: 'gob' },
  RESOLVED: { label: 'Resuelta', tone: 'stable' },
  DISMISSED: { label: 'Descartada', tone: 'neutral' },
};

export const CASE_STATUS: Record<string, { label: string; tone: Tone }> = {
  OPEN: { label: 'Abierto', tone: 'critical' },
  CONTACTING: { label: 'Contactando', tone: 'high' },
  CONTACTED: { label: 'Familia contactada', tone: 'gob' },
  REFERRED: { label: 'Derivado', tone: 'medium' },
  CLOSED_RETURNED: { label: 'Cerrado · retornó', tone: 'stable' },
  CLOSED_TRANSFERRED: { label: 'Cerrado · trasladado', tone: 'neutral' },
  CLOSED_DROPPED_OUT: { label: 'Cerrado · abandonó', tone: 'neutral' },
};

export const ACTION_TYPE: Record<string, string> = {
  NOTE: 'Nota',
  MESSAGE_DRAFTED: 'Mensaje preparado',
  MESSAGE_SENT: 'Mensaje enviado',
  CALL: 'Llamada',
  MEETING: 'Reunión',
  ESCALATED: 'Escalamiento',
  REFERRAL_PSYCHOLOGIST: 'Derivación a psicología',
  REFERRAL_DEMUNA: 'Derivación a DEMUNA',
  REFERRAL_CEM: 'Derivación al CEM',
  REFERRAL_JUNTOS: 'Derivación a Juntos',
  STATUS_CHANGE: 'Cambio de estado',
};

export const ATTENDANCE_LABEL = {
  PRESENT: { short: 'P', label: 'Presente' },
  ABSENT: { short: 'F', label: 'Falta' },
  LATE: { short: 'T', label: 'Tardanza' },
  JUSTIFIED: { short: 'J', label: 'Justificada' },
  LEFT_EARLY: { short: 'S', label: 'Salida anticipada' },
} as const;

export const REPORT_TYPE: Record<string, string> = {
  MONTHLY_FOLLOWUP: 'Seguimiento mensual',
  BIMESTER_ATTENDANCE: 'Asistencia bimestral',
  ATTENTION_GOAL: 'Meta de atención',
  DROPOUT_JUSTIFICATION: 'Justificación de retiros',
};
export const REPORT_STATUS: Record<string, { label: string; tone: Tone }> = {
  DRAFT: { label: 'Borrador', tone: 'neutral' },
  SUBMITTED: { label: 'Enviado a UGEL', tone: 'gob' },
  REVIEWED: { label: 'Revisado', tone: 'stable' },
  OBSERVED: { label: 'Observado', tone: 'high' },
};

const TZ = 'America/Lima';
export function todayInLima(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());
}
export function formatDate(
  iso: string | null | undefined,
  withTime = false,
): string {
  if (!iso) return '—';
  const date = /^\d{4}-\d{2}-\d{2}$/.test(iso)
    ? new Date(`${iso}T12:00:00-05:00`)
    : new Date(iso);
  return new Intl.DateTimeFormat('es-PE', {
    timeZone: TZ,
    day: 'numeric',
    month: 'short',
    ...(withTime
      ? { hour: '2-digit', minute: '2-digit' }
      : { year: 'numeric' }),
  }).format(date);
}
export function timeAgo(iso: string): string {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return 'hace un momento';
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.round(hours / 24);
  return `hace ${days} día${days === 1 ? '' : 's'}`;
}
export const pct = (n: number | null | undefined, digits = 1) =>
  n === null || n === undefined || Number.isNaN(n)
    ? '—'
    : `${n.toFixed(digits)} %`;
export const int = (n: number | null | undefined) =>
  n === null || n === undefined
    ? '—'
    : new Intl.NumberFormat('es-PE').format(n);
export const fullName = (s: {
  firstName: string;
  paternalLastName: string;
  maternalLastName?: string;
}) =>
  `${s.firstName} ${s.paternalLastName}${s.maternalLastName ? ` ${s.maternalLastName}` : ''}`;
export function ageOf(birthDate: string): number {
  const b = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - b.getUTCFullYear();
  if (
    now.getMonth() < b.getUTCMonth() ||
    (now.getMonth() === b.getUTCMonth() && now.getDate() < b.getUTCDate())
  )
    age--;
  return age;
}
export const gradeLabel = (grade: number, name: string) => `${grade}.° ${name}`;

export function greeting(): string {
  const hour = Number(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: TZ,
      hour: '2-digit',
      hourCycle: 'h23',
    }).format(new Date()),
  );
  return hour < 12
    ? 'Buenos días'
    : hour < 19
      ? 'Buenas tardes'
      : 'Buenas noches';
}
// Lunes de la semana de la fecha dada (YYYY-MM-DD).
export function weekStart(date: string): string {
  const d = new Date(`${date}T12:00:00Z`);
  const shift = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - shift);
  return d.toISOString().slice(0, 10);
}
export function isWeekend(date: string): boolean {
  const day = new Date(`${date}T12:00:00Z`).getUTCDay();
  return day === 0 || day === 6;
}
export function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}
// Describe la evidencia de una alerta sin exponer más de lo necesario.
export function alertEvidence(data: Record<string, unknown>): string | null {
  const parts: string[] = [];
  if (typeof data.count === 'number')
    parts.push(`${data.count} registros en la ventana`);
  if (Array.isArray(data.dates) && data.dates.length)
    parts.push(
      `último: ${formatDate(String(data.dates[data.dates.length - 1]))}`,
    );
  if (typeof data.attendanceRate === 'number')
    parts.push(`asistencia ${data.attendanceRate} %`);
  if (typeof data.gap === 'number')
    parts.push(`brecha de ${data.gap} estudiantes`);
  return parts.length ? parts.join(' · ') : null;
}

export const periodLabel = (p: { type: string; number: number }) =>
  `${p.number}.° ${p.type === 'TRIMESTER' ? 'trimestre' : 'bimestre'}`;

// El periodo en curso; si hoy no cae en ninguno (vacaciones), el último ya iniciado; si no, el primero.
export function currentPeriod<T extends { startDate: string; endDate: string }>(
  periods: T[],
  today: string,
): T | undefined {
  const sorted = [...periods].sort((a, b) =>
    a.startDate.localeCompare(b.startDate),
  );
  return (
    sorted.find((p) => p.startDate <= today && today <= p.endDate) ??
    sorted.filter((p) => p.startDate <= today).at(-1) ??
    sorted[0]
  );
}

export const PLAN_STATUS: Record<string, { label: string; tone: Tone }> = {
  DRAFT: { label: 'Borrador', tone: 'neutral' },
  ACTIVE: { label: 'Activo', tone: 'stable' },
  ARCHIVED: { label: 'Archivado', tone: 'neutral' },
};
export const VISIT_STATUS: Record<string, { label: string; tone: Tone }> = {
  SCHEDULED: { label: 'Agendada', tone: 'gob' },
  DONE: { label: 'Observada', tone: 'medium' },
  FEEDBACK_GIVEN: { label: 'Con devolución', tone: 'stable' },
};

// Listas editadas como texto: una entrada por línea.
export const toLines = (text: string) =>
  text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

export const plural = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`;
