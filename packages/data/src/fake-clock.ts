import type { CronEntry, FakeClock } from './types.js';

export interface FakeClockOptions {
  /** initial wall-clock time in ms (default 0 for deterministic tests) */
  startMs?: number;
}

export function createFakeClock(opts: FakeClockOptions = {}): FakeClock {
  let now = opts.startMs ?? 0;
  const entries: CronEntry[] = [];
  let nextId = 1;

  return {
    nowMs: () => now,
    schedule(intervalMs, fn) {
      if (!Number.isFinite(intervalMs) || intervalMs <= 0) {
        throw new Error(`createFakeClock.schedule: intervalMs must be > 0, got ${intervalMs}`);
      }
      const id = String(nextId++);
      entries.push({ id, intervalMs, lastRunMs: now, fn });
      return id;
    },
    unschedule(id) {
      const idx = entries.findIndex((e) => e.id === id);
      if (idx >= 0) entries.splice(idx, 1);
    },
    pendingEntries: () => entries.slice(),
    async advanceMs(ms) {
      if (!Number.isFinite(ms) || ms < 0) {
        throw new Error(`createFakeClock.advanceMs: ms must be >= 0, got ${ms}`);
      }
      const target = now + ms;
      while (true) {
        let nextFireTime = Number.POSITIVE_INFINITY;
        let nextEntry: CronEntry | null = null;
        for (const entry of entries) {
          const fireTime = entry.lastRunMs + entry.intervalMs;
          if (fireTime <= target && fireTime < nextFireTime) {
            nextFireTime = fireTime;
            nextEntry = entry;
          }
        }
        if (!nextEntry) break;
        now = nextFireTime;
        nextEntry.lastRunMs = nextFireTime;
        await nextEntry.fn();
      }
      now = target;
    },
  };
}
