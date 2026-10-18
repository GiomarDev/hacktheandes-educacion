import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '@/features/auth/AuthProvider';
import { apiFetch } from '@/shared/api/client';
import { Button, ErrorNote, Field, inputClass } from '@/shared/ui/kit';
import { AuthFrame } from '@/features/auth/components/AuthFrame';

export function ChangePasswordPage() {
  const { passwordChanged, logout } = useAuth();
  const [currentPassword, setCurrent] = useState('');
  const [newPassword, setNew] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (newPassword !== confirm) {
      setError(new Error('Las contraseñas nuevas no coinciden'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await apiFetch('auth', '/auth/change-password', {
        method: 'POST',
        body: { currentPassword, newPassword },
      });
      passwordChanged();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthFrame
      pose={error ? 'surprised' : 'idea'}
      message="Elige una contraseña que solo tú conozcas. Así protegemos los datos de los estudiantes."
    >
      <h1 className="page-heading">Cambia tu contraseña</h1>
      <p className="mt-1 mb-5 text-[1rem] text-muted">
        Es tu primer ingreso: define una contraseña personal.
      </p>
      <form onSubmit={submit} className="space-y-5">
        <Field label="Contraseña actual">
          <input
            className={inputClass}
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrent(e.target.value)}
            autoComplete="current-password"
          />
        </Field>
        <Field label="Contraseña nueva" hint="Entre 10 y 128 caracteres.">
          <input
            className={inputClass}
            type="password"
            required
            minLength={10}
            maxLength={128}
            value={newPassword}
            onChange={(e) => setNew(e.target.value)}
            autoComplete="new-password"
          />
        </Field>
        <Field label="Repite la contraseña nueva">
          <input
            className={inputClass}
            type="password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
          />
        </Field>
        {error ? <ErrorNote error={error} /> : null}
        <div className="flex gap-2">
          <Button
            type="submit"
            variant="primary"
            busy={busy}
            className="flex-1"
          >
            Guardar
          </Button>
          <Button type="button" variant="ghost" onClick={() => void logout()}>
            Salir
          </Button>
        </div>
      </form>
    </AuthFrame>
  );
}
