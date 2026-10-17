import { calculateAttendanceRate, calculatePeriodGrade } from './period-grade.js';

const cols = (...values: (('AD' | 'A' | 'B' | 'C') | null)[]) =>
  values.map((value, i) => ({ columnNumber: i + 1, value }));

describe('calculatePeriodGrade', () => {
  it('gana la nota más frecuente', () => {
    expect(calculatePeriodGrade(cols('A', 'A', 'B'))).toBe('A');
  });

  it('en empate gana la columna más reciente', () => {
    expect(calculatePeriodGrade(cols('A', 'B'))).toBe('B');
    expect(calculatePeriodGrade(cols('C', 'B', 'B', 'C'))).toBe('C');
  });

  it('ignora las columnas vacías', () => {
    expect(calculatePeriodGrade(cols('AD', null, 'AD', 'C'))).toBe('AD');
  });

  it('sin notas devuelve null', () => {
    expect(calculatePeriodGrade(cols(null, null))).toBeNull();
    expect(calculatePeriodGrade([])).toBeNull();
  });

  it('no depende del orden en que llegan las columnas', () => {
    expect(calculatePeriodGrade([{ columnNumber: 2, value: 'B' }, { columnNumber: 1, value: 'A' }])).toBe('B');
  });
});

describe('calculateAttendanceRate', () => {
  it('cuenta presente, tarde y retiro anticipado como asistencia', () => {
    expect(calculateAttendanceRate(['PRESENT', 'ABSENT', 'LATE', 'JUSTIFIED'])).toBe(50);
    expect(calculateAttendanceRate(['LEFT_EARLY', 'ABSENT', 'ABSENT'])).toBe(33.33);
  });

  it('sin registros devuelve 0', () => {
    expect(calculateAttendanceRate([])).toBe(0);
  });
});
