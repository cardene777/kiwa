/**
 * Risk end-to-end fidelity spec (risk axis: soft credit-check score +
 * aggregate threshold).
 *
 * Issue CAR-979 (v1.41-3) AC — the mock adapter drives a full BNPL
 * risk-scoring ceremony end to end and the fidelity harness diffs the
 * raw {@link TraceEvent} sequence across five axes.
 *
 *  1. scoreCustomerRisk runs a bureau soft credit check that emits
 *     `bnpl.risk_scored` and returns passed = score >= minRequired.
 *  2. scoreCustomerRisk defaults the plan to `defaulted` when the score
 *     is below the required threshold, matching the v0.5 semantics.
 *  3. checkRiskThreshold compares an aggregate score against a
 *     min-required and returns passed without touching the plan.
 *  4. closeRisk detaches the session and further ops fail with
 *     `risk_session_not_found`.
 *  5. Route handler dispatches / rejects the shape variations exposed
 *     over HTTP without spinning up a Node server.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { detectRealEnvMissing, makeRealAdapter } from '../src/adapters/real.js';
import { handleRiskRequest, validateRiskRequest } from '../src/app/risk/route.js';
import type { PaymentAdapter } from '../src/adapters/interface.js';

let mock: PaymentAdapter;

beforeEach(() => {
  mock = makeMockAdapter({ latencyMs: 1 });
});

afterEach(async () => {
  await mock.reset();
});

async function seedPlan(sessionId: string, planId: string): Promise<void> {
  await mock.startPlan({ sessionId, provider: 'klarna' });
  await mock.createPlan({
    sessionId,
    planId,
    customerId: 'cus_alice',
    totalCents: 40_000,
    currency: 'usd',
    installments: 4,
    minRiskScore: 50,
  });
}

describe('mock adapter — soft credit check', () => {
  it('axis 1: scoreCustomerRisk returns passed=true when score >= minRequired', async () => {
    await seedPlan('p-r1', 'plan_r1');
    await mock.startRisk({
      sessionId: 'r1',
      planId: 'plan_r1',
      creditBureau: 'experian',
    });
    const result = await mock.scoreCustomerRisk({
      sessionId: 'r1',
      planId: 'plan_r1',
      score: 75,
      minRequired: 50,
    });
    expect(result.passed).toBe(true);
    expect(result.creditBureau).toBe('experian');
    const trace = mock.traces().find((t) => t.op === 'scoreCustomerRisk');
    expect(trace?.ok).toBe(true);
  });

  it('axis 1: scoreCustomerRisk supports every credit bureau', async () => {
    for (const bureau of ['experian', 'equifax', 'transunion', 'internal'] as const) {
      const sessionId = `r-${bureau}`;
      const planId = `plan_${bureau}`;
      await seedPlan(`p-${sessionId}`, planId);
      await mock.startRisk({ sessionId, planId, creditBureau: bureau });
      const result = await mock.scoreCustomerRisk({
        sessionId,
        planId,
        score: 80,
        minRequired: 50,
      });
      expect(result.passed).toBe(true);
      expect(result.creditBureau).toBe(bureau);
    }
  });

  it('axis 1: scoreCustomerRisk rejects score outside 0..100', async () => {
    await seedPlan('p-r2', 'plan_r2');
    await mock.startRisk({
      sessionId: 'r2',
      planId: 'plan_r2',
      creditBureau: 'experian',
    });
    await expect(
      mock.scoreCustomerRisk({
        sessionId: 'r2',
        planId: 'plan_r2',
        score: 101,
        minRequired: 50,
      }),
    ).rejects.toThrow('score_out_of_range');
    await expect(
      mock.scoreCustomerRisk({
        sessionId: 'r2',
        planId: 'plan_r2',
        score: -1,
        minRequired: 50,
      }),
    ).rejects.toThrow('score_out_of_range');
  });

  it('axis 1: scoreCustomerRisk rejects planId mismatch (session-plan pinning)', async () => {
    await seedPlan('p-r3', 'plan_r3');
    await mock.startRisk({
      sessionId: 'r3',
      planId: 'plan_r3',
      creditBureau: 'experian',
    });
    await expect(
      mock.scoreCustomerRisk({
        sessionId: 'r3',
        planId: 'plan_other',
        score: 75,
        minRequired: 50,
      }),
    ).rejects.toThrow('plan_id_mismatch');
  });

  it('axis 1: scoreCustomerRisk without prior startRisk reports risk_session_not_found', async () => {
    await expect(
      mock.scoreCustomerRisk({
        sessionId: 'never-started',
        planId: 'plan_orphan',
        score: 75,
        minRequired: 50,
      }),
    ).rejects.toThrow('risk_session_not_found');
  });
});

describe('mock adapter — score below threshold', () => {
  it('axis 2: scoreCustomerRisk returns passed=false + defaults plan when score < minRequired', async () => {
    await seedPlan('p-r4', 'plan_r4');
    await mock.startRisk({
      sessionId: 'r4',
      planId: 'plan_r4',
      creditBureau: 'experian',
    });
    const result = await mock.scoreCustomerRisk({
      sessionId: 'r4',
      planId: 'plan_r4',
      score: 40,
      minRequired: 60,
    });
    expect(result.passed).toBe(false);
    expect(result.state).toBe('defaulted');
  });

  it('axis 2: scoreCustomerRisk with exact threshold match returns passed=true', async () => {
    await seedPlan('p-r5', 'plan_r5');
    await mock.startRisk({
      sessionId: 'r5',
      planId: 'plan_r5',
      creditBureau: 'internal',
    });
    const result = await mock.scoreCustomerRisk({
      sessionId: 'r5',
      planId: 'plan_r5',
      score: 60,
      minRequired: 60,
    });
    expect(result.passed).toBe(true);
    expect(result.state).not.toBe('defaulted');
  });
});

describe('mock adapter — aggregate threshold', () => {
  it('axis 3: checkRiskThreshold returns passed when aggregateScore >= minRequired', async () => {
    await seedPlan('p-r6', 'plan_r6');
    await mock.startRisk({
      sessionId: 'r6',
      planId: 'plan_r6',
      creditBureau: 'experian',
    });
    const result = await mock.checkRiskThreshold({
      sessionId: 'r6',
      planId: 'plan_r6',
      aggregateScore: 82,
      minRequired: 70,
    });
    expect(result.passed).toBe(true);
  });

  it('axis 3: checkRiskThreshold returns passed=false when under threshold', async () => {
    await seedPlan('p-r7', 'plan_r7');
    await mock.startRisk({
      sessionId: 'r7',
      planId: 'plan_r7',
      creditBureau: 'experian',
    });
    const result = await mock.checkRiskThreshold({
      sessionId: 'r7',
      planId: 'plan_r7',
      aggregateScore: 60,
      minRequired: 70,
    });
    expect(result.passed).toBe(false);
  });

  it('axis 3: checkRiskThreshold rejects minRequired outside 0..100', async () => {
    await seedPlan('p-r8', 'plan_r8');
    await mock.startRisk({
      sessionId: 'r8',
      planId: 'plan_r8',
      creditBureau: 'experian',
    });
    await expect(
      mock.checkRiskThreshold({
        sessionId: 'r8',
        planId: 'plan_r8',
        aggregateScore: 80,
        minRequired: 200,
      }),
    ).rejects.toThrow('min_required_out_of_range');
  });
});

describe('mock adapter — closeRisk', () => {
  it('axis 4: closeRisk detaches the session and further ops fail', async () => {
    await seedPlan('p-r9', 'plan_r9');
    await mock.startRisk({
      sessionId: 'r9',
      planId: 'plan_r9',
      creditBureau: 'experian',
    });
    await mock.closeRisk({ sessionId: 'r9' });
    await expect(
      mock.scoreCustomerRisk({
        sessionId: 'r9',
        planId: 'plan_r9',
        score: 75,
        minRequired: 50,
      }),
    ).rejects.toThrow('risk_session_not_found');
  });

  it('axis 4: closeRisk on missing session reports risk_session_not_found', async () => {
    await expect(
      mock.closeRisk({ sessionId: 'never-started' }),
    ).rejects.toThrow('risk_session_not_found');
  });
});

describe('route validation — HTTP body shape', () => {
  it('axis 5: validateRiskRequest accepts score shape', () => {
    const parsed = validateRiskRequest({
      kind: 'score',
      sessionId: 'r10',
      planId: 'plan_r10',
      score: 75,
      minRequired: 50,
    });
    expect(parsed.ok).toBe(true);
  });

  it('axis 5: validateRiskRequest accepts threshold shape', () => {
    const parsed = validateRiskRequest({
      kind: 'threshold',
      sessionId: 'r10',
      planId: 'plan_r10',
      aggregateScore: 82,
      minRequired: 70,
    });
    expect(parsed.ok).toBe(true);
  });

  it('axis 5: validateRiskRequest rejects score missing minRequired', () => {
    const parsed = validateRiskRequest({
      kind: 'score',
      sessionId: 'r10',
      planId: 'plan_r10',
      score: 75,
    });
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.errorKind).toBe('minRequired_required_number');
  });

  it('axis 5: validateRiskRequest rejects unknown kind', () => {
    const parsed = validateRiskRequest({
      kind: 'freeze',
      sessionId: 'r10',
      planId: 'plan_r10',
    });
    expect(parsed.ok).toBe(false);
  });

  it('axis 5: handleRiskRequest routes score + threshold end to end', async () => {
    await seedPlan('p-r11', 'plan_r11');
    await mock.startRisk({
      sessionId: 'r11',
      planId: 'plan_r11',
      creditBureau: 'experian',
    });
    const scoreRes = await handleRiskRequest(mock, {
      kind: 'score',
      sessionId: 'r11',
      planId: 'plan_r11',
      score: 75,
      minRequired: 50,
    });
    expect(scoreRes.ok).toBe(true);
    expect(scoreRes.passed).toBe(true);
    const thresholdRes = await handleRiskRequest(mock, {
      kind: 'threshold',
      sessionId: 'r11',
      planId: 'plan_r11',
      aggregateScore: 85,
      minRequired: 70,
    });
    expect(thresholdRes.ok).toBe(true);
    expect(thresholdRes.passed).toBe(true);
  });

  it('axis 5: handleRiskRequest reports errorKind when adapter refuses', async () => {
    const res = await handleRiskRequest(mock, {
      kind: 'score',
      sessionId: 'never-started',
      planId: 'plan_r12',
      score: 75,
      minRequired: 50,
    });
    expect(res.ok).toBe(false);
    expect(res.errorKind).toBe('risk_session_not_found');
  });
});

describe('real adapter — env detection', () => {
  it('detectRealEnvMissing reports KIWA_MODE=mock when explicit', () => {
    const previous = { ...process.env };
    process.env['KIWA_MODE'] = 'mock';
    expect(detectRealEnvMissing()).toBe('KIWA_MODE=mock');
    process.env = previous;
  });

  it('real adapter refuses scoreCustomerRisk on non-integration environments', async () => {
    const real = makeRealAdapter();
    await expect(
      real.scoreCustomerRisk({
        sessionId: 'r13',
        planId: 'plan_r13',
        score: 75,
        minRequired: 50,
      }),
    ).rejects.toThrow('KIWA_BNPL_ENV_MISSING');
    const trace = real.traces().find((t) => t.op === 'scoreCustomerRisk');
    expect(trace?.ok).toBe(false);
    expect(trace?.errorKind).toBe('KIWA_BNPL_ENV_MISSING');
  });
});
