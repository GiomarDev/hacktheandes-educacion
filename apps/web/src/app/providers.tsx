import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiError } from '@/shared/api/client';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { SleepingAmauti } from '@/features/mascot/MascotFigure';
import { EmptyIllustrationContext } from '@/shared/ui/illustration';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // Un 401/403/404 no se arregla reintentando.
      retry: (count, error) =>
        !(error instanceof ApiError && error.status < 500) && count < 2,
    },
  },
});

// Datos remotos (TanStack Query), sesión e ilustración de estados vacíos para toda la aplicación.
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <EmptyIllustrationContext.Provider value={SleepingAmauti}>
          {children}
        </EmptyIllustrationContext.Provider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
