/**
 * Rollout + A/B end-to-end fidelity spec (rollout-ab axis:
 * advanceRollout → evaluateAb → session state).
 *
 * Sub-Issue CAR-891 (v1.40-4) AC — the mock adapter drives a full
 * rollout percentage advancement + A/B variant scoring ceremony end
 * to end and the fidelity harness diffs the raw {@link TraceEvent}
 * sequence across the axis.
 *
 *  1. advanceRollout advances the percentage toward the target.
 *  2. advanceRollout clamps at the target and reports reachedTarget=true.
 *  3. evaluateAb picks the highest-mean-score variant as the winner.
 *  4. evaluateAb reports winner=null when fewer than 2 variants qualify.
 *  5. Route validation + wrapper handler surface the same errorKinds.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import {
  handleAbRequest,
  handleRolloutRequest,
  validateAbRequest,
  validateRolloutRequest,
} from '../src/app/registry/route.js';
import type { LlmOpsAdapter } from '../src/adapters/interface.js';

let mock: LlmOpsAdapter;

beforeEach(async () => {
  mock = makeMockAdapter({ latencyMs: 1 });
  await mock.startOps({ sessionId: 's1' });
  await mock.updateRegistry({
    sessionId: 's1',
    entry: { version: 'v1', activate: true },
  });
});

afterEach(async () => {
  await mock.reset();
});

describe('mock adapter — advanceRollout', () => {
  it('advances the percentage in step increments', async () => {
    const r = await mock.advanceRollout({
      sessionId: 's1',
      rollout: { targetPercent: 50, incrementPercent: 10 },
    });
    expect(r.currentPercent).toBe(10);
    expect(r.reachedTarget).toBe(false);
  });

  it('accumulates across repeated calls toward the target', async () => {
    await mock.advanceRollout({
      sessionId: 's1',
      rollout: { targetPercent: 50, incrementPercent: 20 },
    });
    const r = await mock.advanceRollout({
      sessionId: 's1',
      rollout: { targetPercent: 50, incrementPercent: 20 },
    });
    expect(r.currentPercent).toBe(40);
    expect(r.reachedTarget).toBe(false);
  });

  it('clamps at the target percent', async () => {
    await mock.advanceRollout({
      sessionId: 's1',
      rollout: { targetPercent: 50, incrementPercent: 40 },
    });
    const r = await mock.advanceRollout({
      sessionId: 's1',
      rollout: { targetPercent: 50, incrementPercent: 40 },
    });
    expect(r.currentPercent).toBe(50);
    expect(r.reachedTarget).toBe(true);
  });

  it('reports reachedTarget=true when the first advance meets the target', async () => {
    const r = await mock.advanceRollout({
      sessionId: 's1',
      rollout: { targetPercent: 5, incrementPercent: 10 },
    });
    expect(r.currentPercent).toBe(5);
    expect(r.reachedTarget).toBe(true);
  });

  it('rejects a negative target percent', async () => {
    await expect(
      mock.advanceRollout({
        sessionId: 's1',
        rollout: { targetPercent: -1, incrementPercent: 10 },
      }),
    ).rejects.toThrow(/targetPercent must be in \[0, 100\]/);
  });

  it('rejects a target percent > 100', async () => {
    await expect(
      mock.advanceRollout({
        sessionId: 's1',
        rollout: { targetPercent: 101, incrementPercent: 10 },
      }),
    ).rejects.toThrow(/targetPercent must be in \[0, 100\]/);
  });

  it('rejects a zero increment', async () => {
    await expect(
      mock.advanceRollout({
        sessionId: 's1',
        rollout: { targetPercent: 50, incrementPercent: 0 },
      }),
    ).rejects.toThrow(/incrementPercent must be positive/);
  });

  it('rejects advanceRollout before updateRegistry', async () => {
    await mock.startOps({ sessionId: 's2' });
    await expect(
      mock.advanceRollout({
        sessionId: 's2',
        rollout: { targetPercent: 50, incrementPercent: 10 },
      }),
    ).rejects.toThrow(/update registry first/);
  });

  it('refuses a missing session', async () => {
    await expect(
      mock.advanceRollout({
        sessionId: 'no-such',
        rollout: { targetPercent: 50, incrementPercent: 10 },
      }),
    ).rejects.toThrow(/no session no-such/);
  });
});

describe('mock adapter — evaluateAb', () => {
  it('picks the highest-mean-score variant', async () => {
    const r = await mock.evaluateAb({
      sessionId: 's1',
      ab: {
        results: [
          { variant: 'v1', score: 0.7, samples: 100 },
          { variant: 'v2', score: 0.9, samples: 100 },
        ],
        minSamples: 30,
      },
    });
    expect(r.winner).toBe('v2');
    expect(r.delta).toBeCloseTo(0.2, 5);
    expect(r.qualifiedCount).toBe(2);
  });

  it('reports winner=null when fewer than 2 variants qualify', async () => {
    const r = await mock.evaluateAb({
      sessionId: 's1',
      ab: {
        results: [
          { variant: 'v1', score: 0.7, samples: 10 },
          { variant: 'v2', score: 0.9, samples: 100 },
        ],
        minSamples: 30,
      },
    });
    expect(r.winner).toBeNull();
    expect(r.qualifiedCount).toBe(1);
    expect(r.delta).toBe(0);
  });

  it('reports the correct delta between top and runner-up', async () => {
    const r = await mock.evaluateAb({
      sessionId: 's1',
      ab: {
        results: [
          { variant: 'v1', score: 0.5, samples: 100 },
          { variant: 'v2', score: 0.55, samples: 100 },
          { variant: 'v3', score: 0.9, samples: 100 },
        ],
        minSamples: 30,
      },
    });
    expect(r.winner).toBe('v3');
    // v3 vs runner-up v2: 0.9 - 0.55 = 0.35
    expect(r.delta).toBeCloseTo(0.35, 5);
  });

  it('rejects a 1-variant test', async () => {
    await expect(
      mock.evaluateAb({
        sessionId: 's1',
        ab: {
          results: [{ variant: 'v1', score: 0.7, samples: 100 }],
          minSamples: 30,
        },
      }),
    ).rejects.toThrow(/need at least 2 variants/);
  });

  it('rejects evaluateAb before updateRegistry', async () => {
    await mock.startOps({ sessionId: 's2' });
    await expect(
      mock.evaluateAb({
        sessionId: 's2',
        ab: {
          results: [
            { variant: 'v1', score: 0.7, samples: 100 },
            { variant: 'v2', score: 0.9, samples: 100 },
          ],
          minSamples: 30,
        },
      }),
    ).rejects.toThrow(/update registry first/);
  });

  it('refuses a missing session', async () => {
    await expect(
      mock.evaluateAb({
        sessionId: 'no-such',
        ab: {
          results: [
            { variant: 'v1', score: 0.7, samples: 100 },
            { variant: 'v2', score: 0.9, samples: 100 },
          ],
          minSamples: 30,
        },
      }),
    ).rejects.toThrow(/no session no-such/);
  });
});

describe('route validation — rollout', () => {
  it('accepts a valid rollout body', () => {
    const r = validateRolloutRequest({
      sessionId: 's1',
      rollout: { targetPercent: 50, incrementPercent: 10 },
    });
    expect(r.ok).toBe(true);
  });

  it('rejects a non-object body', () => {
    const r = validateRolloutRequest('nope');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('body_not_object');
  });

  it('rejects an empty sessionId', () => {
    const r = validateRolloutRequest({
      sessionId: '',
      rollout: { targetPercent: 50, incrementPercent: 10 },
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('sessionId_required');
  });

  it('rejects a missing rollout field', () => {
    const r = validateRolloutRequest({ sessionId: 's1' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('rollout_required');
  });

  it('rejects a non-number targetPercent', () => {
    const r = validateRolloutRequest({
      sessionId: 's1',
      rollout: { targetPercent: '50', incrementPercent: 10 },
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('rollout.targetPercent_required');
  });

  it('rejects a zero incrementPercent', () => {
    const r = validateRolloutRequest({
      sessionId: 's1',
      rollout: { targetPercent: 50, incrementPercent: 0 },
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('rollout.incrementPercent_required');
  });
});

describe('route validation — ab', () => {
  it('accepts a valid ab body', () => {
    const r = validateAbRequest({
      sessionId: 's1',
      ab: {
        results: [
          { variant: 'v1', score: 0.7, samples: 100 },
          { variant: 'v2', score: 0.9, samples: 100 },
        ],
        minSamples: 30,
      },
    });
    expect(r.ok).toBe(true);
  });

  it('rejects a non-array results field', () => {
    const r = validateAbRequest({
      sessionId: 's1',
      ab: { results: 'oops', minSamples: 30 },
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('ab.results_required');
  });

  it('rejects a negative minSamples', () => {
    const r = validateAbRequest({
      sessionId: 's1',
      ab: { results: [], minSamples: -1 },
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('ab.minSamples_required');
  });
});

describe('route handlers — rollout / ab', () => {
  it('handleRolloutRequest wraps a successful rollout op', async () => {
    const r = await handleRolloutRequest(mock, {
      sessionId: 's1',
      rollout: { targetPercent: 50, incrementPercent: 10 },
    });
    expect(r.ok).toBe(true);
    expect(r.result?.currentPercent).toBe(10);
  });

  it('handleRolloutRequest translates thrown errors to errorKind', async () => {
    const r = await handleRolloutRequest(mock, {
      sessionId: 'no-such',
      rollout: { targetPercent: 50, incrementPercent: 10 },
    });
    expect(r.ok).toBe(false);
    expect(r.errorKind).toMatch(/no session/);
  });

  it('handleAbRequest wraps a successful ab op', async () => {
    const r = await handleAbRequest(mock, {
      sessionId: 's1',
      ab: {
        results: [
          { variant: 'v1', score: 0.7, samples: 100 },
          { variant: 'v2', score: 0.9, samples: 100 },
        ],
        minSamples: 30,
      },
    });
    expect(r.ok).toBe(true);
    expect(r.result?.winner).toBe('v2');
  });

  it('handleAbRequest translates thrown errors to errorKind', async () => {
    const r = await handleAbRequest(mock, {
      sessionId: 'no-such',
      ab: {
        results: [
          { variant: 'v1', score: 0.7, samples: 100 },
          { variant: 'v2', score: 0.9, samples: 100 },
        ],
        minSamples: 30,
      },
    });
    expect(r.ok).toBe(false);
    expect(r.errorKind).toMatch(/no session/);
  });
});
