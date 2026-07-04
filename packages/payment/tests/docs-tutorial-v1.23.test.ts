/**
 * v1.23-5 docs 補強 (Issue #904) — tutorial 39-41 code snippet 検証。
 *
 * `docs/tutorials/39-stripe-billing.md` /
 * `docs/tutorials/40-paddle-merchant.md` /
 * `docs/tutorials/41-lemon-squeezy-license.md` に載っている code snippet が
 * 実際に動作することを behavior test で担保する。
 *
 * tutorial の code snippet が drift すると読者が「動かない」 体験をする
 * ため、 snippet と実 API の乖離を CI で検知する。 v1.17 / v1.19 / v1.20 /
 * v1.21 / v1.22 の docs-tutorial-v*.test.ts と同 pattern。
 *
 * v1.23 は @kiwa-test/payment v0.3 の 9-axis 高度な billing semantics を扱う
 * (dunning / retry / 3DS v2 / SCA / PSD2 / subscription / invoice / tax /
 * chargeback)。 mock 部分のみを behavior test 対象とする (real driver
 * (Stripe / Paddle / Lemon Squeezy sandbox) は unit test の範囲外)。
 */
import { describe, expect, it } from 'vitest';
import {
  calculateTax,
  cancelSubscription,
  changePlan,
  checkoutCompleted,
  createLemonSqueezyMock,
  createPaddleMock,
  createStripeMock,
  createSubscription,
  dunningAttempt,
  finalizeDunning,
  openChargeback,
  pauseSubscription,
  refunded,
  resolveChargeback,
  resumeSubscription,
  startDunning,
  startThreeDs,
  submitEvidence,
  threeDsFrictionless,
  threeDsRequestChallenge,
  threeDsSubmitChallenge,
} from '../src/index.js';

// ---------------------------------------------------------------------------
// Tutorial 39 — Stripe advanced billing
// ---------------------------------------------------------------------------

describe('tutorial 39 — subscription lifecycle', () => {
  it('walks created → upgraded → paused → resumed → canceled', async () => {
    const adapter = createStripeMock({ secret: 'whsec_test' });
    const { subscription } = await createSubscription(adapter, {
      customerId: 'cus_1',
      planId: 'basic',
      amountCents: 999,
      currency: 'usd',
    });
    expect(subscription.state).toBe('active');

    const upgraded = await changePlan(adapter, subscription, {
      newPlanId: 'pro',
      newAmountCents: 2999,
    });
    expect(upgraded.state).toBe('upgraded');
    expect(subscription.amountCents).toBe(2999);

    const paused = await pauseSubscription(adapter, subscription);
    expect(paused.state).toBe('paused');

    const resumed = await resumeSubscription(adapter, subscription);
    expect(resumed.state).toBe('active');

    const canceled = await cancelSubscription(adapter, subscription);
    expect(canceled.state).toBe('canceled');
  });
});

describe('tutorial 39 — 3DS v2 outcomes', () => {
  it('accepted — user completes the challenge', async () => {
    const adapter = createStripeMock({ secret: 'whsec_test' });
    const session = startThreeDs({
      paymentIntentId: 'pi_1',
      amountCents: 4999,
      currency: 'usd',
      customerId: 'cus_1',
    });
    await threeDsRequestChallenge(adapter, session);
    const result = await threeDsSubmitChallenge(adapter, session, { transStatus: 'Y' });
    expect(result.state).toBe('completed');
    expect(result.metadata?.accepted).toBe(true);
    expect(result.metadata?.transStatus).toBe('Y');
  });

  it('rejected — issuer refuses the challenge', async () => {
    const adapter = createStripeMock({ secret: 'whsec_test' });
    const session = startThreeDs({
      paymentIntentId: 'pi_2',
      amountCents: 4999,
      currency: 'usd',
      customerId: 'cus_1',
    });
    await threeDsRequestChallenge(adapter, session);
    const result = await threeDsSubmitChallenge(adapter, session, { transStatus: 'N' });
    expect(result.state).toBe('completed');
    expect(result.metadata?.accepted).toBe(false);
  });

  it('frictionless — issuer skips the challenge', async () => {
    const adapter = createStripeMock({ secret: 'whsec_test' });
    const session = startThreeDs({
      paymentIntentId: 'pi_3',
      amountCents: 4999,
      currency: 'usd',
      customerId: 'cus_1',
    });
    const result = await threeDsFrictionless(adapter, session);
    expect(result.state).toBe('frictionless');
    expect(result.metadata?.eci).toBe('05');
  });
});

describe('tutorial 39 — dunning', () => {
  it('recovers on the 3rd retry', async () => {
    const adapter = createStripeMock({ secret: 'whsec_test' });
    const session = startDunning({
      invoiceId: 'in_1',
      amountCents: 1999,
      customerId: 'cus_1',
      currency: 'usd',
      config: { maxAttempts: 4 },
    });

    await dunningAttempt(adapter, session);
    await dunningAttempt(adapter, session);
    await dunningAttempt(adapter, session);
    expect(session.state).toBe('active');
    expect(session.attempt).toBe(3);

    const result = await finalizeDunning(adapter, session, { succeed: true });
    expect(result.state).toBe('recovered');
  });

  it('exhausts after maxAttempts + grace', async () => {
    const adapter = createStripeMock({ secret: 'whsec_test' });
    const session = startDunning({
      invoiceId: 'in_2',
      amountCents: 1999,
      customerId: 'cus_1',
      currency: 'usd',
      config: { maxAttempts: 4, gracePeriodMs: 60_000 },
    });

    await dunningAttempt(adapter, session);
    await dunningAttempt(adapter, session);
    await dunningAttempt(adapter, session);
    const last = await dunningAttempt(adapter, session);
    expect(last.state).toBe('in-grace-period');

    const result = await finalizeDunning(adapter, session, { succeed: false });
    expect(result.state).toBe('exhausted');
  });
});

// ---------------------------------------------------------------------------
// Tutorial 40 — Paddle merchant-of-record
// ---------------------------------------------------------------------------

describe('tutorial 40 — paddle inline checkout', () => {
  it('emits checkout.completed after the inline flow closes', async () => {
    const adapter = createPaddleMock({ secret: 'pdl_ntf_test' });
    const received: string[] = [];
    adapter.onWebhook((event) => {
      received.push(event.type);
    });

    const { event } = checkoutCompleted(adapter, {
      amountCents: 2999,
      currency: 'usd',
      customerId: 'ctm_paddle_1',
    });
    await adapter.emit(event);

    expect(received).toHaveLength(1);
    expect(received[0]).toBe('checkout.completed');
  });
});

describe('tutorial 40 — subscription tier + proration metadata', () => {
  it('upgrades to a higher plan and records delta metadata', async () => {
    const adapter = createPaddleMock({ secret: 'pdl_ntf_test' });
    const { subscription } = await createSubscription(adapter, {
      customerId: 'ctm_1',
      planId: 'basic',
      amountCents: 999,
      currency: 'usd',
    });

    const step = await changePlan(adapter, subscription, {
      newPlanId: 'pro',
      newAmountCents: 2999,
    });

    expect(step.state).toBe('upgraded');
    expect(step.metadata?.isUpgrade).toBe(true);
    expect(step.metadata?.previousAmountCents).toBe(999);
    expect(step.metadata?.newAmountCents).toBe(2999);
  });

  it('downgrades to a lower plan and records delta metadata', async () => {
    const adapter = createPaddleMock({ secret: 'pdl_ntf_test' });
    const { subscription } = await createSubscription(adapter, {
      customerId: 'ctm_2',
      planId: 'pro',
      amountCents: 2999,
      currency: 'usd',
    });

    const step = await changePlan(adapter, subscription, {
      newPlanId: 'basic',
      newAmountCents: 999,
    });

    expect(step.state).toBe('downgraded');
    expect(step.metadata?.isUpgrade).toBe(false);
  });
});

describe('tutorial 40 — VAT/GST/sales-tax auto-calc', () => {
  it('calculates 20 % UK VAT for a B2C digital purchase', () => {
    const line = calculateTax({
      netAmountCents: 10000,
      buyerCountry: 'GB',
      merchantCountry: 'US',
      productKind: 'digital',
    });
    expect(line.kind).toBe('vat');
    expect(line.rateBps).toBe(2000);
    expect(line.taxCents).toBe(2000);
    expect(line.reverseCharged).toBe(false);
    expect(line.exempt).toBe(false);
  });

  it('applies reverse charge for a B2B cross-border EU digital purchase', () => {
    const line = calculateTax({
      netAmountCents: 10000,
      buyerCountry: 'DE',
      buyerVatId: 'DE123456789',
      merchantCountry: 'FR',
      productKind: 'digital',
    });
    expect(line.reverseCharged).toBe(true);
    expect(line.taxCents).toBe(0);
    expect(line.rateBps).toBe(1900);
  });

  it('calculates US sales tax for a B2C digital purchase', () => {
    const line = calculateTax({
      netAmountCents: 10000,
      buyerCountry: 'US',
      merchantCountry: 'US',
      productKind: 'digital',
    });
    expect(line.kind).toBe('sales-tax');
    expect(line.rateBps).toBe(800);
    expect(line.taxCents).toBe(800);
  });

  it('marks buyers in unlisted countries as exempt', () => {
    const line = calculateTax({
      netAmountCents: 10000,
      buyerCountry: 'ZZ',
      merchantCountry: 'US',
      productKind: 'digital',
    });
    expect(line.exempt).toBe(true);
    expect(line.taxCents).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Tutorial 41 — Lemon Squeezy hosted checkout + refund + chargeback
// ---------------------------------------------------------------------------

describe('tutorial 41 — hosted checkout', () => {
  it('emits checkout.completed after the hosted flow completes', async () => {
    const adapter = createLemonSqueezyMock({ secret: 'ls_sign_test' });
    const received: string[] = [];
    adapter.onWebhook((event) => {
      received.push(event.type);
    });

    const { event } = checkoutCompleted(adapter, {
      amountCents: 4900,
      currency: 'usd',
      customerId: 'lsc_1',
    });
    await adapter.emit(event);

    expect(received).toHaveLength(1);
    expect(received[0]).toBe('checkout.completed');
  });
});

describe('tutorial 41 — refund full + partial', () => {
  it('processes a full refund with negative amount', async () => {
    const adapter = createLemonSqueezyMock({ secret: 'ls_sign_test' });
    const received: number[] = [];
    adapter.onWebhook((event) => {
      received.push(event.amountCents);
    });

    const { event } = refunded(adapter, {
      amountCents: 4900,
      currency: 'usd',
      customerId: 'lsc_1',
    });
    await adapter.emit(event);

    expect(received).toHaveLength(1);
    expect(received[0]).toBe(-4900);
  });

  it('processes a partial refund with negative amount', async () => {
    const adapter = createLemonSqueezyMock({ secret: 'ls_sign_test' });
    const received: number[] = [];
    adapter.onWebhook((event) => {
      received.push(event.amountCents);
    });

    const { event } = refunded(adapter, {
      amountCents: 2000,
      currency: 'usd',
      customerId: 'lsc_1',
    });
    await adapter.emit(event);

    expect(received).toHaveLength(1);
    expect(received[0]).toBe(-2000);
  });
});

describe('tutorial 41 — chargeback dispute', () => {
  it('walks opened → evidence → won with no fee', async () => {
    const adapter = createLemonSqueezyMock({ secret: 'ls_sign_test' });
    const { chargeback } = await openChargeback(adapter, {
      transactionId: 'ord_1',
      amountCents: 4900,
      currency: 'usd',
      customerId: 'lsc_1',
      reason: 'fraudulent',
    });
    expect(chargeback.state).toBe('opened');

    await submitEvidence(adapter, chargeback, {
      shippingProof: 'digital delivery — activation logged on 2 devices',
      receiptUrl: 'https://mock.receipt/1',
    });
    expect(chargeback.state).toBe('evidence-submitted');

    const resolved = await resolveChargeback(adapter, chargeback, { merchantWon: true });
    expect(chargeback.state).toBe('won');
    expect(resolved.metadata?.merchantWon).toBe(true);
    expect(resolved.metadata?.disputeFeeCents).toBe(0);
  });

  it('walks opened → evidence → lost with dispute fee', async () => {
    const adapter = createLemonSqueezyMock({ secret: 'ls_sign_test' });
    const { chargeback } = await openChargeback(adapter, {
      transactionId: 'ord_2',
      amountCents: 4900,
      currency: 'usd',
      customerId: 'lsc_1',
      reason: 'product-not-received',
    });
    await submitEvidence(adapter, chargeback, {});

    const resolved = await resolveChargeback(adapter, chargeback, { merchantWon: false });
    expect(chargeback.state).toBe('lost');
    expect(resolved.metadata?.merchantWon).toBe(false);
    expect(resolved.metadata?.disputeFeeCents).toBe(1500);
  });
});
