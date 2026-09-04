/**
 * Time source for the engine.
 *
 * Live runs use a real clock with a speed multiplier so a demo run compresses
 * a 40-minute pipeline into a couple of minutes. Seeded history uses a virtual
 * clock: the same engine code runs, but time advances instantly, producing
 * runs whose timestamps and durations are internally consistent.
 */
export interface Clock {
  now(): number;
  wait(ms: number): Promise<void>;
  readonly virtual: boolean;
}

export class RealClock implements Clock {
  readonly virtual = false;
  constructor(private readonly speed = 1) {}
  now() {
    return Date.now();
  }
  wait(ms: number) {
    const real = Math.max(0, Math.round(ms / this.speed));
    if (real === 0) return Promise.resolve();
    return new Promise<void>((resolve) => setTimeout(resolve, real));
  }
}

export class VirtualClock implements Clock {
  readonly virtual = true;
  private t: number;
  constructor(startMs: number) {
    this.t = startMs;
  }
  now() {
    return this.t;
  }
  async wait(ms: number) {
    this.t += Math.max(0, Math.round(ms));
  }
}
