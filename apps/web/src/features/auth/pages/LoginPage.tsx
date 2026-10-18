import { useState } from 'react';
import type { FormEvent } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthProvider';
import { Button, ErrorNote, Field, inputClass } from '@/shared/ui/kit';
import { AuthFrame } from '@/features/auth/components/AuthFrame';

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
    <AuthFrame
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
    </AuthFrame>
  );
}
