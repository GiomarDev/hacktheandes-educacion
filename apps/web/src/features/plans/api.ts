import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, seg } from '@/shared/api/client';
import { qs } from '@/shared/api/query-string';
import { notifyMascot } from '@/features/mascot/events';
import type { SupportPlan, SupportPlanDetail } from './types';

type PlanContent = { barriers: string; strengths?: string; diagnosis?: string };

type VersionContent = {
  goals: string[];
  adjustments: string[];
  strategies: string[];
  progressNotes?: string;
};

export const usePlans = (params: { schoolId?: string; year?: number }) =>
  useQuery({
    queryKey: ['plans', params],
    queryFn: () =>
      apiFetch<SupportPlan[]>(
        'simon',
        `/support-plans${qs({ limit: 100, ...params })}`,
      ),
  });

// Cada lectura con diagnóstico queda auditada: no se recarga sola al volver a la pestaña.
export const usePlan = (id?: string) =>
  useQuery({
    queryKey: ['plan', id],
    queryFn: () =>
      apiFetch<SupportPlanDetail>('simon', `/support-plans/${seg(id)}`),
    enabled: !!id,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

function usePlanMutation<T, R = unknown>(fn: (body: T) => Promise<R>) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['plans'] });
      void client.invalidateQueries({ queryKey: ['plan'] });
    },
  });
}

export const useCreatePlan = () =>
  usePlanMutation(
    (
      body: PlanContent & { schoolId: string; studentId: string; year: number },
    ) =>
      apiFetch<SupportPlan>('simon', '/support-plans', {
        method: 'POST',
        body,
      }),
  );

export const useUpdatePlan = (id: string) =>
  usePlanMutation((body: PlanContent) =>
    apiFetch('simon', `/support-plans/${seg(id)}`, { method: 'PATCH', body }),
  );

export const usePlanStatus = (id: string) =>
  usePlanMutation((status: 'ACTIVE' | 'ARCHIVED') =>
    apiFetch('simon', `/support-plans/${seg(id)}/status`, {
      method: 'PATCH',
      body: { status },
    }),
  );

export const useCreateVersion = (id: string) =>
  usePlanMutation((body: VersionContent & { periodId: string }) =>
    apiFetch('simon', `/support-plans/${seg(id)}/versions`, {
      method: 'POST',
      body,
    }),
  );

export const useUpdateVersion = (id: string) =>
  usePlanMutation(
    ({ versionId, ...body }: VersionContent & { versionId: string }) =>
      apiFetch(
        'simon',
        `/support-plans/${seg(id)}/versions/${seg(versionId)}`,
        { method: 'PATCH', body },
      ),
  );

export const useApproveVersion = (id: string) =>
  usePlanMutation(
    ({
      versionId,
      expectedUpdatedAt,
    }: {
      versionId: string;
      expectedUpdatedAt: string;
    }) =>
      apiFetch(
        'simon',
        `/support-plans/${seg(id)}/versions/${seg(versionId)}/approve`,
        { method: 'POST', body: { expectedUpdatedAt } },
      ).then((r) => {
        notifyMascot('activity:completed', 'Versión aprobada: el plan avanza.');
        return r;
      }),
  );
