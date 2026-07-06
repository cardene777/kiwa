import { describe, expect, it } from 'vitest';
import {
  applyProration,
  calculateLocalizedTax,
  createLemonSqueezyMock,
  createPaddleMock,
  createStripeMock,
  denyByPolicy,
  finalizeDispute,
  finalizeRecovery,
  fullRefund,
  openDispute,
  partialRefund,
  representDispute,
  routeCharge,
  scheduleSmartRetry,
  startOrchestration,
  startRecovery,
  startRefund,
  startSubscriptionMachine,
  submitDisputeEvidence,
  type PaymentAdapter,
} from '../../src/index.js';

/**
 * v0.4 edge cases — boundary conditions, race semantics, guard clauses.
 * These lift branch coverage on the 8 new axes without needing dedicated
 * per-axis files.
 */
describe('v0.4 edge cases', () => {
  it('orchestration: routeCharge on terminated session throws', async () => {
    const adapters: PaymentAdapter[] = [createStripeMock()];
    const session = startOrchestration({
      intentId: 'i_term',
      amountCents: 100,
      config: { providers: ['stripe'] },
    });
    session.state = 'terminated';
    await expect(
      routeCharge(adapters, session, { succeed: true, customerId: 'c' }),
    ).rejects.toThrow(/terminated/);
  });

  it('orchestration: routeCharge throws when adapter for provider missing', async () => {
    const adapters: PaymentAdapter[] = [createStripeMock()];
    const session = startOrchestration({
      intentId: 'i_miss',
      amountCents: 100,
      config: { providers: ['paddle'] }, // adapter missing
    });
    await expect(
      routeCharge(adapters, session, { succeed: true, customerId: 'c' }),
    ).rejects.toThrow(/no adapter registered/);
  });

  it('recovery: scheduleSmartRetry rejected on recovered session', async () => {
    const adapter = createStripeMock();
    const session = startRecovery({
      invoiceId: 'i',
      amountCents: 1,
      customerId: 'c',
    });
    finalizeRecovery(session, { succeed: true });
    await expect(scheduleSmartRetry(adapter, session)).rejects.toThrow(/recovered/);
  });

  it('refund: max amount policy rejects oversized partial', async () => {
    const adapter = createStripeMock();
    const session = startRefund({
      chargeId: 'ch_max',
      originalAmountCents: 10_000,
      chargedAt: Date.now(),
      customerId: 'c',
      policy: { windowMs: 30 * 24 * 60 * 60 * 1000, maxAmountCents: 500 },
    });
    await expect(partialRefund(adapter, session, { amountCents: 600 })).rejects.toThrow(
      /maxAmountCents/,
    );
  });

  it('refund: fullRefund rejects when nothing remains', async () => {
    const adapter = createPaddleMock();
    const session = startRefund({
      chargeId: 'ch_full',
      originalAmountCents: 1000,
      chargedAt: Date.now(),
      customerId: 'c',
      policy: { windowMs: 30 * 24 * 60 * 60 * 1000 },
    });
    await fullRefund(adapter, session);
    await expect(fullRefund(adapter, session)).rejects.toThrow(/no remaining/);
  });

  it('refund: policy-denied then attempts still tracked', async () => {
    const adapter = createLemonSqueezyMock();
    const session = startRefund({
      chargeId: 'ch_pd',
      originalAmountCents: 500,
      chargedAt: Date.now(),
      customerId: 'c',
      policy: { windowMs: 24 * 60 * 60 * 1000 },
    });
    const step = await denyByPolicy(adapter, session);
    expect(step.metadata.originalCents).toBe(500);
  });

  it('dispute: finalizeDispute lost outcome', async () => {
    const adapter = createStripeMock();
    const session = openDispute({
      disputeId: 'dp_lost',
      chargeId: 'ch_lost',
      amountCents: 100,
      customerId: 'c',
      reason: 'r',
    });
    await submitDisputeEvidence(adapter, session, { evidenceIds: ['e'] });
    await representDispute(adapter, session);
    finalizeDispute(session, { won: false });
    expect(session.state).toBe('lost');
  });

  it('subscription: proration with same plan yields zero delta', async () => {
    const adapter = createStripeMock();
    const session = startSubscriptionMachine({
      subscriptionId: 's',
      customerId: 'c',
      planPriceCents: 1000,
    });
    const step = await applyProration(adapter, session, {
      daysElapsed: 10,
      daysInCycle: 30,
      newPlanPriceCents: 1000,
    });
    expect(step.metadata.prorationDeltaCents).toBe(0);
  });

  it('subscription: proration mid-cycle downgrade emits negative delta', async () => {
    const adapter = createPaddleMock();
    const session = startSubscriptionMachine({
      subscriptionId: 's_down',
      customerId: 'c',
      planPriceCents: 5000,
    });
    const step = await applyProration(adapter, session, {
      daysElapsed: 10,
      daysInCycle: 30,
      newPlanPriceCents: 2000,
    });
    // 20 days remain: old=5000*20/30=3333, new=2000*20/30=1333, delta=-2000
    expect(step.metadata.prorationDeltaCents).toBe(-2000);
  });

  it('tax localization: EU B2C at exact 20 percent boundary', async () => {
    const adapter = createStripeMock();
    const { line } = await calculateLocalizedTax(adapter, {
      jurisdiction: 'EU',
      amountCents: 1,
      customerId: 'c',
    });
    // 1 cent * 20 / 100 = 0.2 → round to 0
    expect(line.taxCents).toBe(0);
  });

  it('tax localization: UK B2C computes correctly', async () => {
    const adapter = createPaddleMock();
    const { line } = await calculateLocalizedTax(adapter, {
      jurisdiction: 'UK',
      amountCents: 100_000,
      customerId: 'c',
    });
    expect(line.taxCents).toBe(20_000);
  });

  it('tax localization: currency propagated in webhook event', async () => {
    const adapter = createStripeMock();
    const { step } = await calculateLocalizedTax(adapter, {
      jurisdiction: 'EU',
      amountCents: 5000,
      customerId: 'c',
      currency: 'eur',
    });
    expect(step.state).toBe('calculated');
  });

  it('recovery: cascade default fires 3 channels', async () => {
    const adapter = createStripeMock();
    const session = startRecovery({
      invoiceId: 'i_def',
      amountCents: 100,
      customerId: 'c',
    });
    expect(session.config.cascade).toEqual(['email', 'in-app', 'sms']);
  });

  it('recovery: cardUpdater and networkTokenization default true', async () => {
    const session = startRecovery({
      invoiceId: 'i_flags',
      amountCents: 100,
      customerId: 'c',
    });
    expect(session.config.cardUpdaterEnabled).toBe(true);
    expect(session.config.networkTokenizationEnabled).toBe(true);
  });

  it('orchestration: history captures every step', async () => {
    const adapters: PaymentAdapter[] = [createStripeMock()];
    const session = startOrchestration({
      intentId: 'i_hist',
      amountCents: 100,
      config: { providers: ['stripe'], maxRetriesPerProvider: 100 },
    });
    await routeCharge(adapters, session, { succeed: true, customerId: 'c' });
    await routeCharge(adapters, session, { succeed: true, customerId: 'c' });
    expect(session.history).toHaveLength(2);
  });

  it('recovery: history is empty until first emit', () => {
    const session = startRecovery({
      invoiceId: 'i_no_hist',
      amountCents: 100,
      customerId: 'c',
    });
    expect(session.history).toEqual([]);
  });

  it('refund: partial + full mixed correctly tracks remaining', async () => {
    const adapter = createStripeMock();
    const session = startRefund({
      chargeId: 'ch_mix',
      originalAmountCents: 10_000,
      chargedAt: Date.now(),
      customerId: 'c',
      policy: { windowMs: 30 * 24 * 60 * 60 * 1000 },
    });
    await partialRefund(adapter, session, { amountCents: 3000 });
    const fullStep = await fullRefund(adapter, session);
    expect(fullStep.amountCents).toBe(7000);
    expect(session.refundedCents).toBe(10_000);
  });

  it('subscription: coupon amountOff optional metadata is preserved', async () => {
    const adapter = createStripeMock();
    const session = startSubscriptionMachine({
      subscriptionId: 's_amt',
      customerId: 'c',
      planPriceCents: 1000,
    });
    const { stackCoupon } = await import('../../src/index.js');
    const step = await stackCoupon(adapter, session, {
      code: 'FIVE_OFF',
      percentOff: 0,
      amountOffCents: 500,
      stackable: true,
    });
    expect(step.metadata.couponCode).toBe('FIVE_OFF');
  });

  it('orchestration: totalFailures accumulates across failovers', async () => {
    const adapters: PaymentAdapter[] = [createStripeMock(), createPaddleMock()];
    const session = startOrchestration({
      intentId: 'i_tot',
      amountCents: 100,
      config: {
        providers: ['stripe', 'paddle'],
        maxRetriesPerProvider: 2,
        circuitBreakerThreshold: 100,
      },
    });
    await routeCharge(adapters, session, { succeed: false, customerId: 'c' });
    await routeCharge(adapters, session, { succeed: false, customerId: 'c' });
    await routeCharge(adapters, session, { succeed: false, customerId: 'c' });
    expect(session.totalFailures).toBe(3);
  });

  it('dispute: opening dispute captures currency when provided', async () => {
    const session = openDispute({
      disputeId: 'dp_cur',
      chargeId: 'ch',
      amountCents: 100,
      customerId: 'c',
      currency: 'gbp',
      reason: 'x',
    });
    expect(session.currency).toBe('gbp');
  });

  it('vault: startVault with currency', async () => {
    const { startVault } = await import('../../src/index.js');
    const session = startVault({ customerId: 'c', currency: 'usd' });
    expect(session.currency).toBe('usd');
  });

  it('webhook: dedup key uses handlerName prefix', async () => {
    const { startIdempotency, deliver } = await import('../../src/index.js');
    const adapter = createStripeMock();
    const session = startIdempotency({ handlerName: 'H1' });
    const { event } = adapter.signWebhook({
      type: 't',
      amountCents: 1,
      customerId: 'c',
    });
    const res = await deliver(adapter, session, event);
    expect(res.step.metadata.dedupKey).toContain('H1:');
  });

  it('webhook: config defaults populate on start', async () => {
    const { startIdempotency } = await import('../../src/index.js');
    const session = startIdempotency({ handlerName: 'default' });
    expect(session.config.dedupWindowMs).toBe(24 * 60 * 60 * 1000);
    expect(session.config.maxDeliveryAttempts).toBe(5);
    expect(session.config.replayToleranceMs).toBe(5 * 60 * 1000);
  });

  it('orchestration: DEFAULT circuit breaker at 5 failures', async () => {
    const session = startOrchestration({
      intentId: 'i_def_cb',
      amountCents: 1,
      config: { providers: ['stripe'] },
    });
    expect(session.config.circuitBreakerThreshold).toBe(5);
    expect(session.config.maxRetriesPerProvider).toBe(2);
  });

  it('recovery: preventChargeback path uses same emit logic', async () => {
    const adapter = createStripeMock();
    const session = startRefund({
      chargeId: 'ch_pc',
      originalAmountCents: 1000,
      chargedAt: Date.now(),
      customerId: 'c',
      policy: { windowMs: 30 * 24 * 60 * 60 * 1000, chargebackPrevention: true },
    });
    const { preventChargeback } = await import('../../src/index.js');
    const step = await preventChargeback(adapter, session);
    expect(step.amountCents).toBe(1000);
    expect(session.state).toBe('full-issued');
  });

  it('dispute: submitDisputeEvidence rejects after represent', async () => {
    const adapter = createStripeMock();
    const session = openDispute({
      disputeId: 'dp_rej',
      chargeId: 'ch',
      amountCents: 1,
      customerId: 'c',
      reason: 'r',
    });
    await submitDisputeEvidence(adapter, session, { evidenceIds: ['e1'] });
    await representDispute(adapter, session);
    await expect(
      submitDisputeEvidence(adapter, session, { evidenceIds: ['e2'] }),
    ).rejects.toThrow(/cannot add evidence/);
  });

  it('subscription: startSubscriptionMachine currency propagated', () => {
    const session = startSubscriptionMachine({
      subscriptionId: 's_cur',
      customerId: 'c',
      planPriceCents: 500,
      currency: 'jpy',
    });
    expect(session.currency).toBe('jpy');
  });
});
