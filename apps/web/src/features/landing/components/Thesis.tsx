import { Mic, Radar, Network } from 'lucide-react';
import {
  DROPOUTS_PER_DAY,
  DROPOUTS_PRIMARY,
  DROPOUTS_SECONDARY,
} from '@/features/landing/data';
import { SectionHeading } from '@/features/landing/components/SectionHeading';

const fmt = (n: number) => new Intl.NumberFormat('es-PE').format(n);

const POINTS = [
  {
    icon: Mic,
    title: 'Un audio de 10 segundos en WhatsApp:',
    text: 'El docente registra lo que ocurre en clase con su voz; Amauti agiliza sus trámites institucionales y bitacoriza sus observaciones automáticamente.',
  },
  {
    icon: Radar,
    title: 'Detección en el minuto exacto, sin puntos ciegos:',
    text: 'Cuando un alumno falla en matemáticas, empieza a faltar o se apaga al fondo del salón, Amauti cruza las señales y alerta quién está en riesgo para intervenir a tiempo.',
  },
  {
    icon: Network,
    title: 'Director, UGEL y Ministerio sincronizados en tiempo real:',
    text: 'Cada señal capturada en el aula actualiza instantáneamente toda la cadena institucional sin ahogar al docente en informes ni Excels duplicados.',
  },
];

export function Thesis() {
  return (
    <section
      id="tesis"
      className="bg-white py-16 lg:py-24"
      aria-labelledby="tesis-title"
    >
      <div className="mx-auto grid max-w-[1440px] gap-10 px-4 lg:grid-cols-12 lg:px-8">
        <div className="lg:col-span-6">
          <SectionHeading
            kicker="¿Por qué Amauti hace la diferencia real?"
            title={
              <span id="tesis-title">
                Los sistemas tradicionales hacen autopsias, no rescates. Amauti
                cierra el ciclo completo entre la señal y el rescate.
              </span>
            }
          />
          <p className="l-sub mt-6 text-[1.0625rem]">
            Devolvemos el tiempo y el respaldo a nuestro principal agente de
            cambio —el profesor— a través de la única tecnología que ya tiene en
            su bolsillo:
          </p>
          <ul className="mt-6 space-y-5">
            {POINTS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[color:var(--l-info)] text-[color:var(--l-blue)]">
                  <Icon className="size-5" aria-hidden />
                </span>
                <p className="leading-relaxed text-[color:var(--l-ink-2)]">
                  <strong className="text-[color:var(--l-ink)]">{title}</strong>{' '}
                  {text}
                </p>
              </li>
            ))}
          </ul>
        </div>
        <div className="lg:col-span-6">
          <div className="rounded-lg border border-[color:var(--l-line)] bg-[color:var(--l-band)] p-6 lg:p-8">
            <div className="rounded-md border-l-4 border-[color:var(--l-critical)] bg-[color:var(--l-red-soft)] px-5 py-4">
              <p className="l-serif text-[1.5rem] text-[color:var(--l-critical)]">
                {DROPOUTS_PER_DAY} escolares cada 24 horas
              </p>
              <p className="mt-1 text-[color:var(--l-ink-2)]">
                habrán abandonado para siempre el colegio mientras los sistemas
                oficiales esperan al cierre bimestral.
              </p>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="l-card p-5">
                <p className="l-serif text-[clamp(2.5rem,2rem+1.5vw,3.5rem)] leading-none text-[color:var(--l-stable)]">
                  10 s
                </p>
                <p className="mt-1 font-semibold text-[color:var(--l-blue)]">
                  en WhatsApp
                </p>
                <p className="mt-3 text-[0.9375rem] leading-relaxed text-[color:var(--l-ink-2)]">
                  Para que el profesor registre lo que pasa en clase, agilice
                  trámites, bitacorice observaciones y active el rescate en{' '}
                  <strong className="text-[color:var(--l-ink)]">Amauti</strong>.
                </p>
              </div>
              <div className="l-card p-5">
                <p className="l-serif text-[clamp(2.5rem,2rem+1.5vw,3.5rem)] leading-none text-[color:var(--l-ink-mute)]">
                  60 días
                </p>
                <span className="l-pill mt-2 bg-[color:var(--l-critical-soft)] text-[color:var(--l-critical)]">
                  a ciegas
                </span>
                <p className="mt-3 text-[0.9375rem] leading-relaxed text-[color:var(--l-ink-2)]">
                  De punto ciego en las herramientas oficiales donde todo parece
                  «normal» hasta que el abandono es irreversible.
                </p>
              </div>
            </div>
            <p className="mt-5 text-[0.8125rem] text-[color:var(--l-ink-mute)]">
              Fuente: SIAGIE 2023–2024 ({fmt(DROPOUTS_SECONDARY)} desertores en
              secundaria + {fmt(DROPOUTS_PRIMARY)} en primaria ÷ 365 días). 60
              días: ventana de un bimestre sin señal operativa; 10 s: duración
              objetivo del audio en el piloto.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
