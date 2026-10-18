import { JobsService } from './jobs.service.js';
import type { StatsService } from './stats.service.js';

describe('JobsService', () => {
  afterEach(() => vi.useRealTimers());

  it('calcula una vez el día anterior en Lima y reintenta si hubo fallas', async () => {
    // 01:30 en Lima del 3 de marzo (06:30 UTC): el día anterior es el 2.
    vi.useFakeTimers({ now: new Date('2026-03-03T06:30:00Z') });
    const compute = vi
      .fn()
      .mockResolvedValueOnce({ failed: 1 })
      .mockResolvedValue({ failed: 0 });
    const job = new JobsService({ compute } as unknown as StatsService);
    await job.tick();
    await job.tick();
    await job.tick();
    expect(compute).toHaveBeenCalledTimes(2);
    expect(compute).toHaveBeenCalledWith('2026-03-02');
  });

  it('después de la medianoche reintenta el día que quedó con fallas', async () => {
    vi.useFakeTimers({ now: new Date('2026-03-03T06:30:00Z') });
    const compute = vi
      .fn()
      .mockResolvedValueOnce({ failed: 1 })
      .mockResolvedValue({ failed: 0 });
    const job = new JobsService({ compute } as unknown as StatsService);
    await job.tick();
    vi.setSystemTime(new Date('2026-03-04T06:30:00Z'));
    await job.tick();
    await job.tick();
    expect(compute.mock.calls.map(([d]) => d)).toEqual([
      '2026-03-02',
      '2026-03-02',
      '2026-03-03',
    ]);
  });

  it('un día que lanza un error también se reintenta al día siguiente', async () => {
    vi.useFakeTimers({ now: new Date('2026-03-03T06:30:00Z') });
    const compute = vi
      .fn()
      .mockRejectedValueOnce(new Error('caída'))
      .mockResolvedValue({ failed: 0 });
    const job = new JobsService({ compute } as unknown as StatsService);
    await job.tick();
    vi.setSystemTime(new Date('2026-03-04T06:30:00Z'));
    await job.tick();
    expect(compute.mock.calls.map(([d]) => d)).toEqual([
      '2026-03-02',
      '2026-03-02',
      '2026-03-03',
    ]);
  });

  it('deja de reintentar un día con más de una semana de antigüedad', async () => {
    vi.useFakeTimers({ now: new Date('2026-03-03T06:30:00Z') });
    const compute = vi
      .fn()
      .mockResolvedValueOnce({ failed: 1 })
      .mockResolvedValue({ failed: 0 });
    const job = new JobsService({ compute } as unknown as StatsService);
    await job.tick();
    vi.setSystemTime(new Date('2026-03-12T06:30:00Z'));
    await job.tick();
    expect(compute.mock.calls.map(([d]) => d)).toEqual([
      '2026-03-02',
      '2026-03-11',
    ]);
  });

  it('no se detiene si una fuente lanza un error', async () => {
    const compute = vi.fn().mockRejectedValue(new Error('caída'));
    const job = new JobsService({ compute } as unknown as StatsService);
    await expect(job.tick()).resolves.toBeUndefined();
  });
});
