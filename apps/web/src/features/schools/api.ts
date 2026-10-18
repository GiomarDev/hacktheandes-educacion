import { useQuery } from '@tanstack/react-query';
import { apiFetch, seg } from '@/shared/api/client';
import { qs } from '@/shared/api/query-string';
import type {
  AcademicPeriod,
  Enrollment,
  School,
  Section,
  SectionArea,
  StudentSummary,
} from './types';

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
