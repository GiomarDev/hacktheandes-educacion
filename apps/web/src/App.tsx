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
import { DocenteHoyPage } from './pages/DocenteHoy';
import { AulaPage } from './pages/Aula';
import { EstudiantePage } from './pages/Estudiante';
import { AlertasPage } from './pages/Alertas';
import { CasoPage } from './pages/Caso';
import { PanoramaPage } from './pages/Panorama';
import { EscuelasPage } from './pages/Escuelas';
import { EscuelaPage } from './pages/Escuela';
import { ReportesPage } from './pages/Reportes';
import { FuentesPage } from './pages/Fuentes';
import { NotasPage } from './pages/Notas';
import { PlanesPage } from './pages/Planes';
import { PlanPage } from './pages/Plan';
import { VisitasPage } from './pages/Visitas';
import { AdminPage } from './pages/Admin';
import { Empty, Loading } from './ui/kit';
import { MascotProvider } from './mascot/MascotProvider';

function Home() {
  const { active } = useAuth();
  return active ? <Navigate to={homeFor(active)} replace /> : null;
}

function NotFound() {
  return (
    <Empty title="Página no encontrada">
      <Link to="/" className="text-gob hover:underline">
        Volver al inicio
      </Link>
    </Empty>
  );
}

const routes = [
  {
    element: <Shell />,
    children: [
      { index: true, element: <Home /> },
      { path: 'docente', element: <DocenteHoyPage /> },
      { path: 'docente/aula', element: <AulaPage /> },
      { path: 'estudiantes/:id', element: <EstudiantePage /> },
      { path: 'notas', element: <NotasPage /> },
      { path: 'alertas', element: <AlertasPage /> },
      { path: 'casos/:id', element: <CasoPage /> },
      { path: 'panorama', element: <PanoramaPage /> },
      { path: 'escuelas', element: <EscuelasPage /> },
      { path: 'escuelas/:id', element: <EscuelaPage /> },
      { path: 'reportes', element: <ReportesPage /> },
      { path: 'fuentes', element: <FuentesPage /> },
      { path: 'planes', element: <PlanesPage /> },
      { path: 'planes/:id', element: <PlanPage /> },
      { path: 'visitas', element: <VisitasPage /> },
      { path: 'admin', element: <AdminPage /> },
      { path: '*', element: <NotFound /> },
    ],
  },
];

export function App() {
  const { status, mustChangePassword, user, active } = useAuth();
  // Un router por sesión y rol activo: arranca en la URL actual (que login y cambio de rol llevan a "/").
  const router = useMemo(() => createBrowserRouter(routes), [user?.id, active]);
  if (status === 'loading') return <Loading label="Restaurando sesión…" />;
  if (status === 'anonymous') return <LoginPage />;
  if (mustChangePassword) return <ChangePasswordPage />;
  return (
    <MascotProvider>
      <RouterProvider router={router} />
    </MascotProvider>
  );
}
