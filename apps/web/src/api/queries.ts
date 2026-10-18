import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, seg } from './client';
import type { Role } from '../auth/roles';
import { notifyMascot } from '../mascot/events';
import type {
  Alert,
  AlertStatus,
  AttendanceStatus,
  CaseDetail,
  CaseRecord,
  AcademicPeriod,
  Enrollment,
  GradeSheet,
  IndicatorValue,
  LiteralGrade,
  MonitoringVisit,
  RiskRule,
  SupportPlan,
  SupportPlanDetail,
  UserAccount,
  Report,
  School,
  Section,
  SectionArea,
  StudentSummary,
  DocumentStatus,
  GeneratedDocument,
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
    onSuccess: () => {
      notifyMascot('activity:completed', '¡Asistencia guardada! Buen trabajo.');
      return client.invalidateQueries({ queryKey: ['attendance-day'] });
    },
  });
}

export const useSchoolPeriods = (schoolId?: string, year?: number) =>
  useQuery({
    queryKey: ['periods', schoolId, year],
    queryFn: () =>
      apiFetch<AcademicPeriod[]>(
        'siagie',
        `/schools/${seg(schoolId)}/periods${qs({ year })}`,
      ),
    enabled: !!schoolId,
    staleTime: 10 * 60_000,
  });
export const useSectionAreas = (sectionId?: string) =>
  useQuery({
    queryKey: ['section-areas', sectionId],
    queryFn: () =>
      apiFetch<SectionArea[]>('siagie', `/sections/${seg(sectionId)}/areas`),
    enabled: !!sectionId,
  });
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

// DOCUMENTOS (SIMON): papeleo generado desde WhatsApp y su revisión.
export const useDocuments = (status?: DocumentStatus) =>
  useQuery({
    queryKey: ['documents', status],
    queryFn: () =>
      apiFetch<GeneratedDocument[]>('simon', `/documents${qs({ status })}`),
  });
export function useReviewDocument() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: 'APPROVED' | 'REJECTED';
    }) =>
      apiFetch<GeneratedDocument>('simon', `/documents/${seg(id)}/review`, {
        method: 'POST',
        body: { status },
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['documents'] }),
  });
}
export function useDocumentCorrection() {
  const client = useQueryClient();
  return useMutation({
    // Aún no se sube el contenido: solo se registran nombre, tipo y tamaño del archivo.
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      apiFetch<GeneratedDocument>('simon', `/documents/${seg(id)}/correction`, {
        method: 'POST',
        body: {
          fileName: file.name,
          mimeType: file.type || 'application/octet-stream',
          sizeBytes: file.size,
        },
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['documents'] }),
  });
}
