import { useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { DEMO_ROLES } from '@/features/landing/content';

// Acceso rápido: elegir un rol precarga su DNI de demostración en el login (la contraseña la escribe la persona).
export function DemoAccessCard({
  onEnter = (url: string) => window.location.assign(url),
}: {
  onEnter?: (url: string) => void;
}) {
  const [roleId, setRoleId] = useState<string>(DEMO_ROLES[3].id);
  const role = DEMO_ROLES.find((r) => r.id === roleId) ?? DEMO_ROLES[0];
  const [dni, setDni] = useState<string>(role.dni);

  const pick = (id: string) => {
    const next = DEMO_ROLES.find((r) => r.id === id)!;
    setRoleId(id);
    setDni(next.dni);
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onEnter(`/ingresar?dni=${encodeURIComponent(dni.trim())}`);
  };

  return (
    <form
      onSubmit={submit}
      className="l-card flex h-full flex-col p-6 lg:p-8"
      aria-labelledby="demo-title"
    >
      <h3 id="demo-title" className="l-serif text-[1.625rem] leading-tight">
        Demostración en vivo: de la señal al rescate
      </h3>
      <p className="l-sub mt-2">
        Explora cómo se sincronizan el docente, el director, la UGEL y el
        Ministerio en tiempo real.
      </p>
      <div
        role="radiogroup"
        aria-label="Rol de la demostración"
        className="mt-6 grid grid-cols-2 gap-1.5 rounded-lg bg-[color:var(--l-muted-surface)] p-1.5"
      >
        {DEMO_ROLES.map((r) => (
          <button
            key={r.id}
            type="button"
            role="radio"
            aria-checked={r.id === roleId}
            onClick={() => pick(r.id)}
            className={`min-h-11 rounded-md px-2 text-[0.875rem] font-semibold transition-colors ${
              r.id === roleId
                ? 'bg-[color:var(--l-navy)] text-white'
                : 'text-[color:var(--l-ink-2)] hover:bg-white'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>
      <label className="mt-5 block">
        <span className="mb-1.5 block text-[0.875rem] font-semibold text-[color:var(--l-ink-2)]">
          Número de documento (DNI)
        </span>
        <input
          inputMode="numeric"
          autoComplete="username"
          value={dni}
          onChange={(e) => setDni(e.target.value)}
          className="h-11 w-full rounded-md border border-[color:var(--l-line)] bg-white px-3 tabular-nums focus:border-[color:var(--l-blue)] focus:outline-none"
        />
      </label>
      <label className="mt-4 block">
        <span className="mb-1.5 block text-[0.875rem] font-semibold text-[color:var(--l-ink-2)]">
          Rol de demostración pre-cargado
        </span>
        <select
          value={roleId}
          onChange={(e) => pick(e.target.value)}
          className="h-11 w-full rounded-md border border-[color:var(--l-line)] bg-white px-3 focus:border-[color:var(--l-blue)] focus:outline-none"
        >
          {DEMO_ROLES.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label} — {r.role}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" className="l-btn l-btn-primary mt-6 w-full">
        Ingresar al entorno en vivo{' '}
        <ArrowRight className="size-4" aria-hidden />
      </button>
      <p className="mt-4 flex items-start gap-2 text-[0.8125rem] text-[color:var(--l-ink-mute)]">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
        Autenticación RBAC con JWKS · Diagnósticos sensibles cifrados con
        AES-256.
      </p>
    </form>
  );
}
