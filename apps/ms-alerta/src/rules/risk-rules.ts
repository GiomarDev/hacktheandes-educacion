import { createHash } from 'node:crypto';
import { dateOnly } from '@app/common';
import type { RiskSection } from '@app/common';

export const DEFAULT_RULES = [
  {
    code: 'ABSENCES_3_IN_10',
    type: 'ABSENCES_IN_WINDOW',
    params: { count: 3, windowSchoolDays: 10 },
    severity: 'HIGH',
  },
  {
    code: 'CONSECUTIVE_ABSENCES_3',
    type: 'CONSECUTIVE_ABSENCES',
    params: { count: 3, windowSchoolDays: 10 },
    severity: 'HIGH',
  },
  {
    code: 'LATE_3_IN_10',
    type: 'LATE_COUNT',
    params: { count: 3, windowSchoolDays: 10 },
    severity: 'MEDIUM',
  },
  {
    code: 'SECTION_SILENT',
    type: 'SECTION_SILENT',
    params: {},
    severity: 'MEDIUM',
  },
  {
    code: 'GRADE_LOW_ATTENDANCE',
    type: 'GRADE_WITHOUT_ATTENDANCE',
    params: { minAttendanceRate: 50 },
    severity: 'HIGH',
  },
  {
    code: 'LEFT_WITHOUT_EXIT',
    type: 'LEFT_WITHOUT_EXIT',
    params: {},
    severity: 'MEDIUM',
  },
  {
    code: 'ATTENTION_GOAL_GAP',
    type: 'ATTENTION_GOAL_GAP',
    params: { minGap: 1 },
    severity: 'MEDIUM',
  },
] as const;

export interface RuleInput {
  id: string;
  type: string;
  params: unknown;
  severity: string;
  schoolId: string | null;
}
export interface Signal {
  ruleId: string;
  type:
    | 'ABSENCE_PATTERN'
    | 'SECTION_SILENT'
    | 'GRADE_WITHOUT_ATTENDANCE'
    | 'LEFT_WITHOUT_EXIT'
    | 'ATTENTION_GOAL_GAP';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  section: RiskSection;
  studentId?: string;
  data: Record<string, string | number | string[]>;
  dedupeKey: string;
}

export function schoolDays(end: string, count: number): string[] {
  const day = dateOnly(end);
  const days: string[] = [];
  while (days.length < count) {
    if (day.getUTCDay() !== 0 && day.getUTCDay() !== 6)
      days.push(day.toISOString().slice(0, 10));
    day.setUTCDate(day.getUTCDate() - 1);
  }
  return days.reverse();
}

export function addBusinessDays(now: Date, days = 2): Date {
  const result = new Date(now);
  for (let n = 0; n < days;) {
    result.setUTCDate(result.getUTCDate() + 1);
    const weekday = new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      timeZone: 'America/Lima',
    }).format(result);
    if (weekday !== 'Sat' && weekday !== 'Sun') n++;
  }
  return result;
}

export function paramsError(type: string, params: unknown): string | null {
  if (!params || typeof params !== 'object' || Array.isArray(params))
    return 'params debe ser un objeto';
  const p = params as Record<string, unknown>;
  const limits: Record<string, [number, number]> = [
    'ABSENCES_IN_WINDOW',
    'CONSECUTIVE_ABSENCES',
    'LATE_COUNT',
  ].includes(type)
    ? { count: [1, 60], windowSchoolDays: [1, 60] }
    : type === 'GRADE_WITHOUT_ATTENDANCE'
      ? { minAttendanceRate: [0, 100] }
      : type === 'ATTENTION_GOAL_GAP'
        ? { minGap: [1, 10000] }
        : {};
  if (Object.keys(p).some((key) => !Object.hasOwn(limits, key)))
    return 'Parámetro desconocido para esta regla';
  for (const [key, [min, max]] of Object.entries(limits)) {
    if (
      !Number.isInteger(p[key]) ||
      Number(p[key]) < min ||
      Number(p[key]) > max
    )
      return `${key} fuera de rango`;
  }
  if ('count' in p && Number(p.count) > Number(p.windowSchoolDays))
    return 'count no puede superar windowSchoolDays';
  return null;
}

export function evaluateRules(
  sections: RiskSection[],
  rules: RuleInput[],
  date: string,
  evaluateSilence: boolean,
): Signal[] {
  const signals: Signal[] = [];
  const weekday = dateOnly(date).getUTCDay();
  const add = (
    rule: RuleInput,
    section: RiskSection,
    type: Signal['type'],
    episode: string,
    data: Signal['data'],
    studentId?: string,
  ) => {
    signals.push({
      ruleId: rule.id,
      type,
      severity: rule.severity as Signal['severity'],
      section,
      studentId,
      data,
      dedupeKey: createHash('sha256')
        .update(
          `${rule.id}:${section.school.id}:${studentId ?? section.id}:${episode}`,
        )
        .digest('hex'),
    });
  };
  for (const section of sections)
    for (const rule of rules) {
      if (rule.schoolId && rule.schoolId !== section.school.id) continue;
      if (paramsError(rule.type, rule.params)) continue;
      const p = rule.params as Record<string, number>;
      const days = schoolDays(date, p.windowSchoolDays ?? 10);
      const reported = section.students.some((s) =>
        s.attendance.some((a) => a.date === date && a.classSessionId === null),
      );
      if (
        rule.type === 'SECTION_SILENT' &&
        evaluateSilence &&
        weekday !== 0 &&
        weekday !== 6 &&
        section.students.length &&
        !reported
      ) {
        add(rule, section, 'SECTION_SILENT', date, { date });
      }
      for (const student of section.students) {
        const daily = student.attendance.filter(
          (a) => a.classSessionId === null && days.includes(a.date),
        );
        if (rule.type === 'ABSENCES_IN_WINDOW' || rule.type === 'LATE_COUNT') {
          const dates = daily
            .filter(
              (a) =>
                a.status === (rule.type === 'LATE_COUNT' ? 'LATE' : 'ABSENT'),
            )
            .map((a) => a.date)
            .sort();
          if (dates.length >= p.count)
            add(
              rule,
              section,
              'ABSENCE_PATTERN',
              `${section.year}:${dates[0]}`,
              { dates, count: dates.length },
              student.studentId,
            );
        }
        if (rule.type === 'CONSECUTIVE_ABSENCES') {
          const dates = schoolDays(date, p.count);
          if (
            weekday !== 0 &&
            weekday !== 6 &&
            dates.every((d) =>
              daily.some((a) => a.date === d && a.status === 'ABSENT'),
            )
          ) {
            // Identificar la racha completa, no volver a abrir cada día con la misma racha.
            let start = dates[0];
            for (const d of [...days].reverse().filter((d) => d < start)) {
              if (!daily.some((a) => a.date === d && a.status === 'ABSENT'))
                break;
              start = d;
            }
            add(
              rule,
              section,
              'ABSENCE_PATTERN',
              `${section.year}:${start}`,
              { dates },
              student.studentId,
            );
          }
        }
        if (rule.type === 'GRADE_WITHOUT_ATTENDANCE')
          for (const grade of student.grades) {
            if (
              (grade.value === 'AD' || grade.value === 'A') &&
              grade.attendanceRate < p.minAttendanceRate
            ) {
              add(
                rule,
                section,
                'GRADE_WITHOUT_ATTENDANCE',
                grade.id,
                {
                  gradeId: grade.id,
                  value: grade.value,
                  attendanceRate: grade.attendanceRate,
                },
                student.studentId,
              );
            }
          }
        if (
          rule.type === 'LEFT_WITHOUT_EXIT' &&
          student.attendance.some(
            (a) => a.date === date && a.status === 'LEFT_EARLY',
          ) &&
          !student.exits.includes(date)
        ) {
          add(
            rule,
            section,
            'LEFT_WITHOUT_EXIT',
            date,
            { date },
            student.studentId,
          );
        }
      }
    }
  for (const schoolId of new Set(sections.map((s) => s.school.id))) {
    const group = sections.filter((s) => s.school.id === schoolId);
    const [first] = group;
    if (!group.some((section) => section.students.length)) continue;
    const allReported = group.every(
      (s) =>
        !s.students.length ||
        s.students.every((e) =>
          e.attendance.some(
            (a) => a.date === date && a.classSessionId === null,
          ),
        ),
    );
    for (const rule of rules.filter(
      (r) =>
        r.type === 'ATTENTION_GOAL_GAP' &&
        (!r.schoolId || r.schoolId === schoolId),
    )) {
      if (paramsError(rule.type, rule.params)) continue;
      const present = group
        .flatMap((s) => s.students)
        .filter((e) =>
          e.attendance.some(
            (a) =>
              a.date === date &&
              a.classSessionId === null &&
              ['PRESENT', 'LATE', 'LEFT_EARLY'].includes(a.status),
          ),
        ).length;
      const gap = first.school.attentionGoal - present;
      if (
        evaluateSilence &&
        allReported &&
        weekday !== 0 &&
        weekday !== 6 &&
        gap >= (rule.params as { minGap: number }).minGap
      ) {
        add(rule, first, 'ATTENTION_GOAL_GAP', date, {
          date,
          present,
          goal: first.school.attentionGoal,
          gap,
        });
      }
    }
  }
  return signals;
}
