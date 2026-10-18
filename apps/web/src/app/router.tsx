import { createBrowserRouter, Link, Navigate } from 'react-router';
import type { ComponentType } from 'react';
import { useAuth } from '@/features/auth/AuthProvider';
import { homeFor } from '@/features/auth/roles';
import { Shell } from '@/app/layout/Shell';
import { RouteError } from '@/app/RouteError';
import { Empty } from '@/shared/ui/kit';
import { PageSkeleton } from '@/shared/ui/motion';
import { setPendingNavigation } from '@/shared/lib/app-version';

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
    Component: (await load())[name] as ComponentType,
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
    // Un error en una pantalla se muestra dentro del shell; el menú sigue disponible.
    errorElement: <RouteError />,
    children: [
      {
        errorElement: <RouteError />,
        children: [
          { index: true, element: <Home /> },
          // Con sesión iniciada, /ingresar lleva a la pantalla de inicio del rol.
          { path: 'ingresar', element: <Home /> },
          {
            path: 'docente',
            lazy: page(
              () => import('@/features/home/pages/DocenteHoyPage'),
              'DocenteHoyPage',
            ),
          },
          {
            path: 'docente/aula',
            lazy: page(
              () => import('@/features/attendance/pages/AulaPage'),
              'AulaPage',
            ),
          },
          {
            path: 'estudiantes/:id',
            lazy: page(
              () => import('@/features/schools/pages/EstudiantePage'),
              'EstudiantePage',
            ),
          },
          {
            path: 'notas',
            lazy: page(
              () => import('@/features/grades/pages/NotasPage'),
              'NotasPage',
            ),
          },
          {
            path: 'documentos',
            lazy: page(
              () => import('@/features/documents/pages/DocumentosPage'),
              'DocumentosPage',
            ),
          },
          {
            path: 'alertas',
            lazy: page(
              () => import('@/features/alerts/pages/AlertasPage'),
              'AlertasPage',
            ),
          },
          {
            path: 'casos/:id',
            lazy: page(
              () => import('@/features/alerts/pages/CasoPage'),
              'CasoPage',
            ),
          },
          {
            path: 'panorama',
            lazy: page(
              () => import('@/features/indicators/pages/PanoramaPage'),
              'PanoramaPage',
            ),
          },
          {
            path: 'escuelas',
            lazy: page(
              () => import('@/features/schools/pages/EscuelasPage'),
              'EscuelasPage',
            ),
          },
          {
            path: 'escuelas/:id',
            lazy: page(
              () => import('@/features/schools/pages/EscuelaPage'),
              'EscuelaPage',
            ),
          },
          {
            path: 'reportes',
            lazy: page(
              () => import('@/features/reports/pages/ReportesPage'),
              'ReportesPage',
            ),
          },
          {
            path: 'fuentes',
            lazy: page(
              () => import('@/features/indicators/pages/FuentesPage'),
              'FuentesPage',
            ),
          },
          {
            path: 'planes',
            lazy: page(
              () => import('@/features/plans/pages/PlanesPage'),
              'PlanesPage',
            ),
          },
          {
            path: 'planes/:id',
            lazy: page(
              () => import('@/features/plans/pages/PlanPage'),
              'PlanPage',
            ),
          },
          {
            path: 'visitas',
            lazy: page(
              () => import('@/features/visits/pages/VisitasPage'),
              'VisitasPage',
            ),
          },
          {
            path: 'admin',
            lazy: page(
              () => import('@/features/admin/pages/AdminPage'),
              'AdminPage',
            ),
          },
          { path: '*', element: <NotFound /> },
        ],
      },
    ],
  },
];

// Un router por sesión y rol activo: arranca en la URL actual (que login y cambio de rol llevan a "/").
export function createAppRouter() {
  const router = createBrowserRouter(routes);
  // Si la pantalla destino es de una versión anterior, la recarga entra directo en ella.
  setPendingNavigation(() => {
    const next = router.state.navigation.location;
    return next ? next.pathname + next.search : null;
  });
  return router;
}
