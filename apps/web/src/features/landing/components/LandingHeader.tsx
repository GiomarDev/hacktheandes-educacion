import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Flag } from '@/shared/ui/Brand';
import { NAV } from '@/features/landing/content';

export function LandingHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-[color:var(--l-line)] bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-6 px-4 lg:px-8">
        <a
          href="#inicio"
          className="flex items-center gap-2.5"
          aria-label="Amauti, inicio"
        >
          <Flag size={26} />
          <span className="l-serif text-[1.5rem] leading-none">Amauti</span>
          <span className="rounded-full border border-[color:var(--l-line)] bg-[color:var(--l-muted-surface)] px-2 py-0.5 text-[0.75rem] font-semibold text-[color:var(--l-ink-2)]">
            Piloto
          </span>
        </a>
        <nav
          aria-label="Secciones"
          className="ml-4 hidden items-center gap-6 xl:flex"
        >
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-[0.9375rem] font-medium text-[color:var(--l-ink-2)] transition-colors hover:text-[color:var(--l-ink)]"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-4">
          <span className="hidden text-[0.875rem] text-[color:var(--l-ink-mute)] lg:block">
            Piloto educativo · Hack the Andes
          </span>
          <a href="/ingresar" className="l-btn l-btn-primary whitespace-nowrap">
            <span className="sm:hidden">Ingresar</span>
            <span className="hidden sm:inline">Ingresar a la plataforma</span>
          </a>
          <button
            type="button"
            className="flex size-11 items-center justify-center rounded-md border border-[color:var(--l-line)] xl:hidden"
            aria-expanded={open}
            aria-controls="landing-menu"
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? (
              <X className="size-5" aria-hidden />
            ) : (
              <Menu className="size-5" aria-hidden />
            )}
          </button>
        </div>
      </div>
      {open && (
        <nav
          id="landing-menu"
          aria-label="Secciones"
          className="border-t border-[color:var(--l-line)] bg-white px-4 py-3 xl:hidden"
        >
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block rounded-md px-2 py-3 font-medium text-[color:var(--l-ink)] hover:bg-[color:var(--l-muted-surface)]"
            >
              {item.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
