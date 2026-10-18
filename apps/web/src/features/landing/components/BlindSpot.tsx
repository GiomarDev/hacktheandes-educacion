import { useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { ArrowRight, Mic, Siren, RefreshCcw } from 'lucide-react';
import { CONFLICTS } from '@/features/landing/content';
import { SectionHeading } from '@/features/landing/components/SectionHeading';

// Acto II: cada conflicto del aula muestra la respuesta de Amauti (pestañas verticales accesibles).
export function BlindSpot() {
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const move = (e: KeyboardEvent, i: number) => {
    const next =
      e.key === 'ArrowDown' ? i + 1 : e.key === 'ArrowUp' ? i - 1 : null;
    if (next === null) return;
    e.preventDefault();
    const n = (next + CONFLICTS.length) % CONFLICTS.length;
    setActive(n);
    tabs.current[n]?.focus();
  };
  return (
    <section
      id="espejo"
      className="py-16 lg:py-24"
      aria-labelledby="espejo-title"
    >
      <div className="mx-auto max-w-[1440px] px-4 lg:px-8">
        <SectionHeading
          kicker="El conflicto en el aula · 60 días a ciegas"
          title={
            <span id="espejo-title">
              No lo perdimos el día que dejó de ir. Lo perdimos semanas atrás,
              mientras para el sistema todo seguía «normal».
            </span>
          }
          subtitle="Cuando falló en matemáticas, empezó a faltar y se apagó al fondo del salón, los sistemas oficiales miraban hacia otro lado: haciendo autopsias en lugar de rescates y ahogando al profesor en trámites."
        />
        <div className="mt-10 grid gap-6 lg:grid-cols-12">
          <div
            role="tablist"
            aria-orientation="vertical"
            aria-label="Conflictos del aula"
            className="flex flex-col gap-2 lg:col-span-6"
          >
            {CONFLICTS.map((text, i) => (
              <button
                key={text}
                ref={(el) => {
                  tabs.current[i] = el;
                }}
                role="tab"
                id={`conflict-${i}`}
                aria-selected={active === i}
                aria-controls="conflict-panel"
                tabIndex={active === i ? 0 : -1}
                onClick={() => setActive(i)}
                onKeyDown={(e) => move(e, i)}
                className={`rounded-lg border px-5 py-4 text-left text-[1rem] leading-relaxed transition-colors ${
                  active === i
                    ? 'border-[color:var(--l-line)] border-l-4 border-l-[color:var(--l-blue)] bg-white text-[color:var(--l-ink)]'
                    : 'border-[color:var(--l-line)] bg-[color:var(--l-band)] text-[color:var(--l-ink-2)] hover:bg-white'
                }`}
              >
                {text}
              </button>
            ))}
          </div>
          <div
            id="conflict-panel"
            role="tabpanel"
            aria-labelledby={`conflict-${active}`}
            className="l-card p-6 lg:col-span-6 lg:p-8"
          >
            <span className="l-pill bg-[color:var(--l-info)] text-[color:var(--l-blue)]">
              LA RESPUESTA DE AMAUTI · CIERRA EL CICLO ENTRE LA SEÑAL Y EL
              RESCATE
            </span>
            <h3 className="l-serif mt-5 text-[1.75rem] leading-tight">
              De un punto ciego de 60 días a un audio de 10 segundos en
              WhatsApp.
            </h3>
            <p className="l-sub mt-4 text-[1.0625rem]">
              Con un audio de 10 segundos en WhatsApp, el docente registra lo
              que pasa en clase sin salir de su rutina. Amauti agiliza sus
              trámites institucionales, bitacoriza sus observaciones y le alerta
              qué alumnos están en riesgo, devolviéndole el tiempo para
              intervenir antes de que el estudiante abandone el colegio.
            </p>
            <div key={active} className="fade-in mt-6 flex flex-wrap gap-2">
              <span className="l-pill bg-[color:var(--l-stable-soft)] text-[color:var(--l-stable-text)]">
                <Mic className="size-3.5" aria-hidden /> Audio de 10s en
                WhatsApp → Bitácora + Trámite listo
              </span>
              <span className="l-pill bg-[color:var(--l-critical-soft)] text-[color:var(--l-critical)]">
                <Siren className="size-3.5" aria-hidden /> Alerta de Riesgo ·
                Rescate en 48 h
              </span>
              <span className="l-pill border border-[color:var(--l-line)] text-[color:var(--l-ink-2)]">
                <RefreshCcw className="size-3.5" aria-hidden /> Sincronizado con
                Dirección, UGEL y MINEDU
              </span>
            </div>
          </div>
        </div>
        <div className="l-card mt-6 flex flex-wrap items-center justify-between gap-4 px-6 py-5">
          <p className="font-semibold text-[color:var(--l-ink)]">
            ¿Por qué Amauti hace la diferencia real frente a las herramientas
            tradicionales del Estado?
          </p>
          <a
            href="#tesis"
            className="inline-flex items-center gap-1.5 font-semibold text-[color:var(--l-blue)] hover:underline"
          >
            Ver la tesis de rescate{' '}
            <ArrowRight className="size-4" aria-hidden />
          </a>
        </div>
      </div>
    </section>
  );
}
