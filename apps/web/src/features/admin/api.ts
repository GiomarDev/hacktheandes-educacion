import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, seg } from '@/shared/api/client';
import { qs } from '@/shared/api/query-string';
import type { Role } from '@/features/auth/roles';
import type { UserAccount } from './types';

// AUTH: cuentas por ámbito (dirección su IE; UGEL, DRE y MINEDU su territorio)
export type UserScope = { schoolId?: string; ugelId?: string; dreId?: string };

export const useUsers = (scope: UserScope, enabled = true) =>
  useQuery({
    queryKey: ['users', scope],
    queryFn: () => apiFetch<UserAccount[]>('auth', `/users${qs(scope)}`),
    enabled: enabled && !!(scope.schoolId || scope.ugelId || scope.dreId),
  });

export function useCreateUser() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({
      grant,
      ...body
    }: {
      documentType: 'DNI' | 'CE' | 'PASSPORT';
      documentNumber: string;
      firstName: string;
      lastName: string;
      email?: string;
      temporaryPassword: string;
      grant: { role: Role } & UserScope;
    }) => {
      const created = await apiFetch<{ id: string }>('auth', '/users', {
        method: 'POST',
        body,
      });
      await apiFetch('auth', `/users/${seg(created.id)}/roles`, {
        method: 'POST',
        body: grant,
      });
      return created;
    },
    onSettled: () => client.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useGrantRole() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      ...body
    }: { userId: string; role: Role } & UserScope) =>
      apiFetch('auth', `/users/${seg(userId)}/roles`, { method: 'POST', body }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useRevokeRole() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      apiFetch('auth', `/users/${seg(userId)}/roles/${seg(roleId)}`, {
        method: 'DELETE',
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['users'] }),
  });
}

// Celular del personal: lo edita quien administra sus roles (dirección, UGEL o MINEDU).
export function useUpdatePhone() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, phone }: { userId: string; phone: string }) =>
      apiFetch<{ id: string; phone: string }>(
        'auth',
        `/users/${seg(userId)}/phone`,
        {
          method: 'PATCH',
          body: { phone },
        },
      ),
    onSuccess: () => client.invalidateQueries({ queryKey: ['users'] }),
  });
}
