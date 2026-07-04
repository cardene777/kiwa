import { describe, expect, it } from 'vitest';
import {
  createLemonSqueezyMock,
  createPaddleMock,
  createStripeMock,
  providerEventName,
  startThreeDs,
  threeDsFrictionless,
  threeDsRequestChallenge,
  threeDsSubmitChallenge,
  type PaymentAdapter,
} from '../../src/index.js';

const providers: Array<{ name: string; make: () => PaymentAdapter }> = [
  { name: 'stripe', make: () => createStripeMock() },
  { name: 'paddle', make: () => createPaddleMock() },
  { name: 'lemonsqueezy', make: () => createLemonSqueezyMock() },
];

describe('3DS axis — 3 provider', () => {
  it.each(providers)('$name: challenge flow reaches completed', async ({ make }) => {
    const adapter = make();
    const received: string[] = [];
    adapter.onWebhook((e) => {
      received.push(e.type);
    });
    const session = startThreeDs({
      paymentIntentId: 'pi_1',
      amountCents: 2000,
      customerId: 'cus_1',
    });
    await threeDsRequestChallenge(adapter, session);
    const done = await threeDsSubmitChallenge(adapter, session, { transStatus: 'Y' });
    expect(done.state).toBe('completed');
    expect(done.metadata.accepted).toBe(true);
    expect(done.metadata.eci).toBe('05');
    expect(received).toEqual([
      providerEventName(adapter.provider, '3ds.challenge_required'),
      providerEventName(adapter.provider, '3ds.challenge_completed'),
    ]);
  });

  it.each(providers)('$name: frictionless flow skips challenge', async ({ make }) => {
    const adapter = make();
    const received: string[] = [];
    adapter.onWebhook((e) => {
      received.push(e.type);
    });
    const session = startThreeDs({
      paymentIntentId: 'pi_2',
      amountCents: 1500,
      customerId: 'cus_2',
    });
    const step = await threeDsFrictionless(adapter, session);
    expect(step.state).toBe('frictionless');
    expect(received).toEqual([providerEventName(adapter.provider, '3ds.frictionless')]);
  });

  it('transStatus N marks not accepted with eci 07', async () => {
    const adapter = createStripeMock();
    const session = startThreeDs({
      paymentIntentId: 'pi_3',
      amountCents: 500,
      customerId: 'c',
    });
    await threeDsRequestChallenge(adapter, session);
    const done = await threeDsSubmitChallenge(adapter, session, { transStatus: 'N' });
    expect(done.metadata.accepted).toBe(false);
    expect(done.metadata.eci).toBe('07');
    expect(done.amountCents).toBe(0);
  });

  it('rejects submit before challenge requested', async () => {
    const adapter = createPaddleMock();
    const session = startThreeDs({
      paymentIntentId: 'pi_4',
      amountCents: 500,
      customerId: 'c',
    });
    await expect(threeDsSubmitChallenge(adapter, session, { transStatus: 'Y' })).rejects.toThrow(/fingerprint/);
  });

  it('rejects frictionless from wrong state', async () => {
    const adapter = createLemonSqueezyMock();
    const session = startThreeDs({
      paymentIntentId: 'pi_5',
      amountCents: 500,
      customerId: 'c',
    });
    await threeDsRequestChallenge(adapter, session);
    await expect(threeDsFrictionless(adapter, session)).rejects.toThrow(/challenge-pending/);
  });

  it('challenge required metadata carries ACS url + version', async () => {
    const adapter = createStripeMock();
    const session = startThreeDs({
      paymentIntentId: 'pi_6',
      amountCents: 500,
      customerId: 'c',
    });
    const step = await threeDsRequestChallenge(adapter, session);
    expect(step.metadata.acsChallengeUrl).toBe('https://acs.mock/3ds/pi_6');
    expect(step.metadata.threeDsVersion).toBe('2.2.0');
  });
});
