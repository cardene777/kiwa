/**
 * Full pipeline end-to-end fidelity spec (pipeline axis: registry →
 * rollout → A/B → canary → shadow → tolerance gate).
 *
 * Sub-Issue CAR-891 (v1.40-4) AC — the mock adapter runs a full ops
 * session through the runPipeline op and reports the correct blocked /
 * completed stage across all 4 branches.
 *
 *  1. Blocked when the registry input is empty (blocked-no-versions).
 *  2. Blocked when fewer than 2 A/B variants qualify (blocked-ab-underpowered).
 *  3. Blocked when canary error rate exceeds threshold (blocked-canary-error-rate).
 *  4. Blocked when shadow delta is below the tolerance (blocked-shadow-regression).
 *  5. Completes when registry non-empty + A/B qualified + canary promoted +
 *     shadow delta at or above tolerance.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import {
  handlePipelineRequest,
  validatePipelineRequest,
} from '../src/app/pipeline/route.js';
import type { LlmOpsAdapter } from '../src/adapters/interface.js';

let mock: LlmOpsAdapter;

beforeEach(() => {
  mock = makeMockAdapter({ latencyMs: 1 });
});

afterEach(async () => {
  await mock.reset();
});

describe('mock adapter — runPipeline completion', () => {
  it('completes when all stages resolve cleanly', async () => {
    const r = await mock.runPipeline({
      sessionId: 'p1',
      registry: [
        { version: 'v1', activate: true },
        { version: 'v2-canary', activate: false },
      ],
      rollout: { targetPercent: 50, incrementPercent: 20 },
      ab: {
        results: [
          { variant: 'v1', score: 0.7, samples: 100 },
          { variant: 'v2', score: 0.9, samples: 100 },
        ],
        minSamples: 30,
      },
      canary: {
        canaryVersion: 'v2-canary',
        errorRate: 0.005,
        threshold: 0.01,
      },
      shadow: {
        productionScores: [0.5, 0.5, 0.5],
        shadowScores: [0.6, 0.6, 0.6],
      },
      shadowMinDelta: 0.05,
    });
    expect(r.stage).toBe('completed');
    expect(r.blockedReason).toBeNull();
    expect(r.registry.versionCount).toBe(2);
    expect(r.registry.activeVersion).toBe('v2-canary');
    expect(r.rollout.currentPercent).toBe(20);
    expect(r.rollout.reachedTarget).toBe(false);
    expect(r.ab.winner).toBe('v2');
    expect(r.canary.promoted).toBe(true);
    expect(r.shadow.better).toBe(true);
  });

  it('reports the canary as the active version on completion', async () => {
    const r = await mock.runPipeline({
      sessionId: 'p1',
      registry: [
        { version: 'v1', activate: true },
        { version: 'v2-canary', activate: false },
      ],
      rollout: { targetPercent: 100, incrementPercent: 100 },
      ab: {
        results: [
          { variant: 'v1', score: 0.7, samples: 100 },
          { variant: 'v2', score: 0.9, samples: 100 },
        ],
        minSamples: 30,
      },
      canary: {
        canaryVersion: 'v2-canary',
        errorRate: 0.001,
        threshold: 0.01,
      },
      shadow: {
        productionScores: [0.5],
        shadowScores: [0.9],
      },
      shadowMinDelta: 0.1,
    });
    expect(r.stage).toBe('completed');
    expect(r.registry.activeVersion).toBe('v2-canary');
    expect(r.rollout.reachedTarget).toBe(true);
  });
});

describe('mock adapter — runPipeline blocking branches', () => {
  it('blocks when registry is empty', async () => {
    const r = await mock.runPipeline({
      sessionId: 'p1',
      registry: [],
      rollout: { targetPercent: 50, incrementPercent: 20 },
      ab: {
        results: [
          { variant: 'v1', score: 0.7, samples: 100 },
          { variant: 'v2', score: 0.9, samples: 100 },
        ],
        minSamples: 30,
      },
      canary: {
        canaryVersion: 'v2-canary',
        errorRate: 0.005,
        threshold: 0.01,
      },
      shadow: {
        productionScores: [0.5],
        shadowScores: [0.6],
      },
      shadowMinDelta: 0.05,
    });
    expect(r.stage).toBe('blocked-no-versions');
    expect(r.blockedReason).toMatch(/must not be empty/);
    expect(r.registry.versionCount).toBe(0);
  });

  it('blocks when A/B is under-powered', async () => {
    const r = await mock.runPipeline({
      sessionId: 'p1',
      registry: [{ version: 'v1', activate: true }],
      rollout: { targetPercent: 50, incrementPercent: 20 },
      ab: {
        results: [
          { variant: 'v1', score: 0.7, samples: 10 },
          { variant: 'v2', score: 0.9, samples: 100 },
        ],
        minSamples: 30,
      },
      canary: {
        canaryVersion: 'v1',
        errorRate: 0.005,
        threshold: 0.01,
      },
      shadow: {
        productionScores: [0.5],
        shadowScores: [0.6],
      },
      shadowMinDelta: 0.05,
    });
    expect(r.stage).toBe('blocked-ab-underpowered');
    expect(r.blockedReason).toMatch(/qualified 1/);
    expect(r.ab.qualifiedCount).toBe(1);
    expect(r.ab.winner).toBeNull();
  });

  it('blocks when canary error rate exceeds threshold', async () => {
    const r = await mock.runPipeline({
      sessionId: 'p1',
      registry: [
        { version: 'v1', activate: true },
        { version: 'v2-canary', activate: false },
      ],
      rollout: { targetPercent: 50, incrementPercent: 20 },
      ab: {
        results: [
          { variant: 'v1', score: 0.7, samples: 100 },
          { variant: 'v2', score: 0.9, samples: 100 },
        ],
        minSamples: 30,
      },
      canary: {
        canaryVersion: 'v2-canary',
        errorRate: 0.05,
        threshold: 0.01,
      },
      shadow: {
        productionScores: [0.5],
        shadowScores: [0.6],
      },
      shadowMinDelta: 0.05,
    });
    expect(r.stage).toBe('blocked-canary-error-rate');
    expect(r.blockedReason).toMatch(/errorRate 0.05/);
    expect(r.canary.promoted).toBe(false);
    // active version rolls back to v1 because canary did not promote.
    expect(r.registry.activeVersion).toBe('v1');
  });

  it('blocks when shadow regression is beneath tolerance', async () => {
    const r = await mock.runPipeline({
      sessionId: 'p1',
      registry: [
        { version: 'v1', activate: true },
        { version: 'v2-canary', activate: false },
      ],
      rollout: { targetPercent: 50, incrementPercent: 20 },
      ab: {
        results: [
          { variant: 'v1', score: 0.7, samples: 100 },
          { variant: 'v2', score: 0.9, samples: 100 },
        ],
        minSamples: 30,
      },
      canary: {
        canaryVersion: 'v2-canary',
        errorRate: 0.001,
        threshold: 0.01,
      },
      shadow: {
        productionScores: [0.9],
        shadowScores: [0.5],
      },
      shadowMinDelta: 0.05,
    });
    expect(r.stage).toBe('blocked-shadow-regression');
    expect(r.blockedReason).toMatch(/shadow delta/);
    expect(r.shadow.delta).toBeLessThan(0.05);
  });

  it('A/B under-powered blocking takes precedence over canary failure', async () => {
    const r = await mock.runPipeline({
      sessionId: 'p1',
      registry: [{ version: 'v1', activate: true }],
      rollout: { targetPercent: 50, incrementPercent: 20 },
      // fewer than 2 qualified variants + high canary error rate.
      ab: {
        results: [
          { variant: 'v1', score: 0.7, samples: 10 },
          { variant: 'v2', score: 0.9, samples: 100 },
        ],
        minSamples: 30,
      },
      canary: {
        canaryVersion: 'v1',
        errorRate: 0.5,
        threshold: 0.01,
      },
      shadow: {
        productionScores: [0.5],
        shadowScores: [0.6],
      },
      shadowMinDelta: 0.05,
    });
    expect(r.stage).toBe('blocked-ab-underpowered');
  });

  it('canary blocking takes precedence over shadow regression', async () => {
    const r = await mock.runPipeline({
      sessionId: 'p1',
      registry: [
        { version: 'v1', activate: true },
        { version: 'v2-canary', activate: false },
      ],
      rollout: { targetPercent: 50, incrementPercent: 20 },
      ab: {
        results: [
          { variant: 'v1', score: 0.7, samples: 100 },
          { variant: 'v2', score: 0.9, samples: 100 },
        ],
        minSamples: 30,
      },
      // canary fails + shadow regresses.
      canary: {
        canaryVersion: 'v2-canary',
        errorRate: 0.5,
        threshold: 0.01,
      },
      shadow: {
        productionScores: [0.9],
        shadowScores: [0.5],
      },
      shadowMinDelta: 0.05,
    });
    expect(r.stage).toBe('blocked-canary-error-rate');
  });
});

describe('mock adapter — runPipeline trace + latency', () => {
  it('records a single runPipeline neutral event per call', async () => {
    await mock.runPipeline({
      sessionId: 'p1',
      registry: [{ version: 'v1', activate: true }],
      rollout: { targetPercent: 50, incrementPercent: 20 },
      ab: {
        results: [
          { variant: 'v1', score: 0.7, samples: 100 },
          { variant: 'v2', score: 0.9, samples: 100 },
        ],
        minSamples: 30,
      },
      canary: {
        canaryVersion: 'v1',
        errorRate: 0.005,
        threshold: 0.01,
      },
      shadow: {
        productionScores: [0.5],
        shadowScores: [0.6],
      },
      shadowMinDelta: 0.05,
    });
    const evts = mock.traces().filter((t) => t.op === 'runPipeline');
    expect(evts).toHaveLength(1);
    expect(evts[0]?.ok).toBe(true);
  });

  it('reports a positive latencyMs', async () => {
    const r = await mock.runPipeline({
      sessionId: 'p1',
      registry: [{ version: 'v1', activate: true }],
      rollout: { targetPercent: 50, incrementPercent: 20 },
      ab: {
        results: [
          { variant: 'v1', score: 0.7, samples: 100 },
          { variant: 'v2', score: 0.9, samples: 100 },
        ],
        minSamples: 30,
      },
      canary: {
        canaryVersion: 'v1',
        errorRate: 0.005,
        threshold: 0.01,
      },
      shadow: {
        productionScores: [0.5],
        shadowScores: [0.6],
      },
      shadowMinDelta: 0.05,
    });
    expect(r.latencyMs).toBeGreaterThanOrEqual(1);
  });
});

describe('route validation — pipeline', () => {
  const validBody = {
    sessionId: 'p1',
    registry: [{ version: 'v1', activate: true }],
    rollout: { targetPercent: 50, incrementPercent: 20 },
    ab: {
      results: [
        { variant: 'v1', score: 0.7, samples: 100 },
        { variant: 'v2', score: 0.9, samples: 100 },
      ],
      minSamples: 30,
    },
    canary: {
      canaryVersion: 'v1',
      errorRate: 0.005,
      threshold: 0.01,
    },
    shadow: {
      productionScores: [0.5],
      shadowScores: [0.6],
    },
    shadowMinDelta: 0.05,
  };

  it('accepts a valid pipeline body', () => {
    const r = validatePipelineRequest(validBody);
    expect(r.ok).toBe(true);
  });

  it('rejects a non-object body', () => {
    const r = validatePipelineRequest('not-object');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('body_not_object');
  });

  it('rejects an empty sessionId', () => {
    const r = validatePipelineRequest({ ...validBody, sessionId: '' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('sessionId_required');
  });

  it('rejects a non-array registry field', () => {
    const r = validatePipelineRequest({ ...validBody, registry: 'oops' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('registry_required');
  });

  it('rejects a missing rollout field', () => {
    const noRollout = { ...validBody } as Record<string, unknown>;
    delete noRollout['rollout'];
    const r = validatePipelineRequest(noRollout);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('rollout_required');
  });

  it('rejects a missing ab field', () => {
    const noAb = { ...validBody } as Record<string, unknown>;
    delete noAb['ab'];
    const r = validatePipelineRequest(noAb);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('ab_required');
  });

  it('rejects a missing canary field', () => {
    const noCanary = { ...validBody } as Record<string, unknown>;
    delete noCanary['canary'];
    const r = validatePipelineRequest(noCanary);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('canary_required');
  });

  it('rejects a missing shadow field', () => {
    const noShadow = { ...validBody } as Record<string, unknown>;
    delete noShadow['shadow'];
    const r = validatePipelineRequest(noShadow);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('shadow_required');
  });

  it('rejects a non-number shadowMinDelta', () => {
    const r = validatePipelineRequest({
      ...validBody,
      shadowMinDelta: 'nope',
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('shadowMinDelta_required');
  });
});

describe('route handlers — pipeline', () => {
  const validBody = {
    sessionId: 'p1',
    registry: [
      { version: 'v1', activate: true },
      { version: 'v2-canary', activate: false },
    ],
    rollout: { targetPercent: 50, incrementPercent: 20 },
    ab: {
      results: [
        { variant: 'v1', score: 0.7, samples: 100 },
        { variant: 'v2', score: 0.9, samples: 100 },
      ],
      minSamples: 30,
    },
    canary: {
      canaryVersion: 'v2-canary',
      errorRate: 0.005,
      threshold: 0.01,
    },
    shadow: {
      productionScores: [0.5],
      shadowScores: [0.6],
    },
    shadowMinDelta: 0.05,
  };

  it('handlePipelineRequest wraps a completed pipeline', async () => {
    const r = await handlePipelineRequest(mock, validBody);
    expect(r.ok).toBe(true);
    expect(r.result?.stage).toBe('completed');
  });

  it('handlePipelineRequest reports a blocked pipeline as ok=true with the stage', async () => {
    // The op did not throw — the pipeline itself concluded "blocked",
    // so ok=true on the wrapper is expected (payload signals the stage).
    const r = await handlePipelineRequest(mock, {
      ...validBody,
      registry: [],
    });
    expect(r.ok).toBe(true);
    expect(r.result?.stage).toBe('blocked-no-versions');
  });
});
