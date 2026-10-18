import { useEffect } from 'react';
import { BlindSpot } from '@/features/landing/components/BlindSpot';
import { Closing } from '@/features/landing/components/Closing';
import { Evidence } from '@/features/landing/components/Evidence';
import { Hero } from '@/features/landing/components/Hero';
import { LandingFooter } from '@/features/landing/components/LandingFooter';
import { LandingHeader } from '@/features/landing/components/LandingHeader';
import { Pieces } from '@/features/landing/components/Pieces';
import { Thesis } from '@/features/landing/components/Thesis';
import '@/features/landing/landing.css';

// Página pública para quien aún no inició sesión: el pitch de Amauti y el acceso a la demo.
export function LandingPage() {
  useEffect(() => {
    document.title = 'Amauti — Continuidad educativa y alerta temprana';
  }, []);
  return (
    <div className="landing min-h-screen">
      <a href="#inicio" className="skip-link">
        Saltar al contenido
      </a>
      <LandingHeader />
      <main>
        <Hero />
        <BlindSpot />
        <Thesis />
        <Pieces />
        <Evidence />
        <Closing />
      </main>
      <LandingFooter />
    </div>
  );
}
