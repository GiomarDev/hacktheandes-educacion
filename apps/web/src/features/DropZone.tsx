import { useId, useRef, useState } from 'react';
import type { DragEvent } from 'react';
import { UploadCloud } from 'lucide-react';
import { cx } from '../ui/kit';

const ACCEPTED = /\.(docx|doc|xlsx|xls|pdf)$/i;
const MAX_BYTES = 20 * 1024 * 1024;

// Arrastrar y soltar (o elegir) el documento corregido. Valida formato y tamaño antes de entregarlo.
export function DropZone({
  onFile,
  disabled,
}: {
  onFile(file: File): void;
  disabled?: boolean;
}) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const inputId = useId();

  function take(file: File | undefined) {
    if (!file) return;
    if (!ACCEPTED.test(file.name))
      return setError('El archivo debe ser .docx, .doc, .xlsx, .xls o .pdf');
    if (file.size > MAX_BYTES)
      return setError('El archivo supera el máximo de 20 MB');
    setError(null);
    onFile(file);
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (!disabled) take(e.dataTransfer.files?.[0]);
  };

  return (
    <div>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        aria-label="Arrastra aquí tu documento corregido o haz clic para elegirlo"
        aria-describedby={`${inputId}-hint`}
        data-dragging={dragging}
        onClick={() => !disabled && input.current?.click()}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            input.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cx(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed px-4 py-6 text-center transition-colors',
          dragging
            ? 'border-gob bg-gob-soft'
            : 'border-line bg-canvas hover:border-gob/50',
          disabled && 'cursor-not-allowed opacity-60',
        )}
      >
        <UploadCloud
          className={cx('size-7', dragging ? 'text-gob' : 'text-faint')}
          aria-hidden
        />
        <span className="font-medium text-ink">
          Arrastra aquí tu documento corregido
        </span>
        <span id={`${inputId}-hint`} className="text-[0.875rem] text-faint">
          o haz clic para elegirlo · .docx, .doc, .xlsx, .xls o .pdf · máx. 20
          MB
        </span>
      </div>
      <label htmlFor={inputId} className="sr-only">
        Elegir archivo corregido
      </label>
      <input
        ref={input}
        id={inputId}
        type="file"
        className="sr-only"
        accept=".docx,.doc,.xlsx,.xls,.pdf"
        disabled={disabled}
        onChange={(e) => {
          take(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      {error && (
        <p role="alert" className="mt-2 text-[0.875rem] text-critical">
          {error}
        </p>
      )}
    </div>
  );
}
