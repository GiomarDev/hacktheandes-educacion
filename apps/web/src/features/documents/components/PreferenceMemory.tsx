import { useState } from 'react';
import type { FormEvent } from 'react';
import { BookmarkCheck } from 'lucide-react';
import type {
  DocumentPreference,
  PreferencesResult,
} from '@/features/documents/types';
import { Button, ErrorNote, Field, inputClass } from '@/shared/ui/kit';

// Dentro de un documento no aprobado: el docente le dice a Amauti qué cambiar la próxima vez.
export function PreferenceMemory({
  category,
  result,
  onSave,
  onForget,
  saving,
  forgetting,
  error,
}: {
  category: string;
  result: PreferencesResult;
  onSave(instruction: string): Promise<unknown>;
  onForget(id: string): void;
  saving?: boolean;
  forgetting?: boolean;
  error?: unknown;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState('');
  if (result.status === 'disabled') return null;
  if (result.status === 'unavailable')
    return (
      <p role="status" className="text-[0.875rem] text-faint">
        Los recordatorios no están disponibles ahora. Tu revisión no se ve
        afectada.
      </p>
    );
  const current: DocumentPreference | undefined = result.preferences.find(
    (p) => p.category === category,
  );

  const submit = (e: FormEvent) => {
    e.preventDefault();
    // Si falla, el error se muestra y el texto se conserva para reintentar.
    onSave(text).then(
      () => {
        setEditing(false);
        setText('');
      },
      () => undefined,
    );
  };

  if (current && !editing)
    return (
      <div
        role="status"
        className="flex flex-wrap items-start gap-3 rounded bg-gob-soft px-3 py-2"
      >
        <BookmarkCheck
          className="mt-0.5 size-4 shrink-0 text-gob"
          aria-hidden
        />
        <p className="min-w-[200px] flex-1 text-[0.9375rem] text-ink">
          Recordatorio guardado para tus documentos «{category}»:{' '}
          <span className="font-medium">“{current.instruction}”</span>
        </p>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              setText(current.instruction);
              setEditing(true);
            }}
          >
            Corregir
          </Button>
          <Button
            variant="ghost"
            busy={forgetting}
            onClick={() => onForget(current.id)}
          >
            Olvidar
          </Button>
        </div>
      </div>
    );

  return (
    <form onSubmit={submit} className="space-y-2">
      <Field
        label={`¿Qué quieres recordar al revisar tus próximos documentos «${category}»?`}
        hint="Se mostrará al revisar tus documentos de este tipo y en la plantilla que descargas; no cambia el contenido que prepara Amauti. Solo tú lo ves. No incluyas nombres, DNI ni datos de estudiantes."
      >
        <textarea
          className={`${inputClass} h-20 py-2`}
          required
          minLength={3}
          maxLength={280}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ej.: pon las competencias del CNEB al inicio"
        />
      </Field>
      {error ? <ErrorNote error={error} /> : null}
      <div className="flex gap-2">
        <Button type="submit" variant="primary" busy={saving}>
          Guardar recordatorio
        </Button>
        {editing && (
          <Button variant="ghost" onClick={() => setEditing(false)}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
