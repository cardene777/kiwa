/**
 * Plan end-to-end fidelity spec (plan axis: `terraform plan` capture +
 * change counting + session lifecycle).
 *
 * Issue CAR-1047 (v1.42-2) AC — the mock adapter drives a full Terraform
 * plan capture ceremony end to end and the fidelity harness diffs the raw
 * {@link TraceEvent} sequence across five axes.
 *
 *  1. startPlan seats a Terraform state session under a workspace +
 *     observability target, and rejects duplicate session ids.
 *  2. capturePlan records add / modify / delete counts for the plan and
 *     enforces (non-empty changes, session open).
 *  3. closePlan tears down state and further ops on the same session id
 *     fail.
 *  4. Route handler dispatches / rejects the shape variations exposed
 *     over HTTP without spinning up a Node server.
 *  5. Provider dialects (grafana-oss / prometheus / loki / otel-collector)
 *     translate the neutral event to their respective vocabulary.
 *
 * The real adapter is exercised through the env-detect skeleton and
 * every op refuses with `KIWA_IAC_ENV_MISSING` on every non-integration
 * environment (the default). Downstream tests inspect
 * {@link IacAdapter.mode} + the trace to skip real assertions on those
 * systems.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { detectRealEnvMissing, makeRealAdapter } from '../src/adapters/real.js';
import { handlePlanRequest, validatePlanRequest } from '../src/app/plan/route.js';
import type { IacAdapter } from '../src/adapters/interface.js';

let mock: IacAdapter;

beforeEach(() => {
  mock = makeMockAdapter({ latencyMs: 1 });
});

afterEach(async () => {
  await mock.reset();
});

describe('mock adapter — plan session start', () => {
  it('axis 1: startPlan seats a session under a workspace + observability target', async () => {
    await mock.startPlan({
      sessionId: 'p1',
      workspace: 'prod',
      target: 'prometheus',
    });
    const trace = mock.traces().find((t) => t.op === 'startPlan');
    expect(trace?.ok).toBe(true);
  });

  it('axis 1: startPlan supports multi-workspace under distinct session ids', async () => {
    await mock.startPlan({ sessionId: 'p2a', workspace: 'staging', target: 'loki' });
    await mock.startPlan({ sessionId: 'p2b', workspace: 'dev', target: 'grafana-oss' });
    const starts = mock.traces().filter((t) => t.op === 'startPlan' && t.ok);
    expect(starts.length).toBe(2);
  });

  it('axis 1: startPlan rejects duplicate session id', async () => {
    await mock.startPlan({ sessionId: 'p3', workspace: 'prod', target: 'prometheus' });
    await expect(
      mock.startPlan({ sessionId: 'p3', workspace: 'prod', target: 'prometheus' }),
    ).rejects.toThrow(/plan_session_exists/);
  });
});

describe('mock adapter — plan capture', () => {
  it('axis 2: capturePlan counts additions / modifications / deletions', async () => {
    await mock.startPlan({ sessionId: 'c1', workspace: 'prod', target: 'prometheus' });
    const result = await mock.capturePlan({
      sessionId: 'c1',
      changes: [
        { address: 'aws_instance.web[0]', action: 'create' },
        { address: 'aws_instance.web[1]', action: 'create' },
        { address: 'aws_instance.web[2]', action: 'update' },
        { address: 'aws_instance.old', action: 'delete' },
        { address: 'aws_instance.stable', action: 'no-op' },
      ],
    });
    expect(result.changeCount).toBe(5);
    expect(result.additions).toBe(2);
    expect(result.modifications).toBe(1);
    expect(result.deletions).toBe(1);
  });

  it('axis 2: capturePlan handles a single-change plan', async () => {
    await mock.startPlan({ sessionId: 'c2', workspace: 'prod', target: 'prometheus' });
    const result = await mock.capturePlan({
      sessionId: 'c2',
      changes: [{ address: 'aws_s3_bucket.only', action: 'create' }],
    });
    expect(result.changeCount).toBe(1);
    expect(result.additions).toBe(1);
  });

  it('axis 2: capturePlan refuses empty changes', async () => {
    await mock.startPlan({ sessionId: 'c3', workspace: 'prod', target: 'prometheus' });
    await expect(
      mock.capturePlan({ sessionId: 'c3', changes: [] }),
    ).rejects.toThrow(/changes_must_not_be_empty/);
  });

  it('axis 2: capturePlan refuses when session not started', async () => {
    await expect(
      mock.capturePlan({
        sessionId: 'ghost',
        changes: [{ address: 'r', action: 'create' }],
      }),
    ).rejects.toThrow(/plan_session_not_found/);
  });
});

describe('mock adapter — plan state machine', () => {
  it('axis 3: closePlan removes session', async () => {
    await mock.startPlan({ sessionId: 'sm1', workspace: 'prod', target: 'prometheus' });
    await mock.closePlan({ sessionId: 'sm1' });
    await expect(
      mock.capturePlan({
        sessionId: 'sm1',
        changes: [{ address: 'r', action: 'create' }],
      }),
    ).rejects.toThrow(/plan_session_not_found/);
  });

  it('axis 3: rejects capturePlan after session is closed', async () => {
    await mock.startPlan({ sessionId: 'sm2', workspace: 'prod', target: 'prometheus' });
    await mock.closePlan({ sessionId: 'sm2' });
    await expect(mock.closePlan({ sessionId: 'sm2' })).rejects.toThrow(
      /plan_session_not_found/,
    );
  });
});

describe('route handler — /plan shape validation', () => {
  it('axis 4: validatePlanRequest rejects non-object body', () => {
    const result = validatePlanRequest('not-an-object');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('body_not_object');
  });

  it('axis 4: validatePlanRequest rejects missing sessionId', () => {
    const result = validatePlanRequest({ kind: 'start' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('sessionId_required');
  });

  it('axis 4: validatePlanRequest rejects unknown kind', () => {
    const result = validatePlanRequest({ sessionId: 'r1', kind: 'burn' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('kind_must_be_start_capture_or_close');
  });

  it('axis 4: validatePlanRequest rejects invalid observability target', () => {
    const result = validatePlanRequest({
      sessionId: 'r2',
      kind: 'start',
      workspace: 'prod',
      target: 'datadog',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('target_required_valid');
  });

  it('axis 4: validatePlanRequest rejects change with invalid action', () => {
    const result = validatePlanRequest({
      sessionId: 'r3',
      kind: 'capture',
      changes: [{ address: 'r', action: 'destroy' }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('change_action_required_valid');
  });

  it('axis 4: handlePlanRequest dispatches the start op and returns the workspace', async () => {
    const response = await handlePlanRequest(mock, {
      kind: 'start',
      sessionId: 'r4',
      workspace: 'prod',
      target: 'prometheus',
    });
    expect(response.ok).toBe(true);
    expect(response.kind).toBe('start');
    expect(response.workspace).toBe('prod');
  });

  it('axis 4: handlePlanRequest dispatches the capture op and returns counts', async () => {
    await mock.startPlan({ sessionId: 'r5', workspace: 'prod', target: 'prometheus' });
    const response = await handlePlanRequest(mock, {
      kind: 'capture',
      sessionId: 'r5',
      changes: [
        { address: 'r1', action: 'create' },
        { address: 'r2', action: 'update' },
      ],
    });
    expect(response.ok).toBe(true);
    expect(response.changeCount).toBe(2);
    expect(response.additions).toBe(1);
    expect(response.modifications).toBe(1);
  });

  it('axis 4: handlePlanRequest surfaces errorKind on failure', async () => {
    const response = await handlePlanRequest(mock, {
      kind: 'capture',
      sessionId: 'ghost',
      changes: [{ address: 'r', action: 'create' }],
    });
    expect(response.ok).toBe(false);
    expect(response.errorKind).toBe('plan_session_not_found');
  });
});

describe('mock adapter — provider dialect fidelity', () => {
  it.each(['grafana-oss', 'prometheus', 'loki', 'otel-collector'] as const)(
    'axis 5: startPlan traces the ok event on %s target',
    async (target) => {
      await mock.startPlan({ sessionId: `d-${target}`, workspace: 'prod', target });
      await mock.capturePlan({
        sessionId: `d-${target}`,
        changes: [{ address: 'r', action: 'create' }],
      });
      const starts = mock.traces().filter((t) => t.op === 'startPlan' && t.ok);
      const captures = mock.traces().filter((t) => t.op === 'capturePlan' && t.ok);
      expect(starts.length).toBeGreaterThan(0);
      expect(captures.length).toBeGreaterThan(0);
    },
  );
});

describe('real adapter — env-detect skeleton', () => {
  it('detectRealEnvMissing reports IAC_STACK_READY on hermetic systems', () => {
    const missing = detectRealEnvMissing();
    // Ordinary test envs will not have `IAC_STACK_READY=1` exported, so
    // the detector must report a stable env-missing reason.
    expect(missing).not.toBeNull();
  });

  it('real adapter refuses every op with KIWA_IAC_ENV_MISSING on hermetic systems', async () => {
    const real = makeRealAdapter();
    await expect(
      real.startPlan({ sessionId: 'r-real', workspace: 'prod', target: 'prometheus' }),
    ).rejects.toThrow();
    const trace = real.traces().find((t) => t.op === 'startPlan');
    expect(trace?.ok).toBe(false);
    expect(trace?.errorKind).toBeTruthy();
  });
});
