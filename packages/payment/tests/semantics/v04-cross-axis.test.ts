import { describe, expect, it } from 'vitest';
import {
  advanceCascade,
  applyProration,
  calculateLocalizedTax,
  createLemonSqueezyMock,
  createPaddleMock,
  createStripeMock,
  enterGracePeriod,
  escalateArbitration,
  exitGracePeriod,
  fullRefund,
  migrateToken,
  openDispute,
  partialRefund,
  probeCircuit,
  representDispute,
  routeCharge,
  scheduleSmartRetry,
  shiftLiability,
  stackCoupon,
  startIdempotency,
  startOrchestration,
  startRecovery,
  startRefund,
  startSubscriptionMachine,
  startVault,
  submitDisputeEvidence,
  tokenizeCard,
  verifyPciScope,
  type PaymentAdapter,
} from '../../src/index.js';

/**
 * Cross-axis scenarios that exercise multiple v0.4 axes at once. Real
 * production flows always chain axes (failed charge → dunning cascade
 * → smart retry → recovered) so these tests protect the axis composition
 * boundaries.
 */
describe('v0.4 cross-axis scenarios', () => {
  it('failed orchestration → recovery cascade → recovered', async () => {
    const adapters: PaymentAdapter[] = [createStripeMock(), createPaddleMock()];
    const orchestration = startOrchestration({
      intentId: 'i_cross_1',
      amountCents: 4500,
      config: {
        providers: ['stripe', 'paddle'],
        maxRetriesPerProvider: 2,
        circuitBreakerThreshold: 5,
      },
    });
    await routeCharge(adapters, orchestration, { succeed: false, customerId: 'c_1' });
    // 2 failures on stripe → failover to paddle
    const failedOver = await routeCharge(adapters, orchestration, {
      succeed: false,
      customerId: 'c_1',
    });
    expect(failedOver.state).toBe('failed-over');
    // Kick off recovery on the paddle adapter that ended up handling it
    const paddle = adapters.find((a) => a.provider === 'paddle');
    if (!paddle) throw new Error('paddle adapter missing');
    const recovery = startRecovery({
      invoiceId: 'inv_cross_1',
      amountCents: 4500,
      customerId: 'c_1',
    });
    const retryStep = await scheduleSmartRetry(paddle, recovery);
    expect(retryStep.neutralEvent).toBe('recovery.smart_retry_scheduled');
    const cascade = await advanceCascade(paddle, recovery);
    expect(cascade.metadata.channel).toBe('email');
  });

  it('subscription grace + coupon stack + proration combines', async () => {
    const adapter = createStripeMock();
    const session = startSubscriptionMachine({
      subscriptionId: 'sub_cross_1',
      customerId: 'cus_cross_1',
      planPriceCents: 10_000,
    });
    await stackCoupon(adapter, session, { code: 'SAVE10', percentOff: 10, stackable: true });
    await enterGracePeriod(adapter, session);
    await exitGracePeriod(adapter, session, { recovered: true });
    const step = await applyProration(adapter, session, {
      daysElapsed: 10,
      daysInCycle: 30,
      newPlanPriceCents: 15_000,
    });
    expect(step.metadata.prorationDeltaCents).toBeGreaterThan(0);
    expect(session.state).toBe('active');
  });

  it('refund window expiry → dispute lifecycle → liability shift', async () => {
    const adapter = createStripeMock();
    // Simulate a dispute that arose because refund window closed
    const refundSession = startRefund({
      chargeId: 'ch_cross_1',
      originalAmountCents: 2000,
      chargedAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
      customerId: 'cus_x',
      policy: { windowMs: 30 * 24 * 60 * 60 * 1000 },
    });
    await expect(partialRefund(adapter, refundSession, { amountCents: 500 })).rejects.toThrow(
      /window has expired/,
    );
    // Customer disputes; merchant shifts liability via 3DS proof
    const dispute = openDispute({
      disputeId: 'dp_cross_1',
      chargeId: 'ch_cross_1',
      amountCents: 2000,
      customerId: 'cus_x',
      reason: 'product_not_received',
    });
    const shift = await shiftLiability(adapter, dispute, { threeDsAuthCode: 'AUTH_X' });
    expect(shift.neutralEvent).toBe('dispute.liability_shifted');
  });

  it('vault + PCI verify + cross-provider migration', async () => {
    const stripe = createStripeMock();
    const paddle = createPaddleMock();
    const vault = startVault({ customerId: 'cus_vault_x' });
    await tokenizeCard(stripe, vault, {
      tokenId: 'tok_x_stripe',
      last4: '1234',
      brand: 'visa',
      expMonth: 5,
      expYear: 2029,
      fingerprint: 'fp_x',
    });
    await verifyPciScope(stripe, vault, { targetScope: 'SAQ-A' });
    const migration = await migrateToken(stripe, paddle, vault, {
      tokenId: 'tok_x_stripe',
      newTokenId: 'tok_x_paddle',
    });
    expect(migration.metadata.fromProvider).toBe('stripe');
    expect(migration.metadata.toProvider).toBe('paddle');
  });

  it('tax localization across EU + UK + US in one report', async () => {
    const adapter = createStripeMock();
    const eu = await calculateLocalizedTax(adapter, {
      jurisdiction: 'EU',
      amountCents: 5000,
      customerId: 'cus_multi',
    });
    const uk = await calculateLocalizedTax(adapter, {
      jurisdiction: 'UK',
      amountCents: 3000,
      customerId: 'cus_multi',
    });
    const us = await calculateLocalizedTax(adapter, {
      jurisdiction: 'US',
      amountCents: 8000,
      customerId: 'cus_multi',
    });
    expect(eu.line.taxCents).toBe(1000);
    expect(uk.line.taxCents).toBe(600);
    expect(us.line.taxCents).toBe(700); // 8000 * 8.75 / 100 = 700
  });

  it('circuit-open + probe recovery + resume routing', async () => {
    const adapters: PaymentAdapter[] = [createStripeMock()];
    const session = startOrchestration({
      intentId: 'i_probe',
      amountCents: 100,
      config: {
        providers: ['stripe'],
        circuitBreakerThreshold: 1,
        circuitOpenDurationMs: 1,
        maxRetriesPerProvider: 5,
      },
    });
    await routeCharge(adapters, session, { succeed: false, customerId: 'c' });
    expect(session.state).toBe('circuit-open');
    await new Promise((r) => setTimeout(r, 3));
    await probeCircuit(adapters, session);
    expect(session.state).toBe('circuit-closed');
  });

  it('dispute represent → arbitration flow uses all steps', async () => {
    const adapter = createPaddleMock();
    const dispute = openDispute({
      disputeId: 'dp_full',
      chargeId: 'ch_full',
      amountCents: 5500,
      customerId: 'cus_full',
      reason: 'general',
    });
    await submitDisputeEvidence(adapter, dispute, { evidenceIds: ['a', 'b'] });
    await representDispute(adapter, dispute);
    const arb = await escalateArbitration(adapter, dispute);
    expect(arb.metadata.filingFeeCents).toBe(500);
  });

  it('recovery lost after cascade exhaustion → dispute reasoning', async () => {
    const adapter = createStripeMock();
    const recovery = startRecovery({
      invoiceId: 'inv_lost',
      amountCents: 200,
      customerId: 'cus_lost',
      config: { cascade: ['email'] },
    });
    await advanceCascade(adapter, recovery);
    await expect(advanceCascade(adapter, recovery)).rejects.toThrow(/exhausted/);
  });

  it('idempotency + concurrent handlers see independent state', async () => {
    const adapter = createStripeMock();
    const handlerA = startIdempotency({ handlerName: 'orders' });
    const handlerB = startIdempotency({ handlerName: 'billing' });
    const { event } = adapter.signWebhook({
      type: 'test',
      amountCents: 100,
      customerId: 'c',
    });
    const a1 = await (await import('../../src/index.js')).deliver(adapter, handlerA, event);
    const b1 = await (await import('../../src/index.js')).deliver(adapter, handlerB, event);
    expect(a1.deliver).toBe(true);
    expect(b1.deliver).toBe(true);
    const a2 = await (await import('../../src/index.js')).deliver(adapter, handlerA, event);
    expect(a2.deliver).toBe(false); // dedup on A
  });
});
