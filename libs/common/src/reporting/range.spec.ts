import { reportingRange } from './range.js';
describe('rango civil de los reportes', () => {
  it('incluye el último día completo en Lima y usa DATE para asistencia', () => {
    const range = reportingRange('2026-03-01', '2026-03-31');
    expect(range.timestamps.gte.toISOString()).toBe('2026-03-01T05:00:00.000Z');
    expect(range.timestamps.lt.toISOString()).toBe('2026-04-01T05:00:00.000Z');
    expect(range.dates.lte.toISOString()).toBe('2026-03-31T00:00:00.000Z');
  });
  it.each([
    ['2026-02-30', '2026-03-01'],
    ['2026-03-02', '2026-03-01'],
    ['2025-12-31', '2026-01-01'],
    ['no', 'no'],
  ])('rechaza %s a %s', (from, to) =>
    expect(() => reportingRange(from, to)).toThrow(),
  );
});
