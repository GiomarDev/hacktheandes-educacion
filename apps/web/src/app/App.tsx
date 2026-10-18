import { lazy, Suspense, useMemo } from 'react';
import { RouterProvider } from 'react-router';
import { useAuth } from '@/features/auth/AuthProvider';
import { ChangePasswordPage } from '@/features/auth/pages/ChangePasswordPage';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { MascotProvider } from '@/features/mascot/MascotProvider';
import { PageSkeleton } from '@/shared/ui/motion';
import { createAppRouter } from '@/app/router';

const LandingPage = lazy(() =>
  import('@/features/landing/pages/LandingPage').then((m) => ({
    default: m.LandingPage,
  })),
);

// Puerta de sesión: restaurando → login → cambio de contraseña → aplicación.
export function App() {
  const { status, mustChangePassword, user, active } = useAuth();
  // Un router por sesión y rol activo: arranca en la URL actual (que login y cambio de rol llevan a "/").
  const router = useMemo(() => createAppRouter(), [user?.id, active]);
  if (status === 'loading')
    return (
      <div className="mx-auto w-full max-w-[1560px] px-4 py-8 lg:px-8">
        <PageSkeleton label="Restaurando sesión…" />
      </div>
    );
  // Sin sesión: la presentación pública en "/" y el ingreso en "/ingresar".
  if (status === 'anonymous')
    return window.location.pathname.startsWith('/ingresar') ? (
      <LoginPage />
    ) : (
      <Suspense fallback={null}>
        <LandingPage />
      </Suspense>
    );
  if (mustChangePassword) return <ChangePasswordPage />;
  return (
    <MascotProvider>
      <RouterProvider router={router} />
    </MascotProvider>
  );
}
