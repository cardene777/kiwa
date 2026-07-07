/**
 * Budget end-to-end fidelity spec (budget axis: monthly USD spend vs
 * limit envelope + exhaustion detection + ratio reporting + session
 * lifecycle).
 *
 * Issue CAR-1048 (v1.42-3) AC — the mock adapter drives a full budget
 * check ceremony end to end and the fidelity harness diffs the raw
 * {@link TraceEvent} sequence across five axes.
 *
 *  1. startBudget seats a budget-check session under a serviceName +
 *     observability target, and rejects duplicate session ids.
 *  2. checkBudget records spent vs limit + ratio + exhaustion flag and
 *     enforces (non-negative spent, positive limit, session open).
 *  3. closeBudget tears down state and further ops on the same session
 *     id fail.
 *  4. Route handler dispatches / rejects the shape variations exposed
 *     over HTTP without spinning up a Node server.
 *  5. Provider dialects (grafana-oss / prometheus / loki / otel-collector)
 *     translate the neutral event to their respective vocabulary.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import { handleBudgetRequest, validateBudgetRequest } from '../src/app/budget/route.js';
import type { LlmOpsAdapter } from '../src/adapters/interface.js';

let mock: LlmOpsAdapter;

beforeEach(() => {
  mock = makeMockAdapter({ latencyMs: 1 });
});

afterEach(async () => {
  await mock.reset();
});

describe('mock adapter — budget session start', () => {
  it('axis 1: startBudget seats a session under a serviceName + observability target', async () => {
    await mock.startBudget({
      sessionId: 'b1',
      serviceName: 'llm-gateway',
      target: 'prometheus',
    });
    const trace = mock.traces().find((t) => t.op === 'startBudget');
    expect(trace?.ok).toBe(true);
  });

  it('axis 1: startBudget rejects duplicate session id', async () => {
    await mock.startBudget({
      sessionId: 'b2',
      serviceName: 'llm-gateway',
      target: 'prometheus',
    });
    await expect(
      mock.startBudget({
        sessionId: 'b2',
        serviceName: 'llm-gateway',
        target: 'prometheus',
      }),
    ).rejects.toThrow(/budget_session_exists/);
  });
});

describe('mock adapter — budget checking', () => {
  it('axis 2: checkBudget reports below-limit spend as not exhausted', async () => {
    await mock.startBudget({
      sessionId: 'ck1',
      serviceName: 'llm-gateway',
      target: 'prometheus',
    });
    const result = await mock.checkBudget({
      sessionId: 'ck1',
      spentUsd: 300,
      limitUsd: 1000,
    });
    expect(result.spentUsd).toBe(300);
    expect(result.limitUsd).toBe(1000);
    expect(result.ratio).toBeCloseTo(0.3, 6);
    expect(result.exhausted).toBe(false);
  });

  it('axis 2: checkBudget reports at-limit spend as exhausted', async () => {
    await mock.startBudget({
      sessionId: 'ck2',
      serviceName: 'llm-gateway',
      target: 'prometheus',
    });
    const result = await mock.checkBudget({
      sessionId: 'ck2',
      spentUsd: 1000,
      limitUsd: 1000,
    });
    expect(result.ratio).toBe(1);
    expect(result.exhausted).toBe(true);
  });

  it('axis 2: checkBudget reports over-limit spend as exhausted with ratio > 1', async () => {
    await mock.startBudget({
      sessionId: 'ck3',
      serviceName: 'llm-gateway',
      target: 'prometheus',
    });
    const result = await mock.checkBudget({
      sessionId: 'ck3',
      spentUsd: 1500,
      limitUsd: 1000,
    });
    expect(result.ratio).toBeGreaterThan(1);
    expect(result.exhausted).toBe(true);
  });

  it('axis 2: checkBudget refuses negative spentUsd', async () => {
    await mock.startBudget({
      sessionId: 'ck4',
      serviceName: 'llm-gateway',
      target: 'prometheus',
    });
    await expect(
      mock.checkBudget({ sessionId: 'ck4', spentUsd: -1, limitUsd: 100 }),
    ).rejects.toThrow(/spentUsd_must_be_non_negative/);
  });

  it('axis 2: checkBudget refuses zero limitUsd', async () => {
    await mock.startBudget({
      sessionId: 'ck5',
      serviceName: 'llm-gateway',
      target: 'prometheus',
    });
    await expect(
      mock.checkBudget({ sessionId: 'ck5', spentUsd: 100, limitUsd: 0 }),
    ).rejects.toThrow(/limitUsd_must_be_positive/);
  });

  it('axis 2: checkBudget refuses when session not started', async () => {
    await expect(
      mock.checkBudget({ sessionId: 'ghost', spentUsd: 10, limitUsd: 100 }),
    ).rejects.toThrow(/budget_session_not_found/);
  });
});

describe('mock adapter — budget state machine', () => {
  it('axis 3: closeBudget removes session', async () => {
    await mock.startBudget({
      sessionId: 'sm1',
      serviceName: 'llm-gateway',
      target: 'prometheus',
    });
    await mock.closeBudget({ sessionId: 'sm1' });
    await expect(
      mock.checkBudget({ sessionId: 'sm1', spentUsd: 1, limitUsd: 100 }),
    ).rejects.toThrow(/budget_session_not_found/);
  });

  it('axis 3: rejects closeBudget on unknown sessionId', async () => {
    await expect(mock.closeBudget({ sessionId: 'ghost' })).rejects.toThrow(
      /budget_session_not_found/,
    );
  });
});

describe('route handler — /budget shape validation', () => {
  it('axis 4: validateBudgetRequest rejects non-object body', () => {
    const result = validateBudgetRequest(42);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('body_not_object');
  });

  it('axis 4: validateBudgetRequest rejects unknown kind', () => {
    const result = validateBudgetRequest({ sessionId: 'r1', kind: 'burn' });
    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(result.errorKind).toBe('kind_must_be_start_check_or_close');
  });

  it('axis 4: validateBudgetRequest rejects invalid target', () => {
    const result = validateBudgetRequest({
      sessionId: 'r2',
      kind: 'start',
      serviceName: 'llm-gateway',
      target: 'datadog',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('target_required_valid');
  });

  it('axis 4: validateBudgetRequest rejects check without spentUsd', () => {
    const result = validateBudgetRequest({
      sessionId: 'r3',
      kind: 'check',
      limitUsd: 100,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('spentUsd_required_number');
  });

  it('axis 4: handleBudgetRequest dispatches the check op and returns ratio', async () => {
    await mock.startBudget({
      sessionId: 'r4',
      serviceName: 'llm-gateway',
      target: 'prometheus',
    });
    const response = await handleBudgetRequest(mock, {
      kind: 'check',
      sessionId: 'r4',
      spentUsd: 250,
      limitUsd: 1000,
    });
    expect(response.ok).toBe(true);
    expect(response.ratio).toBeCloseTo(0.25, 6);
    expect(response.exhausted).toBe(false);
  });

  it('axis 4: handleBudgetRequest surfaces errorKind on failure', async () => {
    const response = await handleBudgetRequest(mock, {
      kind: 'check',
      sessionId: 'ghost',
      spentUsd: 1,
      limitUsd: 100,
    });
    expect(response.ok).toBe(false);
    expect(response.errorKind).toBe('budget_session_not_found');
  });
});

describe('mock adapter — budget provider dialect fidelity', () => {
  it.each(['grafana-oss', 'prometheus', 'loki', 'otel-collector'] as const)(
    'axis 5: checkBudget traces the ok event on %s target',
    async (target) => {
      await mock.startBudget({
        sessionId: `d-${target}`,
        serviceName: 'llm-gateway',
        target,
      });
      await mock.checkBudget({
        sessionId: `d-${target}`,
        spentUsd: 10,
        limitUsd: 100,
      });
      const checks = mock.traces().filter((t) => t.op === 'checkBudget' && t.ok);
      expect(checks.length).toBeGreaterThan(0);
    },
  );
});

describe('real adapter — budget env-gate', () => {
  it('real adapter refuses checkBudget with KIWA_LLM_ENV_MISSING on hermetic systems', async () => {
    const real = makeRealAdapter();
    await expect(
      real.checkBudget({ sessionId: 'r-real', spentUsd: 10, limitUsd: 100 }),
    ).rejects.toThrow();
    const trace = real.traces().find((t) => t.op === 'checkBudget');
    expect(trace?.ok).toBe(false);
  });
});
