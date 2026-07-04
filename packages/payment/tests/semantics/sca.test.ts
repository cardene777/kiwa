import { describe, expect, it } from 'vitest';
import {
  createLemonSqueezyMock,
  createPaddleMock,
  createStripeMock,
  providerEventName,
  scaAuthenticate,
  scaEvaluate,
  startSca,
  type PaymentAdapter,
} from '../../src/index.js';

const providers: Array<{ name: string; make: () => PaymentAdapter }> = [
  { name: 'stripe', make: () => createStripeMock() },
  { name: 'paddle', make: () => createPaddleMock() },
  { name: 'lemonsqueezy', make: () => createLemonSqueezyMock() },
];

describe('SCA axis — 3 provider', () => {
  it.each(providers)('$name: required → authenticated path emits token', async ({ make }) => {
    const adapter = make();
    const received: string[] = [];
    adapter.onWebhook((e) => {
      received.push(e.type);
    });
    const session = startSca({
      paymentIntentId: 'pi_a',
      amountCents: 3000,
      customerId: 'cus',
    });
    await scaEvaluate(adapter, session, {});
    const auth = await scaAuthenticate(adapter, session);
    expect(auth.state).toBe('authenticated');
    expect(auth.metadata.strongAuthToken).toMatch(/^sca_tok_pi_a_/);
    expect(session.strongAuthToken).toBeDefined();
    expect(received).toEqual([
      providerEventName(adapter.provider, 'sca.required'),
      providerEventName(adapter.provider, 'sca.authenticated'),
    ]);
  });

  it.each(providers)('$name: exemption terminates without authentication', async ({ make }) => {
    const adapter = make();
    const session = startSca({
      paymentIntentId: 'pi_b',
      amountCents: 200,
      customerId: 'cus',
    });
    const step = await scaEvaluate(adapter, session, { exemption: 'low-value' });
    expect(step.state).toBe('exempt');
    expect(step.metadata.exemption).toBe('low-value');
    expect(session.state).toBe('exempt');
  });

  it('rejects authenticate before evaluate', async () => {
    const adapter = createStripeMock();
    const session = startSca({
      paymentIntentId: 'pi_c',
      amountCents: 500,
      customerId: 'c',
    });
    await expect(scaAuthenticate(adapter, session)).rejects.toThrow(/evaluating/);
  });

  it('rejects authenticate after exemption', async () => {
    const adapter = createPaddleMock();
    const session = startSca({
      paymentIntentId: 'pi_d',
      amountCents: 500,
      customerId: 'c',
    });
    await scaEvaluate(adapter, session, { exemption: 'recurring-subsequent' });
    await expect(scaAuthenticate(adapter, session)).rejects.toThrow(/exempt/);
  });

  it('strong auth token embeds paymentIntentId + timestamp', async () => {
    const adapter = createLemonSqueezyMock();
    const session = startSca({
      paymentIntentId: 'pi_e',
      amountCents: 500,
      customerId: 'c',
    });
    await scaEvaluate(adapter, session, {});
    const auth = await scaAuthenticate(adapter, session);
    expect(auth.metadata.validForMs).toBe(90 * 24 * 60 * 60 * 1000);
    expect(String(auth.metadata.strongAuthToken)).toContain('pi_e');
  });
});
