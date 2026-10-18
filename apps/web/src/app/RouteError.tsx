import { useEffect, useState } from 'react';
import { Link, useRouteError } from 'react-router';
import { RefreshCw } from 'lucide-react';
import {
  isChunkLoadError,
  reloadForNewVersion,
} from '@/shared/lib/app-version';
import { Button, Card } from '@/shared/ui/kit';
import { PageSkeleton } from '@/shared/ui/motion';

// Errores de una pantalla: reemplaza el mensaje técnico de React Router. Si la pantalla era de
// una versión anterior (desplegamos mientras estaba abierta), recarga para tomar la nueva.
export function RouteError() {
  const error = useRouteError();
  const chunk = isChunkLoadError(error);
  const [reloading] = useState(() => chunk && reloadForNewVersion());

  useEffect(() => {
    if (!chunk) console.error(error);
  }, [chunk, error]);

  if (reloading)
    return <PageSkeleton label="Actualizando Amauti a la nueva versión…" />;

  return (
    <Card className="mx-auto mt-6 max-w-xl px-6 py-8 text-center">
      <h1 className="section-heading text-ink">
        {chunk
          ? 'No pudimos cargar esta pantalla'
          : 'Algo salió mal en esta pantalla'}
      </h1>
      <p className="mt-2 text-muted">
        {chunk
          ? 'Puede que haya una versión nueva o que la conexión se haya cortado. Recarga para intentarlo de nuevo.'
          : 'Tus datos están a salvo. Recarga la página o vuelve al inicio; si se repite, avísanos.'}
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Button variant="primary" onClick={() => window.location.reload()}>
          <RefreshCw className="size-4" aria-hidden /> Recargar
        </Button>
        <Link to="/" reloadDocument>
          <Button>Volver al inicio</Button>
        </Link>
      </div>
    </Card>
  );
}
