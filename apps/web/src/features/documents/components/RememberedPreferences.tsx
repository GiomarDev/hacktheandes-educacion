import { BookmarkCheck } from 'lucide-react';
import type { PreferencesResult } from '@/features/documents/types';
import { Button, Card, CardHeader, ErrorNote } from '@/shared/ui/kit';

// Todo lo que Amauti recuerda para los documentos del usuario, con la opción de olvidarlo.
export function RememberedPreferences({
  result,
  onForget,
  forgetting,
  error,
}: {
  result: PreferencesResult;
  onForget(id: string): void;
  forgetting?: boolean;
  error?: unknown;
}) {
  if (result.status !== 'available') return null;
  return (
    <Card className="mt-5">
      <CardHeader
        title="Tus recordatorios de revisión"
        subtitle="Aparecen al revisar tus documentos del mismo tipo y en la plantilla de corrección que descargas. Se guardan en Atomic Memory, solo para tu cuenta."
      />
      {result.preferences.length ? (
        <ul className="divide-y divide-line">
          {result.preferences.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-start gap-3 px-4 py-3 sm:px-5"
            >
              <BookmarkCheck
                className="mt-0.5 size-4 shrink-0 text-gob"
                aria-hidden
              />
              <div className="min-w-[200px] flex-1">
                <div className="text-[0.875rem] font-medium text-muted">
                  {p.category}
                </div>
                <p className="text-[0.9375rem] text-ink">{p.instruction}</p>
              </div>
              <Button
                variant="ghost"
                busy={forgetting}
                aria-label={`Olvidar el recordatorio de ${p.category}`}
                onClick={() => onForget(p.id)}
              >
                Olvidar
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-5 py-4 text-[0.9375rem] text-faint">
          Aún no hay recordatorios. Cuando marques un documento como no
          aprobado, puedes guardar qué revisar en los próximos de ese tipo.
        </p>
      )}
      {error ? <ErrorNote error={error} /> : null}
    </Card>
  );
}
