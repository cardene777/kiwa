import { describe, expect, it } from 'vitest';
import {
  advanceCascade,
  applyCardUpdate,
  applyNetworkToken,
  createLemonSqueezyMock,
  createPaddleMock,
  createStripeMock,
  finalizeRecovery,
  scheduleSmartRetry,
  startRecovery,
  type PaymentAdapter,
} from '../../src/index.js';

const providers: Array<{ name: string; make: () => PaymentAdapter }> = [
  { name: 'stripe', make: () => createStripeMock() },
  { name: 'paddle', make: () => createPaddleMock() },
  { name: 'lemonsqueezy', make: () => createLemonSqueezyMock() },
];

describe('revenue-recovery axis — 3 provider', () => {
  it.each(providers)('$name: schedule smart retry emits scheduled event', async ({ make }) => {
    const adapter = make();
    const session = startRecovery({
      invoiceId: 'inv_1',
      amountCents: 1200,
      customerId: 'cus_1',
    });
    const step = await scheduleSmartRetry(adapter, session);
    expect(step.neutralEvent).toBe('recovery.smart_retry_scheduled');
    expect(session.state).toBe('smart-retry-scheduled');
    expect(step.metadata.priority).toBe('high');
  });

  it.each(providers)(
    '$name: advanceCascade fires each channel then rejects after exhaustion',
    async ({ make }) => {
      const adapter = make();
      const session = startRecovery({
        invoiceId: 'inv_2',
        amountCents: 500,
        customerId: 'cus_2',
        config: { cascade: ['email', 'in-app', 'sms'] },
      });
      const email = await advanceCascade(adapter, session);
      expect(email.metadata.channel).toBe('email');
      const inApp = await advanceCascade(adapter, session);
      expect(inApp.metadata.channel).toBe('in-app');
      const sms = await advanceCascade(adapter, session);
      expect(sms.metadata.channel).toBe('sms');
      await expect(advanceCascade(adapter, session)).rejects.toThrow(/exhausted/);
    },
  );

  it('applyCardUpdate emits card_updated with new PAN suffix', async () => {
    const adapter = createStripeMock();
    const session = startRecovery({
      invoiceId: 'inv_3',
      amountCents: 900,
      customerId: 'cus_3',
    });
    const step = await applyCardUpdate(adapter, session, {
      last4: '4242',
      expMonth: 12,
      expYear: 2030,
    });
    expect(step.neutralEvent).toBe('recovery.card_updated');
    expect(step.metadata.last4).toBe('4242');
    expect(session.state).toBe('card-updated');
  });

  it('applyCardUpdate rejects when cardUpdater disabled', async () => {
    const adapter = createStripeMock();
    const session = startRecovery({
      invoiceId: 'inv_4',
      amountCents: 900,
      customerId: 'cus_4',
      config: { cardUpdaterEnabled: false },
    });
    await expect(
      applyCardUpdate(adapter, session, {
        last4: '0000',
        expMonth: 1,
        expYear: 2027,
      }),
    ).rejects.toThrow(/disabled/);
  });

  it('applyNetworkToken emits tokenized event', async () => {
    const adapter = createPaddleMock();
    const session = startRecovery({
      invoiceId: 'inv_5',
      amountCents: 300,
      customerId: 'cus_5',
    });
    const step = await applyNetworkToken(adapter, session, { networkTokenId: 'nt_abc' });
    expect(step.neutralEvent).toBe('recovery.network_tokenized');
    expect(step.metadata.networkTokenId).toBe('nt_abc');
  });

  it('finalizeRecovery marks session recovered', async () => {
    const adapter = createLemonSqueezyMock();
    const session = startRecovery({
      invoiceId: 'inv_6',
      amountCents: 100,
      customerId: 'cus_6',
    });
    await scheduleSmartRetry(adapter, session);
    finalizeRecovery(session, { succeed: true });
    expect(session.state).toBe('recovered');
  });

  it('rejects operations on already-lost session', async () => {
    const adapter = createStripeMock();
    const session = startRecovery({
      invoiceId: 'inv_7',
      amountCents: 100,
      customerId: 'cus_7',
    });
    finalizeRecovery(session, { succeed: false });
    await expect(scheduleSmartRetry(adapter, session)).rejects.toThrow(/lost/);
  });
});
