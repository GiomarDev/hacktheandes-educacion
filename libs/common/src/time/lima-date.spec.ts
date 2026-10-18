import { dateOnly, todayInLima } from './lima-date.js';

describe('fechas sin hora', () => {
  it('todayInLima devuelve YYYY-MM-DD', () => {
    expect(todayInLima()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('dateOnly crea la fecha a medianoche UTC', () => {
    expect(dateOnly('2026-04-06').toISOString()).toBe('2026-04-06T00:00:00.000Z');
  });
});
