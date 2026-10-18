import { useMemo } from 'react';
import {
  createBrowserRouter,
  Link,
  Navigate,
  RouterProvider,
} from 'react-router';
import { useAuth } from './auth/AuthProvider';
import { homeFor } from './auth/roles';
import { Shell } from './layout/Shell';
import { ChangePasswordPage, LoginPage } from './pages/Login';
import { Empty } from './ui/kit';
import { PageSkeleton } from './ui/motion';
import { MascotProvider } from './mascot/MascotProvider';

function Home() {
  const { active } = useAuth();
  return active ? <Navigate to={homeFor(active)} replace /> : null;
}

function NotFound() {
  return (
    <Empty title="Página no encontrada">
      <Link viewTransition to="/" className="text-gob hover:underline">
        Volver al inicio
      </Link>
    </Empty>
  );
}

// Cada pantalla se carga al visitarla; el router espera el módulo antes de la transición.
function page<M extends Record<string, unknown>>(
  load: () => Promise<M>,
  name: keyof M,
) {
  return async () => ({
    Component: (await load())[name] as React.ComponentType,
  });
}

const routes = [
  {
    element: <Shell />,
    hydrateFallbackElement: (
      <div className="mx-auto w-full max-w-[1560px] px-4 py-8 lg:px-8">
        <PageSkeleton />
      </div>
    ),
    children: [
      { index: true, element: <Home /> },
      {
        path: 'docente',
        lazy: page(() => import('./pages/DocenteHoy'), 'DocenteHoyPage'),
      },
      {
        path: 'docente/aula',
        lazy: page(() => import('./pages/Aula'), 'AulaPage'),
      },
      {
        path: 'estudiantes/:id',
        lazy: page(() => import('./pages/Estudiante'), 'EstudiantePage'),
      },
      { path: 'notas', lazy: page(() => import('./pages/Notas'), 'NotasPage') },
      {
        path: 'alertas',
        lazy: page(() => import('./pages/Alertas'), 'AlertasPage'),
      },
      {
        path: 'casos/:id',
        lazy: page(() => import('./pages/Caso'), 'CasoPage'),
      },
      {
        path: 'panorama',
        lazy: page(() => import('./pages/Panorama'), 'PanoramaPage'),
      },
      {
        path: 'escuelas',
        lazy: page(() => import('./pages/Escuelas'), 'EscuelasPage'),
      },
      {
        path: 'escuelas/:id',
        lazy: page(() => import('./pages/Escuela'), 'EscuelaPage'),
      },
      {
        path: 'reportes',
        lazy: page(() => import('./pages/Reportes'), 'ReportesPage'),
      },
      {
        path: 'fuentes',
        lazy: page(() => import('./pages/Fuentes'), 'FuentesPage'),
      },
      {
        path: 'planes',
        lazy: page(() => import('./pages/Planes'), 'PlanesPage'),
      },
      {
        path: 'planes/:id',
        lazy: page(() => import('./pages/Plan'), 'PlanPage'),
      },
      {
        path: 'visitas',
        lazy: page(() => import('./pages/Visitas'), 'VisitasPage'),
      },
      { path: 'admin', lazy: page(() => import('./pages/Admin'), 'AdminPage') },
      { path: '*', element: <NotFound /> },
    ],
  },
];

export function App() {
  const { status, mustChangePassword, user, active } = useAuth();
  // Un router por sesión y rol activo: arranca en la URL actual (que login y cambio de rol llevan a "/").
  const router = useMemo(() => createBrowserRouter(routes), [user?.id, active]);
  if (status === 'loading')
    return (
      <div className="mx-auto w-full max-w-[1560px] px-4 py-8 lg:px-8">
        <PageSkeleton label="Restaurando sesión…" />
      </div>
    );
  if (status === 'anonymous') return <LoginPage />;
  if (mustChangePassword) return <ChangePasswordPage />;
  return (
    <MascotProvider>
      <RouterProvider router={router} />
    </MascotProvider>
  );
}
