import { describe, expect, it } from 'vitest';
import {
  checkoutCompleted,
  createLemonSqueezyMock,
  createPaddleMock,
  createStripeMock,
  dunningAttempt,
  finalizeDunning,
  startDunning,
} from '../src/index.js';

describe('library documentation payment recipes', () => {
  it('delivers a signed checkout event and rejects a modified amount', async () => {
    const stripe = createStripeMock({ secret: 'whsec_test', now: () => 1_700_000_000_000 });
    const seen: string[] = [];
    const unsubscribe = stripe.onWebhook((event) => { seen.push(`${event.type}:${event.customerId}`); });
    const signed = checkoutCompleted(stripe, { amountCents: 2000, currency: 'usd', customerId: 'cus_test' });
    const verified = stripe.verifyWebhook({ rawBody: signed.rawBody, signature: signed.signature });

    if (verified.ok && verified.event) await stripe.emit(verified.event);

    const changed = stripe.verifyWebhook({
      rawBody: signed.rawBody.replace('"amountCents":2000', '"amountCents":2001'),
      signature: signed.signature,
    });
    if (changed.ok && changed.event) await stripe.emit(changed.event);

    expect(verified).toMatchObject({ ok: true, event: { type: 'checkout.completed', amountCents: 2000 } });
    expect(changed).toMatchObject({ ok: false, reason: 'bad-signature' });
    expect(seen).toEqual(['checkout.completed:cus_test']);
    unsubscribe();
  });

  it('verifies each provider with its own signed event', () => {
    const adapters = [
      createStripeMock({ secret: 'whsec_stripe' }),
      createPaddleMock({ secret: 'whsec_paddle' }),
      createLemonSqueezyMock({ secret: 'whsec_lemon' }),
    ];

    for (const adapter of adapters) {
      const signed = adapter.signWebhook({ type: 'checkout.completed', amountCents: 2000, customerId: 'cus_1' });
      expect(adapter.verifyWebhook(signed)).toMatchObject({ ok: true, reason: 'ok' });
    }
  });

  it('moves a failed invoice through attempts and into the terminal state', async () => {
    const stripe = createStripeMock({ secret: 'whsec_test' });
    const session = startDunning({
      invoiceId: 'inv_42',
      amountCents: 5000,
      customerId: 'cus_1',
      currency: 'usd',
      config: { maxAttempts: 3, gracePeriodMs: 60_000 },
    });

    await dunningAttempt(stripe, session);
    await dunningAttempt(stripe, session);
    const lastAttempt = await dunningAttempt(stripe, session);
    const terminal = await finalizeDunning(stripe, session, { succeed: false });

    expect(lastAttempt).toMatchObject({ state: 'in-grace-period', metadata: { remainingAttempts: 0 } });
    expect(terminal).toMatchObject({ neutralEvent: 'dunning.exhausted', state: 'exhausted', amountCents: 0 });
    expect(session.history).toHaveLength(4);
  });
});
