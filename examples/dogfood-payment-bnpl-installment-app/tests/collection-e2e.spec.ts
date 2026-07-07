/**
 * Collection end-to-end fidelity spec (collection axis: late fee charge +
 * installment mark paid + settle terminal + status snapshot).
 *
 * Issue CAR-979 (v1.41-3) AC — the mock adapter drives a full BNPL
 * collection ceremony end to end and the fidelity harness diffs the raw
 * {@link TraceEvent} sequence across five axes.
 *
 *  1. chargeLateFee accrues the plan-configured lateFeeCents onto the
 *     BnplSession, transitions the state to `late-fee-charged`, and
 *     refuses to charge past a terminal (settled / defaulted) state.
 *  2. markPaid increments installmentsPaid, transitions to `settled`
 *     once every installment is paid, and refuses beyond the plan
 *     installment count.
 *  3. settlePlan drives markInstallmentPaid until settled and returns
 *     the terminal `settled` state.
 *  4. checkCollectionStatus reports a live snapshot of installmentsPaid /
 *     installmentsScheduled / installmentsRemaining + totalLateFeesCents
 *     without mutating the plan.
 *  5. closeCollection detaches the session and further ops on the same
 *     session id fail with `collection_session_not_found`.
 *  6. Route handler dispatches / rejects the shape variations exposed
 *     over HTTP without spinning up a Node server.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { detectRealEnvMissing, makeRealAdapter } from '../src/adapters/real.js';
import {
  handleCollectionRequest,
  validateCollectionRequest,
} from '../src/app/collection/route.js';
import type { PaymentAdapter } from '../src/adapters/interface.js';

let mock: PaymentAdapter;

beforeEach(() => {
  mock = makeMockAdapter({ latencyMs: 1 });
});

afterEach(async () => {
  await mock.reset();
});

async function seedPlan(
  sessionId: string,
  planId: string,
  installments: number,
  lateFeeCents = 700,
): Promise<void> {
  await mock.startPlan({ sessionId, provider: 'klarna' });
  await mock.createPlan({
    sessionId,
    planId,
    customerId: 'cus_alice',
    totalCents: installments * 10_000,
    currency: 'usd',
    installments,
    lateFeeCents,
  });
  for (let i = 0; i < installments; i += 1) {
    await mock.scheduleInstallment({ sessionId, planId });
  }
}

describe('mock adapter — late fee', () => {
  it('axis 1: chargeLateFee accrues plan-configured lateFeeCents', async () => {
    await seedPlan('p-c1', 'plan_c1', 4, 1_500);
    await mock.startCollection({
      sessionId: 'c1',
      planId: 'plan_c1',
    });
    const result = await mock.chargeLateFee({
      sessionId: 'c1',
      planId: 'plan_c1',
      installmentIndex: 1,
    });
    expect(result.lateFeeCents).toBe(1_500);
    expect(result.totalLateFeesCents).toBe(1_500);
    expect(result.state).toBe('late-fee-charged');
    const trace = mock.traces().find((t) => t.op === 'chargeLateFee');
    expect(trace?.ok).toBe(true);
  });

  it('axis 1: chargeLateFee accumulates across multiple missed installments', async () => {
    await seedPlan('p-c2', 'plan_c2', 4, 500);
    await mock.startCollection({ sessionId: 'c2', planId: 'plan_c2' });
    await mock.chargeLateFee({
      sessionId: 'c2',
      planId: 'plan_c2',
      installmentIndex: 1,
    });
    const r2 = await mock.chargeLateFee({
      sessionId: 'c2',
      planId: 'plan_c2',
      installmentIndex: 2,
    });
    expect(r2.totalLateFeesCents).toBe(1_000);
  });

  it('axis 1: chargeLateFee rejects installmentIndex out of range', async () => {
    await seedPlan('p-c3', 'plan_c3', 4);
    await mock.startCollection({ sessionId: 'c3', planId: 'plan_c3' });
    await expect(
      mock.chargeLateFee({
        sessionId: 'c3',
        planId: 'plan_c3',
        installmentIndex: 5,
      }),
    ).rejects.toThrow();
    await expect(
      mock.chargeLateFee({
        sessionId: 'c3',
        planId: 'plan_c3',
        installmentIndex: 0,
      }),
    ).rejects.toThrow();
  });

  it('axis 1: chargeLateFee refuses on settled plan', async () => {
    await seedPlan('p-c4', 'plan_c4', 2);
    await mock.startCollection({ sessionId: 'c4', planId: 'plan_c4' });
    await mock.settlePlan({ sessionId: 'c4', planId: 'plan_c4' });
    await expect(
      mock.chargeLateFee({
        sessionId: 'c4',
        planId: 'plan_c4',
        installmentIndex: 1,
      }),
    ).rejects.toThrow();
  });

  it('axis 1: chargeLateFee rejects planId mismatch (session-plan pinning)', async () => {
    await seedPlan('p-c5', 'plan_c5', 4);
    await mock.startCollection({ sessionId: 'c5', planId: 'plan_c5' });
    await expect(
      mock.chargeLateFee({
        sessionId: 'c5',
        planId: 'plan_other',
        installmentIndex: 1,
      }),
    ).rejects.toThrow('plan_id_mismatch');
  });
});

describe('mock adapter — markPaid', () => {
  it('axis 2: markPaid increments installmentsPaid until settled', async () => {
    await seedPlan('p-c6', 'plan_c6', 3);
    await mock.startCollection({ sessionId: 'c6', planId: 'plan_c6' });
    const r1 = await mock.markPaid({
      sessionId: 'c6',
      planId: 'plan_c6',
    });
    expect(r1.installmentsPaid).toBe(1);
    expect(r1.state).toBe('active');
    const r2 = await mock.markPaid({
      sessionId: 'c6',
      planId: 'plan_c6',
    });
    expect(r2.installmentsPaid).toBe(2);
    const r3 = await mock.markPaid({
      sessionId: 'c6',
      planId: 'plan_c6',
    });
    expect(r3.installmentsPaid).toBe(3);
    expect(r3.state).toBe('settled');
  });

  it('axis 2: markPaid refuses beyond plan installments', async () => {
    await seedPlan('p-c7', 'plan_c7', 2);
    await mock.startCollection({ sessionId: 'c7', planId: 'plan_c7' });
    await mock.markPaid({ sessionId: 'c7', planId: 'plan_c7' });
    await mock.markPaid({ sessionId: 'c7', planId: 'plan_c7' });
    await expect(
      mock.markPaid({ sessionId: 'c7', planId: 'plan_c7' }),
    ).rejects.toThrow('plan_already_settled');
  });

  it('axis 2: markPaid on missing plan reports plan_not_found', async () => {
    // startCollection referencing a plan id that was never created.
    await mock.startCollection({ sessionId: 'c8', planId: 'plan_missing' });
    await expect(
      mock.markPaid({ sessionId: 'c8', planId: 'plan_missing' }),
    ).rejects.toThrow('plan_not_found');
  });
});

describe('mock adapter — settlePlan', () => {
  it('axis 3: settlePlan drives markInstallmentPaid until settled', async () => {
    await seedPlan('p-c9', 'plan_c9', 4);
    await mock.startCollection({ sessionId: 'c9', planId: 'plan_c9' });
    const result = await mock.settlePlan({
      sessionId: 'c9',
      planId: 'plan_c9',
    });
    expect(result.installmentsPaid).toBe(4);
    expect(result.state).toBe('settled');
  });

  it('axis 3: settlePlan is idempotent — settling twice keeps count at plan max', async () => {
    await seedPlan('p-c10', 'plan_c10', 3);
    await mock.startCollection({ sessionId: 'c10', planId: 'plan_c10' });
    const r1 = await mock.settlePlan({
      sessionId: 'c10',
      planId: 'plan_c10',
    });
    const r2 = await mock.settlePlan({
      sessionId: 'c10',
      planId: 'plan_c10',
    });
    expect(r1.installmentsPaid).toBe(3);
    expect(r2.installmentsPaid).toBe(3);
    expect(r2.state).toBe('settled');
  });

  it('axis 3: settlePlan preserves totalLateFeesCents on the terminal snapshot', async () => {
    await seedPlan('p-c11', 'plan_c11', 3, 250);
    await mock.startCollection({ sessionId: 'c11', planId: 'plan_c11' });
    await mock.chargeLateFee({
      sessionId: 'c11',
      planId: 'plan_c11',
      installmentIndex: 1,
    });
    await mock.chargeLateFee({
      sessionId: 'c11',
      planId: 'plan_c11',
      installmentIndex: 2,
    });
    const result = await mock.settlePlan({
      sessionId: 'c11',
      planId: 'plan_c11',
    });
    expect(result.totalLateFeesCents).toBe(500);
  });
});

describe('mock adapter — checkCollectionStatus', () => {
  it('axis 4: checkCollectionStatus reports a live snapshot without mutating', async () => {
    await seedPlan('p-c12', 'plan_c12', 4);
    await mock.startCollection({ sessionId: 'c12', planId: 'plan_c12' });
    await mock.markPaid({ sessionId: 'c12', planId: 'plan_c12' });
    const s1 = await mock.checkCollectionStatus({
      sessionId: 'c12',
      planId: 'plan_c12',
    });
    const s2 = await mock.checkCollectionStatus({
      sessionId: 'c12',
      planId: 'plan_c12',
    });
    expect(s1.installmentsPaid).toBe(1);
    expect(s1.installmentsRemaining).toBe(3);
    expect(s2.installmentsPaid).toBe(1);
    expect(s2.installmentsRemaining).toBe(3);
  });

  it('axis 4: checkCollectionStatus reports settled terminal after settlePlan', async () => {
    await seedPlan('p-c13', 'plan_c13', 2);
    await mock.startCollection({ sessionId: 'c13', planId: 'plan_c13' });
    await mock.settlePlan({ sessionId: 'c13', planId: 'plan_c13' });
    const status = await mock.checkCollectionStatus({
      sessionId: 'c13',
      planId: 'plan_c13',
    });
    expect(status.installmentsRemaining).toBe(0);
    expect(status.state).toBe('settled');
  });
});

describe('mock adapter — closeCollection', () => {
  it('axis 5: closeCollection detaches the session and further ops fail', async () => {
    await seedPlan('p-c14', 'plan_c14', 4);
    await mock.startCollection({ sessionId: 'c14', planId: 'plan_c14' });
    await mock.closeCollection({ sessionId: 'c14' });
    await expect(
      mock.markPaid({ sessionId: 'c14', planId: 'plan_c14' }),
    ).rejects.toThrow('collection_session_not_found');
  });

  it('axis 5: closeCollection on missing session reports collection_session_not_found', async () => {
    await expect(
      mock.closeCollection({ sessionId: 'never-started' }),
    ).rejects.toThrow('collection_session_not_found');
  });
});

describe('route validation — HTTP body shape', () => {
  it('axis 6: validateCollectionRequest accepts lateFee shape', () => {
    const parsed = validateCollectionRequest({
      kind: 'lateFee',
      sessionId: 'c15',
      planId: 'plan_c15',
      installmentIndex: 1,
    });
    expect(parsed.ok).toBe(true);
  });

  it('axis 6: validateCollectionRequest accepts markPaid shape', () => {
    const parsed = validateCollectionRequest({
      kind: 'markPaid',
      sessionId: 'c15',
      planId: 'plan_c15',
    });
    expect(parsed.ok).toBe(true);
  });

  it('axis 6: validateCollectionRequest accepts settle shape', () => {
    const parsed = validateCollectionRequest({
      kind: 'settle',
      sessionId: 'c15',
      planId: 'plan_c15',
    });
    expect(parsed.ok).toBe(true);
  });

  it('axis 6: validateCollectionRequest accepts status shape', () => {
    const parsed = validateCollectionRequest({
      kind: 'status',
      sessionId: 'c15',
      planId: 'plan_c15',
    });
    expect(parsed.ok).toBe(true);
  });

  it('axis 6: validateCollectionRequest rejects lateFee missing installmentIndex', () => {
    const parsed = validateCollectionRequest({
      kind: 'lateFee',
      sessionId: 'c15',
      planId: 'plan_c15',
    });
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.errorKind).toBe('installmentIndex_required_number');
  });

  it('axis 6: validateCollectionRequest rejects unknown kind', () => {
    const parsed = validateCollectionRequest({
      kind: 'purge',
      sessionId: 'c15',
      planId: 'plan_c15',
    });
    expect(parsed.ok).toBe(false);
  });

  it('axis 6: handleCollectionRequest routes markPaid + settle end to end', async () => {
    await seedPlan('p-c16', 'plan_c16', 3);
    await mock.startCollection({ sessionId: 'c16', planId: 'plan_c16' });
    const paidRes = await handleCollectionRequest(mock, {
      kind: 'markPaid',
      sessionId: 'c16',
      planId: 'plan_c16',
    });
    expect(paidRes.ok).toBe(true);
    const settleRes = await handleCollectionRequest(mock, {
      kind: 'settle',
      sessionId: 'c16',
      planId: 'plan_c16',
    });
    expect(settleRes.ok).toBe(true);
    expect(settleRes.state).toBe('settled');
  });

  it('axis 6: handleCollectionRequest reports errorKind when adapter refuses', async () => {
    const res = await handleCollectionRequest(mock, {
      kind: 'markPaid',
      sessionId: 'never-started',
      planId: 'plan_c17',
    });
    expect(res.ok).toBe(false);
    expect(res.errorKind).toBe('collection_session_not_found');
  });
});

describe('real adapter — env detection', () => {
  it('detectRealEnvMissing reports missing Klarna key when BNPL_STACK_READY=1', () => {
    const previous = { ...process.env };
    delete process.env['KIWA_MODE'];
    process.env['BNPL_STACK_READY'] = '1';
    delete process.env['KIWA_KLARNA_API_KEY'];
    delete process.env['KIWA_AFFIRM_API_URL'];
    delete process.env['KIWA_AFTERPAY_API_URL'];
    delete process.env['KIWA_CREDIT_BUREAU_URL'];
    expect(detectRealEnvMissing()).toBe('KIWA_KLARNA_API_KEY_MISSING');
    process.env = previous;
  });

  it('real adapter refuses chargeLateFee on non-integration environments', async () => {
    const real = makeRealAdapter();
    await expect(
      real.chargeLateFee({
        sessionId: 'c18',
        planId: 'plan_c18',
        installmentIndex: 1,
      }),
    ).rejects.toThrow('KIWA_BNPL_ENV_MISSING');
    const trace = real.traces().find((t) => t.op === 'chargeLateFee');
    expect(trace?.ok).toBe(false);
    expect(trace?.errorKind).toBe('KIWA_BNPL_ENV_MISSING');
  });
});
