import type { RiskSection } from '@app/common';
import {
  addBusinessDays,
  DEFAULT_RULES,
  evaluateRules,
  paramsError,
  schoolDays,
} from './risk-rules.js';

const section = (): RiskSection => ({
  id: 'section',
  year: 2026,
  tutorUserId: 'tutor',
  auxiliarUserId: null,
  school: {
    id: 'school',
    ugelId: 'ugel',
    dreId: 'dre',
    hasPsychologist: false,
    attentionGoal: 1,
  },
  students: [
    {
      studentId: 'student',
      enrollmentId: 'enrollment',
      attendance: [],
      grades: [],
      exits: [],
    },
  ],
});
const rule = (type: string) => {
  const r = DEFAULT_RULES.find((r) => r.type === type)!;
  return { ...r, id: r.code, schoolId: null };
};

describe('reglas y plazos de intervención', () => {
  it('la ventana escolar omite sábados y domingos', () =>
    expect(schoolDays('2026-10-19', 3)).toEqual([
      '2026-10-15',
      '2026-10-16',
      '2026-10-19',
    ]));
  it('dos días hábiles desde el viernes vencen el martes a la misma hora de Lima', () =>
    expect(
      addBusinessDays(new Date('2026-10-16T23:00:00Z')).toISOString(),
    ).toBe('2026-10-20T23:00:00.000Z'));
  it('dos días hábiles desde el viernes a las 23:30 de Lima no cuentan el sábado UTC', () =>
    expect(
      addBusinessDays(new Date('2026-10-17T04:30:00Z')).toISOString(),
    ).toBe('2026-10-21T04:30:00.000Z'));
  it('tres faltas diarias disparan y las listas por hora no aumentan el contador', () => {
    const s = section();
    s.students[0].attendance = ['13', '14', '16'].map((d) => ({
      date: `2026-10-${d}`,
      status: 'ABSENT',
      classSessionId: null,
    }));
    expect(
      evaluateRules([s], [rule('ABSENCES_IN_WINDOW')], '2026-10-16', false),
    ).toHaveLength(1);
    s.students[0].attendance[2].classSessionId = 'hour';
    expect(
      evaluateRules([s], [rule('ABSENCES_IN_WINDOW')], '2026-10-16', false),
    ).toHaveLength(0);
  });
  it('justificadas no cuentan como faltas y la regla se limita a su IE', () => {
    const s = section();
    s.students[0].attendance = ['14', '15', '16'].map((d) => ({
      date: `2026-10-${d}`,
      status: 'JUSTIFIED',
      classSessionId: null,
    }));
    expect(
      evaluateRules([s], [rule('ABSENCES_IN_WINDOW')], '2026-10-16', false),
    ).toHaveLength(0);
    expect(
      evaluateRules(
        [s],
        [{ ...rule('SECTION_SILENT'), schoolId: 'other' }],
        '2026-10-16',
        true,
      ),
    ).toHaveLength(0);
  });
  it('la consecutividad requiere los tres días escolares efectivamente reportados', () => {
    const s = section();
    s.students[0].attendance = ['14', '15', '16'].map((d) => ({
      date: `2026-10-${d}`,
      status: 'ABSENT',
      classSessionId: null,
    }));
    expect(
      evaluateRules([s], [rule('CONSECUTIVE_ABSENCES')], '2026-10-16', false),
    ).toHaveLength(1);
    expect(
      evaluateRules([s], [rule('CONSECUTIVE_ABSENCES')], '2026-10-19', false),
    ).toHaveLength(0);
  });
  it('el silencio no se evalúa antes del corte ni en fin de semana', () => {
    expect(
      evaluateRules([section()], [rule('SECTION_SILENT')], '2026-10-16', false),
    ).toHaveLength(0);
    expect(
      evaluateRules([section()], [rule('SECTION_SILENT')], '2026-10-16', true),
    ).toHaveLength(1);
    expect(
      evaluateRules([section()], [rule('SECTION_SILENT')], '2026-10-17', true),
    ).toHaveLength(0);
  });
  it('una nota aprobatoria con baja asistencia y salida sin registro generan evidencia', () => {
    const s = section();
    s.students[0].grades = [
      { id: 'g', value: 'A', attendanceRate: 25, periodId: 'p' },
    ];
    s.students[0].attendance = [
      { date: '2026-10-16', status: 'LEFT_EARLY', classSessionId: 'hour' },
    ];
    expect(
      evaluateRules(
        [s],
        [rule('GRADE_WITHOUT_ATTENDANCE'), rule('LEFT_WITHOUT_EXIT')],
        '2026-10-16',
        false,
      ),
    ).toHaveLength(2);
    s.students[0].exits = ['2026-10-16'];
    expect(
      evaluateRules([s], [rule('LEFT_WITHOUT_EXIT')], '2026-10-16', false),
    ).toHaveLength(0);
  });
  it('rechaza parámetros desconocidos, negativos y ventanas menores al umbral', () => {
    expect(
      paramsError('LATE_COUNT', { count: 3, windowSchoolDays: 2 }),
    ).not.toBeNull();
    expect(
      paramsError('LATE_COUNT', { count: -1, windowSchoolDays: 10 }),
    ).not.toBeNull();
    expect(paramsError('SECTION_SILENT', { surprise: true })).not.toBeNull();
  });
  it('detecta tardanzas repetidas sin sumar otras marcas', () => {
    const s = section();
    s.students[0].attendance = ['14', '15', '16'].map((d) => ({
      date: `2026-10-${d}`,
      status: 'LATE',
      classSessionId: null,
    }));
    expect(
      evaluateRules([s], [rule('LATE_COUNT')], '2026-10-16', false),
    ).toHaveLength(1);
    s.students[0].attendance[0].status = 'PRESENT';
    expect(
      evaluateRules([s], [rule('LATE_COUNT')], '2026-10-16', false),
    ).toHaveLength(0);
  });
  it('la brecha de meta requiere las listas completas de todas las secciones', () => {
    const a = section();
    const b = section();
    b.id = 'section-b';
    b.students[0].studentId = 'student-b';
    a.school.attentionGoal = 2;
    b.school.attentionGoal = 2;
    a.students[0].attendance = [
      { date: '2026-10-16', status: 'PRESENT', classSessionId: null },
    ];
    expect(
      evaluateRules([a, b], [rule('ATTENTION_GOAL_GAP')], '2026-10-16', true),
    ).toHaveLength(0);
    b.students[0].attendance = [
      { date: '2026-10-16', status: 'ABSENT', classSessionId: null },
    ];
    expect(
      evaluateRules([a, b], [rule('ATTENTION_GOAL_GAP')], '2026-10-16', true)[0]
        .data,
    ).toMatchObject({ present: 1, goal: 2, gap: 1 });
  });
});
