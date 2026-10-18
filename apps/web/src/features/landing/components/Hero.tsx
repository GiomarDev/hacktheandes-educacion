import { ArrowDown } from 'lucide-react';
import { MascotFigure } from '@/features/mascot/MascotFigure';
import { DROPOUTS_PER_DAY } from '@/features/landing/data';
import { ECOSYSTEM } from '@/features/landing/content';
import { DemoAccessCard } from '@/features/landing/components/DemoAccessCard';

export function Hero() {
  return (
    <section id="inicio" aria-labelledby="hero-title">
      <div className="mx-auto grid max-w-[1440px] gap-6 px-4 py-8 lg:grid-cols-12 lg:px-8 lg:py-10">
        <div className="l-dark overflow-hidden rounded-lg p-7 sm:p-10 lg:col-span-7 lg:p-12">
          <p className="flex items-center gap-3 text-[0.9375rem] text-[color:var(--l-navy-text)]">
            <span className="h-px w-8 bg-[color:var(--l-amber)]" aria-hidden />
            Cada 24 horas, {DROPOUTS_PER_DAY} alumnos abandonan para siempre el
            colegio
          </p>
          <h1
            id="hero-title"
            className="l-serif mt-5 text-[clamp(2.125rem,1.4rem+2.4vw,3.5rem)] leading-[1.08] text-white"
          >
            ¿En qué minuto exacto perdimos la oportunidad de retenerlos?{' '}
            <span className="text-[color:var(--l-navy-text)]">
              Cierra el ciclo completo entre la señal y el rescate.
            </span>
          </h1>
          <p className="mt-6 max-w-[62ch] text-[1.0625rem] leading-relaxed text-[color:var(--l-navy-text)]">
            No los perdimos el día que dejaron de ir, sino semanas atrás en un
            punto ciego de 60 días. Con un audio de 10 segundos en WhatsApp, el
            docente registra lo que pasa en clase y Amauti agiliza sus trámites,
            bitacoriza sus observaciones y le alerta qué alumnos están en riesgo
            — devolviéndole el tiempo para intervenir y manteniendo al director,
            a la UGEL y al Ministerio sincronizados en tiempo real.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#demo" className="l-btn l-btn-primary">
              Ver demostración en vivo{' '}
              <ArrowDown className="size-4" aria-hidden />
            </a>
            <a href="#piezas" className="l-btn l-btn-ghost">
              Explorar el ciclo de rescate
            </a>
          </div>
          <div className="mt-10 flex items-end justify-between gap-6">
            <blockquote className="max-w-md border-l-4 border-[color:var(--l-amber)] pl-4 text-[0.9375rem] leading-relaxed text-white/90">
              «¡Hola! Soy Amauti. Cierro el ciclo completo entre la señal en el
              aula y el rescate, devolviéndole el tiempo a nuestro principal
              agente de cambio: el profesor.»
            </blockquote>
            <div
              className="l-arch hidden shrink-0 items-end justify-center px-6 pt-8 md:flex"
              aria-hidden
            >
              <MascotFigure pose="greeting" className="h-40 w-28" />
            </div>
          </div>
        </div>
        <div id="demo" className="lg:col-span-5">
          <DemoAccessCard />
        </div>
      </div>
      <div className="border-y border-[color:var(--l-line)] bg-white">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-4 gap-y-3 px-4 py-5 lg:px-8">
          <span className="text-[0.875rem] font-semibold text-[color:var(--l-ink-2)]">
            Sincronizado en tiempo real con estándares e indicadores oficiales:
          </span>
          {ECOSYSTEM.map((item) => (
            <span
              key={item}
              className="l-pill border border-[color:var(--l-line)] bg-[color:var(--l-band)] text-[color:var(--l-ink)]"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
