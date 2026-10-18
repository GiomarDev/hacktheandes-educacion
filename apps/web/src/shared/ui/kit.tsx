import type { ComponentPropsWithRef, ReactNode } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useEmptyIllustration } from '@/shared/ui/illustration';

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
    <section className={cx('rounded-lg border border-line bg-card', className)}>
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
    <header className="flex flex-wrap items-start justify-between gap-2 border-b border-line px-5 py-4">
      <div className="min-w-0">
        <h2 className="section-heading text-ink">{title}</h2>
        {subtitle && (
          <p className="mt-0.5 text-[0.9375rem] text-faint">{subtitle}</p>
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
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && (
          <div className="mb-2 text-[0.875rem] font-medium text-muted">
            {eyebrow}
          </div>
        )}
        <h1 className="page-heading text-ink">{title}</h1>
        {subtitle && (
          <p className="page-description mt-2 text-[1rem] text-muted">
            {subtitle}
          </p>
        )}
        <div className="page-heading-rule mt-4" aria-hidden="true" />
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
    <Card className="kpi-in px-5 py-4">
      <div className="text-[0.9375rem] text-muted">{label}</div>
      <div className={cx('metric-value mt-2 tabular', color)}>{value}</div>
      {hint && <div className="mt-1 text-[0.875rem] text-faint">{hint}</div>}
    </Card>
  );
}

export type Tone =
  'critical' | 'high' | 'medium' | 'low' | 'stable' | 'neutral' | 'gob';
const TONES: Record<Tone, string> = {
  critical: 'bg-critical-soft text-critical',
  high: 'bg-high-soft text-high',
  medium: 'bg-medium-soft text-[#7a5200]',
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
        'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[0.875rem] font-medium',
        TONES[tone],
      )}
    >
      {children}
    </span>
  );
}

// React 19: ref llega como prop y se reenvía con ...rest.
type ButtonProps = ComponentPropsWithRef<'button'> & {
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
    primary: 'bg-gob text-white hover:bg-ink',
    secondary: 'border border-line bg-card text-ink hover:bg-soft',
    ghost: 'text-muted hover:bg-soft hover:text-ink',
    danger: 'bg-peru text-white hover:bg-critical',
  }[variant];
  return (
    <button
      {...rest}
      disabled={disabled || busy}
      className={cx(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 py-2 text-[0.9375rem] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        styles,
        className,
      )}
    >
      {busy && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

// Esqueleto con la forma de una lista: anticipa el contenido en lugar de un spinner.
export function Loading({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="space-y-2.5 px-4 py-4">
      <span className="sr-only">{label}</span>
      {['w-2/3', 'w-11/12', 'w-1/2'].map((width) => (
        <div key={width} className="flex items-center gap-3" aria-hidden>
          <div className="skeleton size-7 shrink-0 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <div className={cx('skeleton h-2.5 rounded', width)} />
            <div className="skeleton h-2 w-1/3 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Vacío: una ilustración (Amauti dormido, inyectado por app/) y el texto de cómo llenarlo.
export function Empty({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  const Illustration = useEmptyIllustration();
  return (
    <div className="flex flex-col items-center px-6 py-8 text-center">
      {Illustration && (
        <Illustration className="mb-1 hidden h-[78px] w-[56px] md:block" />
      )}
      <div className="text-[1rem] font-medium text-ink">{title}</div>
      {children && (
        <p className="mt-1 max-w-sm text-[0.9375rem] text-faint">{children}</p>
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
      className="m-4 flex items-start gap-2 rounded border border-critical/30 bg-critical-soft px-3 py-2 text-[0.9375rem] text-critical"
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
      <span className="mb-1 block text-[0.9375rem] font-medium text-muted">
        {label}
      </span>
      {children}
      {hint && (
        <span className="mt-1 block text-[0.875rem] text-faint">{hint}</span>
      )}
    </label>
  );
}

// Sin alto ni ancho: para controles compactos que fijan los suyos (Tailwind no resuelve h-9/h-8 ni w-full/w-auto juntos).
export const controlClass =
  'rounded border border-line bg-card px-3 text-[1rem] text-ink placeholder:text-faint focus:border-gob focus:outline-none disabled:bg-soft disabled:text-muted';
export const inputClass = `min-h-11 w-full ${controlClass}`;
