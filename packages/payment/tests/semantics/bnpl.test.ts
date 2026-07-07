import { describe, expect, it } from 'vitest';
import {
  chargeLateFee,
  createBnplPlan,
  createLemonSqueezyMock,
  createPaddleMock,
  createStripeMock,
  markInstallmentPaid,
  type PaymentAdapter,
  scheduleInstallment,
  scoreRisk,
} from '../../src/index.js';

const providers: Array<{ name: string; make: () => PaymentAdapter }> = [
  { name: 'stripe', make: () => createStripeMock() },
  { name: 'paddle', make: () => createPaddleMock() },
  { name: 'lemonsqueezy', make: () => createLemonSqueezyMock() },
];

describe('bnpl axis — installment + risk + credit + late fee', () => {
  it.each(providers)('$name: createBnplPlan emits plan_created', async ({ make }) => {
    const adapter = make();
    const { session, step } = await createBnplPlan(adapter, {
      planId: 'plan_1',
      customerId: 'cus_1',
      totalCents: 12000,
      config: { installments: 4 },
    });
    expect(step.neutralEvent).toBe('bnpl.plan_created');
    expect(step.metadata.installments).toBe(4);
    expect(step.metadata.installmentAmountCents).toBe(3000);
    expect(session.state).toBe('plan-created');
    expect(session.installmentAmountCents).toBe(3000);
  });

  it('createBnplPlan rejects totalCents <= 0', async () => {
    const adapter = createStripeMock();
    await expect(
      createBnplPlan(adapter, {
        planId: 'plan_bad',
        customerId: 'cus',
        totalCents: 0,
        config: { installments: 4 },
      }),
    ).rejects.toThrow(/positive/);
  });

  it('createBnplPlan rejects installments < 2', async () => {
    const adapter = createStripeMock();
    await expect(
      createBnplPlan(adapter, {
        planId: 'plan_bad_2',
        customerId: 'cus',
        totalCents: 1000,
        config: { installments: 1 },
      }),
    ).rejects.toThrow(/between 2 and 12/);
  });

  it('createBnplPlan rejects installments > 12', async () => {
    const adapter = createStripeMock();
    await expect(
      createBnplPlan(adapter, {
        planId: 'plan_bad_3',
        customerId: 'cus',
        totalCents: 1000,
        config: { installments: 15 },
      }),
    ).rejects.toThrow(/between 2 and 12/);
  });

  it('createBnplPlan rounds down to integer cents (last installment absorbs remainder)', async () => {
    const adapter = createStripeMock();
    const { session } = await createBnplPlan(adapter, {
      planId: 'plan_r',
      customerId: 'cus',
      totalCents: 10001, // 10001 / 3 = 3333.66... → 3333
      config: { installments: 3 },
    });
    expect(session.installmentAmountCents).toBe(3333);
  });

  it.each(providers)('$name: scheduleInstallment fires each schedule then rejects after exhaustion', async ({ make }) => {
    const adapter = make();
    const { session } = await createBnplPlan(adapter, {
      planId: 'plan_s',
      customerId: 'cus',
      totalCents: 6000,
      config: { installments: 3 },
    });
    const first = await scheduleInstallment(adapter, session);
    expect(first.metadata.installmentIndex).toBe(1);
    const second = await scheduleInstallment(adapter, session);
    expect(second.metadata.installmentIndex).toBe(2);
    const third = await scheduleInstallment(adapter, session);
    expect(third.metadata.installmentIndex).toBe(3);
    await expect(scheduleInstallment(adapter, session)).rejects.toThrow(/all installments already scheduled/);
  });

  it('scheduleInstallment computes due offset based on interval config', async () => {
    const adapter = createStripeMock();
    const { session } = await createBnplPlan(adapter, {
      planId: 'plan_off',
      customerId: 'cus',
      totalCents: 4000,
      config: { installments: 2, installmentIntervalMs: 7 * 24 * 3600 * 1000 },
    });
    const first = await scheduleInstallment(adapter, session);
    expect(first.metadata.dueOffsetMs).toBe(7 * 24 * 3600 * 1000);
    const second = await scheduleInstallment(adapter, session);
    expect(second.metadata.dueOffsetMs).toBe(14 * 24 * 3600 * 1000);
  });

  it.each(providers)('$name: scoreRisk passing keeps active', async ({ make }) => {
    const adapter = make();
    const { session } = await createBnplPlan(adapter, {
      planId: 'plan_score',
      customerId: 'cus',
      totalCents: 5000,
      config: { installments: 4 },
    });
    const step = await scoreRisk(adapter, session, { score: 75 });
    expect(step.neutralEvent).toBe('bnpl.risk_scored');
    expect(step.metadata.passed).toBe(true);
    expect(session.state).toBe('risk-scored');
    expect(session.riskScore).toBe(75);
  });

  it('scoreRisk below minRiskScore defaults the plan', async () => {
    const adapter = createStripeMock();
    const { session } = await createBnplPlan(adapter, {
      planId: 'plan_d',
      customerId: 'cus',
      totalCents: 3000,
      config: { installments: 3 },
    });
    const step = await scoreRisk(adapter, session, { score: 20 });
    expect(step.metadata.passed).toBe(false);
    expect(session.state).toBe('defaulted');
  });

  it('scoreRisk with custom minRiskScore', async () => {
    const adapter = createStripeMock();
    const { session } = await createBnplPlan(adapter, {
      planId: 'plan_min',
      customerId: 'cus',
      totalCents: 3000,
      config: { installments: 3, minRiskScore: 80 },
    });
    const step = await scoreRisk(adapter, session, { score: 75 });
    expect(step.metadata.passed).toBe(false);
    expect(session.state).toBe('defaulted');
  });

  it('scoreRisk rejects score outside 0-100', async () => {
    const adapter = createStripeMock();
    const { session } = await createBnplPlan(adapter, {
      planId: 'plan_r',
      customerId: 'cus',
      totalCents: 1000,
      config: { installments: 2 },
    });
    await expect(scoreRisk(adapter, session, { score: -5 })).rejects.toThrow(/between 0 and 100/);
    await expect(scoreRisk(adapter, session, { score: 150 })).rejects.toThrow(/between 0 and 100/);
  });

  it('scoreRisk metadata includes creditBureau default and override', async () => {
    const adapter = createStripeMock();
    const { session } = await createBnplPlan(adapter, {
      planId: 'plan_cb',
      customerId: 'cus',
      totalCents: 2000,
      config: { installments: 2 },
    });
    const step = await scoreRisk(adapter, session, { score: 80, creditBureau: 'Experian' });
    expect(step.metadata.creditBureau).toBe('Experian');
    const { session: session2 } = await createBnplPlan(adapter, {
      planId: 'plan_cb2',
      customerId: 'cus',
      totalCents: 2000,
      config: { installments: 2 },
    });
    const step2 = await scoreRisk(adapter, session2, { score: 80 });
    expect(step2.metadata.creditBureau).toBe('internal');
  });

  it.each(providers)('$name: chargeLateFee accumulates fees per installment', async ({ make }) => {
    const adapter = make();
    const { session } = await createBnplPlan(adapter, {
      planId: 'plan_lf',
      customerId: 'cus',
      totalCents: 5000,
      config: { installments: 5, lateFeeCents: 500 },
    });
    const one = await chargeLateFee(adapter, session, { installmentIndex: 1 });
    expect(one.metadata.lateFeeCents).toBe(500);
    expect(session.lateFeesTotalCents).toBe(500);
    const two = await chargeLateFee(adapter, session, { installmentIndex: 2 });
    expect(two.metadata.totalLateFees).toBe(1000);
    expect(session.lateFeesTotalCents).toBe(1000);
  });

  it('chargeLateFee rejects out-of-range installmentIndex', async () => {
    const adapter = createStripeMock();
    const { session } = await createBnplPlan(adapter, {
      planId: 'plan_bad_idx',
      customerId: 'cus',
      totalCents: 3000,
      config: { installments: 3 },
    });
    await expect(chargeLateFee(adapter, session, { installmentIndex: 0 })).rejects.toThrow(/out of range/);
    await expect(chargeLateFee(adapter, session, { installmentIndex: 4 })).rejects.toThrow(/out of range/);
  });

  it('chargeLateFee rejects on settled or defaulted session', async () => {
    const adapter = createStripeMock();
    const { session } = await createBnplPlan(adapter, {
      planId: 'plan_settled',
      customerId: 'cus',
      totalCents: 2000,
      config: { installments: 2 },
    });
    await scoreRisk(adapter, session, { score: 10 }); // → defaulted
    await expect(chargeLateFee(adapter, session, { installmentIndex: 1 })).rejects.toThrow(/defaulted/);
  });

  it('markInstallmentPaid tracks paid count and enters settled at end', () => {
    const stripe = createStripeMock();
    // build a session via createBnplPlan sync-ish
    return createBnplPlan(stripe, {
      planId: 'plan_paid',
      customerId: 'cus',
      totalCents: 4000,
      config: { installments: 2 },
    }).then(async ({ session }) => {
      await scoreRisk(stripe, session, { score: 80 });
      markInstallmentPaid(session);
      expect(session.installmentsPaid).toBe(1);
      expect(session.state).toBe('active');
      markInstallmentPaid(session);
      expect(session.installmentsPaid).toBe(2);
      expect(session.state).toBe('settled');
    });
  });

  it('markInstallmentPaid preserves late-fee-charged state until settled', async () => {
    const adapter = createStripeMock();
    const { session } = await createBnplPlan(adapter, {
      planId: 'plan_late',
      customerId: 'cus',
      totalCents: 3000,
      config: { installments: 3 },
    });
    await chargeLateFee(adapter, session, { installmentIndex: 1 });
    markInstallmentPaid(session);
    // partial: still late-fee-charged snapshot
    expect(session.state).toBe('late-fee-charged');
  });

  it('history captures full lifecycle', async () => {
    const adapter = createStripeMock();
    const { session } = await createBnplPlan(adapter, {
      planId: 'plan_hist',
      customerId: 'cus_hist',
      totalCents: 6000,
      config: { installments: 3 },
    });
    await scheduleInstallment(adapter, session);
    await scoreRisk(adapter, session, { score: 80 });
    await scheduleInstallment(adapter, session);
    await chargeLateFee(adapter, session, { installmentIndex: 1 });
    expect(session.history).toHaveLength(5);
    expect(session.history.map((s) => s.neutralEvent)).toEqual([
      'bnpl.plan_created',
      'bnpl.installment_scheduled',
      'bnpl.risk_scored',
      'bnpl.installment_scheduled',
      'bnpl.late_fee_charged',
    ]);
  });

  it('default installmentIntervalMs is 14 days', async () => {
    const adapter = createStripeMock();
    const { session } = await createBnplPlan(adapter, {
      planId: 'plan_def',
      customerId: 'cus',
      totalCents: 2000,
      config: { installments: 2 },
    });
    expect(session.config.installmentIntervalMs).toBe(14 * 24 * 60 * 60 * 1000);
    expect(session.config.lateFeeCents).toBe(700);
  });
});
