import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/app/App';
import { AppProviders } from '@/app/providers';
import { configureAdobeFonts } from '@/shared/lib/adobe-fonts';
import '@/styles/index.css';

configureAdobeFonts({
  kitId: import.meta.env.VITE_ADOBE_FONTS_KIT_ID,
  uiFamily: import.meta.env.VITE_ADOBE_UI_FAMILY,
  displayFamily: import.meta.env.VITE_ADOBE_DISPLAY_FAMILY,
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
);
