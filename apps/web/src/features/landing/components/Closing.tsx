import { ArrowRight, ChevronDown } from 'lucide-react';
import { DROPOUTS_PER_DAY } from '@/features/landing/data';
import { FAQ } from '@/features/landing/content';
import { SectionHeading } from '@/features/landing/components/SectionHeading';
import { WhatsAppQr } from '@/features/landing/components/WhatsAppQr';

export function Closing() {
  return (
    <section
      id="preguntas"
      className="py-16 lg:py-24"
      aria-labelledby="cierre-title"
    >
      <div className="mx-auto max-w-[1440px] px-4 lg:px-8">
        <div className="l-dark flex flex-col gap-8 overflow-hidden rounded-lg p-8 sm:p-12 md:flex-row md:items-center">
          <div className="flex-1">
            <h2
              id="cierre-title"
              className="l-serif max-w-[22ch] text-[clamp(1.875rem,1.4rem+1.6vw,2.75rem)] leading-[1.12] text-white"
            >
              No hagamos más autopsias después de 60 días. Cerremos hoy el ciclo
              entre la señal y el rescate.
            </h2>
            <p className="mt-5 max-w-[64ch] text-[1.0625rem] leading-relaxed text-[color:var(--l-navy-text)]">
              Cada 24 horas, {DROPOUTS_PER_DAY} alumnos abandonan el colegio.
              Prueba en vivo cómo un audio de 10 segundos en WhatsApp le
              devuelve al profesor el tiempo para intervenir y sincroniza al
              director, a la UGEL y al Ministerio.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="/ingresar"
                className="l-btn bg-white text-[color:var(--l-blue)] hover:bg-[color:var(--l-info)]"
              >
                Probar Demostración en Vivo (amauti.keoit.com){' '}
                <ArrowRight className="size-4" aria-hidden />
              </a>
              <a
                href="https://github.com/GiomarDev/hacktheandes-educacion"
                target="_blank"
                rel="noreferrer"
                className="l-btn l-btn-ghost"
              >
                Ver repositorio y arquitectura
              </a>
            </div>
          </div>
          <WhatsAppQr />
        </div>

        <div className="mt-16 grid gap-10 lg:grid-cols-12">
          <SectionHeading
            className="lg:col-span-4"
            kicker="Preguntas frecuentes"
            title="Lo que evalúan directivos, docentes y equipos técnicos."
          />
          <div className="divide-y divide-[color:var(--l-line)] border-y border-[color:var(--l-line)] lg:col-span-8">
            {FAQ.map((item) => (
              <details key={item.q} className="group">
                <summary className="flex min-h-14 cursor-pointer items-center justify-between gap-4 py-4 text-left text-[1.0625rem] font-semibold">
                  {item.q}
                  <ChevronDown
                    className="l-chevron size-5 shrink-0 text-[color:var(--l-ink-mute)] transition-transform"
                    aria-hidden
                  />
                </summary>
                <p className="l-sub pb-5 text-[1rem]">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
