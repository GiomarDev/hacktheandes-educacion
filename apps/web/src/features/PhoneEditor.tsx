import { useId, useState } from 'react';
import type { FormEvent } from 'react';
import { Pencil, Phone } from 'lucide-react';
import { Button } from '../ui/kit';

// Igual que ms-auth: celular peruano de 9 dígitos que empieza con 9; se guarda como +51XXXXXXXXX.
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/[\s-]/g, '').replace(/^\+51/, '');
  return /^9\d{8}$/.test(digits) ? `+51${digits}` : null;
}
const pretty = (phone: string) =>
  phone.replace(/^\+51(\d{3})(\d{3})(\d{3})$/, '+51 $1 $2 $3');

export function PhoneEditor({
  name,
  phone,
  onSave,
}: {
  name: string;
  phone: string | null;
  onSave(phone: string): Promise<unknown>;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(phone ?? '');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const id = useId();

  async function submit(event: FormEvent) {
    event.preventDefault();
    const normalized = normalizePhone(value);
    if (!normalized)
      return setError('Ingresa un celular de 9 dígitos que empiece con 9');
    setBusy(true);
    setError(null);
    try {
      await onSave(normalized);
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar');
    } finally {
      setBusy(false);
    }
  }

  if (!editing)
    return (
      <span className="inline-flex items-center gap-1.5 text-[0.9375rem]">
        <Phone className="size-4 text-faint" aria-hidden />
        <span className={phone ? 'tabular-nums text-ink' : 'text-faint'}>
          {phone ? pretty(phone) : 'Sin celular'}
        </span>
        <button
          type="button"
          className="inline-flex min-h-8 items-center gap-1 rounded px-1.5 text-gob hover:bg-gob-soft"
          aria-label={`${phone ? 'Editar' : 'Agregar'} celular de ${name}`}
          onClick={() => {
            setValue(phone ?? '');
            setEditing(true);
          }}
        >
          <Pencil className="size-3.5" aria-hidden />
          <span className="text-[0.875rem]">
            {phone ? 'Editar' : 'Agregar'}
          </span>
        </button>
      </span>
    );

  return (
    <form
      onSubmit={(e) => void submit(e)}
      className="flex flex-wrap items-start gap-2"
    >
      <div>
        <label htmlFor={id} className="sr-only">
          Celular de {name}
        </label>
        <input
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="off"
          autoFocus
          placeholder="9XX XXX XXX"
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className="h-9 w-40 rounded border border-line bg-card px-3 tabular-nums focus:border-gob focus:outline-none"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        {error && (
          <p
            id={`${id}-error`}
            role="alert"
            className="mt-1 text-[0.875rem] text-critical"
          >
            {error}
          </p>
        )}
      </div>
      <Button type="submit" variant="primary" busy={busy}>
        Guardar
      </Button>
      <Button
        type="button"
        variant="ghost"
        onClick={() => setEditing(false)}
        disabled={busy}
      >
        Cancelar
      </Button>
    </form>
  );
}
