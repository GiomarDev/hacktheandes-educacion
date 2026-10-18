import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { apiFetch } from '../api/client';
import { Flag, Wordmark } from '../ui/Brand';
import { Button, ErrorNote, Field, inputClass } from '../ui/kit';
import { MascotFigure } from '../mascot/MascotFigure';
import type { State } from '../mascot/amauti-animations';

function Frame({
  children,
  pose,
  message,
}: {
  children: ReactNode;
  pose: State;
  message: string;
}) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-card">
      <header className="flex min-h-20 flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-10">
        <div className="flex items-center gap-3">
          <Flag size={28} />
          <Wordmark />
        </div>
        <p className="text-[0.875rem] text-muted">
          Piloto educativo · Hack the Andes
        </p>
      </header>
      <main className="grid flex-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <section className="login-surface relative hidden min-h-[650px] flex-col justify-between overflow-hidden px-12 pt-14 pb-8 lg:flex xl:px-16">
          <div className="relative z-10 max-w-lg">
            <div className="mb-6 flex items-center gap-3 text-[1rem] text-[#cadce9]">
              <span className="h-px w-8 bg-amauti" aria-hidden="true" />{' '}
              Continuidad educativa
            </div>
            <h2 className="page-heading login-copy max-w-[12ch] text-white">
              Cada día en el aula cuenta.
            </h2>
            <p className="mt-6 max-w-[40ch] text-[1.125rem] leading-relaxed text-[#d0deea]">
              Una mirada a tiempo puede cambiar una historia. Conecta la
              asistencia, las alertas y el acompañamiento a las familias.
            </p>
          </div>
          <div className="relative mt-10 flex items-end justify-between gap-6">
            <p className="max-w-[25ch] border-l-2 border-amauti/70 pl-4 text-[1rem] leading-relaxed text-[#d0deea]">
              {message}
            </p>
            <div
              aria-hidden="true"
              className="shrink-0 rounded-t-[5rem] bg-[#24465c] px-9 pt-8"
            >
              <MascotFigure pose={pose} className="h-[225px] w-[158px]" />
            </div>
          </div>
          <div
            className="pointer-events-none absolute right-0 bottom-0 left-0 h-8 border-t border-white/10"
            aria-hidden="true"
          />
        </section>
        <div className="flex items-center justify-center px-5 py-12 sm:px-10 lg:py-16">
          <div className="w-full max-w-[420px]">
            <div className="mb-8 flex items-center gap-4 lg:hidden">
              <MascotFigure
                pose={pose}
                className="h-[75px] w-[53px] shrink-0"
              />
              <p className="max-w-[32ch] text-[0.9375rem] leading-relaxed text-muted">
                {message}
              </p>
            </div>
            {children}
          </div>
        </div>
      </main>
      <footer className="border-t border-line bg-canvas px-5 py-4 text-center text-[0.875rem] leading-relaxed text-muted">
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
    <Frame
      pose={error ? 'surprised' : busy ? 'thinking' : 'greeting'}
      message={
        error
          ? 'Uy, no pude entrar. Revisa tu DNI y tu contraseña.'
          : '¡Hola! Soy Amauti. Ingresa y te muestro cómo funciona todo.'
      }
    >
      <div className="mb-6">
        <h1 className="page-heading">Ingresa a tu cuenta</h1>
        <p className="page-description mt-3 text-[1rem] text-muted">
          Alerta temprana para la continuidad educativa: asistencia, casos y
          acompañamiento a las familias.
        </p>
      </div>
      <form onSubmit={submit} className="space-y-5">
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
          className="min-h-12 w-full"
        >
          Ingresar
        </Button>
        <p className="flex items-center gap-1.5 text-[0.875rem] text-faint">
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
    <Frame
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
    </Frame>
  );
}
