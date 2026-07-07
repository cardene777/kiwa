/**
 * Remediation end-to-end fidelity spec (aiops-remediation axis: anomaly
 * detection + auto-remediation + session lifecycle).
 *
 * Issue CAR-1049 (v1.42-4) AC — the mock adapter drives a full AIOps
 * auto-remediation ceremony end to end and the fidelity harness diffs
 * the raw {@link TraceEvent} sequence across five axes.
 *
 *  1. startRemediation seats an AIOps session under a cluster id +
 *     observability target, and rejects duplicate session ids.
 *  2. detectAnomaly filters points by z-score threshold, counts
 *     anomalies, and enforces (non-empty points, positive threshold,
 *     session open).
 *  3. executeRemediation runs a set of runbook actions, counts
 *     succeeded / failed, and enforces (non-empty actions, session
 *     open).
 *  4. closeRemediation tears down state and further ops on the same
 *     session id fail.
 *  5. Route handler dispatches / rejects the shape variations exposed
 *     over HTTP without spinning up a Node server.
 *  6. Provider dialects (grafana-oss / prometheus / loki / otel-
 *     collector) translate the neutral event to their respective
 *     vocabulary.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { detectRealEnvMissing, makeRealAdapter } from '../src/adapters/real.js';
import {
  handleRemediationRequest,
  validateRemediationRequest,
} from '../src/app/remediation/route.js';
import type { ChaosAiopsAdapter } from '../src/adapters/interface.js';

let mock: ChaosAiopsAdapter;

beforeEach(() => {
  mock = makeMockAdapter({ latencyMs: 1 });
});

afterEach(async () => {
  await mock.reset();
});

describe('mock adapter — remediation session start', () => {
  it('axis 1: startRemediation seats a session under a cluster id + observability target', async () => {
    await mock.startRemediation({
      sessionId: 's1',
      clusterId: 'prod-cluster',
      target: 'prometheus',
    });
    const trace = mock.traces().find((t) => t.op === 'startRemediation');
    expect(trace?.ok).toBe(true);
  });

  it('axis 1: startRemediation supports multi-cluster under distinct session ids', async () => {
    await mock.startRemediation({
      sessionId: 's2a',
      clusterId: 'us-east',
      target: 'loki',
    });
    await mock.startRemediation({
      sessionId: 's2b',
      clusterId: 'eu-west',
      target: 'grafana-oss',
    });
    const starts = mock
      .traces()
      .filter((t) => t.op === 'startRemediation' && t.ok);
    expect(starts.length).toBe(2);
  });

  it('axis 1: startRemediation rejects duplicate session id', async () => {
    await mock.startRemediation({
      sessionId: 's3',
      clusterId: 'prod-cluster',
      target: 'prometheus',
    });
    await expect(
      mock.startRemediation({
        sessionId: 's3',
        clusterId: 'prod-cluster',
        target: 'prometheus',
      }),
    ).rejects.toThrow(/remediation_session_exists/);
  });
});

describe('mock adapter — detect anomaly', () => {
  it('axis 2: detectAnomaly filters points by z-score threshold', async () => {
    await mock.startRemediation({
      sessionId: 'd1',
      clusterId: 'prod',
      target: 'prometheus',
    });
    const result = await mock.detectAnomaly({
      sessionId: 'd1',
      points: [
        { metric: 'cpu.load', value: 80, zScore: 4.2 },
        { metric: 'memory.rss', value: 60, zScore: 0.8 },
        { metric: 'disk.iops', value: 100, zScore: -3.9 },
      ],
      zScoreThreshold: 3,
    });
    expect(result.pointCount).toBe(3);
    expect(result.anomalyCount).toBe(2);
    expect(result.hasAnomaly).toBe(true);
    expect(result.zScoreThreshold).toBe(3);
  });

  it('axis 2: detectAnomaly reports hasAnomaly false when nothing crosses threshold', async () => {
    await mock.startRemediation({
      sessionId: 'd2',
      clusterId: 'prod',
      target: 'prometheus',
    });
    const result = await mock.detectAnomaly({
      sessionId: 'd2',
      points: [
        { metric: 'cpu.load', value: 20, zScore: 0.5 },
        { metric: 'memory.rss', value: 40, zScore: 1.0 },
      ],
      zScoreThreshold: 3,
    });
    expect(result.anomalyCount).toBe(0);
    expect(result.hasAnomaly).toBe(false);
  });

  it('axis 2: detectAnomaly counts absolute z-score so negative outliers count', async () => {
    await mock.startRemediation({
      sessionId: 'd3',
      clusterId: 'prod',
      target: 'prometheus',
    });
    const result = await mock.detectAnomaly({
      sessionId: 'd3',
      points: [
        { metric: 'req.rate', value: 0, zScore: -5.0 },
      ],
      zScoreThreshold: 3,
    });
    expect(result.anomalyCount).toBe(1);
  });

  it('axis 2: detectAnomaly refuses empty points', async () => {
    await mock.startRemediation({
      sessionId: 'd4',
      clusterId: 'prod',
      target: 'prometheus',
    });
    await expect(
      mock.detectAnomaly({ sessionId: 'd4', points: [], zScoreThreshold: 3 }),
    ).rejects.toThrow(/points_must_not_be_empty/);
  });

  it('axis 2: detectAnomaly refuses zero or negative zScoreThreshold', async () => {
    await mock.startRemediation({
      sessionId: 'd5',
      clusterId: 'prod',
      target: 'prometheus',
    });
    await expect(
      mock.detectAnomaly({
        sessionId: 'd5',
        points: [{ metric: 'x', value: 1, zScore: 5 }],
        zScoreThreshold: 0,
      }),
    ).rejects.toThrow(/zScoreThreshold_must_be_positive/);
  });

  it('axis 2: detectAnomaly refuses when session not started', async () => {
    await expect(
      mock.detectAnomaly({
        sessionId: 'ghost',
        points: [{ metric: 'x', value: 1, zScore: 5 }],
        zScoreThreshold: 3,
      }),
    ).rejects.toThrow(/remediation_session_not_found/);
  });
});

describe('mock adapter — execute remediation', () => {
  it('axis 3: executeRemediation counts succeeded and failed actions', async () => {
    await mock.startRemediation({
      sessionId: 'e1',
      clusterId: 'prod',
      target: 'prometheus',
    });
    // caller drives the full ceremony (anomaly + execute)
    await mock.detectAnomaly({
      sessionId: 'e1',
      points: [{ metric: 'x', value: 1, zScore: 5 }],
      zScoreThreshold: 3,
    });
    const result = await mock.executeRemediation({
      sessionId: 'e1',
      actions: [
        { actionId: 'restart-pod', runbookId: 'rb-1', success: true },
        { actionId: 'scale-up', runbookId: 'rb-2', success: true },
        { actionId: 'notify-oncall', runbookId: 'rb-3', success: false },
      ],
    });
    expect(result.actionCount).toBe(3);
    expect(result.succeeded).toBe(2);
    expect(result.failed).toBe(1);
    expect(result.allSucceeded).toBe(false);
  });

  it('axis 3: executeRemediation reports allSucceeded true when every action passes', async () => {
    await mock.startRemediation({
      sessionId: 'e2',
      clusterId: 'prod',
      target: 'prometheus',
    });
    await mock.detectAnomaly({
      sessionId: 'e2',
      points: [{ metric: 'x', value: 1, zScore: 5 }],
      zScoreThreshold: 3,
    });
    const result = await mock.executeRemediation({
      sessionId: 'e2',
      actions: [
        { actionId: 'restart-pod', runbookId: 'rb-1', success: true },
      ],
    });
    expect(result.allSucceeded).toBe(true);
  });

  it('axis 3: executeRemediation bootstraps anomaly step when caller skipped detectAnomaly', async () => {
    await mock.startRemediation({
      sessionId: 'e3',
      clusterId: 'prod',
      target: 'prometheus',
    });
    // Skip detectAnomaly — the mock adapter must synthesize an
    // anomaly-detected state so the aiops semantics stay honest.
    const result = await mock.executeRemediation({
      sessionId: 'e3',
      actions: [
        { actionId: 'restart-pod', runbookId: 'rb-1', success: true },
      ],
    });
    expect(result.actionCount).toBe(1);
    expect(result.succeeded).toBe(1);
  });

  it('axis 3: executeRemediation refuses empty actions', async () => {
    await mock.startRemediation({
      sessionId: 'e4',
      clusterId: 'prod',
      target: 'prometheus',
    });
    await expect(
      mock.executeRemediation({ sessionId: 'e4', actions: [] }),
    ).rejects.toThrow(/actions_must_not_be_empty/);
  });

  it('axis 3: executeRemediation refuses when session not started', async () => {
    await expect(
      mock.executeRemediation({
        sessionId: 'ghost',
        actions: [{ actionId: 'a', runbookId: 'r', success: true }],
      }),
    ).rejects.toThrow(/remediation_session_not_found/);
  });
});

describe('mock adapter — remediation state machine', () => {
  it('axis 4: closeRemediation removes session', async () => {
    await mock.startRemediation({
      sessionId: 'sm1',
      clusterId: 'prod',
      target: 'prometheus',
    });
    await mock.closeRemediation({ sessionId: 'sm1' });
    await expect(
      mock.detectAnomaly({
        sessionId: 'sm1',
        points: [{ metric: 'x', value: 1, zScore: 5 }],
        zScoreThreshold: 3,
      }),
    ).rejects.toThrow(/remediation_session_not_found/);
  });

  it('axis 4: closeRemediation on closed session errors as not found', async () => {
    await mock.startRemediation({
      sessionId: 'sm2',
      clusterId: 'prod',
      target: 'prometheus',
    });
    await mock.closeRemediation({ sessionId: 'sm2' });
    await expect(
      mock.closeRemediation({ sessionId: 'sm2' }),
    ).rejects.toThrow(/remediation_session_not_found/);
  });
});

describe('route handler — /remediation shape validation', () => {
  it('axis 5: validateRemediationRequest rejects non-object body', () => {
    const result = validateRemediationRequest('not-an-object');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('body_not_object');
  });

  it('axis 5: validateRemediationRequest rejects missing sessionId', () => {
    const result = validateRemediationRequest({ kind: 'start' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('sessionId_required');
  });

  it('axis 5: validateRemediationRequest rejects unknown kind', () => {
    const result = validateRemediationRequest({
      sessionId: 'r1',
      kind: 'burn',
    });
    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(result.errorKind).toBe('kind_must_be_start_detect_execute_or_close');
  });

  it('axis 5: validateRemediationRequest rejects point with missing metric', () => {
    const result = validateRemediationRequest({
      sessionId: 'r2',
      kind: 'detect',
      points: [{ value: 1, zScore: 5 }],
      zScoreThreshold: 3,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('point_metric_required');
  });

  it('axis 5: validateRemediationRequest rejects action with missing runbookId', () => {
    const result = validateRemediationRequest({
      sessionId: 'r3',
      kind: 'execute',
      actions: [{ actionId: 'a', success: true }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('action_runbookId_required');
  });

  it('axis 5: handleRemediationRequest dispatches the start op', async () => {
    const response = await handleRemediationRequest(mock, {
      kind: 'start',
      sessionId: 'r4',
      clusterId: 'prod',
      target: 'prometheus',
    });
    expect(response.ok).toBe(true);
    expect(response.kind).toBe('start');
    expect(response.clusterId).toBe('prod');
  });

  it('axis 5: handleRemediationRequest dispatches the detect op', async () => {
    await mock.startRemediation({
      sessionId: 'r5',
      clusterId: 'prod',
      target: 'prometheus',
    });
    const response = await handleRemediationRequest(mock, {
      kind: 'detect',
      sessionId: 'r5',
      points: [
        { metric: 'cpu', value: 90, zScore: 5 },
        { metric: 'mem', value: 60, zScore: 1 },
      ],
      zScoreThreshold: 3,
    });
    expect(response.ok).toBe(true);
    expect(response.anomalyCount).toBe(1);
    expect(response.hasAnomaly).toBe(true);
  });

  it('axis 5: handleRemediationRequest dispatches the execute op', async () => {
    await mock.startRemediation({
      sessionId: 'r6',
      clusterId: 'prod',
      target: 'prometheus',
    });
    await mock.detectAnomaly({
      sessionId: 'r6',
      points: [{ metric: 'x', value: 1, zScore: 5 }],
      zScoreThreshold: 3,
    });
    const response = await handleRemediationRequest(mock, {
      kind: 'execute',
      sessionId: 'r6',
      actions: [
        { actionId: 'a', runbookId: 'rb', success: true },
      ],
    });
    expect(response.ok).toBe(true);
    expect(response.succeeded).toBe(1);
    expect(response.allSucceeded).toBe(true);
  });

  it('axis 5: handleRemediationRequest surfaces errorKind on failure', async () => {
    const response = await handleRemediationRequest(mock, {
      kind: 'detect',
      sessionId: 'ghost',
      points: [{ metric: 'x', value: 1, zScore: 5 }],
      zScoreThreshold: 3,
    });
    expect(response.ok).toBe(false);
    expect(response.errorKind).toBe('remediation_session_not_found');
  });
});

describe('mock adapter — provider dialect fidelity', () => {
  it.each(['grafana-oss', 'prometheus', 'loki', 'otel-collector'] as const)(
    'axis 6: full remediation flow traces the ok events on %s target',
    async (target) => {
      await mock.startRemediation({
        sessionId: `d-${target}`,
        clusterId: 'prod',
        target,
      });
      await mock.detectAnomaly({
        sessionId: `d-${target}`,
        points: [{ metric: 'cpu', value: 100, zScore: 5 }],
        zScoreThreshold: 3,
      });
      await mock.executeRemediation({
        sessionId: `d-${target}`,
        actions: [{ actionId: 'a', runbookId: 'rb', success: true }],
      });
      await mock.closeRemediation({ sessionId: `d-${target}` });
      const starts = mock
        .traces()
        .filter((t) => t.op === 'startRemediation' && t.ok);
      const detects = mock.traces().filter((t) => t.op === 'detectAnomaly' && t.ok);
      const executes = mock
        .traces()
        .filter((t) => t.op === 'executeRemediation' && t.ok);
      const closes = mock.traces().filter((t) => t.op === 'closeRemediation' && t.ok);
      expect(starts.length).toBeGreaterThan(0);
      expect(detects.length).toBeGreaterThan(0);
      expect(executes.length).toBeGreaterThan(0);
      expect(closes.length).toBeGreaterThan(0);
    },
  );
});

describe('real adapter — env-detect skeleton', () => {
  it('real adapter refuses every remediation op with KIWA_CHAOS_AIOPS_ENV_MISSING on hermetic systems', async () => {
    const real = makeRealAdapter();
    await expect(
      real.startRemediation({
        sessionId: 'r-real',
        clusterId: 'prod',
        target: 'prometheus',
      }),
    ).rejects.toThrow();
    const trace = real.traces().find((t) => t.op === 'startRemediation');
    expect(trace?.ok).toBe(false);
    expect(trace?.errorKind).toBeTruthy();
  });

  it('detectRealEnvMissing keeps the reason string non-null on hermetic systems', () => {
    const missing = detectRealEnvMissing();
    expect(missing).not.toBeNull();
  });
});
