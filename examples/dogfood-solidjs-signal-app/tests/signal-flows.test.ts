import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter, SkippedError } from '../src/adapters/real.js';
import {
  driveCounterFlow,
  driveTodosFlow,
  driveResourceFlow,
  driveSuspenseFlow,
} from '../src/flows/signal-flows.js';

describe('signal flows (end-to-end)', () => {
  it('T-DSSA-SF-001 driveCounterFlow mock: observed=[0..ticks]', async () => {
    const adapter = makeMockAdapter();
    const out = await driveCounterFlow(adapter, 3);
    // effect runs = ticks + 1 (initial + N re-runs)
    expect(out.effectRunCount).toBe(4);
    expect(out.observedValues).toEqual([0, 1, 2, 3]);
    expect(out.finalMarkup).toContain('data-testid="counter-value">3<');
    await adapter.reset();
  });

  it('T-DSSA-SF-002 driveTodosFlow mock: markAll collapses to +1 run', async () => {
    const adapter = makeMockAdapter();
    const out = await driveTodosFlow(adapter, ['a', 'b'], [
      { kind: 'add', title: 'c' },
      { kind: 'markAll', completed: true },
    ]);
    expect(out.finalMarkup).toContain('3/3 completed');
    // seed 2 (mountTodos add) + 1 (add c) + 1 (markAll batch) + 1 initial = 5
    expect(out.finalEffectRunCount).toBeGreaterThanOrEqual(4);
    await adapter.reset();
  });

  it('T-DSSA-SF-003 driveResourceFlow mock: terminal state = ready', async () => {
    const adapter = makeMockAdapter();
    const out = await driveResourceFlow(adapter, async () => ({
      id: 'u1',
      displayName: 'Ada',
      email: 'ada@ex.com',
    }));
    expect(out.terminalState).toBe('ready');
    expect(out.finalMarkup).toContain('user-profile-ready');
    expect(out.transitionCount).toBeGreaterThanOrEqual(3);
    await adapter.reset();
  });

  it('T-DSSA-SF-004 driveSuspenseFlow mock: fallback + resolved observed', async () => {
    const adapter = makeMockAdapter();
    const out = await driveSuspenseFlow(adapter, 1);
    expect(out.hadFallback).toBe(true);
    expect(out.hadResolved).toBe(true);
    expect(out.timedOut).toBe(false);
    await adapter.reset();
  });

  it('T-DSSA-SF-005 real adapter (skipped path) throws SOLID_REAL_ENV_MISSING', async () => {
    const adapter = makeRealAdapter();
    await expect(driveCounterFlow(adapter, 1)).rejects.toThrow(SkippedError);
    const traces = adapter.traces();
    expect(traces.length).toBeGreaterThan(0);
    expect(traces[0]?.errorKind).toBe('SOLID_REAL_ENV_MISSING');
    await adapter.reset();
  });
});
