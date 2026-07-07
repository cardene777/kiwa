/**
 * Canary + shadow end-to-end fidelity spec (canary-shadow axis:
 * promoteCanary → compareShadow → session state).
 *
 * Sub-Issue CAR-891 (v1.40-4) AC — the mock adapter drives a full
 * canary promotion + shadow comparison ceremony end to end and the
 * fidelity harness diffs the raw {@link TraceEvent} sequence across
 * the axis.
 *
 *  1. promoteCanary flips the canary version active when the error
 *     rate is at or below the threshold.
 *  2. promoteCanary refuses when error rate exceeds threshold and
 *     leaves the current active version unchanged.
 *  3. compareShadow reports better=true when shadow average > production.
 *  4. compareShadow reports the delta between averages.
 *  5. Route validation + wrapper handler surface the same errorKinds.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import {
  handleCanaryRequest,
  handleShadowRequest,
  validateCanaryRequest,
  validateShadowRequest,
} from '../src/app/canary/route.js';
import type { LlmOpsAdapter } from '../src/adapters/interface.js';

let mock: LlmOpsAdapter;

beforeEach(async () => {
  mock = makeMockAdapter({ latencyMs: 1 });
  await mock.startOps({ sessionId: 's1' });
  await mock.updateRegistry({
    sessionId: 's1',
    entry: { version: 'v1', activate: true },
  });
  await mock.updateRegistry({
    sessionId: 's1',
    entry: { version: 'v2-canary', activate: false },
  });
});

afterEach(async () => {
  await mock.reset();
});

describe('mock adapter — promoteCanary', () => {
  it('promotes when error rate is under the threshold', async () => {
    const r = await mock.promoteCanary({
      sessionId: 's1',
      canary: {
        canaryVersion: 'v2-canary',
        errorRate: 0.005,
        threshold: 0.01,
      },
    });
    expect(r.promoted).toBe(true);
    expect(r.activeVersion).toBe('v2-canary');
    expect(r.latencyMs).toBeGreaterThanOrEqual(1);
  });

  it('promotes when error rate exactly matches the threshold', async () => {
    const r = await mock.promoteCanary({
      sessionId: 's1',
      canary: {
        canaryVersion: 'v2-canary',
        errorRate: 0.01,
        threshold: 0.01,
      },
    });
    expect(r.promoted).toBe(true);
  });

  it('refuses when error rate exceeds threshold', async () => {
    const r = await mock.promoteCanary({
      sessionId: 's1',
      canary: {
        canaryVersion: 'v2-canary',
        errorRate: 0.05,
        threshold: 0.01,
      },
    });
    expect(r.promoted).toBe(false);
    // active version unchanged.
    expect(r.activeVersion).toBe('v1');
  });

  it('does not mutate active version on refuse', async () => {
    await mock.promoteCanary({
      sessionId: 's1',
      canary: {
        canaryVersion: 'v2-canary',
        errorRate: 0.05,
        threshold: 0.01,
      },
    });
    const registry = mock.registry('s1');
    const active = registry.filter((r) => r.active);
    expect(active).toHaveLength(1);
    expect(active[0]?.version).toBe('v1');
  });

  it('rejects a negative error rate', async () => {
    await expect(
      mock.promoteCanary({
        sessionId: 's1',
        canary: {
          canaryVersion: 'v2-canary',
          errorRate: -0.1,
          threshold: 0.01,
        },
      }),
    ).rejects.toThrow(/errorRate must be in \[0, 1\]/);
  });

  it('rejects an error rate > 1', async () => {
    await expect(
      mock.promoteCanary({
        sessionId: 's1',
        canary: {
          canaryVersion: 'v2-canary',
          errorRate: 1.5,
          threshold: 0.01,
        },
      }),
    ).rejects.toThrow(/errorRate must be in \[0, 1\]/);
  });

  it('rejects a threshold > 1', async () => {
    await expect(
      mock.promoteCanary({
        sessionId: 's1',
        canary: {
          canaryVersion: 'v2-canary',
          errorRate: 0.005,
          threshold: 1.5,
        },
      }),
    ).rejects.toThrow(/threshold must be in \[0, 1\]/);
  });

  it('refuses promoteCanary before updateRegistry', async () => {
    await mock.startOps({ sessionId: 's2' });
    await expect(
      mock.promoteCanary({
        sessionId: 's2',
        canary: {
          canaryVersion: 'v2-canary',
          errorRate: 0.005,
          threshold: 0.01,
        },
      }),
    ).rejects.toThrow(/update registry first/);
  });

  it('refuses a missing session', async () => {
    await expect(
      mock.promoteCanary({
        sessionId: 'no-such',
        canary: {
          canaryVersion: 'v2-canary',
          errorRate: 0.005,
          threshold: 0.01,
        },
      }),
    ).rejects.toThrow(/no session no-such/);
  });
});

describe('mock adapter — compareShadow', () => {
  it('reports better=true when shadow beats production', async () => {
    const r = await mock.compareShadow({
      sessionId: 's1',
      shadow: {
        productionScores: [0.5, 0.5, 0.5],
        shadowScores: [0.6, 0.6, 0.6],
      },
    });
    expect(r.better).toBe(true);
    expect(r.delta).toBeCloseTo(0.1, 5);
    expect(r.prodAvg).toBeCloseTo(0.5, 5);
    expect(r.shadowAvg).toBeCloseTo(0.6, 5);
  });

  it('reports better=false when shadow underperforms production', async () => {
    const r = await mock.compareShadow({
      sessionId: 's1',
      shadow: {
        productionScores: [0.9, 0.9, 0.9],
        shadowScores: [0.5, 0.5, 0.5],
      },
    });
    expect(r.better).toBe(false);
    expect(r.delta).toBeCloseTo(-0.4, 5);
  });

  it('reports better=false when both averages match exactly', async () => {
    const r = await mock.compareShadow({
      sessionId: 's1',
      shadow: {
        productionScores: [0.7, 0.7],
        shadowScores: [0.7, 0.7],
      },
    });
    expect(r.better).toBe(false);
    expect(r.delta).toBe(0);
  });

  it('reports productionCount + shadowCount from the inputs', async () => {
    const r = await mock.compareShadow({
      sessionId: 's1',
      shadow: {
        productionScores: [0.5, 0.6, 0.7],
        shadowScores: [0.8, 0.9],
      },
    });
    expect(r.productionCount).toBe(3);
    expect(r.shadowCount).toBe(2);
  });

  it('rejects an empty productionScores', async () => {
    await expect(
      mock.compareShadow({
        sessionId: 's1',
        shadow: { productionScores: [], shadowScores: [0.5] },
      }),
    ).rejects.toThrow(/scores must not be empty/);
  });

  it('rejects an empty shadowScores', async () => {
    await expect(
      mock.compareShadow({
        sessionId: 's1',
        shadow: { productionScores: [0.5], shadowScores: [] },
      }),
    ).rejects.toThrow(/scores must not be empty/);
  });

  it('refuses compareShadow before updateRegistry', async () => {
    await mock.startOps({ sessionId: 's2' });
    await expect(
      mock.compareShadow({
        sessionId: 's2',
        shadow: { productionScores: [0.5], shadowScores: [0.6] },
      }),
    ).rejects.toThrow(/update registry first/);
  });

  it('refuses a missing session', async () => {
    await expect(
      mock.compareShadow({
        sessionId: 'no-such',
        shadow: { productionScores: [0.5], shadowScores: [0.6] },
      }),
    ).rejects.toThrow(/no session no-such/);
  });
});

describe('mock adapter — trace order', () => {
  it('emits promoteCanary + compareShadow events in call order', async () => {
    await mock.promoteCanary({
      sessionId: 's1',
      canary: {
        canaryVersion: 'v2-canary',
        errorRate: 0.005,
        threshold: 0.01,
      },
    });
    await mock.compareShadow({
      sessionId: 's1',
      shadow: {
        productionScores: [0.5, 0.5],
        shadowScores: [0.6, 0.6],
      },
    });
    const events = mock
      .traces()
      .filter((t) => t.op === 'promoteCanary' || t.op === 'compareShadow');
    expect(events).toHaveLength(2);
    expect(events[0]?.op).toBe('promoteCanary');
    expect(events[1]?.op).toBe('compareShadow');
  });
});

describe('route validation — canary', () => {
  it('accepts a valid canary body', () => {
    const r = validateCanaryRequest({
      sessionId: 's1',
      canary: {
        canaryVersion: 'v2-canary',
        errorRate: 0.005,
        threshold: 0.01,
      },
    });
    expect(r.ok).toBe(true);
  });

  it('rejects a non-object body', () => {
    const r = validateCanaryRequest(null);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('body_not_object');
  });

  it('rejects an empty canaryVersion', () => {
    const r = validateCanaryRequest({
      sessionId: 's1',
      canary: {
        canaryVersion: '',
        errorRate: 0.005,
        threshold: 0.01,
      },
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('canary.canaryVersion_required');
  });

  it('rejects a missing errorRate', () => {
    const r = validateCanaryRequest({
      sessionId: 's1',
      canary: {
        canaryVersion: 'v2-canary',
        threshold: 0.01,
      },
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('canary.errorRate_required');
  });

  it('rejects a missing threshold', () => {
    const r = validateCanaryRequest({
      sessionId: 's1',
      canary: {
        canaryVersion: 'v2-canary',
        errorRate: 0.005,
      },
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('canary.threshold_required');
  });
});

describe('route validation — shadow', () => {
  it('accepts a valid shadow body', () => {
    const r = validateShadowRequest({
      sessionId: 's1',
      shadow: {
        productionScores: [0.5],
        shadowScores: [0.6],
      },
    });
    expect(r.ok).toBe(true);
  });

  it('rejects a non-array productionScores', () => {
    const r = validateShadowRequest({
      sessionId: 's1',
      shadow: {
        productionScores: 'oops',
        shadowScores: [0.6],
      },
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('shadow.productionScores_required');
  });

  it('rejects a non-array shadowScores', () => {
    const r = validateShadowRequest({
      sessionId: 's1',
      shadow: {
        productionScores: [0.5],
        shadowScores: 'oops',
      },
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('shadow.shadowScores_required');
  });
});

describe('route handlers — canary / shadow', () => {
  it('handleCanaryRequest wraps a successful promote op', async () => {
    const r = await handleCanaryRequest(mock, {
      sessionId: 's1',
      canary: {
        canaryVersion: 'v2-canary',
        errorRate: 0.005,
        threshold: 0.01,
      },
    });
    expect(r.ok).toBe(true);
    expect(r.result?.promoted).toBe(true);
  });

  it('handleCanaryRequest translates thrown errors to errorKind', async () => {
    const r = await handleCanaryRequest(mock, {
      sessionId: 'no-such',
      canary: {
        canaryVersion: 'v2-canary',
        errorRate: 0.005,
        threshold: 0.01,
      },
    });
    expect(r.ok).toBe(false);
    expect(r.errorKind).toMatch(/no session/);
  });

  it('handleShadowRequest wraps a successful compare op', async () => {
    const r = await handleShadowRequest(mock, {
      sessionId: 's1',
      shadow: {
        productionScores: [0.5, 0.5],
        shadowScores: [0.6, 0.6],
      },
    });
    expect(r.ok).toBe(true);
    expect(r.result?.better).toBe(true);
  });

  it('handleShadowRequest translates thrown errors to errorKind', async () => {
    const r = await handleShadowRequest(mock, {
      sessionId: 'no-such',
      shadow: {
        productionScores: [0.5],
        shadowScores: [0.6],
      },
    });
    expect(r.ok).toBe(false);
    expect(r.errorKind).toMatch(/no session/);
  });
});
