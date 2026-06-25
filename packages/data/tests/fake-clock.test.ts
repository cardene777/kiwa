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

  it('T-CLK-006 default startMs=0 - opts未指定で 0', () => {
    const clock = createFakeClock();
    expect(clock.nowMs()).toBe(0);
  });

  it('T-CLK-007 startMs explicit 0 - 0 を opts で渡しても 0', () => {
    const clock = createFakeClock({ startMs: 0 });
    expect(clock.nowMs()).toBe(0);
  });

  it('T-CLK-008 schedule returns numeric string id - 1 / 2 / 3 increment', () => {
    const clock = createFakeClock();
    const id1 = clock.schedule(100, () => undefined);
    const id2 = clock.schedule(200, () => undefined);
    expect(id1).toBe('1');
    expect(id2).toBe('2');
  });

  it('T-CLK-009 rejects NaN intervalMs', () => {
    const clock = createFakeClock();
    expect(() => clock.schedule(NaN, () => undefined)).toThrow(/intervalMs must be > 0/);
  });

  it('T-CLK-010 rejects Infinity intervalMs - finite check', () => {
    const clock = createFakeClock();
    expect(() => clock.schedule(Infinity, () => undefined)).toThrow(/intervalMs must be > 0/);
  });

  it('T-CLK-011 schedule error message - intervalMs 値を含む string interpolation', () => {
    const clock = createFakeClock();
    expect(() => clock.schedule(-5, () => undefined)).toThrow(/got -5/);
    expect(() => clock.schedule(0, () => undefined)).toThrow(/got 0/);
  });

  it('T-CLK-012 advanceMs rejects negative ms', async () => {
    const clock = createFakeClock();
    await expect(clock.advanceMs(-1)).rejects.toThrow(/ms must be >= 0/);
  });

  it('T-CLK-013 advanceMs rejects NaN ms', async () => {
    const clock = createFakeClock();
    await expect(clock.advanceMs(NaN)).rejects.toThrow(/ms must be >= 0/);
  });

  it('T-CLK-014 advanceMs rejects Infinity ms', async () => {
    const clock = createFakeClock();
    await expect(clock.advanceMs(Infinity)).rejects.toThrow(/ms must be >= 0/);
  });

  it('T-CLK-015 advanceMs(0) - 0 ok で時刻不変', async () => {
    const clock = createFakeClock({ startMs: 1000 });
    await clock.advanceMs(0);
    expect(clock.nowMs()).toBe(1000);
  });

  it('T-CLK-016 advanceMs error message - ms 値を含む', async () => {
    const clock = createFakeClock();
    await expect(clock.advanceMs(-3)).rejects.toThrow(/got -3/);
  });

  it('T-CLK-017 pendingEntries - schedule した entry を slice 返却 (immutable)', () => {
    const clock = createFakeClock();
    clock.schedule(100, () => undefined);
    clock.schedule(200, () => undefined);
    const entries = clock.pendingEntries();
    expect(entries.length).toBe(2);
    expect(entries[0]?.intervalMs).toBe(100);
    expect(entries[1]?.intervalMs).toBe(200);
    entries.length = 0;
    expect(clock.pendingEntries().length).toBe(2);
  });

  it('T-CLK-018 unschedule unknown id - 何もしない', () => {
    const clock = createFakeClock();
    clock.schedule(100, () => undefined);
    clock.unschedule('999');
    expect(clock.pendingEntries().length).toBe(1);
  });

  it('T-CLK-019 fire timing - exactly at intervalMs (boundary)', async () => {
    const clock = createFakeClock();
    const fires: number[] = [];
    clock.schedule(100, () => {
      fires.push(clock.nowMs());
    });
    await clock.advanceMs(100);
    expect(fires).toEqual([100]);
    expect(clock.nowMs()).toBe(100);
  });

  it('T-CLK-020 fire timing - target ちょうど未満 (99ms) では未発火', async () => {
    const clock = createFakeClock();
    let fired = 0;
    clock.schedule(100, () => {
      fired += 1;
    });
    await clock.advanceMs(99);
    expect(fired).toBe(0);
    expect(clock.nowMs()).toBe(99);
  });

  it('T-CLK-021 multiple advances - 累積 fire (200ms + 200ms = 400ms で 4 回)', async () => {
    const clock = createFakeClock();
    let fired = 0;
    clock.schedule(100, () => {
      fired += 1;
    });
    await clock.advanceMs(200);
    await clock.advanceMs(200);
    expect(fired).toBe(4);
    expect(clock.nowMs()).toBe(400);
  });

  it('T-CLK-022 async handler awaited - fn 完了まで次 entry 待つ', async () => {
    const clock = createFakeClock();
    const log: string[] = [];
    clock.schedule(100, async () => {
      log.push('start');
      await new Promise((r) => setTimeout(r, 10));
      log.push('end');
    });
    await clock.advanceMs(200);
    expect(log).toEqual(['start', 'end', 'start', 'end']);
  });

  it('T-CLK-023 nextFireTime tie-breaking - 同時刻なら 先 schedule 優先', async () => {
    const clock = createFakeClock();
    const log: string[] = [];
    clock.schedule(100, () => {
      log.push('A');
    });
    clock.schedule(100, () => {
      log.push('B');
    });
    await clock.advanceMs(100);
    expect(log).toEqual(['A', 'B']);
  });

  it('T-CLK-024 unschedule before advance - 後続 entry の fire 維持', async () => {
    const clock = createFakeClock();
    const log: string[] = [];
    const idA = clock.schedule(100, () => {
      log.push('A');
    });
    clock.schedule(150, () => {
      log.push('B');
    });
    clock.unschedule(idA);
    await clock.advanceMs(300);
    expect(log).toEqual(['B', 'B']);
  });

  it('T-CLK-025 schedule then advance 0 - fn not invoked', async () => {
    const clock = createFakeClock();
    let fired = 0;
    clock.schedule(100, () => {
      fired += 1;
    });
    await clock.advanceMs(0);
    expect(fired).toBe(0);
    expect(clock.nowMs()).toBe(0);
  });

  it('T-CLK-026 startMs negative - 負の時刻も保持 (validation なし)', () => {
    const clock = createFakeClock({ startMs: -100 });
    expect(clock.nowMs()).toBe(-100);
  });

  it('T-CLK-027 multi-id - 50 件 schedule で id 1..50', () => {
    const clock = createFakeClock();
    const ids: string[] = [];
    for (let i = 0; i < 50; i += 1) {
      ids.push(clock.schedule(100, () => undefined));
    }
    expect(ids[0]).toBe('1');
    expect(ids[49]).toBe('50');
    expect(new Set(ids).size).toBe(50);
  });
});
