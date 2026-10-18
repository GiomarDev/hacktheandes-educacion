// Marco común de las pantallas sin sesión (ingreso y cambio de contraseña).
import type { ReactNode } from 'react';
import { Flag, Wordmark } from '@/shared/ui/Brand';
import { MascotFigure } from '@/features/mascot/MascotFigure';
import type { State } from '@/features/mascot/amauti-animations';

export function AuthFrame({
  children,
  pose,
  message,
}: {
  children: ReactNode;
  pose: State;
  message: string;
}) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-card">
      <header className="flex min-h-20 flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-10">
        <div className="flex items-center gap-3">
          <Flag size={28} />
          <Wordmark />
        </div>
        <p className="text-[0.875rem] text-muted">
          Piloto educativo · Hack the Andes
        </p>
      </header>
      <main className="grid flex-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <section className="login-surface relative hidden min-h-[650px] flex-col justify-between overflow-hidden px-12 pt-14 pb-8 lg:flex xl:px-16">
          <div className="relative z-10 max-w-lg">
            <div className="mb-6 flex items-center gap-3 text-[1rem] text-[#cadce9]">
              <span className="h-px w-8 bg-amauti" aria-hidden="true" />{' '}
              Continuidad educativa
            </div>
            <h2 className="page-heading login-copy max-w-[12ch] text-white">
              Cada día en el aula cuenta.
            </h2>
            <p className="mt-6 max-w-[40ch] text-[1.125rem] leading-relaxed text-[#d0deea]">
              Una mirada a tiempo puede cambiar una historia. Conecta la
              asistencia, las alertas y el acompañamiento a las familias.
            </p>
          </div>
          <div className="relative mt-10 flex items-end justify-between gap-6">
            <p className="max-w-[25ch] border-l-2 border-amauti/70 pl-4 text-[1rem] leading-relaxed text-[#d0deea]">
              {message}
            </p>
            <div
              aria-hidden="true"
              className="shrink-0 rounded-t-[5rem] bg-[#24465c] px-9 pt-8"
            >
              <MascotFigure pose={pose} className="h-[225px] w-[158px]" />
            </div>
          </div>
          <div
            className="pointer-events-none absolute right-0 bottom-0 left-0 h-8 border-t border-white/10"
            aria-hidden="true"
          />
        </section>
        <div className="flex items-center justify-center px-5 py-12 sm:px-10 lg:py-16">
          <div className="w-full max-w-[420px]">
            <div className="mb-8 flex items-center gap-4 lg:hidden">
              <MascotFigure
                pose={pose}
                className="h-[75px] w-[53px] shrink-0"
              />
              <p className="max-w-[32ch] text-[0.9375rem] leading-relaxed text-muted">
                {message}
              </p>
            </div>
            {children}
          </div>
        </div>
      </main>
      <footer className="border-t border-line bg-canvas px-5 py-4 text-center text-[0.875rem] leading-relaxed text-muted">
        Datos sintéticos de demostración · Las notificaciones a familias son
        simuladas
      </footer>
    </div>
  );
}
