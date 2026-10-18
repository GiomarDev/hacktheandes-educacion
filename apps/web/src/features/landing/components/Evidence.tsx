import {
  DROPOUTS_PER_DAY,
  DROPOUTS_PRIMARY,
  DROPOUTS_SECONDARY,
  REGION_DROPOUT_SECONDARY,
} from '@/features/landing/data';
import { SectionHeading } from '@/features/landing/components/SectionHeading';

const fmt = (n: number) => new Intl.NumberFormat('es-PE').format(n);
const ucayali = REGION_DROPOUT_SECONDARY.find((r) => r.geoCode === '25')!;

// Las citas son síntesis ilustrativas (no testimonios textuales): se rotulan como tales.
const QUOTES = [
  {
    text: '«Antes nos ahogaban en trámites institucionales dejándonos solos y sin tiempo para intervenir cuando un alumno fallaba en matemáticas o se apagaba al fondo del salón. Con un audio de 10 segundos en WhatsApp, Amauti bitacoriza mis observaciones, agiliza mis informes y me devuelve el tiempo para rescatarlo.»',
    who: 'Nuestro Principal Agente de Cambio · Docente de Aula (Secundaria y Primaria)',
    note: 'Síntesis ilustrativa de la entrevista de validación con una docente del Estado',
  },
  {
    text: '«Los sistemas tradicionales hacían autopsias tras un punto ciego de 60 días donde todo parecía ‘normal’. Amauti cierra el ciclo completo entre la señal y el rescate, manteniendo al director, a la UGEL y al Ministerio sincronizados en tiempo real.»',
    who: 'Gestión Educativa Sincronizada · Dirección, UGEL y MINEDU',
    note: 'Escenario objetivo del piloto',
  },
];

export function Evidence() {
  const cards = [
    {
      big: `${DROPOUTS_PER_DAY} / 24 h`,
      color: 'var(--l-critical)',
      text: (
        <>
          Alumnos escolares abandonan para siempre el colegio cada 24 horas (
          {fmt(DROPOUTS_SECONDARY)} en secundaria y {fmt(DROPOUTS_PRIMARY)} en
          primaria según SIAGIE 2023–2024).
        </>
      ),
    },
    {
      big: '60 días → 10 s',
      color: 'var(--l-high)',
      text: (
        <>
          Reemplazamos el punto ciego de 60 días por un audio de 10 segundos en
          WhatsApp y alertas tempranas en regiones críticas como{' '}
          <strong>Ucayali ({ucayali.value}%)</strong>.
        </>
      ),
    },
    {
      big: '448',
      color: 'var(--l-blue)',
      text: (
        <>
          Valores oficiales de ESCALE y SIAGIE contrastados e importados con
          control de integridad <strong>SHA-256</strong>.
        </>
      ),
    },
    {
      big: '5 Microservicios',
      color: 'var(--l-ink)',
      text: (
        <>
          Arquitectura real en <strong>NestJS + PostgreSQL</strong> con esquemas
          aislados, RBAC (JWKS) y motor determinista de alertas.
        </>
      ),
    },
  ];
  return (
    <section
      id="prueba"
      className="bg-white py-16 lg:py-24"
      aria-labelledby="prueba-title"
    >
      <div className="mx-auto max-w-[1440px] px-4 lg:px-8">
        <SectionHeading
          kicker="Del rescate en el aula a la evidencia nacional"
          title={
            <span id="prueba-title">
              Lo que ocurre cuando liberas al profesor de los trámites y
              sincronizas a todo el Estado.
            </span>
          }
        />
        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {QUOTES.map((q) => (
            <figure
              key={q.who}
              className="relative rounded-lg border border-[color:var(--l-line)] bg-[color:var(--l-band)] p-6 pl-8 lg:p-8 lg:pl-10"
            >
              <span
                className="absolute top-6 bottom-6 left-0 w-1 rounded-r bg-[color:var(--l-amber)]"
                aria-hidden
              />
              <blockquote className="l-serif text-[1.1875rem] leading-relaxed font-normal">
                {q.text}
              </blockquote>
              <figcaption className="mt-5">
                <span className="block font-semibold">{q.who}</span>
                <span className="text-[0.8125rem] text-[color:var(--l-ink-mute)]">
                  {q.note}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((c) => (
            <article key={c.big} className="l-card p-6">
              <p
                className="l-serif text-[clamp(1.875rem,1.5rem+1vw,2.5rem)] leading-tight"
                style={{ color: c.color }}
              >
                {c.big}
              </p>
              <p className="mt-3 leading-relaxed text-[color:var(--l-ink-2)]">
                {c.text}
              </p>
            </article>
          ))}
          <article className="l-card p-6 sm:col-span-2">
            <span className="l-pill bg-[color:var(--l-stable-soft)] text-[color:var(--l-stable-text)]">
              En vivo en amauti.keoit.com
            </span>
            <p className="l-serif mt-3 text-[clamp(1.875rem,1.5rem+1vw,2.5rem)] leading-tight text-[color:var(--l-stable)]">
              Ciclo Completo en Tiempo Real
            </p>
            <p className="mt-3 leading-relaxed text-[color:var(--l-ink-2)]">
              Profesor (WhatsApp), Director, UGEL y Ministerio sincronizados al
              instante entre la señal en el aula y el rescate familiar.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
