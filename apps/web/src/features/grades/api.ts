import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, seg } from '@/shared/api/client';
import { qs } from '@/shared/api/query-string';
import type { GradeSheet, LiteralGrade } from './types';

export const useGradeSheet = (params: {
  sectionId?: string;
  areaId?: string;
  periodId?: string;
}) =>
  useQuery({
    queryKey: ['grade-sheet', params],
    queryFn: () =>
      apiFetch<GradeSheet>(
        'siagie',
        `/grades${qs({
          sectionId: seg(params.sectionId),
          areaId: seg(params.areaId),
          periodId: seg(params.periodId),
        })}`,
      ),
    enabled: !!(params.sectionId && params.areaId && params.periodId),
  });

export function useRecordGrade() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      enrollmentId: string;
      competencyId: string;
      periodId: string;
      columnNumber: number;
      value: LiteralGrade | null;
    }) => apiFetch('siagie', '/grades/entries', { method: 'POST', body }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['grade-sheet'] }),
  });
}
