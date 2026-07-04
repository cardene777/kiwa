import { describe, expect, it } from 'vitest';
import {
  createLemonSqueezyMock,
  createPaddleMock,
  createStripeMock,
  creditNoteInvoice,
  draftInvoice,
  markUncollectible,
  openInvoice,
  payInvoice,
  providerEventName,
  voidInvoice,
  type PaymentAdapter,
} from '../../src/index.js';

const providers: Array<{ name: string; make: () => PaymentAdapter }> = [
  { name: 'stripe', make: () => createStripeMock() },
  { name: 'paddle', make: () => createPaddleMock() },
  { name: 'lemonsqueezy', make: () => createLemonSqueezyMock() },
];

describe('invoice axis — 3 provider', () => {
  it.each(providers)('$name: draft → open → paid happy path', async ({ make }) => {
    const adapter = make();
    const received: string[] = [];
    adapter.onWebhook((e) => {
      received.push(e.type);
    });
    const { invoice } = await draftInvoice(adapter, {
      customerId: 'cus_1',
      amountCents: 2000,
    });
    await openInvoice(adapter, invoice);
    await payInvoice(adapter, invoice);
    expect(invoice.state).toBe('paid');
    expect(received).toEqual([
      providerEventName(adapter.provider, 'invoice.drafted'),
      providerEventName(adapter.provider, 'invoice.opened'),
      providerEventName(adapter.provider, 'invoice.paid'),
    ]);
  });

  it.each(providers)('$name: draft → void terminates without paid', async ({ make }) => {
    const adapter = make();
    const { invoice } = await draftInvoice(adapter, {
      customerId: 'cus_2',
      amountCents: 500,
    });
    const voided = await voidInvoice(adapter, invoice);
    expect(voided.state).toBe('void');
    expect(invoice.state).toBe('void');
    // second void rejected
    await expect(voidInvoice(adapter, invoice)).rejects.toThrow(/void/);
  });

  it('open → uncollectible reflects dunning terminal', async () => {
    const adapter = createStripeMock();
    const { invoice } = await draftInvoice(adapter, {
      customerId: 'c',
      amountCents: 1200,
    });
    await openInvoice(adapter, invoice);
    const uncoll = await markUncollectible(adapter, invoice);
    expect(uncoll.state).toBe('uncollectible');
  });

  it('paid invoice + partial credit note keeps state paid', async () => {
    const adapter = createPaddleMock();
    const { invoice } = await draftInvoice(adapter, {
      customerId: 'c',
      amountCents: 1000,
      currency: 'eur',
    });
    await openInvoice(adapter, invoice);
    await payInvoice(adapter, invoice);
    const credit = await creditNoteInvoice(adapter, invoice, { creditAmountCents: 300 });
    expect(credit.amountCents).toBe(-300);
    expect(invoice.state).toBe('paid');
  });

  it('credit note over invoice amount rejected', async () => {
    const adapter = createLemonSqueezyMock();
    const { invoice } = await draftInvoice(adapter, {
      customerId: 'c',
      amountCents: 500,
    });
    await openInvoice(adapter, invoice);
    await payInvoice(adapter, invoice);
    await expect(creditNoteInvoice(adapter, invoice, { creditAmountCents: 600 })).rejects.toThrow(/exceeds/);
  });

  it('rejects pay on draft (must open first)', async () => {
    const adapter = createStripeMock();
    const { invoice } = await draftInvoice(adapter, {
      customerId: 'c',
      amountCents: 100,
    });
    await expect(payInvoice(adapter, invoice)).rejects.toThrow(/draft/);
  });

  it('rejects credit note before paid', async () => {
    const adapter = createStripeMock();
    const { invoice } = await draftInvoice(adapter, {
      customerId: 'c',
      amountCents: 100,
    });
    await openInvoice(adapter, invoice);
    await expect(creditNoteInvoice(adapter, invoice, { creditAmountCents: 50 })).rejects.toThrow(/paid/);
  });

  it('rejects credit note with non-positive amount', async () => {
    const adapter = createStripeMock();
    const { invoice } = await draftInvoice(adapter, {
      customerId: 'c',
      amountCents: 100,
    });
    await openInvoice(adapter, invoice);
    await payInvoice(adapter, invoice);
    await expect(creditNoteInvoice(adapter, invoice, { creditAmountCents: 0 })).rejects.toThrow(/> 0/);
  });
});
