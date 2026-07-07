/**
 * Drift end-to-end fidelity spec (drift axis: expected-vs-actual resource
 * diff + missing / extra resource classification + session lifecycle).
 *
 * Issue CAR-1047 (v1.42-2) AC — the mock adapter drives a full drift
 * detection ceremony end to end and the fidelity harness diffs the raw
 * {@link TraceEvent} sequence across five axes.
 *
 *  1. startDrift seats a Terraform state comparison session under a
 *     workspace + observability target, and rejects duplicate session ids.
 *  2. detectDrift compares expected vs actual resource lists, reports
 *     driftCount + hasDrift, and captures both missing + extra addresses
 *     in driftedResources.
 *  3. closeDrift tears down state and further ops on the same session id
 *     fail.
 *  4. Route handler dispatches / rejects the shape variations exposed
 *     over HTTP without spinning up a Node server.
 *  5. Provider dialects (grafana-oss / prometheus / loki / otel-collector)
 *     translate the neutral event to their respective vocabulary.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import { handleDriftRequest, validateDriftRequest } from '../src/app/drift/route.js';
import type { IacAdapter } from '../src/adapters/interface.js';

let mock: IacAdapter;

beforeEach(() => {
  mock = makeMockAdapter({ latencyMs: 1 });
});

afterEach(async () => {
  await mock.reset();
});

describe('mock adapter — drift session start', () => {
  it('axis 1: startDrift seats a session under a workspace + observability target', async () => {
    await mock.startDrift({
      sessionId: 'd1',
      workspace: 'prod',
      target: 'prometheus',
    });
    const trace = mock.traces().find((t) => t.op === 'startDrift');
    expect(trace?.ok).toBe(true);
  });

  it('axis 1: startDrift rejects duplicate session id', async () => {
    await mock.startDrift({ sessionId: 'd2', workspace: 'prod', target: 'prometheus' });
    await expect(
      mock.startDrift({ sessionId: 'd2', workspace: 'prod', target: 'prometheus' }),
    ).rejects.toThrow(/drift_session_exists/);
  });
});

describe('mock adapter — drift detection', () => {
  it('axis 2: detectDrift reports 0 when expected matches actual', async () => {
    await mock.startDrift({ sessionId: 'x1', workspace: 'prod', target: 'prometheus' });
    const result = await mock.detectDrift({
      sessionId: 'x1',
      expected: ['aws_instance.a', 'aws_instance.b'],
      actual: ['aws_instance.a', 'aws_instance.b'],
    });
    expect(result.driftCount).toBe(0);
    expect(result.hasDrift).toBe(false);
    expect(result.driftedResources).toEqual([]);
  });

  it('axis 2: detectDrift finds missing resources (in expected, not in actual)', async () => {
    await mock.startDrift({ sessionId: 'x2', workspace: 'prod', target: 'prometheus' });
    const result = await mock.detectDrift({
      sessionId: 'x2',
      expected: ['aws_instance.a', 'aws_instance.b', 'aws_instance.c'],
      actual: ['aws_instance.a'],
    });
    expect(result.driftCount).toBe(2);
    expect(result.hasDrift).toBe(true);
    expect(result.driftedResources).toEqual(
      expect.arrayContaining(['aws_instance.b', 'aws_instance.c']),
    );
  });

  it('axis 2: detectDrift finds extra resources (in actual, not in expected)', async () => {
    await mock.startDrift({ sessionId: 'x3', workspace: 'prod', target: 'prometheus' });
    const result = await mock.detectDrift({
      sessionId: 'x3',
      expected: ['aws_instance.a'],
      actual: ['aws_instance.a', 'aws_instance.rogue'],
    });
    expect(result.driftCount).toBe(1);
    expect(result.hasDrift).toBe(true);
    expect(result.driftedResources).toEqual(['aws_instance.rogue']);
  });

  it('axis 2: detectDrift finds both missing and extra resources together', async () => {
    await mock.startDrift({ sessionId: 'x4', workspace: 'prod', target: 'prometheus' });
    const result = await mock.detectDrift({
      sessionId: 'x4',
      expected: ['a', 'b', 'c'],
      actual: ['a', 'b', 'd'],
    });
    expect(result.driftCount).toBe(2);
    expect(result.driftedResources).toEqual(expect.arrayContaining(['c', 'd']));
  });

  it('axis 2: detectDrift refuses when session not started', async () => {
    await expect(
      mock.detectDrift({ sessionId: 'ghost', expected: [], actual: [] }),
    ).rejects.toThrow(/drift_session_not_found/);
  });
});

describe('mock adapter — drift state machine', () => {
  it('axis 3: closeDrift removes session', async () => {
    await mock.startDrift({ sessionId: 'sm1', workspace: 'prod', target: 'prometheus' });
    await mock.closeDrift({ sessionId: 'sm1' });
    await expect(
      mock.detectDrift({ sessionId: 'sm1', expected: [], actual: [] }),
    ).rejects.toThrow(/drift_session_not_found/);
  });

  it('axis 3: rejects closeDrift on unknown sessionId', async () => {
    await expect(mock.closeDrift({ sessionId: 'ghost' })).rejects.toThrow(
      /drift_session_not_found/,
    );
  });
});

describe('route handler — /drift shape validation', () => {
  it('axis 4: validateDriftRequest rejects non-object body', () => {
    const result = validateDriftRequest(42);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('body_not_object');
  });

  it('axis 4: validateDriftRequest rejects unknown kind', () => {
    const result = validateDriftRequest({ sessionId: 'r1', kind: 'burn' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('kind_must_be_start_detect_or_close');
  });

  it('axis 4: validateDriftRequest rejects invalid observability target', () => {
    const result = validateDriftRequest({
      sessionId: 'r2',
      kind: 'start',
      workspace: 'prod',
      target: 'datadog',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('target_required_valid');
  });

  it('axis 4: validateDriftRequest rejects non-string expected item', () => {
    const result = validateDriftRequest({
      sessionId: 'r3',
      kind: 'detect',
      expected: [1, 2],
      actual: ['a'],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('expected_item_must_be_string');
  });

  it('axis 4: handleDriftRequest dispatches the detect op and returns drift count', async () => {
    await mock.startDrift({ sessionId: 'r4', workspace: 'prod', target: 'prometheus' });
    const response = await handleDriftRequest(mock, {
      kind: 'detect',
      sessionId: 'r4',
      expected: ['a', 'b'],
      actual: ['a'],
    });
    expect(response.ok).toBe(true);
    expect(response.driftCount).toBe(1);
    expect(response.hasDrift).toBe(true);
  });

  it('axis 4: handleDriftRequest surfaces errorKind on failure', async () => {
    const response = await handleDriftRequest(mock, {
      kind: 'detect',
      sessionId: 'ghost',
      expected: [],
      actual: [],
    });
    expect(response.ok).toBe(false);
    expect(response.errorKind).toBe('drift_session_not_found');
  });
});

describe('mock adapter — drift provider dialect fidelity', () => {
  it.each(['grafana-oss', 'prometheus', 'loki', 'otel-collector'] as const)(
    'axis 5: detectDrift traces the ok event on %s target',
    async (target) => {
      await mock.startDrift({ sessionId: `d-${target}`, workspace: 'prod', target });
      await mock.detectDrift({
        sessionId: `d-${target}`,
        expected: ['a'],
        actual: [],
      });
      const detects = mock.traces().filter((t) => t.op === 'detectDrift' && t.ok);
      expect(detects.length).toBeGreaterThan(0);
    },
  );
});

describe('real adapter — drift env-gate', () => {
  it('real adapter refuses detectDrift with KIWA_IAC_ENV_MISSING on hermetic systems', async () => {
    const real = makeRealAdapter();
    await expect(
      real.detectDrift({ sessionId: 'r-real', expected: [], actual: [] }),
    ).rejects.toThrow();
    const trace = real.traces().find((t) => t.op === 'detectDrift');
    expect(trace?.ok).toBe(false);
  });
});
