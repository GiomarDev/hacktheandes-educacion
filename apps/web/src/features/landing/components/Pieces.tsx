import { ArrowRight, Check } from 'lucide-react';
import { RegionMap } from '@/features/indicators/components/RegionMap';
import { TrendChart } from '@/features/indicators/components/TrendChart';
import {
  DROPOUTS_PRIMARY,
  DROPOUTS_SECONDARY,
  ESCALE_NATIONAL_SECONDARY,
  REGION_DROPOUT_SECONDARY,
  STUDENTS_PRIMARY,
  STUDENTS_SECONDARY,
} from '@/features/landing/data';
import { SectionHeading } from '@/features/landing/components/SectionHeading';

const fmt = (n: number) => new Intl.NumberFormat('es-PE').format(n);
const pct = (num: number, den: number) => ((100 * num) / den).toFixed(2);
const escaleLatest = ESCALE_NATIONAL_SECONDARY.at(-1)!;

const PIECES = [
  {
    badge: 'PIEZA 01 · EL PROFESOR COMO AGENTE DE CAMBIO',
    title: 'Audio de 10s en WhatsApp y Cero Trámites',
    text: 'Con la única tecnología que ya tiene en su bolsillo, el docente manda un audio de 10 segundos o pasa lista en un toque. Amauti agiliza sus trámites institucionales y redacta los informes por él.',
    stat: '10 seg',
    statColor: 'var(--l-stable)',
    statText: 'en WhatsApp para registrar lo que pasa en clase',
  },
  {
    badge: 'PIEZA 02 · DE LA SEÑAL AL RESCATE',
    title: 'Bitácora Viva y Alertas de Alumnos en Riesgo',
    text: 'Bitacoriza observaciones del salón, caídas en matemáticas e inasistencias para alertar exactamente qué alumnos están en riesgo antes de perderlos en el punto ciego de 60 días.',
    stat: '48 horas',
    statColor: 'var(--l-critical)',
    statText: 'para devolverle al docente el tiempo de intervenir',
  },
  {
    badge: 'PIEZA 03 · DIRECCIÓN Y PSICOLOGÍA',
    title: 'Expediente CNEB y Planes de Rescate',
    text: 'Unifica las observaciones bitacorizadas por voz, calificaciones por competencias (AD, A, B, C), asistencia y planes psicopedagógicos para sostener el rescate con la familia.',
    stat: 'AES-256',
    statColor: 'var(--l-blue)',
    statText: 'cifrado para diagnósticos confidenciales',
  },
];

function PanelPreview() {
  return (
    <figure
      className="l-card overflow-hidden"
      aria-label="Vista del Panorama de continuidad educativa de Amauti"
    >
      <div
        className="flex items-center gap-1.5 border-b border-[color:var(--l-line)] bg-[color:var(--l-band)] px-4 py-2.5"
        aria-hidden
      >
        <span className="size-2.5 rounded-full bg-[#e1e5eb]" />
        <span className="size-2.5 rounded-full bg-[#e1e5eb]" />
        <span className="size-2.5 rounded-full bg-[#e1e5eb]" />
        <span className="ml-3 rounded bg-white px-3 py-0.5 text-[0.75rem] text-[color:var(--l-ink-mute)]">
          amauti.keoit.com/panorama
        </span>
      </div>
      <div className="space-y-4 p-4 sm:p-5">
        <p className="text-[0.75rem] font-medium tracking-wide text-[color:var(--l-ink-mute)] uppercase">
          Panorama de continuidad educativa
        </p>
        <div className="rounded-md bg-[color:var(--l-red-soft)] px-3 py-2 text-[0.875rem] font-medium text-[color:var(--l-red)]">
          1 institución educativa con alertas abiertas · 8 alertas · 8 casos
          abiertos{' '}
          <span className="text-[color:var(--l-ink-mute)]">
            (datos de demostración)
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {[
            {
              v: `${pct(DROPOUTS_SECONDARY, STUDENTS_SECONDARY)}%`,
              l: `Deserción secundaria (${fmt(DROPOUTS_SECONDARY)} · SIAGIE)`,
              c: 'var(--l-critical)',
            },
            {
              v: `${pct(DROPOUTS_PRIMARY, STUDENTS_PRIMARY)}%`,
              l: `Deserción primaria (${fmt(DROPOUTS_PRIMARY)} · SIAGIE)`,
              c: 'var(--l-high)',
            },
            {
              v: `${escaleLatest.value}%`,
              l: `Interanual secundaria ${escaleLatest.period} (ESCALE)`,
              c: 'var(--l-ink)',
            },
            { v: '1', l: 'IE con alertas abiertas (demo)', c: 'var(--l-blue)' },
          ].map((k) => (
            <div
              key={k.l}
              className="rounded-md border border-[color:var(--l-line)] p-3"
            >
              <p
                className="l-serif text-[1.625rem] leading-none"
                style={{ color: k.c }}
              >
                {k.v}
              </p>
              <p className="mt-1.5 text-[0.75rem] leading-snug text-[color:var(--l-ink-2)]">
                {k.l}
              </p>
            </div>
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <div className="rounded-md border border-[color:var(--l-line)] p-3">
            <p className="mb-2 text-[0.8125rem] font-semibold">
              Deserción en secundaria por región · SIAGIE 2023–2024
            </p>
            <RegionMap values={REGION_DROPOUT_SECONDARY} />
          </div>
          <div className="rounded-md border border-[color:var(--l-line)] p-3">
            <p className="mb-2 text-[0.8125rem] font-semibold">
              Tendencia nacional · ESCALE 2013–2025
            </p>
            <TrendChart
              series={[
                {
                  label: 'Perú',
                  color: '#C8102E',
                  points: ESCALE_NATIONAL_SECONDARY,
                },
              ]}
              height={170}
            />
            <p className="mt-2 text-[0.75rem] text-[color:var(--l-ink-mute)]">
              TD = (M<sub>t</sub> − (M<sub>t</sub> ∩ M<sub>t+1</sub>) − A5S
              <sub>t</sub> − F<sub>t</sub>) / M<sub>t</sub> × 100
            </p>
          </div>
        </div>
      </div>
      <figcaption className="border-t border-[color:var(--l-line)] px-5 py-2.5 text-[0.75rem] text-[color:var(--l-ink-mute)]">
        Indicadores oficiales reales (SIAGIE y ESCALE); alertas y casos con
        datos sintéticos de demostración.
      </figcaption>
    </figure>
  );
}

export function Pieces() {
  return (
    <section
      id="piezas"
      className="py-16 lg:py-24"
      aria-labelledby="piezas-title"
    >
      <div className="mx-auto max-w-[1440px] px-4 lg:px-8">
        <SectionHeading
          kicker="El ciclo completo entre la señal y el rescate"
          title={
            <span id="piezas-title">
              Un audio de 10 segundos en el aula. Cuatro niveles sincronizados
              en tiempo real.
            </span>
          }
        />
        <div className="mt-10 grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="l-sub text-[1.0625rem]">
              Desde que el docente envía un audio de 10 segundos en WhatsApp
              registrando que un alumno falló en matemáticas o se apagó en el
              salón, Amauti bitacoriza la señal, alerta el riesgo y sincroniza
              en tiempo real al director, a la UGEL y al Ministerio.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                'Agiliza trámites y bitacoriza con un audio de 10s',
                'Devuelve al profesor el tiempo para intervenir',
                'Director, UGEL y MINEDU sincronizados en vivo',
              ].map((t) => (
                <li
                  key={t}
                  className="l-pill bg-[color:var(--l-stable-soft)] py-1.5 text-[color:var(--l-stable-text)]"
                >
                  <Check className="size-4" aria-hidden /> {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-8">
            <PanelPreview />
          </div>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {PIECES.map((p) => (
            <article key={p.badge} className="l-card flex flex-col p-6">
              <p className="text-[0.6875rem] font-bold tracking-wide text-[color:var(--l-ink-mute)]">
                {p.badge}
              </p>
              <h3 className="l-serif mt-3 text-[1.375rem] leading-snug">
                {p.title}
              </h3>
              <p className="mt-3 flex-1 text-[0.9375rem] leading-relaxed text-[color:var(--l-ink-2)]">
                {p.text}
              </p>
              <p className="mt-5 border-t border-[color:var(--l-line)] pt-4">
                <span
                  className="l-serif text-[1.75rem]"
                  style={{ color: p.statColor }}
                >
                  {p.stat}
                </span>
                <span className="mt-1 block text-[0.875rem] text-[color:var(--l-ink-2)]">
                  {p.statText}
                </span>
              </p>
            </article>
          ))}
          <article className="flex flex-col rounded-lg border border-[color:var(--l-line)] border-t-4 border-t-[color:var(--l-blue)] bg-[color:var(--l-band)] p-6">
            <p className="text-[0.6875rem] font-bold tracking-wide text-[color:var(--l-ink-mute)]">
              PIEZA 04 · SINCRONIZACIÓN EN TIEMPO REAL
            </p>
            <h3 className="l-serif mt-3 text-[1.375rem] leading-snug">
              Director, UGEL y Ministerio Sincronizados
            </h3>
            <p className="mt-3 flex-1 text-[0.9375rem] leading-relaxed text-[color:var(--l-ink-2)]">
              Cierra el ciclo completo sin pedir Excels: cada señal en el aula
              actualiza en tiempo real el tablero de Dirección, la supervisión
              territorial de la UGEL y el mapa nacional del MINEDU.
            </p>
            <a
              href="#demo"
              className="mt-5 inline-flex items-center gap-1.5 border-t border-[color:var(--l-line)] pt-4 font-bold text-[color:var(--l-blue)] hover:underline"
            >
              Demostrar sincronización en vivo{' '}
              <ArrowRight className="size-4" aria-hidden />
            </a>
          </article>
        </div>
      </div>
    </section>
  );
}
