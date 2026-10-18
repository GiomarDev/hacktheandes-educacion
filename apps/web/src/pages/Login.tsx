import { useState } from 'react';
import type { FormEvent } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { apiFetch } from '../api/client';
import { Flag, Wordmark } from '../ui/Brand';
import { Button, ErrorNote, Field, inputClass } from '../ui/kit';

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <div className="h-1 bg-peru" />
      <header className="flex items-center gap-3 border-b border-line bg-card px-4 py-3 sm:px-8">
        <Flag size={26} />
        <div className="text-[11px] font-medium uppercase tracking-wide text-muted">
          Piloto educativo · Hack the Andes
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-[380px]">{children}</div>
      </main>
      <footer className="px-4 py-4 text-center text-[11px] text-faint">
        Datos sintéticos de demostración · Las notificaciones a familias son
        simuladas
      </footer>
    </div>
  );
}

export function LoginPage() {
  const { login } = useAuth();
  const [documentNumber, setDocumentNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(documentNumber.trim(), password);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Frame>
      <div className="mb-6">
        <Wordmark />
        <h1 className="mt-4 text-[22px] font-semibold tracking-tight">
          Ingresa a tu cuenta
        </h1>
        <p className="mt-1 text-[13px] text-muted">
          Alerta temprana para la continuidad educativa: asistencia, casos y
          acompañamiento a las familias.
        </p>
      </div>
      <form
        onSubmit={submit}
        className="space-y-4 rounded-md border border-line bg-card p-5"
      >
        <Field label="Número de documento">
          <input
            className={inputClass}
            inputMode="numeric"
            autoComplete="username"
            required
            minLength={6}
            maxLength={15}
            value={documentNumber}
            onChange={(e) => setDocumentNumber(e.target.value)}
            placeholder="DNI"
          />
        </Field>
        <Field label="Contraseña">
          <input
            className={inputClass}
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        {error ? <ErrorNote error={error} /> : null}
        <Button
          type="submit"
          variant="primary"
          busy={busy}
          className="h-9 w-full"
        >
          Ingresar
        </Button>
        <p className="flex items-center gap-1.5 text-[11px] text-faint">
          <ShieldCheck className="size-3.5" aria-hidden /> Tras 5 intentos
          fallidos la cuenta se bloquea 15 minutos.
        </p>
      </form>
    </Frame>
  );
}

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
    <Frame>
      <h1 className="text-[20px] font-semibold tracking-tight">
        Cambia tu contraseña
      </h1>
      <p className="mt-1 mb-5 text-[13px] text-muted">
        Es tu primer ingreso: define una contraseña personal.
      </p>
      <form
        onSubmit={submit}
        className="space-y-4 rounded-md border border-line bg-card p-5"
      >
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
    </Frame>
  );
}
