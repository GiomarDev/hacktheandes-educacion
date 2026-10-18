import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { hasNewVersion } from '@/shared/lib/app-version';
import { Button } from '@/shared/ui/kit';

const EVERY_MS = 5 * 60_000;

// Si se publica una versión mientras la app está abierta, invita a actualizar antes de que
// una pantalla nueva falle al cargar. Revisa al volver a la pestaña y cada 5 minutos.
export function NewVersionNotice({
  check = hasNewVersion,
  reload = () => window.location.reload(),
}: {
  check?: () => Promise<boolean>;
  reload?: () => void;
}) {
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const run = () => {
      if (document.visibilityState === 'hidden') return;
      void check().then((yes) => !cancelled && yes && setAvailable(true));
    };
    run();
    const timer = setInterval(run, EVERY_MS);
    document.addEventListener('visibilitychange', run);
    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', run);
    };
  }, [check]);

  if (!available) return null;
  return (
    <div
      role="status"
      className="fade-in fixed inset-x-4 bottom-20 z-50 mx-auto flex max-w-md items-center gap-3 rounded-lg border border-line bg-card px-4 py-3 shadow-lg md:bottom-6"
    >
      <Sparkles className="size-5 shrink-0 text-gob" aria-hidden />
      <span className="flex-1 text-[0.9375rem]">
        Hay una nueva versión de Amauti.
      </span>
      <Button variant="primary" onClick={reload}>
        Actualizar
      </Button>
    </div>
  );
}
