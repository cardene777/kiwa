/**
 * Refund + chargeback dispute + evidence + representment vitest spec.
 *
 * Sub-Issue #903 (v1.23-4) AC — a full journey from Lemon Squeezy order
 * paid → full refund (or partial refund) is exercised, plus the
 * chargeback dispute lifecycle (opened → evidence submitted → won or
 * lost) with the real card-network dispute fee applied on lost.
 *
 * Fidelity axes covered here —
 *  1. Full refund matches order.amountCents → `order_refunded` +
 *     RefundRecord kind='full'.
 *  2. Partial refund emits a `order_refunded` for the delta amount +
 *     RefundRecord kind='partial'.
 *  3. Over-refund is rejected before touching the store (guard
 *     `refund_exceeds_order`).
 *  4. Refund on an unpaid order is rejected (guard `order_not_paid`).
 *  5. Chargeback opened → evidence_submitted → won emits three neutral
 *     events with the state machine guard rejecting evidence twice / out
 *     of order.
 *  6. Chargeback lost applies the 1500 cent dispute fee on the losing step.
 *  7. Chargeback dispute reason accepts all 8 real ChargebackReason values.
 *  8. Route handler input validation for both /refund and /dispute/action.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { providerEventName } from '@kiwa/payment';
import { makeMockAdapter } from '../src/adapters/mock.js';
import {
  createRefundHandler,
  createRefundListHandler,
} from '../src/routes/refund/handler.js';
import {
  createDisputeActionHandler,
  createDisputeListHandler,
} from '../src/routes/dispute/handler.js';

async function seedPaidOrder(
  adapter: ReturnType<typeof makeMockAdapter>,
  input: { customerId: string; amountCents: number; currency?: string } = {
    customerId: 'cus_seed',
    amountCents: 5000,
  },
): Promise<string> {
  const draftInput: { customerId: string; amountCents: number; currency?: string } = {
    customerId: input.customerId,
    amountCents: input.amountCents,
  };
  if (input.currency !== undefined) draftInput.currency = input.currency;
  const drafted = await adapter.draftOrder(draftInput);
  await adapter.openOrder(drafted.id);
  await adapter.payOrder(drafted.id);
  return drafted.id;
}

describe('mock adapter — refund happy paths (axes 1 + 2)', () => {
  let adapter: ReturnType<typeof makeMockAdapter>;

  beforeEach(() => {
    adapter = makeMockAdapter();
  });

  afterEach(async () => {
    await adapter.reset();
  });

  it('axis 1: full refund emits order_refunded + persists RefundRecord kind=full', async () => {
    const orderId = await seedPaidOrder(adapter, {
      customerId: 'cus_full',
      amountCents: 5000,
    });
    const result = await adapter.refundOrder({ orderId });
    expect(result.refund.kind).toBe('full');
    expect(result.refund.refundAmountCents).toBe(5000);
    expect(result.refund.orderId).toBe(orderId);
    const events = adapter.eventsEmitted();
    const refunded = events.find(
      (e) => e.type === providerEventName('lemonsqueezy', 'invoice.credit_noted'),
    );
    expect(refunded).toBeDefined();
    expect(refunded?.amountCents).toBe(-5000);
  });

  it('axis 1: full refund equals default when refundAmountCents omitted', async () => {
    const orderId = await seedPaidOrder(adapter, {
      customerId: 'cus_def',
      amountCents: 3500,
    });
    const result = await adapter.refundOrder({ orderId, reason: 'buyer_regret' });
    expect(result.refund.refundAmountCents).toBe(3500);
    expect(result.refund.kind).toBe('full');
    expect(result.refund.reason).toBe('buyer_regret');
  });

  it('axis 2: partial refund emits order_refunded with delta only', async () => {
    const orderId = await seedPaidOrder(adapter, {
      customerId: 'cus_part',
      amountCents: 10000,
    });
    const result = await adapter.refundOrder({
      orderId,
      refundAmountCents: 3000,
      reason: 'partial_return',
    });
    expect(result.refund.kind).toBe('partial');
    expect(result.refund.refundAmountCents).toBe(3000);
    const events = adapter.eventsEmitted();
    const refunded = events.find(
      (e) => e.type === providerEventName('lemonsqueezy', 'invoice.credit_noted'),
    );
    expect(refunded?.amountCents).toBe(-3000);
  });

  it('axis 2: multiple partial refunds accumulate distinct RefundRecords', async () => {
    const orderId = await seedPaidOrder(adapter, {
      customerId: 'cus_multi',
      amountCents: 10000,
    });
    await adapter.refundOrder({ orderId, refundAmountCents: 2000 });
    await adapter.refundOrder({ orderId, refundAmountCents: 3000 });
    const refunds = adapter.listRefunds();
    expect(refunds).toHaveLength(2);
    expect(refunds[0]?.refundAmountCents).toBe(2000);
    expect(refunds[1]?.refundAmountCents).toBe(3000);
  });

  it('trace captures the refundOrder success + amount', async () => {
    const orderId = await seedPaidOrder(adapter, {
      customerId: 'cus_trace',
      amountCents: 4200,
    });
    await adapter.refundOrder({ orderId, refundAmountCents: 1000 });
    const traces = adapter.traces();
    const succeeded = traces.find((t) => t.op === 'refundOrder' && t.ok);
    expect(succeeded).toBeDefined();
    expect(succeeded?.detail?.refundAmountCents).toBe(1000);
    expect(succeeded?.detail?.kind).toBe('partial');
  });
});

describe('mock adapter — refund guards (axes 3 + 4)', () => {
  let adapter: ReturnType<typeof makeMockAdapter>;

  beforeEach(() => {
    adapter = makeMockAdapter();
  });

  afterEach(async () => {
    await adapter.reset();
  });

  it('axis 3: refund exceeding order amount is rejected before touching store', async () => {
    const orderId = await seedPaidOrder(adapter, {
      customerId: 'cus_over',
      amountCents: 1000,
    });
    await expect(
      adapter.refundOrder({ orderId, refundAmountCents: 5000 }),
    ).rejects.toThrow(/exceeds invoice amount|exceeds invoice/);
    expect(adapter.listRefunds()).toEqual([]);
    const traces = adapter.traces();
    const failed = traces.find((t) => t.op === 'refundOrder' && !t.ok);
    expect(failed?.errorKind).toBe('refund_exceeds_order');
  });

  it('axis 3: refund of zero is rejected', async () => {
    const orderId = await seedPaidOrder(adapter, {
      customerId: 'cus_zero',
      amountCents: 1000,
    });
    await expect(
      adapter.refundOrder({ orderId, refundAmountCents: 0 }),
    ).rejects.toThrow(/must be > 0/);
  });

  it('axis 4: refund on non-paid order is rejected', async () => {
    const drafted = await adapter.draftOrder({
      customerId: 'cus_no_pay',
      amountCents: 1000,
    });
    await expect(
      adapter.refundOrder({ orderId: drafted.id }),
    ).rejects.toThrow(/must be paid/);
    const traces = adapter.traces();
    const failed = traces.find((t) => t.op === 'refundOrder' && !t.ok);
    expect(failed?.errorKind).toBe('order_not_paid');
  });

  it('axis 4: refund on unknown order id is rejected', async () => {
    await expect(
      adapter.refundOrder({ orderId: 'ord_missing' }),
    ).rejects.toThrow(/not found/);
    const traces = adapter.traces();
    const failed = traces.find((t) => t.op === 'refundOrder' && !t.ok);
    expect(failed?.errorKind).toBe('entity_not_found');
  });
});

describe('mock adapter — chargeback lifecycle (axis 5 + 6)', () => {
  let adapter: ReturnType<typeof makeMockAdapter>;

  beforeEach(() => {
    adapter = makeMockAdapter();
  });

  afterEach(async () => {
    await adapter.reset();
  });

  it('axis 5: opened → evidence_submitted → won emits three neutral events', async () => {
    const orderId = await seedPaidOrder(adapter, {
      customerId: 'cus_cb1',
      amountCents: 5000,
    });
    const dispute = await adapter.openChargeback({
      orderId,
      reason: 'fraudulent',
    });
    expect(dispute.state).toBe('opened');
    await adapter.submitChargebackEvidence({
      chargebackId: dispute.id,
      receiptUrl: 'https://s3.example.com/receipt-1.pdf',
      customerCommunication: 'Buyer confirmed delivery on 2026-03-14',
    });
    const resolved = await adapter.resolveChargeback({
      chargebackId: dispute.id,
      merchantWon: true,
    });
    expect(resolved.state).toBe('won');
    const events = adapter.eventsEmitted();
    // Lemon Squeezy dialects chargeback.opened → order_refunded, so we
    // assert against provider event name explicitly.
    const opened = events.find(
      (e) => e.type === providerEventName('lemonsqueezy', 'chargeback.opened'),
    );
    const evidence = events.find(
      (e) => e.type === providerEventName('lemonsqueezy', 'chargeback.evidence_submitted'),
    );
    const won = events.find(
      (e) => e.type === providerEventName('lemonsqueezy', 'chargeback.won'),
    );
    expect(opened).toBeDefined();
    expect(evidence).toBeDefined();
    expect(won).toBeDefined();
  });

  it('axis 5: resolve on opened (no evidence yet) is rejected', async () => {
    const orderId = await seedPaidOrder(adapter, {
      customerId: 'cus_cb_no_ev',
      amountCents: 3000,
    });
    const dispute = await adapter.openChargeback({
      orderId,
      reason: 'unrecognized',
    });
    await expect(
      adapter.resolveChargeback({
        chargebackId: dispute.id,
        merchantWon: true,
      }),
    ).rejects.toThrow(/submit evidence first/);
    const traces = adapter.traces();
    const failed = traces.find((t) => t.op === 'resolveChargeback' && !t.ok);
    expect(failed?.errorKind).toBe('chargeback_evidence_missing');
  });

  it('axis 5: evidence twice is rejected', async () => {
    const orderId = await seedPaidOrder(adapter, {
      customerId: 'cus_ev_twice',
      amountCents: 3000,
    });
    const dispute = await adapter.openChargeback({
      orderId,
      reason: 'duplicate',
    });
    await adapter.submitChargebackEvidence({
      chargebackId: dispute.id,
      receiptUrl: 'https://s3.example.com/receipt.pdf',
    });
    await expect(
      adapter.submitChargebackEvidence({
        chargebackId: dispute.id,
        receiptUrl: 'https://s3.example.com/receipt2.pdf',
      }),
    ).rejects.toThrow(/is evidence-submitted/);
  });

  it('axis 6: lost chargeback applies 1500 cent dispute fee via metadata', async () => {
    const orderId = await seedPaidOrder(adapter, {
      customerId: 'cus_lost',
      amountCents: 5000,
    });
    const dispute = await adapter.openChargeback({
      orderId,
      reason: 'product-not-received',
    });
    await adapter.submitChargebackEvidence({
      chargebackId: dispute.id,
      shippingProof: 'https://s3.example.com/tracking-lost.pdf',
    });
    const resolved = await adapter.resolveChargeback({
      chargebackId: dispute.id,
      merchantWon: false,
    });
    expect(resolved.state).toBe('lost');
    const lostStep = resolved.history[resolved.history.length - 1];
    expect(lostStep?.state).toBe('lost');
    expect(lostStep?.metadata['disputeFeeCents']).toBe(1500);
  });

  it('axis 6: won chargeback records disputeFeeCents = 0', async () => {
    const orderId = await seedPaidOrder(adapter, {
      customerId: 'cus_won',
      amountCents: 4000,
    });
    const dispute = await adapter.openChargeback({
      orderId,
      reason: 'product-unacceptable',
    });
    await adapter.submitChargebackEvidence({
      chargebackId: dispute.id,
      receiptUrl: 'https://s3.example.com/receipt-won.pdf',
    });
    const resolved = await adapter.resolveChargeback({
      chargebackId: dispute.id,
      merchantWon: true,
    });
    const wonStep = resolved.history[resolved.history.length - 1];
    expect(wonStep?.metadata['disputeFeeCents']).toBe(0);
  });

  it('axis 7: chargeback reason accepts all 8 real ChargebackReason values', async () => {
    const reasons = [
      'fraudulent',
      'unrecognized',
      'duplicate',
      'product-not-received',
      'product-unacceptable',
      'subscription-canceled',
      'credit-not-processed',
      'general',
    ] as const;
    for (const reason of reasons) {
      const orderId = await seedPaidOrder(adapter, {
        customerId: `cus_${reason}`,
        amountCents: 1000,
      });
      const dispute = await adapter.openChargeback({ orderId, reason });
      expect(dispute.reason).toBe(reason);
    }
  });

  it('chargeback opened on unknown order id is rejected', async () => {
    await expect(
      adapter.openChargeback({
        orderId: 'ord_missing_cb',
        reason: 'fraudulent',
      }),
    ).rejects.toThrow(/not found/);
    const traces = adapter.traces();
    const failed = traces.find((t) => t.op === 'openChargeback' && !t.ok);
    expect(failed?.errorKind).toBe('entity_not_found');
  });
});

describe('refund route handler (axis 8)', () => {
  let adapter: ReturnType<typeof makeMockAdapter>;
  let refundHandler: ReturnType<typeof createRefundHandler>;
  let listHandler: ReturnType<typeof createRefundListHandler>;

  beforeEach(() => {
    adapter = makeMockAdapter();
    refundHandler = createRefundHandler(adapter);
    listHandler = createRefundListHandler(adapter);
  });

  afterEach(async () => {
    await adapter.reset();
  });

  it('returns 200 + refund body on happy path', async () => {
    const orderId = await seedPaidOrder(adapter, {
      customerId: 'cus_r_ok',
      amountCents: 3000,
    });
    const res = await refundHandler(
      new Request('http://localhost/refund', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ orderId, refundAmountCents: 500 }),
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      refund: { kind: string; refundAmountCents: number };
      order: { state: string };
    };
    expect(body.refund.kind).toBe('partial');
    expect(body.refund.refundAmountCents).toBe(500);
    // Full refund via credit note keeps the order paid.
    expect(body.order.state).toBe('paid');
  });

  it('returns 400 on missing_fields (orderId)', async () => {
    const res = await refundHandler(
      new Request('http://localhost/refund', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ refundAmountCents: 100 }),
      }),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('missing_fields');
  });

  it('returns 400 on invalid_amount', async () => {
    const res = await refundHandler(
      new Request('http://localhost/refund', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ orderId: 'ord_x', refundAmountCents: -100 }),
      }),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('invalid_amount');
  });

  it('returns 409 on over-refund attempt', async () => {
    const orderId = await seedPaidOrder(adapter, {
      customerId: 'cus_over_route',
      amountCents: 1000,
    });
    const res = await refundHandler(
      new Request('http://localhost/refund', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ orderId, refundAmountCents: 5000 }),
      }),
    );
    expect(res.status).toBe(409);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('illegal_refund');
  });

  it('returns 400 on invalid_json', async () => {
    const res = await refundHandler(
      new Request('http://localhost/refund', {
        method: 'POST',
        body: 'not-json',
      }),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('invalid_json');
  });

  it('list handler returns refunds sorted in insertion order', async () => {
    const orderId = await seedPaidOrder(adapter, {
      customerId: 'cus_list_r',
      amountCents: 10000,
    });
    await adapter.refundOrder({ orderId, refundAmountCents: 1000 });
    await adapter.refundOrder({ orderId, refundAmountCents: 2000 });
    const res = await listHandler(new Request('http://localhost/refund'));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { refunds: { refundAmountCents: number }[] };
    expect(body.refunds).toHaveLength(2);
    expect(body.refunds[0]?.refundAmountCents).toBe(1000);
    expect(body.refunds[1]?.refundAmountCents).toBe(2000);
  });
});

describe('dispute route handler (axis 8)', () => {
  let adapter: ReturnType<typeof makeMockAdapter>;
  let actionHandler: ReturnType<typeof createDisputeActionHandler>;
  let listHandler: ReturnType<typeof createDisputeListHandler>;

  beforeEach(() => {
    adapter = makeMockAdapter();
    actionHandler = createDisputeActionHandler(adapter);
    listHandler = createDisputeListHandler(adapter);
  });

  afterEach(async () => {
    await adapter.reset();
  });

  it('open action returns 200 + chargeback body', async () => {
    const orderId = await seedPaidOrder(adapter, {
      customerId: 'cus_open',
      amountCents: 3000,
    });
    const res = await actionHandler(
      new Request('http://localhost/dispute/action', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'open', orderId, reason: 'fraudulent' }),
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { chargeback: { state: string; reason: string } };
    expect(body.chargeback.state).toBe('opened');
    expect(body.chargeback.reason).toBe('fraudulent');
  });

  it('open action returns 400 on invalid reason', async () => {
    const orderId = await seedPaidOrder(adapter, {
      customerId: 'cus_bad_reason',
      amountCents: 3000,
    });
    const res = await actionHandler(
      new Request('http://localhost/dispute/action', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'open',
          orderId,
          reason: 'not-a-real-reason',
        }),
      }),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('invalid_reason');
  });

  it('open action returns 400 on missing_fields', async () => {
    const res = await actionHandler(
      new Request('http://localhost/dispute/action', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'open' }),
      }),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('missing_fields');
  });

  it('evidence action returns 200', async () => {
    const orderId = await seedPaidOrder(adapter, {
      customerId: 'cus_ev_ok',
      amountCents: 3000,
    });
    const dispute = await adapter.openChargeback({ orderId, reason: 'duplicate' });
    const res = await actionHandler(
      new Request('http://localhost/dispute/action', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'evidence',
          chargebackId: dispute.id,
          receiptUrl: 'https://s3.example.com/receipt.pdf',
        }),
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { chargeback: { state: string } };
    expect(body.chargeback.state).toBe('evidence-submitted');
  });

  it('resolve action requires boolean merchantWon', async () => {
    const orderId = await seedPaidOrder(adapter, {
      customerId: 'cus_no_bool',
      amountCents: 1000,
    });
    const dispute = await adapter.openChargeback({ orderId, reason: 'general' });
    await adapter.submitChargebackEvidence({
      chargebackId: dispute.id,
      receiptUrl: 'https://s3.example.com/receipt.pdf',
    });
    const res = await actionHandler(
      new Request('http://localhost/dispute/action', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'resolve', chargebackId: dispute.id }),
      }),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('missing_fields');
  });

  it('resolve action returns 409 on repeat resolve', async () => {
    const orderId = await seedPaidOrder(adapter, {
      customerId: 'cus_re_resolve',
      amountCents: 1000,
    });
    const dispute = await adapter.openChargeback({ orderId, reason: 'general' });
    await adapter.submitChargebackEvidence({
      chargebackId: dispute.id,
      receiptUrl: 'https://s3.example.com/receipt.pdf',
    });
    await adapter.resolveChargeback({
      chargebackId: dispute.id,
      merchantWon: true,
    });
    const res = await actionHandler(
      new Request('http://localhost/dispute/action', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'resolve',
          chargebackId: dispute.id,
          merchantWon: false,
        }),
      }),
    );
    expect(res.status).toBe(409);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('illegal_transition');
  });

  it('unknown action returns 400', async () => {
    const res = await actionHandler(
      new Request('http://localhost/dispute/action', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'not-a-thing' }),
      }),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('unknown_action');
  });

  it('list handler returns opened chargebacks', async () => {
    const orderId = await seedPaidOrder(adapter, {
      customerId: 'cus_list_cb',
      amountCents: 2000,
    });
    await adapter.openChargeback({ orderId, reason: 'fraudulent' });
    const res = await listHandler(new Request('http://localhost/dispute'));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { chargebacks: unknown[] };
    expect(body.chargebacks).toHaveLength(1);
  });
});
