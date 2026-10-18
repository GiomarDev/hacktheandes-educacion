import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, seg } from '@/shared/api/client';
import { qs } from '@/shared/api/query-string';
import { notifyMascot } from '@/features/mascot/events';
import type { MonitoringVisit } from './types';

export const useVisits = (params: { schoolId?: string; year?: number }) =>
  useQuery({
    queryKey: ['visits', params],
    queryFn: () =>
      apiFetch<MonitoringVisit[]>(
        'simon',
        `/monitoring-visits${qs({ limit: 100, ...params })}`,
      ),
  });

export function useCreateVisit() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      schoolId: string;
      sectionId: string;
      observedTeacherUserId: string;
      visitedAt: string;
      protocolVersion: string;
    }) =>
      apiFetch<MonitoringVisit>('simon', '/monitoring-visits', {
        method: 'POST',
        body,
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['visits'] }),
  });
}

export function useUpdateVisit() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string;
      status: 'DONE' | 'FEEDBACK_GIVEN';
      observations?: string;
      feedback?: string;
      improvementCommitment?: string;
    }) =>
      apiFetch<MonitoringVisit>('simon', `/monitoring-visits/${seg(id)}`, {
        method: 'PATCH',
        body,
      }),
    onSuccess: (visit) => {
      if (visit.status === 'FEEDBACK_GIVEN')
        notifyMascot(
          'activity:completed',
          'Devolución registrada. ¡Gracias por acompañar!',
        );
      return client.invalidateQueries({ queryKey: ['visits'] });
    },
  });
}
