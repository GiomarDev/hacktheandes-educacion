import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/shared/api/client';
import { qs } from '@/shared/api/query-string';
import type { IndicatorValue } from './types';

// ESCALE
export const useIndicators = (params: {
  code?: string;
  geo_level?: string;
  geo_code?: string;
  period?: string;
  dimension?: string;
}) =>
  useQuery({
    queryKey: ['indicators', params],
    queryFn: () =>
      apiFetch<IndicatorValue[]>('escale', `/indicators${qs(params)}`),
    staleTime: 5 * 60_000,
  });
