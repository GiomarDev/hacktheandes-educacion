import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, seg } from '@/shared/api/client';
import { qs } from '@/shared/api/query-string';
import type {
  Alert,
  AlertStatus,
  CaseDetail,
  CaseRecord,
  RiskRule,
} from './types';

// ALERTA
export const useAlerts = (
  params: { schoolId?: string; status?: AlertStatus; limit?: number } = {},
) =>
  useQuery({
    queryKey: ['alerts', params],
    queryFn: () =>
      apiFetch<Alert[]>('alerta', `/alerts${qs({ limit: 100, ...params })}`),
  });

export const useCases = (params: { schoolId?: string; status?: string } = {}) =>
  useQuery({
    queryKey: ['cases', params],
    queryFn: () =>
      apiFetch<CaseRecord[]>(
        'alerta',
        `/cases${qs({ limit: 100, ...params })}`,
      ),
  });

export const useCase = (id?: string) =>
  useQuery({
    queryKey: ['case', id],
    queryFn: () => apiFetch<CaseDetail>('alerta', `/cases/${seg(id)}`),
    enabled: !!id,
  });

export function useUpdateAlert() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AlertStatus }) =>
      apiFetch<Alert>('alerta', `/alerts/${seg(id)}`, {
        method: 'PATCH',
        body: { status },
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['alerts'] }),
  });
}

export const useRules = () =>
  useQuery({
    queryKey: ['rules'],
    queryFn: () => apiFetch<RiskRule[]>('alerta', '/rules'),
  });

export function useUpdateRule() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string;
      params?: Record<string, number>;
      severity?: string;
      isActive?: boolean;
    }) =>
      apiFetch<RiskRule>('alerta', `/rules/${seg(id)}`, {
        method: 'PATCH',
        body,
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['rules'] }),
  });
}

export function useCaseAction(caseId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: { type: string; notes: string; status?: string }) =>
      apiFetch('alerta', `/cases/${seg(caseId)}/actions`, {
        method: 'POST',
        body,
      }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['case', caseId] });
      void client.invalidateQueries({ queryKey: ['cases'] });
      void client.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}

export function useSendMessage(caseId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: { requestId: string; body?: string }) =>
      apiFetch('alerta', `/cases/${seg(caseId)}/send-message`, {
        method: 'POST',
        body,
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['case', caseId] }),
  });
}
