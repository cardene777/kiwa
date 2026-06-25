import { describe, expect, it } from 'vitest';
import { createFakeClock } from '../src/index.js';

describe('createFakeClock', () => {
  it('starts at the specified time and advances', async () => {
    const clock = createFakeClock({ startMs: 1000 });
    expect(clock.nowMs()).toBe(1000);
    await clock.advanceMs(500);
    expect(clock.nowMs()).toBe(1500);
  });

  it('fires a scheduled cron entry at every interval', async () => {
    const clock = createFakeClock();
    const fires: number[] = [];
    clock.schedule(100, () => {
      fires.push(clock.nowMs());
    });
    await clock.advanceMs(350);
    expect(fires).toEqual([100, 200, 300]);
  });

  it('honours multiple intervals interleaved', async () => {
    const clock = createFakeClock();
    const fires: string[] = [];
    clock.schedule(100, () => {
      fires.push(`A@${clock.nowMs()}`);
    });
    clock.schedule(150, () => {
      fires.push(`B@${clock.nowMs()}`);
    });
    await clock.advanceMs(450);
    expect(fires).toEqual([
      'A@100',
      'B@150',
      'A@200',
      'A@300',
      'B@300',
      'A@400',
      'B@450',
    ]);
  });

  it('unschedule stops a previously scheduled entry', async () => {
    const clock = createFakeClock();
    let fires = 0;
    const id = clock.schedule(50, () => {
      fires += 1;
    });
    await clock.advanceMs(120);
    expect(fires).toBe(2);
    clock.unschedule(id);
    await clock.advanceMs(500);
    expect(fires).toBe(2);
  });

  it('rejects non-positive intervals', () => {
    const clock = createFakeClock();
    expect(() => clock.schedule(0, () => undefined)).toThrow(/intervalMs must be > 0/);
    expect(() => clock.schedule(-10, () => undefined)).toThrow(/intervalMs must be > 0/);
  });
});
