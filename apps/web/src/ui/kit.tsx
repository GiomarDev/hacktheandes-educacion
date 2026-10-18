import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { AlertTriangle, Inbox, Loader2 } from 'lucide-react';

const cx = (...parts: (string | false | null | undefined)[]) =>
  parts.filter(Boolean).join(' ');
export { cx };

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cx('rounded-md border border-line bg-card', className)}>
      {children}
    </section>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-2 border-b border-line px-4 py-3">
      <div className="min-w-0">
        <h2 className="text-[14px] font-semibold text-ink">{title}</h2>
        {subtitle && (
          <p className="mt-0.5 text-[12px] text-faint">{subtitle}</p>
        )}
      </div>
      {action}
    </header>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: ReactNode;
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {eyebrow && (
          <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-faint">
            {eyebrow}
          </div>
        )}
        <h1 className="text-[22px] font-semibold tracking-tight text-ink">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-[13px] text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Kpi({
  label,
  value,
  hint,
  tone = 'ink',
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: 'ink' | 'critical' | 'high' | 'stable' | 'gob';
}) {
  const color = {
    ink: 'text-ink',
    critical: 'text-critical',
    high: 'text-high',
    stable: 'text-stable',
    gob: 'text-gob',
  }[tone];
  return (
    <Card className="px-4 py-3">
      <div className="text-[12px] text-muted">{label}</div>
      <div
        className={cx(
          'mt-1 font-mono text-[26px] font-medium leading-tight tabular',
          color,
        )}
      >
        {value}
      </div>
      {hint && <div className="mt-1 text-[11px] text-faint">{hint}</div>}
    </Card>
  );
}

export type Tone =
  'critical' | 'high' | 'medium' | 'low' | 'stable' | 'neutral' | 'gob';
const TONES: Record<Tone, string> = {
  critical: 'bg-critical-soft text-critical',
  high: 'bg-high-soft text-high',
  medium: 'bg-medium-soft text-[#9a6a00]',
  low: 'bg-stable-soft text-low',
  stable: 'bg-stable-soft text-stable',
  neutral: 'bg-soft text-muted',
  gob: 'bg-gob-soft text-gob',
};
export function Badge({
  tone = 'neutral',
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium',
        TONES[tone],
      )}
    >
      {children}
    </span>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  busy?: boolean;
};
export function Button({
  variant = 'secondary',
  busy,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const styles = {
    primary: 'bg-ink text-white hover:bg-ink-2',
    secondary: 'border border-line bg-card text-ink hover:bg-soft',
    ghost: 'text-muted hover:bg-soft hover:text-ink',
    danger: 'bg-peru text-white hover:bg-critical',
  }[variant];
  return (
    <button
      {...rest}
      disabled={disabled || busy}
      className={cx(
        'inline-flex h-8 items-center justify-center gap-1.5 rounded px-3 text-[12.5px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        styles,
        className,
      )}
    >
      {busy && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

export function Loading({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div
      role="status"
      className="flex items-center gap-2 px-4 py-6 text-[12.5px] text-faint"
    >
      <Loader2 className="size-4 animate-spin" aria-hidden />
      {label}
    </div>
  );
}

export function Empty({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-8 text-center">
      <Inbox className="mb-2 size-6 text-faint" aria-hidden />
      <div className="text-[13px] font-medium text-ink">{title}</div>
      {children && (
        <p className="mt-1 max-w-sm text-[12px] text-faint">{children}</p>
      )}
    </div>
  );
}

export function ErrorNote({ error }: { error: unknown }) {
  const message =
    error instanceof Error ? error.message : 'No se pudo cargar la información';
  return (
    <div
      role="alert"
      className="m-4 flex items-start gap-2 rounded border border-critical/30 bg-critical-soft px-3 py-2 text-[12.5px] text-critical"
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{message}</span>
    </div>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-medium text-muted">
        {label}
      </span>
      {children}
      {hint && (
        <span className="mt-1 block text-[11px] text-faint">{hint}</span>
      )}
    </label>
  );
}

export const inputClass =
  'h-9 w-full rounded border border-line bg-card px-3 text-[13px] text-ink placeholder:text-faint focus:border-gob focus:outline-none';
