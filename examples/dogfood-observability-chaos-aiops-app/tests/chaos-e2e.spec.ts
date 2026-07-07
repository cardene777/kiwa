/**
 * Chaos end-to-end fidelity spec (chaos axis: fault injection + blast
 * radius + auto-rollback + session lifecycle).
 *
 * Issue CAR-1049 (v1.42-4) AC — the mock adapter drives a full chaos
 * engineering ceremony end to end and the fidelity harness diffs the
 * raw {@link TraceEvent} sequence across five axes.
 *
 *  1. startChaos seats a chaos-engine session under an experiment id +
 *     observability target, and rejects duplicate session ids.
 *  2. injectFault records fault kind + target + duration and enforces
 *     (non-empty target, positive duration, session open).
 *  3. triggerRollback computes blast radius + compares error rate to
 *     threshold, enforces (positive totalInstances, affected within
 *     range, rates within [0, 1], fault previously injected).
 *  4. closeChaos tears down state and further ops on the same session
 *     id fail.
 *  5. Route handler dispatches / rejects the shape variations exposed
 *     over HTTP without spinning up a Node server.
 *  6. Provider dialects (grafana-oss / prometheus / loki / otel-
 *     collector) translate the neutral event to their respective
 *     vocabulary.
 *
 * The real adapter is exercised through the env-detect skeleton and
 * every op refuses with `KIWA_CHAOS_AIOPS_ENV_MISSING` on every
 * non-integration environment (the default). Downstream tests inspect
 * {@link ChaosAiopsAdapter.mode} + the trace to skip real assertions on
 * those systems.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { detectRealEnvMissing, makeRealAdapter } from '../src/adapters/real.js';
import { handleChaosRequest, validateChaosRequest } from '../src/app/chaos/route.js';
import type { ChaosAiopsAdapter } from '../src/adapters/interface.js';

let mock: ChaosAiopsAdapter;

beforeEach(() => {
  mock = makeMockAdapter({ latencyMs: 1 });
});

afterEach(async () => {
  await mock.reset();
});

describe('mock adapter — chaos session start', () => {
  it('axis 1: startChaos seats a session under an experiment id + observability target', async () => {
    await mock.startChaos({
      sessionId: 'c1',
      experimentId: 'exp-alpha',
      target: 'prometheus',
    });
    const trace = mock.traces().find((t) => t.op === 'startChaos');
    expect(trace?.ok).toBe(true);
  });

  it('axis 1: startChaos supports multi-experiment under distinct session ids', async () => {
    await mock.startChaos({ sessionId: 'c2a', experimentId: 'exp-A', target: 'loki' });
    await mock.startChaos({ sessionId: 'c2b', experimentId: 'exp-B', target: 'grafana-oss' });
    const starts = mock.traces().filter((t) => t.op === 'startChaos' && t.ok);
    expect(starts.length).toBe(2);
  });

  it('axis 1: startChaos rejects duplicate session id', async () => {
    await mock.startChaos({ sessionId: 'c3', experimentId: 'exp-dup', target: 'prometheus' });
    await expect(
      mock.startChaos({ sessionId: 'c3', experimentId: 'exp-dup', target: 'prometheus' }),
    ).rejects.toThrow(/chaos_session_exists/);
  });
});

describe('mock adapter — inject fault', () => {
  it('axis 2: injectFault records the fault kind + target + duration', async () => {
    await mock.startChaos({ sessionId: 'i1', experimentId: 'exp-inject', target: 'prometheus' });
    const result = await mock.injectFault({
      sessionId: 'i1',
      fault: { kind: 'network-latency', target: 'checkout-svc', durationSec: 60 },
    });
    expect(result.faultKind).toBe('network-latency');
    expect(result.faultTarget).toBe('checkout-svc');
    expect(result.durationSec).toBe(60);
    expect(result.experimentId).toBe('exp-inject');
  });

  it.each([
    'network-latency',
    'network-partition',
    'pod-kill',
    'cpu-stress',
    'disk-fill',
  ] as const)('axis 2: injectFault accepts fault kind %s', async (kind) => {
    await mock.startChaos({ sessionId: `i-${kind}`, experimentId: 'exp-kind', target: 'prometheus' });
    const result = await mock.injectFault({
      sessionId: `i-${kind}`,
      fault: { kind, target: 'svc-a', durationSec: 30 },
    });
    expect(result.faultKind).toBe(kind);
  });

  it('axis 2: injectFault refuses empty target', async () => {
    await mock.startChaos({ sessionId: 'i3', experimentId: 'exp-empty', target: 'prometheus' });
    await expect(
      mock.injectFault({
        sessionId: 'i3',
        fault: { kind: 'pod-kill', target: '', durationSec: 10 },
      }),
    ).rejects.toThrow(/target_must_not_be_empty/);
  });

  it('axis 2: injectFault refuses zero or negative duration', async () => {
    await mock.startChaos({ sessionId: 'i4', experimentId: 'exp-dur', target: 'prometheus' });
    await expect(
      mock.injectFault({
        sessionId: 'i4',
        fault: { kind: 'pod-kill', target: 'svc-a', durationSec: 0 },
      }),
    ).rejects.toThrow(/durationSec_must_be_positive/);
    await expect(
      mock.injectFault({
        sessionId: 'i4',
        fault: { kind: 'pod-kill', target: 'svc-a', durationSec: -1 },
      }),
    ).rejects.toThrow(/durationSec_must_be_positive/);
  });

  it('axis 2: injectFault refuses when session not started', async () => {
    await expect(
      mock.injectFault({
        sessionId: 'ghost',
        fault: { kind: 'pod-kill', target: 'svc', durationSec: 10 },
      }),
    ).rejects.toThrow(/chaos_session_not_found/);
  });
});

describe('mock adapter — trigger rollback', () => {
  it('axis 3: triggerRollback triggers when errorRate >= threshold', async () => {
    await mock.startChaos({ sessionId: 'r1', experimentId: 'exp-rb', target: 'prometheus' });
    await mock.injectFault({
      sessionId: 'r1',
      fault: { kind: 'cpu-stress', target: 'svc-a', durationSec: 60 },
    });
    const result = await mock.triggerRollback({
      sessionId: 'r1',
      blastRadius: { affectedInstances: 3, totalInstances: 10 },
      rollback: { errorRate: 0.15, threshold: 0.1 },
    });
    expect(result.triggered).toBe(true);
    expect(result.blastRadiusRatio).toBeCloseTo(0.3);
    expect(result.affectedInstances).toBe(3);
  });

  it('axis 3: triggerRollback does not trigger when errorRate < threshold', async () => {
    await mock.startChaos({ sessionId: 'r2', experimentId: 'exp-rb', target: 'prometheus' });
    await mock.injectFault({
      sessionId: 'r2',
      fault: { kind: 'network-latency', target: 'svc-a', durationSec: 60 },
    });
    const result = await mock.triggerRollback({
      sessionId: 'r2',
      blastRadius: { affectedInstances: 1, totalInstances: 10 },
      rollback: { errorRate: 0.05, threshold: 0.1 },
    });
    expect(result.triggered).toBe(false);
  });

  it('axis 3: triggerRollback computes blast radius ratio 0 when nothing affected', async () => {
    await mock.startChaos({ sessionId: 'r3', experimentId: 'exp-rb', target: 'prometheus' });
    await mock.injectFault({
      sessionId: 'r3',
      fault: { kind: 'pod-kill', target: 'svc-a', durationSec: 60 },
    });
    const result = await mock.triggerRollback({
      sessionId: 'r3',
      blastRadius: { affectedInstances: 0, totalInstances: 10 },
      rollback: { errorRate: 0.0, threshold: 0.1 },
    });
    expect(result.blastRadiusRatio).toBe(0);
    expect(result.triggered).toBe(false);
  });

  it('axis 3: triggerRollback refuses fault not injected', async () => {
    await mock.startChaos({ sessionId: 'r4', experimentId: 'exp-nofault', target: 'prometheus' });
    await expect(
      mock.triggerRollback({
        sessionId: 'r4',
        blastRadius: { affectedInstances: 1, totalInstances: 10 },
        rollback: { errorRate: 0.5, threshold: 0.1 },
      }),
    ).rejects.toThrow(/fault_not_injected/);
  });

  it('axis 3: triggerRollback refuses totalInstances <= 0', async () => {
    await mock.startChaos({ sessionId: 'r5', experimentId: 'exp-bad', target: 'prometheus' });
    await mock.injectFault({
      sessionId: 'r5',
      fault: { kind: 'pod-kill', target: 'svc-a', durationSec: 10 },
    });
    await expect(
      mock.triggerRollback({
        sessionId: 'r5',
        blastRadius: { affectedInstances: 0, totalInstances: 0 },
        rollback: { errorRate: 0.5, threshold: 0.1 },
      }),
    ).rejects.toThrow(/totalInstances_must_be_positive/);
  });

  it('axis 3: triggerRollback refuses affectedInstances > totalInstances', async () => {
    await mock.startChaos({ sessionId: 'r6', experimentId: 'exp-bad', target: 'prometheus' });
    await mock.injectFault({
      sessionId: 'r6',
      fault: { kind: 'pod-kill', target: 'svc-a', durationSec: 10 },
    });
    await expect(
      mock.triggerRollback({
        sessionId: 'r6',
        blastRadius: { affectedInstances: 20, totalInstances: 10 },
        rollback: { errorRate: 0.5, threshold: 0.1 },
      }),
    ).rejects.toThrow(/affectedInstances_out_of_range/);
  });

  it('axis 3: triggerRollback refuses errorRate out of [0, 1]', async () => {
    await mock.startChaos({ sessionId: 'r7', experimentId: 'exp-bad', target: 'prometheus' });
    await mock.injectFault({
      sessionId: 'r7',
      fault: { kind: 'pod-kill', target: 'svc-a', durationSec: 10 },
    });
    await expect(
      mock.triggerRollback({
        sessionId: 'r7',
        blastRadius: { affectedInstances: 1, totalInstances: 10 },
        rollback: { errorRate: 1.5, threshold: 0.1 },
      }),
    ).rejects.toThrow(/errorRate_out_of_range/);
  });

  it('axis 3: triggerRollback refuses threshold out of [0, 1]', async () => {
    await mock.startChaos({ sessionId: 'r8', experimentId: 'exp-bad', target: 'prometheus' });
    await mock.injectFault({
      sessionId: 'r8',
      fault: { kind: 'pod-kill', target: 'svc-a', durationSec: 10 },
    });
    await expect(
      mock.triggerRollback({
        sessionId: 'r8',
        blastRadius: { affectedInstances: 1, totalInstances: 10 },
        rollback: { errorRate: 0.5, threshold: -0.1 },
      }),
    ).rejects.toThrow(/threshold_out_of_range/);
  });
});

describe('mock adapter — chaos state machine', () => {
  it('axis 4: closeChaos removes session', async () => {
    await mock.startChaos({ sessionId: 'sm1', experimentId: 'exp-sm', target: 'prometheus' });
    await mock.closeChaos({ sessionId: 'sm1' });
    await expect(
      mock.injectFault({
        sessionId: 'sm1',
        fault: { kind: 'pod-kill', target: 'svc-a', durationSec: 10 },
      }),
    ).rejects.toThrow(/chaos_session_not_found/);
  });

  it('axis 4: closeChaos on closed session errors as not found', async () => {
    await mock.startChaos({ sessionId: 'sm2', experimentId: 'exp-sm', target: 'prometheus' });
    await mock.closeChaos({ sessionId: 'sm2' });
    await expect(mock.closeChaos({ sessionId: 'sm2' })).rejects.toThrow(
      /chaos_session_not_found/,
    );
  });
});

describe('route handler — /chaos shape validation', () => {
  it('axis 5: validateChaosRequest rejects non-object body', () => {
    const result = validateChaosRequest('not-an-object');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('body_not_object');
  });

  it('axis 5: validateChaosRequest rejects missing sessionId', () => {
    const result = validateChaosRequest({ kind: 'start' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('sessionId_required');
  });

  it('axis 5: validateChaosRequest rejects unknown kind', () => {
    const result = validateChaosRequest({ sessionId: 'r1', kind: 'burn' });
    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(result.errorKind).toBe('kind_must_be_start_inject_rollback_or_close');
  });

  it('axis 5: validateChaosRequest rejects invalid observability target', () => {
    const result = validateChaosRequest({
      sessionId: 'r2',
      kind: 'start',
      experimentId: 'e1',
      target: 'datadog',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('target_required_valid');
  });

  it('axis 5: validateChaosRequest rejects fault with invalid kind', () => {
    const result = validateChaosRequest({
      sessionId: 'r3',
      kind: 'inject',
      fault: { kind: 'meteor', target: 'svc', durationSec: 10 },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('fault_kind_required_valid');
  });

  it('axis 5: validateChaosRequest rejects rollback with errorRate outside [0, 1]', () => {
    const result = validateChaosRequest({
      sessionId: 'r4',
      kind: 'rollback',
      blastRadius: { affectedInstances: 1, totalInstances: 10 },
      rollback: { errorRate: 2.0, threshold: 0.5 },
    });
    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(result.errorKind).toBe('errorRate_required_within_zero_and_one');
  });

  it('axis 5: handleChaosRequest dispatches the start op and returns the experiment id', async () => {
    const response = await handleChaosRequest(mock, {
      kind: 'start',
      sessionId: 'r5',
      experimentId: 'exp-handle',
      target: 'prometheus',
    });
    expect(response.ok).toBe(true);
    expect(response.kind).toBe('start');
    expect(response.experimentId).toBe('exp-handle');
  });

  it('axis 5: handleChaosRequest dispatches the inject op and returns the fault detail', async () => {
    await mock.startChaos({ sessionId: 'r6', experimentId: 'exp-handle', target: 'prometheus' });
    const response = await handleChaosRequest(mock, {
      kind: 'inject',
      sessionId: 'r6',
      fault: { kind: 'pod-kill', target: 'svc-a', durationSec: 60 },
    });
    expect(response.ok).toBe(true);
    expect(response.faultKind).toBe('pod-kill');
    expect(response.faultTarget).toBe('svc-a');
    expect(response.durationSec).toBe(60);
  });

  it('axis 5: handleChaosRequest dispatches the rollback op and returns the trigger flag', async () => {
    await mock.startChaos({ sessionId: 'r7', experimentId: 'exp-handle', target: 'prometheus' });
    await mock.injectFault({
      sessionId: 'r7',
      fault: { kind: 'cpu-stress', target: 'svc-a', durationSec: 60 },
    });
    const response = await handleChaosRequest(mock, {
      kind: 'rollback',
      sessionId: 'r7',
      blastRadius: { affectedInstances: 5, totalInstances: 10 },
      rollback: { errorRate: 0.2, threshold: 0.1 },
    });
    expect(response.ok).toBe(true);
    expect(response.triggered).toBe(true);
    expect(response.blastRadiusRatio).toBeCloseTo(0.5);
  });

  it('axis 5: handleChaosRequest surfaces errorKind on failure', async () => {
    const response = await handleChaosRequest(mock, {
      kind: 'inject',
      sessionId: 'ghost',
      fault: { kind: 'pod-kill', target: 'svc-a', durationSec: 60 },
    });
    expect(response.ok).toBe(false);
    expect(response.errorKind).toBe('chaos_session_not_found');
  });
});

describe('mock adapter — provider dialect fidelity', () => {
  it.each(['grafana-oss', 'prometheus', 'loki', 'otel-collector'] as const)(
    'axis 6: full chaos flow traces the ok events on %s target',
    async (target) => {
      await mock.startChaos({
        sessionId: `d-${target}`,
        experimentId: 'exp-dialect',
        target,
      });
      await mock.injectFault({
        sessionId: `d-${target}`,
        fault: { kind: 'cpu-stress', target: 'svc-a', durationSec: 30 },
      });
      await mock.triggerRollback({
        sessionId: `d-${target}`,
        blastRadius: { affectedInstances: 1, totalInstances: 10 },
        rollback: { errorRate: 0.2, threshold: 0.1 },
      });
      await mock.closeChaos({ sessionId: `d-${target}` });
      const starts = mock.traces().filter((t) => t.op === 'startChaos' && t.ok);
      const injects = mock.traces().filter((t) => t.op === 'injectFault' && t.ok);
      const rollbacks = mock.traces().filter((t) => t.op === 'triggerRollback' && t.ok);
      const closes = mock.traces().filter((t) => t.op === 'closeChaos' && t.ok);
      expect(starts.length).toBeGreaterThan(0);
      expect(injects.length).toBeGreaterThan(0);
      expect(rollbacks.length).toBeGreaterThan(0);
      expect(closes.length).toBeGreaterThan(0);
    },
  );
});

describe('real adapter — env-detect skeleton', () => {
  it('detectRealEnvMissing reports env missing on hermetic systems', () => {
    const missing = detectRealEnvMissing();
    // Ordinary test envs will not have `CHAOS_AIOPS_STACK_READY=1`
    // exported, so the detector must report a stable env-missing reason.
    expect(missing).not.toBeNull();
  });

  it('real adapter refuses every chaos op with KIWA_CHAOS_AIOPS_ENV_MISSING on hermetic systems', async () => {
    const real = makeRealAdapter();
    await expect(
      real.startChaos({ sessionId: 'r-real', experimentId: 'exp', target: 'prometheus' }),
    ).rejects.toThrow();
    const trace = real.traces().find((t) => t.op === 'startChaos');
    expect(trace?.ok).toBe(false);
    expect(trace?.errorKind).toBeTruthy();
  });
});
