import { describe, expect, it } from 'vitest';
import {
  createLemonSqueezyMock,
  createPaddleMock,
  createStripeMock,
  openChargeback,
  providerEventName,
  resolveChargeback,
  submitEvidence,
  type PaymentAdapter,
} from '../../src/index.js';

const providers: Array<{ name: string; make: () => PaymentAdapter }> = [
  { name: 'stripe', make: () => createStripeMock() },
  { name: 'paddle', make: () => createPaddleMock() },
  { name: 'lemonsqueezy', make: () => createLemonSqueezyMock() },
];

describe('chargeback axis — 3 provider', () => {
  it.each(providers)('$name: full flow ending in merchant won', async ({ make }) => {
    const adapter = make();
    const received: string[] = [];
    adapter.onWebhook((e) => {
      received.push(e.type);
    });
    const { chargeback } = await openChargeback(adapter, {
      transactionId: 'txn_1',
      customerId: 'cus_1',
      amountCents: 5000,
      reason: 'fraudulent',
    });
    await submitEvidence(adapter, chargeback, {
      receiptUrl: 'https://receipt/1',
      shippingProof: 'ups:xxx',
    });
    const resolved = await resolveChargeback(adapter, chargeback, { merchantWon: true });
    expect(resolved.state).toBe('won');
    expect(resolved.metadata.disputeFeeCents).toBe(0);
    expect(chargeback.state).toBe('won');
    expect(received).toEqual([
      providerEventName(adapter.provider, 'chargeback.opened'),
      providerEventName(adapter.provider, 'chargeback.evidence_submitted'),
      providerEventName(adapter.provider, 'chargeback.won'),
    ]);
  });

  it.each(providers)('$name: lost dispute deducts amount + fee', async ({ make }) => {
    const adapter = make();
    const { chargeback } = await openChargeback(adapter, {
      transactionId: 'txn_2',
      customerId: 'cus_2',
      amountCents: 3000,
      reason: 'product-not-received',
      currency: 'usd',
    });
    await submitEvidence(adapter, chargeback, {});
    const lost = await resolveChargeback(adapter, chargeback, { merchantWon: false });
    expect(lost.state).toBe('lost');
    expect(lost.amountCents).toBe(-3000);
    expect(lost.metadata.disputeFeeCents).toBe(1500);
  });

  it('rejects submit evidence on non-opened chargeback', async () => {
    const adapter = createStripeMock();
    const { chargeback } = await openChargeback(adapter, {
      transactionId: 't',
      customerId: 'c',
      amountCents: 100,
      reason: 'unrecognized',
    });
    await submitEvidence(adapter, chargeback, {});
    await expect(submitEvidence(adapter, chargeback, {})).rejects.toThrow(/evidence-submitted/);
  });

  it('rejects resolve without evidence submitted', async () => {
    const adapter = createPaddleMock();
    const { chargeback } = await openChargeback(adapter, {
      transactionId: 't',
      customerId: 'c',
      amountCents: 100,
      reason: 'duplicate',
    });
    await expect(resolveChargeback(adapter, chargeback, { merchantWon: true })).rejects.toThrow(/submit evidence/);
  });

  it('evidence metadata reflects submitted fields', async () => {
    const adapter = createLemonSqueezyMock();
    const { chargeback } = await openChargeback(adapter, {
      transactionId: 't',
      customerId: 'c',
      amountCents: 100,
      reason: 'general',
    });
    const step = await submitEvidence(adapter, chargeback, {
      receiptUrl: 'r',
      customerCommunication: 'email',
    });
    expect(step.metadata.hasReceipt).toBe(true);
    expect(step.metadata.hasShippingProof).toBe(false);
    expect(step.metadata.hasCustomerCommunication).toBe(true);
  });

  it('history persists all 3 steps in order', async () => {
    const adapter = createStripeMock();
    const { chargeback } = await openChargeback(adapter, {
      transactionId: 't',
      customerId: 'c',
      amountCents: 100,
      reason: 'general',
    });
    await submitEvidence(adapter, chargeback, {});
    await resolveChargeback(adapter, chargeback, { merchantWon: false });
    expect(chargeback.history).toHaveLength(3);
    expect(chargeback.history.map((h) => h.state)).toEqual(['opened', 'evidence-submitted', 'lost']);
  });
});
