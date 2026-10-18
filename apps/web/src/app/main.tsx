import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/app/App';
import { AppProviders } from '@/app/providers';
import { configureAdobeFonts } from '@/shared/lib/adobe-fonts';
import { reloadForNewVersion } from '@/shared/lib/app-version';
import '@/styles/index.css';

configureAdobeFonts({
  kitId: import.meta.env.VITE_ADOBE_FONTS_KIT_ID,
  uiFamily: import.meta.env.VITE_ADOBE_UI_FAMILY,
  displayFamily: import.meta.env.VITE_ADOBE_DISPLAY_FAMILY,
});

// Vite avisa cuando no puede precargar un archivo de otra versión (desplegamos con la app
// abierta): se recarga una vez para tomar la nueva. Si ya se recargó, el error sigue su curso.
window.addEventListener('vite:preloadError', (event) => {
  if (reloadForNewVersion()) event.preventDefault();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
);
