import { NavLink, Outlet } from 'react-router';
import {
  AlertTriangle,
  BarChart3,
  CalendarCheck,
  ClipboardList,
  Database,
  FileText,
  LayoutDashboard,
  LogOut,
  School,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useSession } from '../auth/AuthProvider';
import { navFor, roleLabel } from '../auth/roles';
import type { NavIcon } from '../auth/roles';
import { useAlerts } from '../api/queries';
import { Flag, Wordmark } from '../ui/Brand';
import { cx } from '../ui/kit';

const ICONS: Record<NavIcon, LucideIcon> = {
  today: CalendarCheck,
  classroom: ClipboardList,
  alerts: AlertTriangle,
  panorama: LayoutDashboard,
  schools: School,
  reports: FileText,
  sources: Database,
};

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
  const canSeeAlerts = items.some((i) => i.to === '/alertas');
  const openAlerts = useAlerts({ status: 'OPEN' });
  const alertCount = canSeeAlerts ? (openAlerts.data?.length ?? 0) : 0;

  return (
    <div className="flex min-h-screen bg-canvas text-ink">
      {/* Barra lateral institucional (escritorio) */}
      <aside className="sticky top-0 hidden h-screen w-16 shrink-0 flex-col items-center bg-ink md:flex">
        <div className="flex h-[52px] w-full items-center justify-center border-b border-ink-2">
          <Flag />
        </div>
        <nav
          aria-label="Principal"
          className="flex w-full flex-1 flex-col items-center gap-0.5 py-2.5"
        >
          {items.map((item) => {
            const Icon = ICONS[item.icon];
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/docente'}
                className={({ isActive }) =>
                  cx(
                    'relative flex h-12 w-14 flex-col items-center justify-center gap-0.5 rounded-[5px] text-[9px] font-medium transition-colors hover:bg-ink-2 hover:text-white',
                    isActive ? 'bg-ink-2 text-white' : 'text-[#B4BCC9]',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute top-1/2 left-0 h-[22px] w-[3px] -translate-y-1/2 rounded-r bg-peru" />
                    )}
                    <Icon
                      className="size-[18px]"
                      strokeWidth={1.7}
                      aria-hidden
                    />
                    <span className="max-w-full truncate px-0.5">
                      {item.label}
                    </span>
                    {item.icon === 'alerts' && alertCount > 0 && (
                      <span className="absolute top-1 right-1 flex h-3.5 min-w-4 items-center justify-center rounded-full bg-peru px-1 font-mono text-[9px] font-semibold text-white">
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
          className="mb-3 flex h-10 w-10 items-center justify-center rounded text-[#B4BCC9] hover:bg-ink-2 hover:text-white"
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
        >
          <LogOut className="size-[17px]" strokeWidth={1.7} />
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-line bg-card">
          <div className="flex h-[52px] items-center gap-3 px-4 lg:px-6">
            <div className="md:hidden">
              <Flag size={24} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="hidden text-[10px] font-medium tracking-wide text-faint uppercase sm:block">
                Piloto · Hack the Andes · Reto de educación
              </div>
              <Wordmark />
            </div>
            {user.roles.length > 1 ? (
              <label className="hidden items-center gap-2 text-[12px] text-muted sm:flex">
                Rol activo
                <select
                  className="h-8 rounded border border-line bg-card px-2 text-[12px] font-medium text-ink"
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
              <div className="hidden text-[12px] text-muted sm:block">
                Rol activo:{' '}
                <span className="font-medium text-ink">
                  {roleLabel(active.role)}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 border-l border-line pl-3">
              <div className="flex size-8 items-center justify-center rounded-full bg-gob text-[11px] font-semibold text-white">
                {initials(user.name)}
              </div>
              <div className="hidden leading-tight lg:block">
                <div className="text-[12.5px] font-medium">{user.name}</div>
                <div className="text-[11px] text-faint">
                  {roleLabel(active.role)}
                </div>
              </div>
              <button
                onClick={() => void logout()}
                className="flex size-8 items-center justify-center rounded text-muted hover:bg-soft md:hidden"
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
                className="h-8 w-full rounded border border-line bg-card px-2 text-[12px]"
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
        </header>

        <main className="flex-1 px-4 pt-5 pb-24 md:pb-8 lg:px-8">
          <Outlet />
        </main>

        <footer className="hidden items-center gap-4 border-t border-line bg-card px-6 py-2 text-[11px] text-faint md:flex">
          <span className="flex items-center gap-1.5">
            <BarChart3 className="size-3.5" aria-hidden /> SIAGIE · Alerta ·
            SIMON · ESCALE
          </span>
          <span>Datos sintéticos de demostración</span>
          <span className="ml-auto font-mono">v0.1.0 · piloto</span>
        </footer>
      </div>

      {/* Barra inferior (móvil) */}
      <nav
        aria-label="Principal móvil"
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {items.slice(0, 5).map((item) => {
          const Icon = ICONS[item.icon];
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/docente'}
              className={({ isActive }) =>
                cx(
                  'relative flex h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium',
                  isActive ? 'text-peru' : 'text-muted',
                )
              }
            >
              <Icon className="size-5" strokeWidth={1.7} aria-hidden />
              {item.label}
              {item.icon === 'alerts' && alertCount > 0 && (
                <span className="absolute top-1.5 right-[calc(50%-18px)] rounded-full bg-peru px-1 font-mono text-[9px] text-white">
                  {alertCount}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
