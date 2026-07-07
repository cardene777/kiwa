/**
 * v1.33-5 docs 補強 (Issue #1040 / CAR-739) — tutorial 64-66 code snippet validation.
 *
 * `docs/tutorials/64-payment-orchestration.md` /
 * `docs/tutorials/65-stripe-connect-marketplace.md` /
 * `docs/tutorials/66-paddle-billing-v2.md` に載っている
 * code snippet が実際に動作することを behavior test で担保する。
 *
 * v1.23 → v1.33 で 11 milestone 連続 snippet validation streak を延伸。
 * tutorial の code snippet が drift すると読者が「動かない」 体験をする
 * ため、 snippet と実 API の乖離を CI で検知する。
 */
import { describe, expect, it } from 'vitest';
import {
  advanceCascade,
  applyCardUpdate,
  applyNetworkToken,
  applyProration,
  calculateLocalizedTax,
  collectFidelityCoverage,
  createLemonSqueezyMock,
  createPaddleMock,
  createStripeMock,
  deliver,
  enterGracePeriod,
  escalateArbitration,
  exitGracePeriod,
  finalizeDispute,
  finalizeRecovery,
  fullRefund,
  migrateToken,
  openDispute,
  partialRefund,
  preventChargeback,
  probeCircuit,
  reportDac7,
  representDispute,
  revokeToken,
  rotateSignature,
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
} from '../src/index.js';

// ---------------------------------------------------------------------------
// Tutorial 64 — Payment orchestration
// ---------------------------------------------------------------------------

describe('tutorial 64 — startOrchestration', () => {
  it('constructs a session with defaults filled in (tutorial: defaults snippet)', () => {
    const session = startOrchestration({
      intentId: 'pi_1',
      amountCents: 4999,
      currency: 'usd',
      config: { providers: ['stripe', 'paddle', 'lemonsqueezy'] },
    });

    expect(session.state).toBe('routing');
    expect(session.currentProviderIndex).toBe(0);
    expect(session.config.circuitBreakerThreshold).toBe(5);
    expect(session.config.maxRetriesPerProvider).toBe(2);
    expect(session.config.circuitOpenDurationMs).toBe(30_000);
  });

  it('rejects an empty provider list (tutorial: empty-list snippet)', () => {
    expect(() =>
      startOrchestration({
        intentId: 'pi_1',
        amountCents: 4999,
        config: { providers: [] },
      }),
    ).toThrow(/providers must not be empty/);
  });
});

describe('tutorial 64 — routeCharge retry ladder', () => {
  it('stays on the primary while the per-provider cap has not been hit (tutorial: retry-ladder snippet)', async () => {
    const stripe = createStripeMock({ secret: 'whsec_test' });
    const session = startOrchestration({
      intentId: 'pi_1',
      amountCents: 4999,
      currency: 'usd',
      config: { providers: ['stripe'], maxRetriesPerProvider: 3, circuitBreakerThreshold: 100 },
    });

    const step = await routeCharge([stripe], session, { succeed: false, customerId: 'cus_1' });

    expect(step.state).toBe('routing');
    expect(session.currentProviderIndex).toBe(0);
    expect(session.totalFailures).toBe(1);
    expect(step.neutralEvent).toBe('orchestration.routed');
  });

  it('emits orchestration.routed on the success path (tutorial: success snippet)', async () => {
    const stripe = createStripeMock({ secret: 'whsec_test' });
    const session = startOrchestration({
      intentId: 'pi_2',
      amountCents: 4999,
      currency: 'usd',
      config: { providers: ['stripe'] },
    });

    const step = await routeCharge([stripe], session, { succeed: true, customerId: 'cus_1' });

    expect(step.state).toBe('routing');
    expect(step.neutralEvent).toBe('orchestration.routed');
    expect(step.metadata.provider).toBe('stripe');
    expect(session.totalFailures).toBe(0);
  });
});

describe('tutorial 64 — failover cascade', () => {
  it('failed_over after maxRetriesPerProvider consecutive failures (tutorial: failover snippet)', async () => {
    const stripe = createStripeMock({ secret: 'whsec_stripe' });
    const paddle = createPaddleMock({ secret: 'whsec_paddle' });
    const session = startOrchestration({
      intentId: 'pi_1',
      amountCents: 4999,
      currency: 'usd',
      config: {
        providers: ['stripe', 'paddle'],
        maxRetriesPerProvider: 2,
        circuitBreakerThreshold: 100,
      },
    });

    await routeCharge([stripe, paddle], session, { succeed: false, customerId: 'cus_1' });
    const failover = await routeCharge([stripe, paddle], session, {
      succeed: false,
      customerId: 'cus_1',
    });

    expect(failover.state).toBe('failed-over');
    expect(failover.neutralEvent).toBe('orchestration.failed_over');
    expect(failover.metadata.provider).toBe('paddle');
    expect(session.currentProviderIndex).toBe(1);
    expect(session.currentProviderFailures).toBe(0);
  });
});

describe('tutorial 64 — circuit breaker', () => {
  it('opens after circuitBreakerThreshold total failures (tutorial: circuit-open snippet)', async () => {
    const stripe = createStripeMock({ secret: 'whsec_test' });
    const session = startOrchestration({
      intentId: 'pi_1',
      amountCents: 4999,
      currency: 'usd',
      config: {
        providers: ['stripe'],
        maxRetriesPerProvider: 100,
        circuitBreakerThreshold: 3,
      },
    });

    await routeCharge([stripe], session, { succeed: false, customerId: 'cus_1' });
    await routeCharge([stripe], session, { succeed: false, customerId: 'cus_1' });
    const opened = await routeCharge([stripe], session, {
      succeed: false,
      customerId: 'cus_1',
    });

    expect(opened.state).toBe('circuit-open');
    expect(opened.neutralEvent).toBe('orchestration.circuit_opened');
    expect(session.circuitOpenedAt).not.toBeNull();
  });

  it('probeCircuit reports opened metadata while the window has not elapsed (tutorial: probe snippet)', async () => {
    const stripe = createStripeMock({ secret: 'whsec_test' });
    const session = startOrchestration({
      intentId: 'pi_2',
      amountCents: 4999,
      config: {
        providers: ['stripe'],
        maxRetriesPerProvider: 100,
        circuitBreakerThreshold: 1,
        circuitOpenDurationMs: 60_000,
      },
    });
    await routeCharge([stripe], session, { succeed: false, customerId: 'cus_1' });

    const probe = await probeCircuit([stripe], session);

    expect(probe.state).toBe('circuit-open');
    expect(Number(probe.metadata.remainingMs)).toBeGreaterThan(0);
  });
});

describe('tutorial 64 — fidelity coverage', () => {
  it('every provider covers the orchestration axis with 4 neutral events (tutorial: fidelity snippet)', () => {
    const coverage = collectFidelityCoverage([
      createStripeMock({ secret: 'whsec_stripe' }),
      createPaddleMock({ secret: 'whsec_paddle' }),
      createLemonSqueezyMock({ secret: 'whsec_lemonsqueezy' }),
    ]);

    const orchRows = coverage.rows.filter((r) => r.axis === 'orchestration');
    expect(orchRows).toHaveLength(3);
    for (const row of orchRows) {
      expect(row.neutralEvents).toEqual([
        'orchestration.routed',
        'orchestration.failed_over',
        'orchestration.circuit_opened',
        'orchestration.circuit_closed',
      ]);
    }
  });
});

// ---------------------------------------------------------------------------
// Tutorial 65 — Stripe Connect marketplace
// ---------------------------------------------------------------------------

describe('tutorial 65 — dispute evidence + representment', () => {
  it('opens a dispute then advances through evidence-submitted → represented (tutorial: dispute-evidence snippet)', async () => {
    const stripe = createStripeMock({ secret: 'whsec_test' });
    const session = openDispute({
      disputeId: 'dp_1',
      chargeId: 'ch_1',
      amountCents: 4999,
      currency: 'usd',
      customerId: 'cus_1',
      reason: 'product_not_received',
    });
    expect(session.state).toBe('opened');

    const submitted = await submitDisputeEvidence(stripe, session, {
      evidenceIds: ['receipt.pdf', 'shipping_label.pdf'],
    });
    expect(submitted.state).toBe('evidence-submitted');
    expect(session.evidence).toHaveLength(2);

    const represented = await representDispute(stripe, session);
    expect(represented.state).toBe('represented');
    expect(represented.neutralEvent).toBe('dispute.represented');
  });

  it('rejects representDispute without evidence (tutorial: represent-reject snippet)', async () => {
    const stripe = createStripeMock({ secret: 'whsec_test' });
    const session = openDispute({
      disputeId: 'dp_2',
      chargeId: 'ch_2',
      amountCents: 4999,
      customerId: 'cus_1',
      reason: 'fraud',
    });
    await expect(representDispute(stripe, session)).rejects.toThrow(
      /evidence must be submitted first/,
    );
  });
});

describe('tutorial 65 — arbitration escalation + liability shift', () => {
  it('walks opened → evidence-submitted → represented → arbitration-opened (tutorial: arbitration snippet)', async () => {
    const stripe = createStripeMock({ secret: 'whsec_test' });
    const session = openDispute({
      disputeId: 'dp_1',
      chargeId: 'ch_1',
      amountCents: 9999,
      currency: 'usd',
      customerId: 'cus_1',
      reason: 'product_unacceptable',
    });
    await submitDisputeEvidence(stripe, session, { evidenceIds: ['receipt.pdf'] });
    await representDispute(stripe, session);
    const escalated = await escalateArbitration(stripe, session);

    expect(escalated.state).toBe('arbitration-opened');
    expect(escalated.metadata.filingFeeCents).toBe(500);
    expect(session.arbitrationOpenedAt).not.toBeNull();
  });

  it('shifts liability to the issuer with a 3DS auth code (tutorial: liability-shift snippet)', async () => {
    const stripe = createStripeMock({ secret: 'whsec_test' });
    const session = openDispute({
      disputeId: 'dp_2',
      chargeId: 'ch_2',
      amountCents: 4999,
      customerId: 'cus_1',
      reason: 'fraud',
    });
    const shifted = await shiftLiability(stripe, session, { threeDsAuthCode: '3ds_abc' });

    expect(shifted.state).toBe('liability-shifted');
    expect(shifted.metadata.threeDsAuthCode).toBe('3ds_abc');
    expect(session.liabilityShifted).toBe(true);
  });
});

describe('tutorial 65 — partial refund with policy', () => {
  it('issues a partial refund inside the window with per-refund caps (tutorial: partial-refund snippet)', async () => {
    const stripe = createStripeMock({ secret: 'whsec_test' });
    const session = startRefund({
      chargeId: 'ch_1',
      originalAmountCents: 9999,
      chargedAt: Date.now(),
      customerId: 'cus_1',
      currency: 'usd',
      policy: {
        windowMs: 30 * 24 * 60 * 60 * 1000,
        minAmountCents: 100,
        maxAmountCents: 5000,
      },
    });

    const step = await partialRefund(stripe, session, { amountCents: 2500 });

    expect(step.state).toBe('partial-issued');
    expect(step.neutralEvent).toBe('refund.partial');
    expect(session.refundedCents).toBe(2500);
    expect(step.metadata.remainingCents).toBe(9999 - 2500);
  });

  it('rejects a refund above maxAmountCents (tutorial: refund-cap snippet)', async () => {
    const stripe = createStripeMock({ secret: 'whsec_test' });
    const session = startRefund({
      chargeId: 'ch_2',
      originalAmountCents: 9999,
      chargedAt: Date.now(),
      customerId: 'cus_1',
      policy: { windowMs: 30 * 24 * 60 * 60 * 1000, maxAmountCents: 5000 },
    });
    await expect(partialRefund(stripe, session, { amountCents: 6000 })).rejects.toThrow(
      /above maxAmountCents/,
    );
  });
});

describe('tutorial 65 — webhook idempotency for payout events', () => {
  it('dedups a second delivery of the same event id inside the window (tutorial: dedup snippet)', async () => {
    const stripe = createStripeMock({ secret: 'whsec_test' });
    const session = startIdempotency({ handlerName: 'payout-handler' });
    const { event } = stripe.signWebhook({
      type: 'payout.paid',
      amountCents: 12000,
      customerId: 'acct_1',
    });

    const first = await deliver(stripe, session, event);
    const second = await deliver(stripe, session, event);

    expect(first.deliver).toBe(true);
    expect(second.deliver).toBe(false);
    expect(second.step.state).toBe('dedup-hit');
    expect(second.step.metadata.dedupKey).toBe(`payout-handler:${event.id}`);
  });
});

describe('tutorial 65 — DAC7 report', () => {
  it('rolls up 3 EU + UK lines into a single DAC7 report event (tutorial: dac7 snippet)', async () => {
    const stripe = createStripeMock({ secret: 'whsec_test' });
    const { line: euLine } = await calculateLocalizedTax(stripe, {
      jurisdiction: 'EU',
      amountCents: 10_000,
      customerId: 'cus_de',
    });
    const { line: ukLine } = await calculateLocalizedTax(stripe, {
      jurisdiction: 'UK',
      amountCents: 5_000,
      customerId: 'cus_uk',
    });
    const { line: b2bReverseCharge } = await calculateLocalizedTax(stripe, {
      jurisdiction: 'EU',
      amountCents: 20_000,
      customerId: 'cus_biz',
      b2b: true,
    });

    expect(euLine.taxCents).toBe(2000);
    expect(euLine.reverseCharge).toBe(false);
    expect(ukLine.taxCents).toBe(1000);
    expect(b2bReverseCharge.reverseCharge).toBe(true);
    expect(b2bReverseCharge.taxCents).toBe(0);

    const report = await reportDac7(stripe, {
      sellerId: 'seller_1',
      reportingYear: 2026,
      lines: [euLine, ukLine, b2bReverseCharge],
      customerId: 'seller_1',
      currency: 'eur',
    });

    expect(report.state).toBe('reported');
    expect(report.metadata.lineCount).toBe(3);
    expect(report.metadata.totalTaxCents).toBe(3000);
    expect(report.amountCents).toBe(35_000);
  });
});

// ---------------------------------------------------------------------------
// Tutorial 66 — Paddle Billing v2
// ---------------------------------------------------------------------------

describe('tutorial 66 — grace period lifecycle', () => {
  it('enters grace, recovers back to active (tutorial: grace-recover snippet)', async () => {
    const paddle = createPaddleMock({ secret: 'whsec_test' });
    const session = startSubscriptionMachine({
      subscriptionId: 'sub_1',
      customerId: 'cus_1',
      planPriceCents: 2999,
      currency: 'usd',
      gracePeriodMs: 7 * 24 * 60 * 60 * 1000,
    });

    const entered = await enterGracePeriod(paddle, session);
    expect(entered.state).toBe('grace-period');
    expect(entered.neutralEvent).toBe('subscription.grace_period_entered');
    expect(Number(entered.metadata.graceEndsAt)).toBeGreaterThan(Date.now());

    const exited = await exitGracePeriod(paddle, session, { recovered: true });
    expect(exited.state).toBe('active');
    expect(session.gracePeriodEnteredAt).toBeNull();
  });

  it('enters grace, expires on timeout (tutorial: grace-expire snippet)', async () => {
    const paddle = createPaddleMock({ secret: 'whsec_test' });
    const session = startSubscriptionMachine({
      subscriptionId: 'sub_2',
      customerId: 'cus_1',
      planPriceCents: 2999,
    });
    await enterGracePeriod(paddle, session);
    const expired = await exitGracePeriod(paddle, session, { recovered: false });

    expect(expired.state).toBe('expired');
    expect(expired.metadata.recovered).toBe(false);
  });
});

describe('tutorial 66 — mid-cycle proration', () => {
  it('upgrades on day 10 of a 30-day cycle: credits 20 days of old + charges 20 days of new (tutorial: proration snippet)', async () => {
    const paddle = createPaddleMock({ secret: 'whsec_test' });
    const session = startSubscriptionMachine({
      subscriptionId: 'sub_1',
      customerId: 'cus_1',
      planPriceCents: 900,
    });

    const step = await applyProration(paddle, session, {
      daysElapsed: 10,
      daysInCycle: 30,
      newPlanPriceCents: 2999,
    });

    expect(step.neutralEvent).toBe('subscription.proration_applied');
    // (30-10)/30 * (2999 - 900) = 20/30 * 2099 = ~1399
    expect(step.metadata.prorationDeltaCents).toBe(1399);
    expect(step.metadata.oldPlanCents).toBe(900);
    expect(step.metadata.newPlanCents).toBe(2999);
    expect(session.currentCyclePriceCents).toBe(2999);
  });

  it('rejects daysInCycle=0 (tutorial: proration-guard snippet)', async () => {
    const paddle = createPaddleMock({ secret: 'whsec_test' });
    const session = startSubscriptionMachine({
      subscriptionId: 'sub_2',
      customerId: 'cus_1',
      planPriceCents: 900,
    });
    await expect(
      applyProration(paddle, session, { daysElapsed: 5, daysInCycle: 0, newPlanPriceCents: 2999 }),
    ).rejects.toThrow(/daysInCycle must be positive/);
  });
});

describe('tutorial 66 — coupon stacking', () => {
  it('stacks 2 stackable coupons summing under 100 (tutorial: coupon-stack snippet)', async () => {
    const paddle = createPaddleMock({ secret: 'whsec_test' });
    const session = startSubscriptionMachine({
      subscriptionId: 'sub_1',
      customerId: 'cus_1',
      planPriceCents: 3000,
    });

    await stackCoupon(paddle, session, { code: 'BF10', percentOff: 10, stackable: true });
    const second = await stackCoupon(paddle, session, {
      code: 'REF15',
      percentOff: 15,
      stackable: true,
    });

    expect(second.metadata.totalPercentOff).toBe(25);
    expect(second.metadata.discountedCents).toBe(2250);
    expect(second.metadata.stackSize).toBe(2);
  });

  it('caps combined percent at 100 (tutorial: coupon-cap snippet)', async () => {
    const paddle = createPaddleMock({ secret: 'whsec_test' });
    const session = startSubscriptionMachine({
      subscriptionId: 'sub_2',
      customerId: 'cus_1',
      planPriceCents: 3000,
    });
    await stackCoupon(paddle, session, { code: 'A', percentOff: 60, stackable: true });
    const capped = await stackCoupon(paddle, session, {
      code: 'B',
      percentOff: 80,
      stackable: true,
    });

    expect(capped.metadata.totalPercentOff).toBe(100);
    expect(capped.metadata.discountedCents).toBe(0);
  });

  it('non-stackable coupon replaces all previous stackable coupons (tutorial: coupon-exclusive snippet)', async () => {
    const paddle = createPaddleMock({ secret: 'whsec_test' });
    const session = startSubscriptionMachine({
      subscriptionId: 'sub_3',
      customerId: 'cus_1',
      planPriceCents: 3000,
    });
    await stackCoupon(paddle, session, { code: 'A', percentOff: 20, stackable: true });
    const exclusive = await stackCoupon(paddle, session, {
      code: 'VIP50',
      percentOff: 50,
      stackable: false,
    });

    expect(exclusive.metadata.stackSize).toBe(1);
    expect(exclusive.metadata.totalPercentOff).toBe(50);
    expect(session.coupons.map((c) => c.code)).toEqual(['VIP50']);
  });
});

describe('tutorial 66 — recovery ladder', () => {
  it('smart retry → dunning cascade → card update → network token → recovered (tutorial: recovery snippet)', async () => {
    const paddle = createPaddleMock({ secret: 'whsec_test' });
    const session = startRecovery({
      invoiceId: 'inv_1',
      amountCents: 2999,
      customerId: 'cus_1',
      currency: 'usd',
      config: {
        cascade: ['email', 'in-app', 'sms'],
        cascadeStepMs: 60_000,
        cardUpdaterEnabled: true,
        networkTokenizationEnabled: true,
      },
    });

    const smart = await scheduleSmartRetry(paddle, session);
    expect(smart.state).toBe('smart-retry-scheduled');
    expect(smart.metadata.priority).toBe('high');

    const email = await advanceCascade(paddle, session);
    expect(email.metadata.channel).toBe('email');
    expect(email.metadata.stepIndex).toBe(1);

    const inApp = await advanceCascade(paddle, session);
    expect(inApp.metadata.channel).toBe('in-app');

    const carded = await applyCardUpdate(paddle, session, {
      last4: '4242',
      expMonth: 12,
      expYear: 2030,
    });
    expect(carded.state).toBe('card-updated');
    expect(carded.metadata.last4).toBe('4242');

    const tokened = await applyNetworkToken(paddle, session, {
      networkTokenId: 'ntk_visa_abc',
    });
    expect(tokened.state).toBe('network-tokenized');

    const final = finalizeRecovery(session, { succeed: true });
    expect(final.state).toBe('recovered');
  });
});

describe('tutorial 66 — vault + cross-provider migration', () => {
  it('tokenizes a card in Paddle then migrates it to Stripe with the same fingerprint (tutorial: vault-migrate snippet)', async () => {
    const paddle = createPaddleMock({ secret: 'whsec_paddle' });
    const stripe = createStripeMock({ secret: 'whsec_stripe' });
    const vault = startVault({ customerId: 'cus_1', currency: 'usd' });

    await tokenizeCard(paddle, vault, {
      tokenId: 'pm_paddle_abc',
      last4: '4242',
      brand: 'visa',
      expMonth: 12,
      expYear: 2030,
      fingerprint: 'fp_visa_4242',
      networkTokenId: 'ntk_visa_abc',
    });

    const migrated = await migrateToken(paddle, stripe, vault, {
      tokenId: 'pm_paddle_abc',
      newTokenId: 'pm_stripe_xyz',
    });

    expect(migrated.state).toBe('migrated');
    expect(migrated.metadata.fromProvider).toBe('paddle');
    expect(migrated.metadata.toProvider).toBe('stripe');
    expect(migrated.metadata.fingerprint).toBe('fp_visa_4242');
    expect(vault.tokens.has('pm_stripe_xyz')).toBe(true);
    expect(vault.tokens.has('pm_paddle_abc')).toBe(false);
  });

  it('verifyPciScope passes when no raw PAN is present in any token (tutorial: pci-scope snippet)', async () => {
    const paddle = createPaddleMock({ secret: 'whsec_paddle' });
    const vault = startVault({ customerId: 'cus_1' });
    await tokenizeCard(paddle, vault, {
      tokenId: 'pm_1',
      last4: '4242',
      brand: 'visa',
      expMonth: 12,
      expYear: 2030,
      fingerprint: 'fp_1',
    });

    const verified = await verifyPciScope(paddle, vault, { targetScope: 'SAQ-A' });

    expect(verified.state).toBe('pci-verified');
    expect(verified.metadata.scope).toBe('SAQ-A');
    expect(vault.pciScope).toBe('SAQ-A');
  });
});

// ---------------------------------------------------------------------------
// Tutorial-referenced API surface — additional tutorial snippet coverage
// ---------------------------------------------------------------------------
// The tutorials name-drop these functions in the intro + "What you learned"
// sections. Behavior-test them so a public API drift breaks CI regardless of
// which snippet the reader lands on.

describe('tutorial 64 — routeCharge terminated + wrong-state guards', () => {
  it('rejects routeCharge while the circuit is open (tutorial: circuit-guard snippet)', async () => {
    const stripe = createStripeMock({ secret: 'whsec_test' });
    const session = startOrchestration({
      intentId: 'pi_1',
      amountCents: 4999,
      config: {
        providers: ['stripe'],
        maxRetriesPerProvider: 100,
        circuitBreakerThreshold: 1,
      },
    });
    await routeCharge([stripe], session, { succeed: false, customerId: 'cus_1' });
    expect(session.state).toBe('circuit-open');

    await expect(
      routeCharge([stripe], session, { succeed: false, customerId: 'cus_1' }),
    ).rejects.toThrow(/circuit is open/);
  });

  it('rejects routeCharge with no adapter for the current provider (tutorial: adapter-missing snippet)', async () => {
    const stripe = createStripeMock({ secret: 'whsec_stripe' });
    const session = startOrchestration({
      intentId: 'pi_1',
      amountCents: 4999,
      config: { providers: ['paddle'] },
    });
    await expect(
      routeCharge([stripe], session, { succeed: true, customerId: 'cus_1' }),
    ).rejects.toThrow(/no adapter registered for paddle/);
  });
});

describe('tutorial 65 — finalizeDispute won / lost outcomes', () => {
  it('finalizeDispute(won) marks the dispute as won (tutorial: dispute-won snippet)', async () => {
    const stripe = createStripeMock({ secret: 'whsec_test' });
    const session = openDispute({
      disputeId: 'dp_1',
      chargeId: 'ch_1',
      amountCents: 4999,
      customerId: 'cus_1',
      reason: 'product_not_received',
    });
    await submitDisputeEvidence(stripe, session, { evidenceIds: ['receipt.pdf'] });
    await representDispute(stripe, session);
    const final = finalizeDispute(session, { won: true });

    expect(final.state).toBe('won');
  });

  it('finalizeDispute(lost) marks the dispute as lost (tutorial: dispute-lost snippet)', async () => {
    const stripe = createStripeMock({ secret: 'whsec_test' });
    const session = openDispute({
      disputeId: 'dp_2',
      chargeId: 'ch_2',
      amountCents: 4999,
      customerId: 'cus_1',
      reason: 'fraud',
    });
    const final = finalizeDispute(session, { won: false });

    expect(final.state).toBe('lost');
  });
});

describe('tutorial 65 — refund full path + policy-denied + preventChargeback', () => {
  it('issues a full refund inside the window (tutorial: full-refund snippet)', async () => {
    const stripe = createStripeMock({ secret: 'whsec_test' });
    const session = startRefund({
      chargeId: 'ch_1',
      originalAmountCents: 9999,
      chargedAt: Date.now(),
      customerId: 'cus_1',
      policy: { windowMs: 30 * 24 * 60 * 60 * 1000 },
    });

    const step = await fullRefund(stripe, session);

    expect(step.state).toBe('full-issued');
    expect(step.neutralEvent).toBe('refund.full');
    expect(session.refundedCents).toBe(9999);
  });

  it('preventChargeback issues a full refund when chargebackPrevention is on (tutorial: prevent-chargeback snippet)', async () => {
    const stripe = createStripeMock({ secret: 'whsec_test' });
    const session = startRefund({
      chargeId: 'ch_2',
      originalAmountCents: 4999,
      chargedAt: Date.now(),
      customerId: 'cus_1',
      policy: { windowMs: 30 * 24 * 60 * 60 * 1000, chargebackPrevention: true },
    });

    const step = await preventChargeback(stripe, session);

    expect(step.state).toBe('full-issued');
    expect(session.refundedCents).toBe(4999);
  });

  it('preventChargeback rejects when chargebackPrevention is disabled (tutorial: prevent-chargeback-guard snippet)', async () => {
    const stripe = createStripeMock({ secret: 'whsec_test' });
    const session = startRefund({
      chargeId: 'ch_3',
      originalAmountCents: 4999,
      chargedAt: Date.now(),
      customerId: 'cus_1',
      policy: { windowMs: 30 * 24 * 60 * 60 * 1000 },
    });

    await expect(
      preventChargeback(stripe, session),
    ).rejects.toThrow(/chargebackPrevention disabled/);
  });
});

describe('tutorial 65 — tax localization jurisdiction spread', () => {
  it('AU applies GST at 10 % (tutorial: gst snippet)', async () => {
    const stripe = createStripeMock({ secret: 'whsec_test' });
    const { line } = await calculateLocalizedTax(stripe, {
      jurisdiction: 'AU',
      amountCents: 10_000,
      customerId: 'cus_au',
    });

    expect(line.kind).toBe('gst');
    expect(line.ratePercent).toBe(10);
    expect(line.taxCents).toBe(1000);
    expect(line.reverseCharge).toBe(false);
  });

  it('US applies sales-tax at 8.75 % (tutorial: us-sales-tax snippet)', async () => {
    const stripe = createStripeMock({ secret: 'whsec_test' });
    const { line } = await calculateLocalizedTax(stripe, {
      jurisdiction: 'US',
      amountCents: 10_000,
      customerId: 'cus_us',
      region: 'US-CA',
    });

    expect(line.kind).toBe('sales-tax');
    expect(line.ratePercent).toBe(8.75);
    expect(line.taxCents).toBe(875);
  });
});

describe('tutorial 66 — vault revokeToken', () => {
  it('revokes an existing token and decrements the vault (tutorial: revoke-token snippet)', async () => {
    const paddle = createPaddleMock({ secret: 'whsec_paddle' });
    const vault = startVault({ customerId: 'cus_1' });
    await tokenizeCard(paddle, vault, {
      tokenId: 'pm_1',
      last4: '4242',
      brand: 'visa',
      expMonth: 12,
      expYear: 2030,
      fingerprint: 'fp_1',
    });

    const revoked = await revokeToken(paddle, vault, {
      tokenId: 'pm_1',
    });

    expect(revoked.state).toBe('revoked');
    expect(revoked.neutralEvent).toBe('vault.token_revoked');
    expect(revoked.metadata.remainingTokens).toBe(0);
    expect(vault.tokens.has('pm_1')).toBe(false);
  });
});

describe('tutorial 65 — webhook signature rotation', () => {
  it('rotateSignature increments version and emits webhook.signature_rotated (tutorial: rotate snippet)', async () => {
    const stripe = createStripeMock({ secret: 'whsec_test' });
    const session = startIdempotency({ handlerName: 'payout-handler' });
    const before = session.signatureVersion;

    const step = await rotateSignature(stripe, session);

    expect(step.state).toBe('rotated');
    expect(step.neutralEvent).toBe('webhook.signature_rotated');
    expect(session.signatureVersion).toBe(before + 1);
  });
});

describe('tutorial 66 — finalizeRecovery lost outcome', () => {
  it('finalizeRecovery(false) marks the recovery as lost (tutorial: recovery-lost snippet)', async () => {
    const paddle = createPaddleMock({ secret: 'whsec_test' });
    const session = startRecovery({
      invoiceId: 'inv_1',
      amountCents: 2999,
      customerId: 'cus_1',
    });

    const final = finalizeRecovery(session, { succeed: false });

    expect(final.state).toBe('lost');
  });
});

// ---------------------------------------------------------------------------
// Concept doc — payment-real-driver-testing.md fidelity harness assertion
// ---------------------------------------------------------------------------

describe('concept doc — fidelity coverage grid', () => {
  it('exposes 3 provider × 25 axis = 75 rows with 8 v0.4 axes present (concept: fidelity-grid snippet, v1.33 tutorial revalidated under v0.5 grid)', () => {
    const coverage = collectFidelityCoverage([
      createStripeMock({ secret: 'whsec_stripe' }),
      createPaddleMock({ secret: 'whsec_paddle' }),
      createLemonSqueezyMock({ secret: 'whsec_lemonsqueezy' }),
    ]);

    expect(coverage.providers).toEqual(['stripe', 'paddle', 'lemonsqueezy']);
    // v0.5 extends fidelity grid: 9 v0.3 + 8 v0.4 + 8 v0.5 = 25 axis × 3 provider = 75 rows.
    // Prior to v0.5 this was 17 axis × 3 = 51 rows; the v1.33 tutorial's 8 v0.4 axes
    // still each appear on all 3 providers with ≥ 3 neutral events, so the tutorial
    // invariant (v0.4 axis coverage) holds even though the total grid grew.
    expect(coverage.rows.length).toBe(75); // 3 provider × 25 axis (v0.5 grid)
    expect(coverage.axes.length).toBe(25); // 9 v0.3 + 8 v0.4 + 8 v0.5

    const v04Axes = [
      'orchestration',
      'revenue-recovery',
      'refund-advanced',
      'dispute',
      'webhook-idempotency-advanced',
      'tax-localization',
      'subscription-state-machine',
      'payment-method-vault',
    ];
    for (const axis of v04Axes) {
      const axisRows = coverage.rows.filter((r) => r.axis === axis);
      expect(axisRows).toHaveLength(3); // all 3 providers cover it
      for (const row of axisRows) {
        expect(row.neutralEvents.length).toBeGreaterThanOrEqual(3);
      }
    }
  });
});
