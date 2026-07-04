import { describe, expect, it } from 'vitest';
import {
  createLemonSqueezyMock,
  createPaddleMock,
  createStripeMock,
  dunningAttempt,
  finalizeDunning,
  providerEventName,
  startDunning,
  type PaymentAdapter,
} from '../../src/index.js';

const providers: Array<{ name: string; make: () => PaymentAdapter }> = [
  { name: 'stripe', make: () => createStripeMock() },
  { name: 'paddle', make: () => createPaddleMock() },
  { name: 'lemonsqueezy', make: () => createLemonSqueezyMock() },
];

describe('dunning axis — 3 provider', () => {
  it.each(providers)('$name: retry sequence exhausts after maxAttempts', async ({ make }) => {
    const adapter = make();
    const received: string[] = [];
    adapter.onWebhook((e) => {
      received.push(e.type);
    });
    const session = startDunning({
      invoiceId: 'inv_1',
      amountCents: 5000,
      customerId: 'cus_1',
      config: { maxAttempts: 3, gracePeriodMs: 60_000 },
    });
    await dunningAttempt(adapter, session);
    await dunningAttempt(adapter, session);
    const last = await dunningAttempt(adapter, session);
    expect(last.state).toBe('in-grace-period');
    const terminal = await finalizeDunning(adapter, session, { succeed: false });
    expect(terminal.state).toBe('exhausted');
    expect(session.history).toHaveLength(4);
    expect(received).toHaveLength(4);
    expect(received.slice(0, 3).every((t) => t === providerEventName(adapter.provider, 'dunning.attempt'))).toBe(true);
    expect(received[3]).toBe(providerEventName(adapter.provider, 'dunning.exhausted'));
  });

  it.each(providers)('$name: recovery mid-sequence terminates in recovered', async ({ make }) => {
    const adapter = make();
    const session = startDunning({
      invoiceId: 'inv_2',
      amountCents: 2500,
      customerId: 'cus_2',
      config: { maxAttempts: 4 },
    });
    await dunningAttempt(adapter, session);
    await dunningAttempt(adapter, session);
    const recovered = await finalizeDunning(adapter, session, { succeed: true });
    expect(recovered.state).toBe('recovered');
    expect(recovered.neutralEvent).toBe('dunning.recovered');
    expect(recovered.amountCents).toBe(2500);
    expect(session.history).toHaveLength(3);
  });

  it('rejects a second attempt after grace period reached', async () => {
    const adapter = createStripeMock();
    const session = startDunning({
      invoiceId: 'inv_3',
      amountCents: 1000,
      customerId: 'cus_3',
      config: { maxAttempts: 1 },
    });
    await dunningAttempt(adapter, session);
    await expect(dunningAttempt(adapter, session)).rejects.toThrow(/in-grace-period/);
  });

  it('finalizeDunning double-call rejects', async () => {
    const adapter = createPaddleMock();
    const session = startDunning({
      invoiceId: 'inv_4',
      amountCents: 500,
      customerId: 'cus_4',
      config: { maxAttempts: 2 },
    });
    await dunningAttempt(adapter, session);
    await finalizeDunning(adapter, session, { succeed: true });
    await expect(finalizeDunning(adapter, session, { succeed: false })).rejects.toThrow(/already/);
  });

  it('metadata carries remainingAttempts + graceEndsAt on last attempt', async () => {
    const adapter = createLemonSqueezyMock();
    const session = startDunning({
      invoiceId: 'inv_5',
      amountCents: 1200,
      customerId: 'cus_5',
      config: { maxAttempts: 2, gracePeriodMs: 30_000 },
    });
    const first = await dunningAttempt(adapter, session);
    expect(first.metadata.remainingAttempts).toBe(1);
    expect(first.metadata.graceEndsAt).toBe(0);
    const second = await dunningAttempt(adapter, session);
    expect(second.metadata.remainingAttempts).toBe(0);
    expect(second.metadata.graceEndsAt).toBeGreaterThan(0);
  });
});
