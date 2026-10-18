import { useCallback, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../api/client';
import type { Role } from '../auth/roles';
import { useMascot } from '../mascot/MascotProvider';

type Onboarding = { completedRoles: Role[] };

// El recorrido se muestra solo la primera vez que alguien entra con un rol.
// Si ms-auth no responde, no se muestra (nunca bloquea el trabajo).
export function useOnboarding(role: Role) {
  const client = useQueryClient();
  const mascot = useMascot();
  const status = useQuery({
    queryKey: ['onboarding'],
    queryFn: () => apiFetch<Onboarding>('auth', '/auth/onboarding'),
    staleTime: Infinity,
    retry: false,
  });
  const save = useMutation({
    mutationFn: () =>
      apiFetch<Onboarding>('auth', '/auth/onboarding', {
        method: 'POST',
        body: { role },
      }),
    onSuccess: (data) => client.setQueryData(['onboarding'], data),
  });
  const [open, setOpen] = useState(false);
  const pending = !!status.data && !status.data.completedRoles.includes(role);

  useEffect(() => {
    if (pending) setOpen(true);
  }, [pending, role]);

  useEffect(() => {
    mascot.suspend(open);
  }, [open, mascot]);

  const start = useCallback(() => setOpen(true), []);
  const finish = useCallback(
    (completed: boolean) => {
      setOpen(false);
      if (pending) save.mutate();
      if (completed) {
        mascot.setVisible(true);
        // Espera a que la mascota vuelva a la pantalla antes de celebrar.
        window.setTimeout(
          () => mascot.celebrate('¡Listo! Si me necesitas, aquí estaré.'),
          400,
        );
      }
    },
    [pending, save, mascot],
  );

  return { open, start, finish };
}
