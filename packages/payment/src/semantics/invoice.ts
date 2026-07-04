import type { PaymentAdapter } from '../types.js';
import { providerEventName, type AxisStep } from './types.js';

/**
 * Invoice lifecycle. Real providers use the state machine draft → open →
 * paid (or void / uncollectible). Credit notes are emitted post-paid to
 * refund partial amounts without voiding the invoice. Guards enforce the
 * legal transitions so tests exercise each edge explicitly.
 */
export type InvoiceState =
  | 'draft'
  | 'open'
  | 'paid'
  | 'void'
  | 'uncollectible';

export interface Invoice {
  id: string;
  customerId: string;
  amountCents: number;
  currency?: string;
  state: InvoiceState;
  history: AxisStep<InvoiceState>[];
}

/**
 * Draft a new invoice. Emits `invoice.drafted`.
 */
export async function draftInvoice(
  adapter: PaymentAdapter,
  input: {
    customerId: string;
    amountCents: number;
    currency?: string;
  },
): Promise<{ invoice: Invoice; step: AxisStep<InvoiceState> }> {
  const providerEvent = providerEventName(adapter.provider, 'invoice.drafted');
  const { event } = adapter.signWebhook({
    type: providerEvent,
    amountCents: input.amountCents,
    ...(input.currency !== undefined ? { currency: input.currency } : {}),
    customerId: input.customerId,
  });
  await adapter.emit(event);
  const invoice: Invoice = {
    id: `inv_${event.id}`,
    customerId: input.customerId,
    amountCents: input.amountCents,
    state: 'draft',
    history: [],
  };
  if (input.currency !== undefined) invoice.currency = input.currency;
  const step: AxisStep<InvoiceState> = {
    neutralEvent: 'invoice.drafted',
    providerEvent,
    state: 'draft',
    amountCents: input.amountCents,
    metadata: {
      invoiceId: invoice.id,
    },
  };
  invoice.history.push(step);
  return { invoice, step };
}

/**
 * Open (finalise) a draft. Emits `invoice.opened`. Only allowed from `draft`.
 */
export async function openInvoice(
  adapter: PaymentAdapter,
  invoice: Invoice,
): Promise<AxisStep<InvoiceState>> {
  if (invoice.state !== 'draft') {
    throw new Error(`openInvoice: invoice ${invoice.id} is ${invoice.state}`);
  }
  const providerEvent = providerEventName(adapter.provider, 'invoice.opened');
  const { event } = adapter.signWebhook({
    type: providerEvent,
    amountCents: invoice.amountCents,
    ...(invoice.currency !== undefined ? { currency: invoice.currency } : {}),
    customerId: invoice.customerId,
  });
  await adapter.emit(event);
  invoice.state = 'open';
  const step: AxisStep<InvoiceState> = {
    neutralEvent: 'invoice.opened',
    providerEvent,
    state: 'open',
    amountCents: invoice.amountCents,
    metadata: {
      invoiceId: invoice.id,
      openedAt: event.timestamp,
    },
  };
  invoice.history.push(step);
  return step;
}

/**
 * Mark invoice paid. Emits `invoice.paid`. Only allowed from `open`.
 */
export async function payInvoice(
  adapter: PaymentAdapter,
  invoice: Invoice,
): Promise<AxisStep<InvoiceState>> {
  if (invoice.state !== 'open') {
    throw new Error(`payInvoice: invoice ${invoice.id} is ${invoice.state}`);
  }
  const providerEvent = providerEventName(adapter.provider, 'invoice.paid');
  const { event } = adapter.signWebhook({
    type: providerEvent,
    amountCents: invoice.amountCents,
    ...(invoice.currency !== undefined ? { currency: invoice.currency } : {}),
    customerId: invoice.customerId,
  });
  await adapter.emit(event);
  invoice.state = 'paid';
  const step: AxisStep<InvoiceState> = {
    neutralEvent: 'invoice.paid',
    providerEvent,
    state: 'paid',
    amountCents: invoice.amountCents,
    metadata: {
      invoiceId: invoice.id,
      paidAt: event.timestamp,
    },
  };
  invoice.history.push(step);
  return step;
}

/**
 * Void an invoice. Emits `invoice.voided`. Allowed from `draft` or `open`
 * (real providers reject voiding a paid invoice — must be credit-noted
 * instead).
 */
export async function voidInvoice(
  adapter: PaymentAdapter,
  invoice: Invoice,
): Promise<AxisStep<InvoiceState>> {
  if (invoice.state !== 'draft' && invoice.state !== 'open') {
    throw new Error(`voidInvoice: invoice ${invoice.id} is ${invoice.state}, cannot void`);
  }
  const providerEvent = providerEventName(adapter.provider, 'invoice.voided');
  const { event } = adapter.signWebhook({
    type: providerEvent,
    amountCents: 0,
    ...(invoice.currency !== undefined ? { currency: invoice.currency } : {}),
    customerId: invoice.customerId,
  });
  await adapter.emit(event);
  invoice.state = 'void';
  const step: AxisStep<InvoiceState> = {
    neutralEvent: 'invoice.voided',
    providerEvent,
    state: 'void',
    amountCents: 0,
    metadata: {
      invoiceId: invoice.id,
      voidedAt: event.timestamp,
    },
  };
  invoice.history.push(step);
  return step;
}

/**
 * Mark an invoice uncollectible (dunning exhausted). Emits
 * `invoice.uncollectible`. Only allowed from `open`.
 */
export async function markUncollectible(
  adapter: PaymentAdapter,
  invoice: Invoice,
): Promise<AxisStep<InvoiceState>> {
  if (invoice.state !== 'open') {
    throw new Error(`markUncollectible: invoice ${invoice.id} is ${invoice.state}`);
  }
  const providerEvent = providerEventName(adapter.provider, 'invoice.uncollectible');
  const { event } = adapter.signWebhook({
    type: providerEvent,
    amountCents: invoice.amountCents,
    ...(invoice.currency !== undefined ? { currency: invoice.currency } : {}),
    customerId: invoice.customerId,
  });
  await adapter.emit(event);
  invoice.state = 'uncollectible';
  const step: AxisStep<InvoiceState> = {
    neutralEvent: 'invoice.uncollectible',
    providerEvent,
    state: 'uncollectible',
    amountCents: invoice.amountCents,
    metadata: {
      invoiceId: invoice.id,
      markedAt: event.timestamp,
    },
  };
  invoice.history.push(step);
  return step;
}

/**
 * Issue a credit note against a paid invoice. Emits `invoice.credit_noted`
 * with the credit amount (negative, capped at the invoice amount so tests
 * fail loudly on overrefund attempts).
 */
export async function creditNoteInvoice(
  adapter: PaymentAdapter,
  invoice: Invoice,
  input: { creditAmountCents: number },
): Promise<AxisStep<InvoiceState>> {
  if (invoice.state !== 'paid') {
    throw new Error(`creditNoteInvoice: invoice ${invoice.id} is ${invoice.state}, must be paid`);
  }
  if (input.creditAmountCents <= 0) {
    throw new Error('creditNoteInvoice: creditAmountCents must be > 0');
  }
  if (input.creditAmountCents > invoice.amountCents) {
    throw new Error(
      `creditNoteInvoice: credit ${input.creditAmountCents} exceeds invoice ${invoice.amountCents}`,
    );
  }
  const providerEvent = providerEventName(adapter.provider, 'invoice.credit_noted');
  const { event } = adapter.signWebhook({
    type: providerEvent,
    amountCents: -input.creditAmountCents,
    ...(invoice.currency !== undefined ? { currency: invoice.currency } : {}),
    customerId: invoice.customerId,
  });
  await adapter.emit(event);
  const step: AxisStep<InvoiceState> = {
    neutralEvent: 'invoice.credit_noted',
    providerEvent,
    state: 'paid',
    amountCents: -input.creditAmountCents,
    metadata: {
      invoiceId: invoice.id,
      creditAmountCents: input.creditAmountCents,
      creditedAt: event.timestamp,
    },
  };
  invoice.history.push(step);
  return step;
}
