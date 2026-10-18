import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
import { BarChart3, LogOut, MoreHorizontal, Compass } from 'lucide-react';
import { NavigationIcon } from '@/shared/ui/NavigationIcon';
import { useSession } from '@/features/auth/AuthProvider';
import { navFor, roleLabel } from '@/features/auth/roles';
import { useAlerts } from '@/features/alerts/api';
import { useMascot } from '@/features/mascot/MascotProvider';
import { MascotFigure } from '@/features/mascot/MascotFigure';
import { stepsFor } from '@/features/onboarding/steps';
import { Tour } from '@/features/onboarding/Tour';
import { useOnboarding } from '@/features/onboarding/useOnboarding';
import { Flag, Wordmark } from '@/shared/ui/Brand';
import { cx } from '@/shared/ui/kit';
import { DataProgress } from '@/shared/ui/motion';
import { NewVersionNotice } from '@/shared/ui/NewVersionNotice';

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
}

export function Shell() {
  const { user, active, selectRole, logout } = useSession();
  const items = navFor(active);
  const mascot = useMascot();
  const tour = useOnboarding(active.role);
  const { pathname } = useLocation();
  // Al cambiar de módulo, el foco pasa al contenido nuevo (lectores de pantalla y teclado).
  const mainRef = useRef<HTMLElement>(null);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    mainRef.current?.focus({ preventScroll: true });
  }, [pathname]);
  const canSeeAlerts = items.some((i) => i.to === '/alertas');
  const openAlerts = useAlerts({ status: 'OPEN' });
  const alertCount = canSeeAlerts ? (openAlerts.data?.length ?? 0) : 0;
  // En el móvil caben 5 accesos: si hay más, los 4 primeros y un menú "Más" con el resto.
  const [moreOpen, setMoreOpen] = useState(false);
  const mobileItems = items.length > 5 ? items.slice(0, 4) : items;
  const moreItems = items.length > 5 ? items.slice(4) : [];

  return (
    <div className="flex min-h-screen bg-canvas text-ink">
      <a href="#main-content" className="skip-link">
        Saltar al contenido
      </a>
      {/* Navegación con etiquetas de lectura a tamaño funcional. */}
      <aside className="sticky top-0 hidden h-dvh w-[84px] shrink-0 flex-col bg-ink text-white md:flex lg:w-[232px]">
        <div className="flex min-h-20 w-full items-center justify-center gap-3 border-b border-white/10 px-4 lg:justify-start">
          <Flag size={28} />
          <span className="hidden font-display text-[1.75rem] font-semibold tracking-tight lg:block">
            Amauti
          </span>
        </div>
        <nav
          aria-label="Principal"
          className="flex w-full min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-1.5 py-5 lg:px-3"
        >
          {items.map((item) => {
            return (
              <NavLink
                viewTransition
                key={item.to}
                to={item.to}
                end={item.to === '/docente'}
                data-tour={`nav-${item.icon}`}
                className={({ isActive }) =>
                  cx(
                    'relative flex min-h-14 w-full flex-col items-center justify-center gap-1 rounded-md px-1 py-2 text-[0.75rem] font-medium transition-colors hover:bg-white/10 hover:text-white lg:min-h-12 lg:flex-row lg:justify-start lg:gap-3 lg:px-3 lg:text-[1rem]',
                    isActive ? 'bg-white/10 text-white' : 'text-[#c9d9e5]',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span
                        className="nav-indicator absolute top-1/2 left-0 h-[22px] w-[3px] -translate-y-1/2 rounded-r bg-amauti"
                        aria-hidden
                      />
                    )}
                    <NavigationIcon
                      name={item.icon}
                      className="size-5 shrink-0"
                      aria-hidden
                    />
                    <span className="max-w-full px-0.5 lg:pr-5">
                      {item.label}
                    </span>
                    {item.icon === 'alerts' && alertCount > 0 && (
                      <span className="absolute top-1 right-1 flex h-4 min-w-4 lg:top-3.5 lg:right-2 items-center justify-center rounded-full bg-peru px-1 font-sans tabular-nums text-[0.75rem] font-semibold text-white">
                        {alertCount > 99 ? '99+' : alertCount}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
        <button
          onClick={() => void logout()}
          className="mx-3 mb-4 flex min-h-11 items-center justify-center gap-3 rounded-md text-[#c9d9e5] hover:bg-white/10 hover:text-white lg:justify-start lg:px-3"
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
        >
          <LogOut className="size-5 shrink-0" aria-hidden />
          <span className="hidden text-[1rem] lg:inline">Cerrar sesión</span>
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-line bg-card">
          <div className="flex min-h-20 flex-wrap items-center gap-3 px-4 py-3 lg:px-8">
            <div className="md:hidden">
              <Flag size={24} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="hidden text-[0.875rem] text-muted sm:block">
                Continuidad educativa
              </div>
              <Wordmark />
            </div>
            {user.roles.length > 1 ? (
              <label className="hidden items-center gap-2 text-[0.9375rem] text-muted sm:flex">
                Rol activo
                <select
                  className="h-8 rounded border border-line bg-card px-2 text-[0.9375rem] font-medium text-ink"
                  value={user.roles.indexOf(active)}
                  onChange={(e) => selectRole(Number(e.target.value))}
                >
                  {user.roles.map((claim, i) => (
                    <option key={i} value={i}>
                      {roleLabel(claim.role)}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <div className="hidden text-[0.9375rem] text-muted sm:block">
                Rol activo:{' '}
                <span className="font-medium text-ink">
                  {roleLabel(active.role)}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1" data-tour="amauti">
              <button
                hidden={!mascot.available}
                type="button"
                onClick={() => mascot.setVisible(!mascot.visible)}
                aria-pressed={mascot.visible}
                title={mascot.visible ? 'Ocultar a Amauti' : 'Mostrar a Amauti'}
                aria-label={
                  mascot.visible ? 'Ocultar a Amauti' : 'Mostrar a Amauti'
                }
                className={cx(
                  'flex size-11 items-center justify-center rounded transition-colors hover:bg-soft',
                  mascot.visible ? 'bg-medium-soft' : 'opacity-70',
                )}
              >
                <MascotFigure className="h-7 w-5" />
              </button>
              <button
                type="button"
                onClick={tour.start}
                title="Ver el recorrido"
                aria-label="Ver el recorrido de bienvenida"
                className="flex size-11 items-center justify-center rounded text-muted transition-colors hover:bg-soft hover:text-ink"
              >
                <Compass className="size-4" strokeWidth={1.8} aria-hidden />
              </button>
            </div>
            <div className="flex items-center gap-2 border-l border-line pl-3">
              <div className="flex size-11 items-center justify-center rounded-full bg-gob text-[0.875rem] font-semibold text-white">
                {initials(user.name)}
              </div>
              <div className="hidden leading-tight lg:block">
                <div className="text-[0.9375rem] font-medium">{user.name}</div>
                <div className="text-[0.875rem] text-faint">
                  {roleLabel(active.role)}
                </div>
              </div>
              <button
                onClick={() => void logout()}
                className="flex size-11 items-center justify-center rounded text-muted hover:bg-soft md:hidden"
                aria-label="Cerrar sesión"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          </div>
          {user.roles.length > 1 && (
            <div className="border-t border-line px-4 py-1.5 sm:hidden">
              <select
                aria-label="Rol activo"
                className="h-8 w-full rounded border border-line bg-card px-2 text-[0.9375rem]"
                value={user.roles.indexOf(active)}
                onChange={(e) => selectRole(Number(e.target.value))}
              >
                {user.roles.map((claim, i) => (
                  <option key={i} value={i}>
                    Rol activo: {roleLabel(claim.role)}
                  </option>
                ))}
              </select>
            </div>
          )}
          <DataProgress />
        </header>

        <main
          ref={mainRef}
          id="main-content"
          tabIndex={-1}
          className="flex-1 px-4 pt-7 pb-28 outline-none md:pb-10 lg:px-8 lg:pt-9"
        >
          {/* La entrada es única por pantalla, sin mover los bloques durante la lectura. */}
          <div
            key={pathname}
            className="page-enter page-view mx-auto w-full max-w-[1560px]"
          >
            <Outlet />
          </div>
        </main>
        <NewVersionNotice />
        {tour.open && (
          <Tour
            steps={stepsFor(active, user.name).filter(
              (s) => mascot.available || s.id !== 'amauti',
            )}
            onFinish={tour.finish}
          />
        )}

        <footer className="hidden items-center gap-4 border-t border-line bg-card px-6 py-2 text-[0.875rem] text-faint md:flex">
          <span className="flex items-center gap-1.5">
            <BarChart3 className="size-3.5" aria-hidden /> SIAGIE · Alerta ·
            SIMON · ESCALE
          </span>
          <span>Datos sintéticos de demostración</span>
          <span className="ml-auto font-sans tabular-nums">
            v0.1.0 · piloto
          </span>
        </footer>
      </div>

      {/* Barra inferior (móvil) */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-20 bg-ink/20 md:hidden"
          onClick={() => setMoreOpen(false)}
          aria-hidden
        />
      )}
      {moreOpen && (
        <nav
          aria-label="Más secciones"
          className="fixed inset-x-3 bottom-[calc(4rem+env(safe-area-inset-bottom)+8px)] z-30 rounded-md border border-line bg-card py-1 shadow-lg md:hidden"
        >
          {moreItems.map((item) => {
            return (
              <NavLink
                viewTransition
                key={item.to}
                to={item.to}
                onClick={() => setMoreOpen(false)}
                className={({ isActive }) =>
                  cx(
                    'flex items-center gap-3 px-4 py-2.5 text-[1rem] font-medium',
                    isActive ? 'bg-gob-soft text-gob' : 'text-ink',
                  )
                }
              >
                <NavigationIcon
                  name={item.icon}
                  className="size-5"
                  aria-hidden
                />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      )}
      <nav
        aria-label="Principal móvil"
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {mobileItems.map((item) => {
          return (
            <NavLink
              viewTransition
              key={item.to}
              to={item.to}
              end={item.to === '/docente'}
              data-tour={`nav-${item.icon}`}
              onClick={() => setMoreOpen(false)}
              className={({ isActive }) =>
                cx(
                  'relative flex h-16 flex-1 flex-col items-center justify-center gap-0.5 text-[0.8125rem] font-medium',
                  isActive ? 'bg-gob-soft text-gob' : 'text-muted',
                )
              }
            >
              <NavigationIcon name={item.icon} className="size-5" aria-hidden />
              {item.label}
              {item.icon === 'alerts' && alertCount > 0 && (
                <span className="absolute top-1.5 right-[calc(50%-18px)] rounded-full bg-peru px-1 font-sans tabular-nums text-[0.75rem] text-white">
                  {alertCount}
                </span>
              )}
            </NavLink>
          );
        })}
        {moreItems.length > 0 && (
          <button
            type="button"
            data-tour="nav-more"
            aria-expanded={moreOpen}
            onClick={() => setMoreOpen((o) => !o)}
            className={cx(
              'flex h-16 flex-1 flex-col items-center justify-center gap-0.5 text-[0.8125rem] font-medium',
              moreOpen ? 'bg-gob-soft text-gob' : 'text-muted',
            )}
          >
            <MoreHorizontal className="size-5" aria-hidden />
            Más
          </button>
        )}
      </nav>
    </div>
  );
}
