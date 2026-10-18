/** Timers share the same pause clock as the mascot, including page visibility. */
export class PausableTimers {
  private jobs = new Map<
    number,
    { fn: () => void; remaining: number; started: number; handle: number }
  >();
  private serial = 0;
  private paused = false;
  private now: () => number;
  private schedule: (fn: () => void, ms: number) => number;
  private cancel: (id: number) => void;
  constructor(
    now = () => performance.now(),
    schedule = (fn: () => void, ms: number) => window.setTimeout(fn, ms),
    cancel = (id: number) => window.clearTimeout(id),
  ) {
    this.now = now;
    this.schedule = schedule;
    this.cancel = cancel;
  }
  set(fn: () => void, ms: number) {
    const id = ++this.serial;
    this.jobs.set(id, { fn, remaining: ms, started: this.now(), handle: 0 });
    if (!this.paused) this.arm(id);
    return id;
  }
  private arm(id: number) {
    const job = this.jobs.get(id);
    if (!job) return;
    job.started = this.now();
    job.handle = this.schedule(() => {
      this.jobs.delete(id);
      job.fn();
    }, job.remaining);
  }
  clear(id: number) {
    const job = this.jobs.get(id);
    if (job) {
      this.cancel(job.handle);
      this.jobs.delete(id);
    }
  }
  pause(value: boolean) {
    if (this.paused === value) return;
    this.paused = value;
    for (const [id, job] of this.jobs) {
      if (value) {
        this.cancel(job.handle);
        job.remaining = Math.max(0, job.remaining - (this.now() - job.started));
      } else this.arm(id);
    }
  }
  destroy() {
    for (const id of this.jobs.keys()) this.clear(id);
  }
}
