import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, seg } from '@/shared/api/client';
import { qs } from '@/shared/api/query-string';
import { notifyMascot } from '@/features/mascot/events';
import type { Report } from './types';

// SIMON
export const useReports = (params: { schoolId?: string; year?: number } = {}) =>
  useQuery({
    queryKey: ['reports', params],
    queryFn: () =>
      apiFetch<Report[]>('simon', `/reports${qs({ limit: 100, ...params })}`),
  });

export function useGenerateReport() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      schoolId: string;
      year: number;
      type: string;
      month?: number;
      periodId?: string;
    }) =>
      apiFetch<Report>('simon', '/reports/generate', { method: 'POST', body }),
    onSuccess: () => {
      notifyMascot(
        'report:completed',
        'Reporte listo con los datos registrados.',
      );
      return client.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useReportTransition() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      action,
      ...body
    }: {
      id: string;
      action: 'submit' | 'review';
      revision: number;
      status?: 'REVIEWED' | 'OBSERVED';
      notes?: string;
    }) =>
      apiFetch<Report>('simon', `/reports/${seg(id)}/${action}`, {
        method: 'POST',
        body,
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['reports'] }),
  });
}
