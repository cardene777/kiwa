import { describe, expect, it } from 'vitest';
import {
  completeCpu,
  platformEventName,
  startCpu,
  startCpuBudget,
  tickCpu,
  type EdgePlatform,
} from '../../src/index.js';

const platforms: EdgePlatform[] = ['cloudflare', 'vercel', 'deno'];

describe('cpu-time-limit axis — 3 platform', () => {
  it.each(platforms)('%s: start → tick → complete under budget', (platform) => {
    const session = startCpuBudget({ platform, budgetMs: 50, warningAtMs: 40 });
    expect(session.state).toBe('idle');
    expect(session.history).toHaveLength(0);

    const started = startCpu(session);
    expect(started.state).toBe('running');
    expect(started.neutralEvent).toBe('cpu.started');
    expect(started.platformEvent).toBe(platformEventName(platform, 'cpu.started'));

    const tick = tickCpu(session, { deltaMs: 10 });
    expect(tick.neutralEvent).toBe('cpu.started');
    expect(tick.state).toBe('running');
    expect(tick.metadata).toMatchObject({ elapsedMs: 10, budgetMs: 50, remaining: 40 });

    const completed = completeCpu(session);
    expect(completed.state).toBe('completed');
    expect(completed.neutralEvent).toBe('cpu.completed');
    expect(completed.metadata).toMatchObject({ elapsedMs: 10, budgetMs: 50, usedRatio: 0.2 });
  });

  it.each(platforms)('%s: crossing warning threshold emits cpu.budget-warning', (platform) => {
    const session = startCpuBudget({ platform, budgetMs: 50, warningAtMs: 40 });
    startCpu(session);
    const warn = tickCpu(session, { deltaMs: 42 });
    expect(warn.neutralEvent).toBe('cpu.budget-warning');
    expect(warn.platformEvent).toBe(platformEventName(platform, 'cpu.budget-warning'));
    expect(warn.state).toBe('warning');
    expect(warn.metadata).toMatchObject({ elapsedMs: 42, warningAtMs: 40, remaining: 8 });
  });

  it('exhausting the budget emits cpu.limited with overshoot', () => {
    const session = startCpuBudget({ platform: 'cloudflare', budgetMs: 50, warningAtMs: 40 });
    startCpu(session);
    const limited = tickCpu(session, { deltaMs: 55 });
    expect(limited.neutralEvent).toBe('cpu.limited');
    expect(limited.state).toBe('throttled');
    expect(limited.metadata).toMatchObject({ elapsedMs: 55, budgetMs: 50, overshootMs: 5 });
    expect(() => tickCpu(session, { deltaMs: 1 })).toThrow(/throttled/);
  });

  it('defaults budgetMs=50 and warningAtMs=40', () => {
    const session = startCpuBudget({ platform: 'vercel' });
    expect(session.budgetMs).toBe(50);
    expect(session.warningAtMs).toBe(40);
  });

  it('rejects startCpu unless idle, and completeCpu while idle', () => {
    const session = startCpuBudget({ platform: 'deno' });
    expect(() => completeCpu(session)).toThrow(/idle/);
    startCpu(session);
    expect(() => startCpu(session)).toThrow(/expected idle/);
  });

  it('rejects tickCpu before startCpu', () => {
    const session = startCpuBudget({ platform: 'vercel' });
    expect(() => tickCpu(session, { deltaMs: 5 })).toThrow(/call startCpu first/);
  });

  it('completeCpu from throttled reports usedRatio > 1', () => {
    const session = startCpuBudget({ platform: 'deno', budgetMs: 50, warningAtMs: 40 });
    startCpu(session);
    tickCpu(session, { deltaMs: 60 });
    const completed = completeCpu(session);
    expect(completed.metadata.usedRatio).toBeGreaterThan(1);
  });

  it('accumulates every step into history', () => {
    const session = startCpuBudget({ platform: 'cloudflare', budgetMs: 50, warningAtMs: 40 });
    startCpu(session);
    tickCpu(session, { deltaMs: 10 });
    tickCpu(session, { deltaMs: 32 });
    tickCpu(session, { deltaMs: 10 });
    completeCpu(session);
    expect(session.history.map((s) => s.neutralEvent)).toEqual([
      'cpu.started',
      'cpu.started',
      'cpu.budget-warning',
      'cpu.limited',
      'cpu.completed',
    ]);
  });
});
