import { useEffect, useMemo, useRef } from 'react';
import source from '@/features/mascot/amauti.svg?raw';
import { SVGAnimator, type State } from '@/features/mascot/amauti-animations';

// El dibujo trae <title id>: en copias decorativas se quita para no repetir IDs ni duplicar lectura.
const decorative = source
  .replace(/<title[^>]*>.*?<\/title>/s, '')
  .replace(/\srole="img"/, '')
  .replace(/\saria-labelledby="[^"]*"/, '')
  .replace('<svg ', '<svg aria-hidden="true" focusable="false" ');

const reducedMotion = () =>
  typeof window !== 'undefined' &&
  !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Amauti dentro de la página (login, recorrido, estados vacíos), sin el compañero flotante.
export function MascotFigure({
  pose = 'idle',
  className,
}: {
  pose?: State;
  className?: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const animator = useRef<SVGAnimator | null>(null);
  const html = useMemo(() => ({ __html: decorative }), []);

  useEffect(() => {
    const svg = host.current?.querySelector('svg');
    if (!svg) return;
    try {
      animator.current = new SVGAnimator(svg);
    } catch {
      animator.current = null;
    }
    return () => {
      animator.current?.destroy();
      animator.current = null;
    };
  }, []);

  useEffect(() => {
    try {
      animator.current?.play(pose, reducedMotion());
    } catch {
      // Sin SVG completo (p. ej. en pruebas), el dibujo queda estático.
    }
  }, [pose]);

  return (
    <div
      ref={host}
      className={className}
      data-pose={pose}
      dangerouslySetInnerHTML={html}
    />
  );
}

// Ilustración para los estados vacíos (ver shared/ui/illustration).
export function SleepingAmauti({ className }: { className?: string }) {
  return <MascotFigure pose="sleeping" className={className} />;
}
