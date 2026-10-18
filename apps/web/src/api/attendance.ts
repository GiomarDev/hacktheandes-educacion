import { useQueries, useQuery } from '@tanstack/react-query';
import { apiFetch, seg } from './client';
import type { AttendanceStatus, Enrollment, Section } from './types';

export interface AttendanceMark {
  enrollmentId: string;
  date: string;
  status: AttendanceStatus;
}

export const attendanceRangeQuery = (
  sectionId: string,
  from: string,
  to: string,
) => ({
  queryKey: ['attendance-day', sectionId, from, to],
  queryFn: () =>
    apiFetch<AttendanceMark[]>(
      'siagie',
      `/attendance?${new URLSearchParams({ sectionId, from, to })}`,
    ),
});

// Nómina y asistencia de varias secciones a la vez (portal docente).
export function useSectionsData(sections: Section[], from: string, to: string) {
  const rosters = useQueries({
    queries: sections.map((s) => ({
      queryKey: ['section-students', s.id],
      queryFn: () =>
        apiFetch<Enrollment[]>('siagie', `/sections/${seg(s.id)}/students`),
    })),
  });
  const attendance = useQueries({
    queries: sections.map((s) => attendanceRangeQuery(s.id, from, to)),
  });
  return { rosters, attendance };
}

export function attendanceRate(marks: AttendanceMark[]): number | null {
  if (!marks.length) return null;
  const attended = marks.filter(
    (m) =>
      m.status === 'PRESENT' ||
      m.status === 'LATE' ||
      m.status === 'LEFT_EARLY',
  ).length;
  return (100 * attended) / marks.length;
}

// Nombres de los estudiantes de las secciones a cargo (los servicios de alertas solo guardan IDs).
export function useStudentNames(): Map<string, Enrollment> {
  const year = Number(
    new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' })
      .format(new Date())
      .slice(0, 4),
  );
  const sections = useQuery({
    queryKey: ['sections', { year }],
    queryFn: () => apiFetch<Section[]>('siagie', `/sections?year=${year}`),
  });
  const rosters = useQueries({
    queries: (sections.data ?? []).map((s) => ({
      queryKey: ['section-students', s.id],
      queryFn: () =>
        apiFetch<Enrollment[]>('siagie', `/sections/${seg(s.id)}/students`),
    })),
  });
  const names = new Map<string, Enrollment>();
  rosters.forEach((r) => r.data?.forEach((e) => names.set(e.studentId, e)));
  return names;
}
