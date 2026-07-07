/**
 * Plan end-to-end fidelity spec (plan axis: BNPL plan creation +
 * per-installment schedule).
 *
 * Issue CAR-979 (v1.41-3) AC — the mock adapter drives a full BNPL
 * plan ceremony end to end and the fidelity harness diffs the raw
 * {@link TraceEvent} sequence across five axes.
 *
 *  1. createPlan seats a BNPL plan under a customer id + currency, and
 *     rejects duplicate plan ids in the same session.
 *  2. scheduleInstallment advances the schedule pointer atomically and
 *     enforces (2 <= installments <= 12, plan session open, no
 *     over-scheduling).
 *  3. installmentAmountCents == floor(totalCents / installments), so the
 *     last installment absorbs any rounding remainder.
 *  4. closePlan detaches the session id and further ops on the same id
 *     fail with `plan_session_not_found`.
 *  5. Route handler dispatches / rejects the shape variations exposed
 *     over HTTP without spinning up a Node server.
 *
 * The real adapter is exercised through the env-detect skeleton and
 * every op refuses with `KIWA_BNPL_ENV_MISSING` on every non-integration
 * environment (the default). Downstream tests inspect
 * {@link PaymentAdapter.mode} + the trace to skip real assertions on
 * those systems.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { detectRealEnvMissing, makeRealAdapter } from '../src/adapters/real.js';
import { handlePlanRequest, validatePlanRequest } from '../src/app/plan/route.js';
import type { PaymentAdapter } from '../src/adapters/interface.js';

let mock: PaymentAdapter;

beforeEach(() => {
  mock = makeMockAdapter({ latencyMs: 1 });
});

afterEach(async () => {
  await mock.reset();
});

describe('mock adapter — plan creation', () => {
  it('axis 1: createPlan seats a BNPL plan under a customer id + currency', async () => {
    await mock.startPlan({ sessionId: 'p1', provider: 'klarna' });
    const result = await mock.createPlan({
      sessionId: 'p1',
      planId: 'plan_alice_1',
      customerId: 'cus_alice',
      totalCents: 60_000,
      currency: 'usd',
      installments: 4,
    });
    expect(result.planId).toBe('plan_alice_1');
    expect(result.installmentAmountCents).toBe(15_000);
    expect(result.state).toBe('plan-created');
    const trace = mock.traces().find((t) => t.op === 'createPlan');
    expect(trace?.ok).toBe(true);
  });

  it('axis 1: createPlan accepts multi-provider plans across separate sessions', async () => {
    await mock.startPlan({ sessionId: 'p2', provider: 'affirm' });
    const p2 = await mock.createPlan({
      sessionId: 'p2',
      planId: 'plan_affirm',
      customerId: 'cus_alice',
      totalCents: 40_000,
      currency: 'usd',
      installments: 4,
    });
    expect(p2.installmentAmountCents).toBe(10_000);

    await mock.startPlan({ sessionId: 'p2b', provider: 'afterpay' });
    const p2b = await mock.createPlan({
      sessionId: 'p2b',
      planId: 'plan_afterpay',
      customerId: 'cus_alice',
      totalCents: 20_000,
      currency: 'usd',
      installments: 4,
    });
    expect(p2b.installmentAmountCents).toBe(5_000);
  });

  it('axis 1: createPlan rejects duplicate plan id in the same session', async () => {
    await mock.startPlan({ sessionId: 'p3', provider: 'klarna' });
    await mock.createPlan({
      sessionId: 'p3',
      planId: 'plan_dup',
      customerId: 'cus_alice',
      totalCents: 40_000,
      currency: 'usd',
      installments: 4,
    });
    await expect(
      mock.createPlan({
        sessionId: 'p3',
        planId: 'plan_dup',
        customerId: 'cus_alice',
        totalCents: 40_000,
        currency: 'usd',
        installments: 4,
      }),
    ).rejects.toThrow('plan_already_created');
  });

  it('axis 1: createPlan rejects installments < 2 (semantics guard)', async () => {
    await mock.startPlan({ sessionId: 'p4', provider: 'klarna' });
    await expect(
      mock.createPlan({
        sessionId: 'p4',
        planId: 'plan_bad',
        customerId: 'cus_alice',
        totalCents: 40_000,
        currency: 'usd',
        installments: 1,
      }),
    ).rejects.toThrow();
  });

  it('axis 1: createPlan rejects installments > 12 (semantics guard)', async () => {
    await mock.startPlan({ sessionId: 'p5', provider: 'klarna' });
    await expect(
      mock.createPlan({
        sessionId: 'p5',
        planId: 'plan_bad',
        customerId: 'cus_alice',
        totalCents: 40_000,
        currency: 'usd',
        installments: 13,
      }),
    ).rejects.toThrow();
  });

  it('axis 1: createPlan rejects negative totalCents (semantics guard)', async () => {
    await mock.startPlan({ sessionId: 'p6', provider: 'klarna' });
    await expect(
      mock.createPlan({
        sessionId: 'p6',
        planId: 'plan_bad',
        customerId: 'cus_alice',
        totalCents: -1,
        currency: 'usd',
        installments: 4,
      }),
    ).rejects.toThrow();
  });

  it('axis 1: createPlan without prior startPlan reports plan_session_not_found', async () => {
    await expect(
      mock.createPlan({
        sessionId: 'never-started',
        planId: 'plan_orphan',
        customerId: 'cus_alice',
        totalCents: 40_000,
        currency: 'usd',
        installments: 4,
      }),
    ).rejects.toThrow('plan_session_not_found');
  });
});

describe('mock adapter — installment schedule', () => {
  it('axis 2: scheduleInstallment advances the schedule pointer atomically', async () => {
    await mock.startPlan({ sessionId: 'p7', provider: 'klarna' });
    await mock.createPlan({
      sessionId: 'p7',
      planId: 'plan_sched',
      customerId: 'cus_alice',
      totalCents: 60_000,
      currency: 'usd',
      installments: 4,
    });
    const s1 = await mock.scheduleInstallment({
      sessionId: 'p7',
      planId: 'plan_sched',
    });
    expect(s1.installmentIndex).toBe(1);
    const s2 = await mock.scheduleInstallment({
      sessionId: 'p7',
      planId: 'plan_sched',
    });
    expect(s2.installmentIndex).toBe(2);
  });

  it('axis 2: scheduleInstallment emits monotonically increasing dueOffsetMs', async () => {
    await mock.startPlan({ sessionId: 'p8', provider: 'affirm' });
    await mock.createPlan({
      sessionId: 'p8',
      planId: 'plan_sched',
      customerId: 'cus_alice',
      totalCents: 60_000,
      currency: 'usd',
      installments: 3,
      installmentIntervalMs: 1_000,
    });
    const s1 = await mock.scheduleInstallment({
      sessionId: 'p8',
      planId: 'plan_sched',
    });
    const s2 = await mock.scheduleInstallment({
      sessionId: 'p8',
      planId: 'plan_sched',
    });
    const s3 = await mock.scheduleInstallment({
      sessionId: 'p8',
      planId: 'plan_sched',
    });
    expect(s1.dueOffsetMs).toBe(1_000);
    expect(s2.dueOffsetMs).toBe(2_000);
    expect(s3.dueOffsetMs).toBe(3_000);
  });

  it('axis 2: scheduleInstallment refuses to over-schedule beyond installments', async () => {
    await mock.startPlan({ sessionId: 'p9', provider: 'afterpay' });
    await mock.createPlan({
      sessionId: 'p9',
      planId: 'plan_sched',
      customerId: 'cus_alice',
      totalCents: 20_000,
      currency: 'usd',
      installments: 2,
    });
    await mock.scheduleInstallment({ sessionId: 'p9', planId: 'plan_sched' });
    await mock.scheduleInstallment({ sessionId: 'p9', planId: 'plan_sched' });
    await expect(
      mock.scheduleInstallment({ sessionId: 'p9', planId: 'plan_sched' }),
    ).rejects.toThrow();
  });

  it('axis 2: scheduleInstallment on missing plan reports plan_not_found', async () => {
    await mock.startPlan({ sessionId: 'p10', provider: 'klarna' });
    await expect(
      mock.scheduleInstallment({
        sessionId: 'p10',
        planId: 'plan_missing',
      }),
    ).rejects.toThrow('plan_not_found');
  });
});

describe('mock adapter — installmentAmountCents math', () => {
  it('axis 3: installmentAmountCents == floor(totalCents / installments)', async () => {
    await mock.startPlan({ sessionId: 'p11', provider: 'klarna' });
    const result = await mock.createPlan({
      sessionId: 'p11',
      planId: 'plan_math',
      customerId: 'cus_alice',
      totalCents: 12_345,
      currency: 'usd',
      installments: 3,
    });
    // floor(12345 / 3) == 4115.
    expect(result.installmentAmountCents).toBe(4_115);
  });

  it('axis 3: installmentAmountCents is stable across scheduleInstallment', async () => {
    await mock.startPlan({ sessionId: 'p12', provider: 'affirm' });
    await mock.createPlan({
      sessionId: 'p12',
      planId: 'plan_math',
      customerId: 'cus_alice',
      totalCents: 60_000,
      currency: 'usd',
      installments: 6,
    });
    const s1 = await mock.scheduleInstallment({
      sessionId: 'p12',
      planId: 'plan_math',
    });
    const s2 = await mock.scheduleInstallment({
      sessionId: 'p12',
      planId: 'plan_math',
    });
    expect(s1.installmentAmountCents).toBe(10_000);
    expect(s2.installmentAmountCents).toBe(10_000);
  });
});

describe('mock adapter — closePlan', () => {
  it('axis 4: closePlan detaches the session and further ops fail', async () => {
    await mock.startPlan({ sessionId: 'p13', provider: 'klarna' });
    await mock.createPlan({
      sessionId: 'p13',
      planId: 'plan_close',
      customerId: 'cus_alice',
      totalCents: 40_000,
      currency: 'usd',
      installments: 4,
    });
    await mock.closePlan({ sessionId: 'p13' });
    await expect(
      mock.createPlan({
        sessionId: 'p13',
        planId: 'plan_close_dup',
        customerId: 'cus_alice',
        totalCents: 40_000,
        currency: 'usd',
        installments: 4,
      }),
    ).rejects.toThrow('plan_session_not_found');
  });

  it('axis 4: closePlan on missing session reports plan_session_not_found', async () => {
    await expect(
      mock.closePlan({ sessionId: 'never-started' }),
    ).rejects.toThrow('plan_session_not_found');
  });
});

describe('route validation — HTTP body shape', () => {
  it('axis 5: validatePlanRequest accepts create shape', () => {
    const parsed = validatePlanRequest({
      kind: 'create',
      sessionId: 'p14',
      planId: 'plan_ok',
      customerId: 'cus_alice',
      totalCents: 40_000,
      currency: 'usd',
      installments: 4,
    });
    expect(parsed.ok).toBe(true);
  });

  it('axis 5: validatePlanRequest accepts schedule shape', () => {
    const parsed = validatePlanRequest({
      kind: 'schedule',
      sessionId: 'p14',
      planId: 'plan_ok',
    });
    expect(parsed.ok).toBe(true);
  });

  it('axis 5: validatePlanRequest rejects create missing customerId', () => {
    const parsed = validatePlanRequest({
      kind: 'create',
      sessionId: 'p14',
      planId: 'plan_ok',
      totalCents: 40_000,
      currency: 'usd',
      installments: 4,
    });
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.errorKind).toBe('customerId_required');
  });

  it('axis 5: validatePlanRequest rejects unknown kind', () => {
    const parsed = validatePlanRequest({
      kind: 'purge',
      sessionId: 'p14',
      planId: 'plan_ok',
    });
    expect(parsed.ok).toBe(false);
  });

  it('axis 5: handlePlanRequest routes create + schedule end to end', async () => {
    await mock.startPlan({ sessionId: 'p15', provider: 'klarna' });
    const createRes = await handlePlanRequest(mock, {
      kind: 'create',
      sessionId: 'p15',
      planId: 'plan_route',
      customerId: 'cus_alice',
      totalCents: 40_000,
      currency: 'usd',
      installments: 4,
    });
    expect(createRes.ok).toBe(true);
    const scheduleRes = await handlePlanRequest(mock, {
      kind: 'schedule',
      sessionId: 'p15',
      planId: 'plan_route',
    });
    expect(scheduleRes.ok).toBe(true);
    expect(scheduleRes.installmentIndex).toBe(1);
  });

  it('axis 5: handlePlanRequest reports errorKind when adapter refuses', async () => {
    const res = await handlePlanRequest(mock, {
      kind: 'create',
      sessionId: 'never-started',
      planId: 'plan_route',
      customerId: 'cus_alice',
      totalCents: 40_000,
      currency: 'usd',
      installments: 4,
    });
    expect(res.ok).toBe(false);
    expect(res.errorKind).toBe('plan_session_not_found');
  });
});

describe('real adapter — env detection', () => {
  it('detectRealEnvMissing returns non-null when env keys are missing', () => {
    const previous = { ...process.env };
    delete process.env['KIWA_MODE'];
    delete process.env['BNPL_STACK_READY'];
    expect(detectRealEnvMissing()).toBe('KIWA_BNPL_ENV_MISSING');
    process.env = previous;
  });

  it('real adapter refuses createPlan on non-integration environments', async () => {
    const real = makeRealAdapter();
    await expect(
      real.createPlan({
        sessionId: 'r1',
        planId: 'plan_real',
        customerId: 'cus_alice',
        totalCents: 40_000,
        currency: 'usd',
        installments: 4,
      }),
    ).rejects.toThrow('KIWA_BNPL_ENV_MISSING');
    const trace = real.traces().find((t) => t.op === 'createPlan');
    expect(trace?.ok).toBe(false);
    expect(trace?.errorKind).toBe('KIWA_BNPL_ENV_MISSING');
  });
});
