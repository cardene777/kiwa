import { describe, expect, it } from 'vitest';
import {
  creditNoteInvoice,
  createStripeMock,
  draftInvoice,
  markUncollectible,
  openInvoice,
  payInvoice,
  voidInvoice,
} from '../../src/index.js';

// Closes the reachable branches in packages/payment/src/semantics/invoice.ts
// that invoice.test.ts leaves open: state-guard throws on illegal transitions,
// creditNote input validation (<=0 / > invoice amount / non-paid), and the
// `invoice.currency !== undefined` arm across every state transition.

describe('invoice — defensive state guards', () => {
  it('T-PAY-C-INV-001 openInvoice throws when invoice is not draft', async () => {
    const adapter = createStripeMock();
    const { invoice } = await draftInvoice(adapter, {
      customerId: 'cus_inv_1',
      amountCents: 1200,
    });
    await openInvoice(adapter, invoice);
    await expect(openInvoice(adapter, invoice)).rejects.toThrow(/is open/);
  });

  it('T-PAY-C-INV-002 payInvoice throws when invoice is not open', async () => {
    const adapter = createStripeMock();
    const { invoice } = await draftInvoice(adapter, {
      customerId: 'cus_inv_2',
      amountCents: 1200,
    });
    await expect(payInvoice(adapter, invoice)).rejects.toThrow(/is draft/);
  });

  it('T-PAY-C-INV-003 voidInvoice rejects paid invoice', async () => {
    const adapter = createStripeMock();
    const { invoice } = await draftInvoice(adapter, {
      customerId: 'cus_inv_3',
      amountCents: 1200,
    });
    await openInvoice(adapter, invoice);
    await payInvoice(adapter, invoice);
    await expect(voidInvoice(adapter, invoice)).rejects.toThrow(/cannot void/);
  });

  it('T-PAY-C-INV-004 markUncollectible throws when invoice is not open', async () => {
    const adapter = createStripeMock();
    const { invoice } = await draftInvoice(adapter, {
      customerId: 'cus_inv_4',
      amountCents: 1200,
    });
    await expect(markUncollectible(adapter, invoice)).rejects.toThrow(/is draft/);
  });

  it('T-PAY-C-INV-005 creditNoteInvoice throws when invoice not paid', async () => {
    const adapter = createStripeMock();
    const { invoice } = await draftInvoice(adapter, {
      customerId: 'cus_inv_5',
      amountCents: 1200,
    });
    await expect(
      creditNoteInvoice(adapter, invoice, { creditAmountCents: 100 }),
    ).rejects.toThrow(/must be paid/);
  });

  it('T-PAY-C-INV-006 creditNoteInvoice rejects zero credit', async () => {
    const adapter = createStripeMock();
    const { invoice } = await draftInvoice(adapter, {
      customerId: 'cus_inv_6',
      amountCents: 1200,
    });
    await openInvoice(adapter, invoice);
    await payInvoice(adapter, invoice);
    await expect(
      creditNoteInvoice(adapter, invoice, { creditAmountCents: 0 }),
    ).rejects.toThrow(/> 0/);
  });

  it('T-PAY-C-INV-007 creditNoteInvoice rejects negative credit', async () => {
    const adapter = createStripeMock();
    const { invoice } = await draftInvoice(adapter, {
      customerId: 'cus_inv_7',
      amountCents: 1200,
    });
    await openInvoice(adapter, invoice);
    await payInvoice(adapter, invoice);
    await expect(
      creditNoteInvoice(adapter, invoice, { creditAmountCents: -50 }),
    ).rejects.toThrow(/> 0/);
  });

  it('T-PAY-C-INV-008 creditNoteInvoice rejects overrefund', async () => {
    const adapter = createStripeMock();
    const { invoice } = await draftInvoice(adapter, {
      customerId: 'cus_inv_8',
      amountCents: 1200,
    });
    await openInvoice(adapter, invoice);
    await payInvoice(adapter, invoice);
    await expect(
      creditNoteInvoice(adapter, invoice, { creditAmountCents: 5000 }),
    ).rejects.toThrow(/exceeds/);
  });

  it('T-PAY-C-INV-009 draft with currency carries across full lifecycle', async () => {
    const adapter = createStripeMock();
    const { invoice } = await draftInvoice(adapter, {
      customerId: 'cus_inv_9',
      amountCents: 1200,
      currency: 'EUR',
    });
    expect(invoice.currency).toBe('EUR');
    const openStep = await openInvoice(adapter, invoice);
    expect(openStep.neutralEvent).toBe('invoice.opened');
    const payStep = await payInvoice(adapter, invoice);
    expect(payStep.neutralEvent).toBe('invoice.paid');
    const cn = await creditNoteInvoice(adapter, invoice, { creditAmountCents: 300 });
    expect(cn.amountCents).toBe(-300);
    expect(cn.metadata.creditAmountCents).toBe(300);
  });

  it('T-PAY-C-INV-010 void from open invoice succeeds with currency', async () => {
    const adapter = createStripeMock();
    const { invoice } = await draftInvoice(adapter, {
      customerId: 'cus_inv_10',
      amountCents: 400,
      currency: 'JPY',
    });
    await openInvoice(adapter, invoice);
    const step = await voidInvoice(adapter, invoice);
    expect(step.neutralEvent).toBe('invoice.voided');
    expect(step.amountCents).toBe(0);
    expect(invoice.state).toBe('void');
  });

  it('T-PAY-C-INV-011 markUncollectible succeeds from open state', async () => {
    const adapter = createStripeMock();
    const { invoice } = await draftInvoice(adapter, {
      customerId: 'cus_inv_11',
      amountCents: 900,
    });
    await openInvoice(adapter, invoice);
    const step = await markUncollectible(adapter, invoice);
    expect(invoice.state).toBe('uncollectible');
    expect(step.metadata.markedAt).toBeGreaterThan(0);
  });

  it('T-PAY-C-INV-012 voidInvoice throws on uncollectible', async () => {
    const adapter = createStripeMock();
    const { invoice } = await draftInvoice(adapter, {
      customerId: 'cus_inv_12',
      amountCents: 500,
    });
    await openInvoice(adapter, invoice);
    await markUncollectible(adapter, invoice);
    await expect(voidInvoice(adapter, invoice)).rejects.toThrow(/cannot void/);
  });

  it('T-PAY-C-INV-013b creditNoteInvoice without currency skips currency spread', async () => {
    const adapter = createStripeMock();
    const { invoice } = await draftInvoice(adapter, {
      customerId: 'cus_inv_13b',
      amountCents: 800,
    });
    await openInvoice(adapter, invoice);
    await payInvoice(adapter, invoice);
    const cn = await creditNoteInvoice(adapter, invoice, { creditAmountCents: 200 });
    expect(cn.amountCents).toBe(-200);
    expect(invoice.currency).toBeUndefined();
  });

  it('T-PAY-C-INV-013 markUncollectible with currency defined forwards currency to event', async () => {
    const adapter = createStripeMock();
    const { invoice } = await draftInvoice(adapter, {
      customerId: 'cus_inv_13',
      amountCents: 900,
      currency: 'CHF',
    });
    await openInvoice(adapter, invoice);
    const step = await markUncollectible(adapter, invoice);
    expect(invoice.state).toBe('uncollectible');
    expect(invoice.currency).toBe('CHF');
    expect(step.neutralEvent).toBe('invoice.uncollectible');
  });
});
