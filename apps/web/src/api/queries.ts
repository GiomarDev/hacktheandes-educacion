import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, seg } from './client';
import type {
  Alert,
  AlertStatus,
  AttendanceStatus,
  CaseDetail,
  CaseRecord,
  Enrollment,
  IndicatorValue,
  Report,
  School,
  Section,
  StudentSummary,
} from './types';

const qs = (params: Record<string, string | number | undefined | null>) => {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  );
  return entries.length
    ? `?${new URLSearchParams(entries.map(([k, v]) => [k, String(v)]))}`
    : '';
};

// SIAGIE
export const useSchools = (ugelId?: string) =>
  useQuery({
    queryKey: ['schools', ugelId],
    queryFn: () => apiFetch<School[]>('siagie', `/schools${qs({ ugelId })}`),
  });
export const useSchool = (id?: string) =>
  useQuery({
    queryKey: ['school', id],
    queryFn: () => apiFetch<School>('siagie', `/schools/${seg(id)}`),
    enabled: !!id,
  });
export const useSections = (
  params: { schoolId?: string; year?: number } = {},
) =>
  useQuery({
    queryKey: ['sections', params],
    queryFn: () => apiFetch<Section[]>('siagie', `/sections${qs(params)}`),
  });
export const useSectionStudents = (sectionId?: string) =>
  useQuery({
    queryKey: ['section-students', sectionId],
    queryFn: () =>
      apiFetch<Enrollment[]>('siagie', `/sections/${seg(sectionId)}/students`),
    enabled: !!sectionId,
  });
export const useStudentSummary = (id?: string) =>
  useQuery({
    queryKey: ['student-summary', id],
    queryFn: () =>
      apiFetch<StudentSummary>('siagie', `/students/${seg(id)}/summary`),
    enabled: !!id,
  });
export function useSaveAttendance() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      sectionId: string;
      date: string;
      records: {
        enrollmentId: string;
        status: AttendanceStatus;
        justification?: string;
      }[];
    }) => apiFetch('siagie', '/attendance/bulk', { method: 'POST', body }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['attendance-day'] }),
  });
}

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
export function useCaseAction(caseId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: { type: string; notes: string; status?: string }) =>
      apiFetch('alerta', `/cases/${seg(caseId)}/actions`, { method: 'POST', body }),
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
    onSuccess: () => client.invalidateQueries({ queryKey: ['reports'] }),
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
