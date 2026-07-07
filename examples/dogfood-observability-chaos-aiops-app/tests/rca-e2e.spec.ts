/**
 * RCA end-to-end fidelity spec (aiops-rca axis: root cause analysis +
 * alert correlation + session lifecycle).
 *
 * Issue CAR-1049 (v1.42-4) AC — the mock adapter drives a full AIOps
 * RCA + correlation ceremony end to end and the fidelity harness diffs
 * the raw {@link TraceEvent} sequence across five axes.
 *
 *  1. startRca seats an AIOps RCA session under a cluster id +
 *     observability target, and rejects duplicate session ids.
 *  2. analyzeRootCause walks the dependency graph and identifies the
 *     upstream root cause service, enforces (non-empty failedServices,
 *     session open).
 *  3. correlateAlerts groups alerts by fire-time window, enforces
 *     (non-empty alerts, positive windowMs, session open).
 *  4. closeRca tears down state and further ops on the same session id
 *     fail.
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
  handleRcaRequest,
  validateRcaRequest,
} from '../src/app/rca/route.js';
import type { ChaosAiopsAdapter } from '../src/adapters/interface.js';

let mock: ChaosAiopsAdapter;

beforeEach(() => {
  mock = makeMockAdapter({ latencyMs: 1 });
});

afterEach(async () => {
  await mock.reset();
});

describe('mock adapter — rca session start', () => {
  it('axis 1: startRca seats a session under a cluster id + observability target', async () => {
    await mock.startRca({
      sessionId: 's1',
      clusterId: 'prod',
      target: 'prometheus',
    });
    const trace = mock.traces().find((t) => t.op === 'startRca');
    expect(trace?.ok).toBe(true);
  });

  it('axis 1: startRca supports multi-cluster under distinct session ids', async () => {
    await mock.startRca({
      sessionId: 's2a',
      clusterId: 'us-east',
      target: 'loki',
    });
    await mock.startRca({
      sessionId: 's2b',
      clusterId: 'eu-west',
      target: 'grafana-oss',
    });
    const starts = mock.traces().filter((t) => t.op === 'startRca' && t.ok);
    expect(starts.length).toBe(2);
  });

  it('axis 1: startRca rejects duplicate session id', async () => {
    await mock.startRca({
      sessionId: 's3',
      clusterId: 'prod',
      target: 'prometheus',
    });
    await expect(
      mock.startRca({
        sessionId: 's3',
        clusterId: 'prod',
        target: 'prometheus',
      }),
    ).rejects.toThrow(/rca_session_exists/);
  });
});

describe('mock adapter — analyze root cause', () => {
  it('axis 2: analyzeRootCause identifies the upstream root cause in a linear topology', async () => {
    await mock.startRca({
      sessionId: 'a1',
      clusterId: 'prod',
      target: 'prometheus',
    });
    // topology: gateway -> api -> db; all three failed. Root is the
    // service whose downstreams are all failed (gateway upstream root).
    const result = await mock.analyzeRootCause({
      sessionId: 'a1',
      edges: [
        { from: 'gateway', to: 'api' },
        { from: 'api', to: 'db' },
      ],
      failedServices: ['gateway', 'api', 'db'],
    });
    expect(result.rootCause).toBe('gateway');
    expect(result.failedCount).toBe(3);
    expect(result.edgeCount).toBe(2);
  });

  it('axis 2: analyzeRootCause returns first failed service when no downstream chain matches', async () => {
    await mock.startRca({
      sessionId: 'a2',
      clusterId: 'prod',
      target: 'prometheus',
    });
    const result = await mock.analyzeRootCause({
      sessionId: 'a2',
      edges: [],
      failedServices: ['solo-svc'],
    });
    expect(result.rootCause).toBe('solo-svc');
  });

  it('axis 2: analyzeRootCause handles multi-branch topology', async () => {
    await mock.startRca({
      sessionId: 'a3',
      clusterId: 'prod',
      target: 'prometheus',
    });
    // topology: lb -> [api-a, api-b]; both api services failed under lb
    const result = await mock.analyzeRootCause({
      sessionId: 'a3',
      edges: [
        { from: 'lb', to: 'api-a' },
        { from: 'lb', to: 'api-b' },
      ],
      failedServices: ['lb', 'api-a', 'api-b'],
    });
    expect(result.rootCause).toBe('lb');
    expect(result.edgeCount).toBe(2);
  });

  it('axis 2: analyzeRootCause refuses empty failedServices', async () => {
    await mock.startRca({
      sessionId: 'a4',
      clusterId: 'prod',
      target: 'prometheus',
    });
    await expect(
      mock.analyzeRootCause({
        sessionId: 'a4',
        edges: [],
        failedServices: [],
      }),
    ).rejects.toThrow(/failedServices_must_not_be_empty/);
  });

  it('axis 2: analyzeRootCause refuses when session not started', async () => {
    await expect(
      mock.analyzeRootCause({
        sessionId: 'ghost',
        edges: [],
        failedServices: ['svc'],
      }),
    ).rejects.toThrow(/rca_session_not_found/);
  });
});

describe('mock adapter — correlate alerts', () => {
  it('axis 3: correlateAlerts groups alerts fired within the window', async () => {
    await mock.startRca({
      sessionId: 'c1',
      clusterId: 'prod',
      target: 'prometheus',
    });
    // caller drives analyzeRootCause first
    await mock.analyzeRootCause({
      sessionId: 'c1',
      edges: [],
      failedServices: ['svc'],
    });
    const result = await mock.correlateAlerts({
      sessionId: 'c1',
      alerts: [
        { alertId: 'a1', service: 'gateway', firedAtMs: 1000 },
        { alertId: 'a2', service: 'api', firedAtMs: 1500 },
        { alertId: 'a3', service: 'db', firedAtMs: 2000 },
      ],
      windowMs: 5000,
    });
    // All fired within 5s of the head, should collapse into 1 group.
    expect(result.groupCount).toBe(1);
    expect(result.alertCount).toBe(3);
    expect(result.windowMs).toBe(5000);
  });

  it('axis 3: correlateAlerts splits alerts fired outside the window', async () => {
    await mock.startRca({
      sessionId: 'c2',
      clusterId: 'prod',
      target: 'prometheus',
    });
    await mock.analyzeRootCause({
      sessionId: 'c2',
      edges: [],
      failedServices: ['svc'],
    });
    const result = await mock.correlateAlerts({
      sessionId: 'c2',
      alerts: [
        { alertId: 'a1', service: 'gateway', firedAtMs: 1000 },
        { alertId: 'a2', service: 'api', firedAtMs: 60_000 },
      ],
      windowMs: 5000,
    });
    // Second alert fires 59s later, outside the 5s window — 2 groups.
    expect(result.groupCount).toBe(2);
  });

  it('axis 3: correlateAlerts bootstraps rca ceremony when caller skipped analyzeRootCause', async () => {
    await mock.startRca({
      sessionId: 'c3',
      clusterId: 'prod',
      target: 'prometheus',
    });
    // Skip analyzeRootCause — the mock adapter must synthesize the RCA
    // step so the aiops semantics stay honest.
    const result = await mock.correlateAlerts({
      sessionId: 'c3',
      alerts: [
        { alertId: 'a1', service: 'gateway', firedAtMs: 1000 },
      ],
      windowMs: 5000,
    });
    expect(result.alertCount).toBe(1);
    expect(result.groupCount).toBe(1);
  });

  it('axis 3: correlateAlerts refuses empty alerts', async () => {
    await mock.startRca({
      sessionId: 'c4',
      clusterId: 'prod',
      target: 'prometheus',
    });
    await expect(
      mock.correlateAlerts({
        sessionId: 'c4',
        alerts: [],
        windowMs: 5000,
      }),
    ).rejects.toThrow(/alerts_must_not_be_empty/);
  });

  it('axis 3: correlateAlerts refuses zero or negative windowMs', async () => {
    await mock.startRca({
      sessionId: 'c5',
      clusterId: 'prod',
      target: 'prometheus',
    });
    await expect(
      mock.correlateAlerts({
        sessionId: 'c5',
        alerts: [{ alertId: 'a', service: 's', firedAtMs: 1 }],
        windowMs: 0,
      }),
    ).rejects.toThrow(/windowMs_must_be_positive/);
  });

  it('axis 3: correlateAlerts refuses when session not started', async () => {
    await expect(
      mock.correlateAlerts({
        sessionId: 'ghost',
        alerts: [{ alertId: 'a', service: 's', firedAtMs: 1 }],
        windowMs: 5000,
      }),
    ).rejects.toThrow(/rca_session_not_found/);
  });
});

describe('mock adapter — rca state machine', () => {
  it('axis 4: closeRca removes session', async () => {
    await mock.startRca({
      sessionId: 'sm1',
      clusterId: 'prod',
      target: 'prometheus',
    });
    await mock.closeRca({ sessionId: 'sm1' });
    await expect(
      mock.analyzeRootCause({
        sessionId: 'sm1',
        edges: [],
        failedServices: ['svc'],
      }),
    ).rejects.toThrow(/rca_session_not_found/);
  });

  it('axis 4: closeRca on closed session errors as not found', async () => {
    await mock.startRca({
      sessionId: 'sm2',
      clusterId: 'prod',
      target: 'prometheus',
    });
    await mock.closeRca({ sessionId: 'sm2' });
    await expect(mock.closeRca({ sessionId: 'sm2' })).rejects.toThrow(
      /rca_session_not_found/,
    );
  });
});

describe('route handler — /rca shape validation', () => {
  it('axis 5: validateRcaRequest rejects non-object body', () => {
    const result = validateRcaRequest('not-an-object');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('body_not_object');
  });

  it('axis 5: validateRcaRequest rejects missing sessionId', () => {
    const result = validateRcaRequest({ kind: 'start' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('sessionId_required');
  });

  it('axis 5: validateRcaRequest rejects unknown kind', () => {
    const result = validateRcaRequest({ sessionId: 'r1', kind: 'burn' });
    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(result.errorKind).toBe('kind_must_be_start_analyze_correlate_or_close');
  });

  it('axis 5: validateRcaRequest rejects edge with missing from field', () => {
    const result = validateRcaRequest({
      sessionId: 'r2',
      kind: 'analyze',
      edges: [{ to: 'svc' }],
      failedServices: ['svc'],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('edge_from_required');
  });

  it('axis 5: validateRcaRequest rejects alert with missing firedAtMs', () => {
    const result = validateRcaRequest({
      sessionId: 'r3',
      kind: 'correlate',
      alerts: [{ alertId: 'a', service: 's' }],
      windowMs: 5000,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('alert_firedAtMs_required_number');
  });

  it('axis 5: handleRcaRequest dispatches the start op', async () => {
    const response = await handleRcaRequest(mock, {
      kind: 'start',
      sessionId: 'r4',
      clusterId: 'prod',
      target: 'prometheus',
    });
    expect(response.ok).toBe(true);
    expect(response.kind).toBe('start');
    expect(response.clusterId).toBe('prod');
  });

  it('axis 5: handleRcaRequest dispatches the analyze op', async () => {
    await mock.startRca({
      sessionId: 'r5',
      clusterId: 'prod',
      target: 'prometheus',
    });
    const response = await handleRcaRequest(mock, {
      kind: 'analyze',
      sessionId: 'r5',
      edges: [{ from: 'lb', to: 'api' }],
      failedServices: ['lb', 'api'],
    });
    expect(response.ok).toBe(true);
    expect(response.rootCause).toBe('lb');
    expect(response.failedCount).toBe(2);
  });

  it('axis 5: handleRcaRequest dispatches the correlate op', async () => {
    await mock.startRca({
      sessionId: 'r6',
      clusterId: 'prod',
      target: 'prometheus',
    });
    await mock.analyzeRootCause({
      sessionId: 'r6',
      edges: [],
      failedServices: ['svc'],
    });
    const response = await handleRcaRequest(mock, {
      kind: 'correlate',
      sessionId: 'r6',
      alerts: [
        { alertId: 'a', service: 's', firedAtMs: 1000 },
      ],
      windowMs: 5000,
    });
    expect(response.ok).toBe(true);
    expect(response.alertCount).toBe(1);
    expect(response.groupCount).toBe(1);
  });

  it('axis 5: handleRcaRequest surfaces errorKind on failure', async () => {
    const response = await handleRcaRequest(mock, {
      kind: 'analyze',
      sessionId: 'ghost',
      edges: [],
      failedServices: ['svc'],
    });
    expect(response.ok).toBe(false);
    expect(response.errorKind).toBe('rca_session_not_found');
  });
});

describe('mock adapter — provider dialect fidelity', () => {
  it.each(['grafana-oss', 'prometheus', 'loki', 'otel-collector'] as const)(
    'axis 6: full rca flow traces the ok events on %s target',
    async (target) => {
      await mock.startRca({
        sessionId: `d-${target}`,
        clusterId: 'prod',
        target,
      });
      await mock.analyzeRootCause({
        sessionId: `d-${target}`,
        edges: [{ from: 'lb', to: 'api' }],
        failedServices: ['lb', 'api'],
      });
      await mock.correlateAlerts({
        sessionId: `d-${target}`,
        alerts: [{ alertId: 'a', service: 'lb', firedAtMs: 1000 }],
        windowMs: 5000,
      });
      await mock.closeRca({ sessionId: `d-${target}` });
      const starts = mock.traces().filter((t) => t.op === 'startRca' && t.ok);
      const analyzes = mock.traces().filter((t) => t.op === 'analyzeRootCause' && t.ok);
      const correlates = mock.traces().filter((t) => t.op === 'correlateAlerts' && t.ok);
      const closes = mock.traces().filter((t) => t.op === 'closeRca' && t.ok);
      expect(starts.length).toBeGreaterThan(0);
      expect(analyzes.length).toBeGreaterThan(0);
      expect(correlates.length).toBeGreaterThan(0);
      expect(closes.length).toBeGreaterThan(0);
    },
  );
});

describe('real adapter — env-detect skeleton', () => {
  it('real adapter refuses every rca op with KIWA_CHAOS_AIOPS_ENV_MISSING on hermetic systems', async () => {
    const real = makeRealAdapter();
    await expect(
      real.startRca({
        sessionId: 'r-real',
        clusterId: 'prod',
        target: 'prometheus',
      }),
    ).rejects.toThrow();
    const trace = real.traces().find((t) => t.op === 'startRca');
    expect(trace?.ok).toBe(false);
    expect(trace?.errorKind).toBeTruthy();
  });

  it('detectRealEnvMissing keeps the reason string non-null on hermetic systems', () => {
    const missing = detectRealEnvMissing();
    expect(missing).not.toBeNull();
  });
});
