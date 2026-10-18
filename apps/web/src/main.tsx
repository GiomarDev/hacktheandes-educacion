import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiError } from './api/client';
import { AuthProvider } from './auth/AuthProvider';
import { App } from './App';
import './index.css';
import { configureAdobeFonts } from './adobe-fonts';

configureAdobeFonts({
  kitId: import.meta.env.VITE_ADOBE_FONTS_KIT_ID,
  uiFamily: import.meta.env.VITE_ADOBE_UI_FAMILY,
  displayFamily: import.meta.env.VITE_ADOBE_DISPLAY_FAMILY,
});

const queryClient = new QueryClient({
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
