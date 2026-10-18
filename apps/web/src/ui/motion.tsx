import { useEffect, useState } from 'react';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { useNavigation } from 'react-router';
import { cx } from './kit';

const SHOW_DELAY = 150;
const EXIT_MS = 320;

// Barra fina bajo la cabecera mientras hay datos en camino. Espera 150 ms para no parpadear
// en respuestas rápidas y sale con un fundido al completar.
export function TopProgress({ active }: { active: boolean }) {
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle');
  useEffect(() => {
    if (active) {
      const timer = setTimeout(() => setPhase('running'), SHOW_DELAY);
      return () => clearTimeout(timer);
    }
    setPhase((p) => (p === 'running' ? 'done' : 'idle'));
    const timer = setTimeout(() => setPhase('idle'), EXIT_MS);
    return () => clearTimeout(timer);
  }, [active]);
  if (phase === 'idle') return null;
  return (
    <div
      role="progressbar"
      aria-label="Cargando datos"
      aria-busy={phase === 'running'}
      className={cx('top-progress', phase === 'done' && 'top-progress-done')}
    >
      <span />
    </div>
  );
}

// Datos en camino o un módulo de pantalla descargándose.
export function DataProgress() {
  const fetching = useIsFetching();
  const mutating = useIsMutating();
  const navigation = useNavigation();
  return (
    <TopProgress
      active={fetching + mutating > 0 || navigation.state !== 'idle'}
    />
  );
}

// Esqueleto con la forma de una pantalla: título, fila de indicadores y dos bloques.
export function PageSkeleton({
  label = 'Cargando la pantalla…',
}: {
  label?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="space-y-6"
    >
      <span className="sr-only">{label}</span>
      <div className="space-y-3" aria-hidden>
        <div className="skeleton h-3 w-32 rounded" />
        <div className="skeleton h-9 w-2/3 max-w-md rounded-md" />
        <div className="skeleton h-3.5 w-1/2 max-w-lg rounded" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-md border border-line bg-card p-4">
            <div className="skeleton h-3 w-24 rounded" />
            <div className="skeleton mt-3 h-8 w-20 rounded-md" />
            <div className="skeleton mt-3 h-2.5 w-28 rounded" />
          </div>
        ))}
      </div>
      <div
        className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]"
        aria-hidden
      >
        {[5, 3].map((rows, i) => (
          <div key={i} className="rounded-md border border-line bg-card">
            <div className="border-b border-line p-4">
              <div className="skeleton h-4 w-48 rounded" />
              <div className="skeleton mt-2 h-3 w-64 max-w-full rounded" />
            </div>
            <div className="space-y-4 p-4">
              {Array.from({ length: rows }, (_, r) => (
                <div key={r} className="flex items-center gap-3">
                  <div className="skeleton size-9 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-3 w-3/5 rounded" />
                    <div className="skeleton h-2.5 w-2/5 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
