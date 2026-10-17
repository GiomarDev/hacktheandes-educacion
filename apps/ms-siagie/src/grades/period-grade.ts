export type LiteralGradeValue = 'AD' | 'A' | 'B' | 'C';
export type AttendanceStatusValue = 'PRESENT' | 'ABSENT' | 'LATE' | 'JUSTIFIED' | 'LEFT_EARLY';

export const CALCULATION_METHOD = 'MODE_RECENT_TIEBREAK';

// Regla provisional (la oficial está por validar): gana la nota más frecuente;
// si hay empate, la de la columna más reciente entre las empatadas. Las columnas vacías no cuentan.
export function calculatePeriodGrade(
  entries: { columnNumber: number; value: LiteralGradeValue | null }[],
): LiteralGradeValue | null {
  const stats = new Map<LiteralGradeValue, { count: number; lastColumn: number }>();
  for (const { columnNumber, value } of entries) {
    if (!value) continue;
    const s = stats.get(value) ?? { count: 0, lastColumn: 0 };
    stats.set(value, { count: s.count + 1, lastColumn: Math.max(s.lastColumn, columnNumber) });
  }
  let best: { value: LiteralGradeValue; count: number; lastColumn: number } | null = null;
  for (const [value, s] of stats) {
    if (!best || s.count > best.count || (s.count === best.count && s.lastColumn > best.lastColumn)) {
      best = { value, ...s };
    }
  }
  return best?.value ?? null;
}

const ATTENDED: AttendanceStatusValue[] = ['PRESENT', 'LATE', 'LEFT_EARLY'];

export function calculateAttendanceRate(statuses: AttendanceStatusValue[]): number {
  if (!statuses.length) return 0;
  const attended = statuses.filter((s) => ATTENDED.includes(s)).length;
  return Math.round((attended / statuses.length) * 10000) / 100;
}
