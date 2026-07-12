import { describe, expect, it } from 'vitest';
import {
  createStripeMock,
  providerEventName,
  startThreeDs,
  threeDsFrictionless,
  threeDsRequestChallenge,
  threeDsSubmitChallenge,
} from '../../src/index.js';

describe('3DS axis — defensive branch closure', () => {
  it('startThreeDs stores currency when provided', () => {
    const session = startThreeDs({
      paymentIntentId: 'pi_cur',
      amountCents: 2000,
      currency: 'USD',
      customerId: 'cus',
    });
    expect(session.currency).toBe('USD');
    expect(session.state).toBe('fingerprint');
  });

  it('threeDsRequestChallenge propagates currency to signed webhook', async () => {
    const adapter = createStripeMock();
    const received: Array<{ type: string; currency?: string }> = [];
    adapter.onWebhook((e) => { received.push({ type: e.type, currency: e.currency }); });
    const session = startThreeDs({
      paymentIntentId: 'pi_req',
      amountCents: 2000,
      currency: 'EUR',
      customerId: 'cus',
    });
    await threeDsRequestChallenge(adapter, session);
    expect(received[0]?.currency).toBe('EUR');
    expect(received[0]?.type).toBe(providerEventName(adapter.provider, '3ds.challenge_required'));
  });

  it('threeDsSubmitChallenge with A status marks accepted eci 05', async () => {
    const adapter = createStripeMock();
    const session = startThreeDs({
      paymentIntentId: 'pi_a',
      amountCents: 2000,
      currency: 'JPY',
      customerId: 'cus',
    });
    await threeDsRequestChallenge(adapter, session);
    const step = await threeDsSubmitChallenge(adapter, session, { transStatus: 'A' });
    expect(step.metadata.accepted).toBe(true);
    expect(step.metadata.eci).toBe('05');
    expect(step.metadata.transStatus).toBe('A');
    expect(step.amountCents).toBe(2000);
  });

  it('threeDsSubmitChallenge with U status marks not-accepted with zero amount', async () => {
    const adapter = createStripeMock();
    const session = startThreeDs({
      paymentIntentId: 'pi_u',
      amountCents: 999,
      customerId: 'cus',
    });
    await threeDsRequestChallenge(adapter, session);
    const step = await threeDsSubmitChallenge(adapter, session, { transStatus: 'U' });
    expect(step.metadata.accepted).toBe(false);
    expect(step.metadata.eci).toBe('07');
    expect(step.amountCents).toBe(0);
  });

  it('threeDsSubmitChallenge with R (rejected) marks not-accepted', async () => {
    const adapter = createStripeMock();
    const session = startThreeDs({
      paymentIntentId: 'pi_r',
      amountCents: 500,
      customerId: 'cus',
    });
    await threeDsRequestChallenge(adapter, session);
    const step = await threeDsSubmitChallenge(adapter, session, { transStatus: 'R' });
    expect(step.metadata.accepted).toBe(false);
    expect(step.metadata.eci).toBe('07');
  });

  it('threeDsSubmitChallenge with C (challenge required) marks not-accepted', async () => {
    const adapter = createStripeMock();
    const session = startThreeDs({
      paymentIntentId: 'pi_c',
      amountCents: 500,
      customerId: 'cus',
    });
    await threeDsRequestChallenge(adapter, session);
    const step = await threeDsSubmitChallenge(adapter, session, { transStatus: 'C' });
    expect(step.metadata.accepted).toBe(false);
    expect(step.metadata.eci).toBe('07');
  });

  it('threeDsSubmitChallenge propagates currency to signed webhook (Y path)', async () => {
    const adapter = createStripeMock();
    const received: Array<{ type: string; currency?: string; amountCents?: number }> = [];
    adapter.onWebhook((e) => {
      received.push({ type: e.type, currency: e.currency, amountCents: e.amountCents });
    });
    const session = startThreeDs({
      paymentIntentId: 'pi_y_cur',
      amountCents: 1234,
      currency: 'CHF',
      customerId: 'cus',
    });
    await threeDsRequestChallenge(adapter, session);
    await threeDsSubmitChallenge(adapter, session, { transStatus: 'Y' });
    const completedEvent = received.find(
      (r) => r.type === providerEventName(adapter.provider, '3ds.challenge_completed'),
    );
    expect(completedEvent?.currency).toBe('CHF');
    expect(completedEvent?.amountCents).toBe(1234);
  });

  it('threeDsFrictionless propagates currency to signed webhook', async () => {
    const adapter = createStripeMock();
    const received: Array<{ type: string; currency?: string }> = [];
    adapter.onWebhook((e) => { received.push({ type: e.type, currency: e.currency }); });
    const session = startThreeDs({
      paymentIntentId: 'pi_fric_cur',
      amountCents: 500,
      currency: 'AUD',
      customerId: 'cus',
    });
    await threeDsFrictionless(adapter, session);
    expect(received[0]?.currency).toBe('AUD');
    expect(session.state).toBe('frictionless');
  });

  it('threeDsRequestChallenge throws when session already completed', async () => {
    const adapter = createStripeMock();
    const session = startThreeDs({
      paymentIntentId: 'pi_done',
      amountCents: 500,
      customerId: 'cus',
    });
    await threeDsRequestChallenge(adapter, session);
    await threeDsSubmitChallenge(adapter, session, { transStatus: 'Y' });
    await expect(threeDsRequestChallenge(adapter, session)).rejects.toThrow(/completed/);
  });

  it('threeDsRequestChallenge throws when session already in challenge-pending', async () => {
    const adapter = createStripeMock();
    const session = startThreeDs({
      paymentIntentId: 'pi_dup',
      amountCents: 500,
      customerId: 'cus',
    });
    await threeDsRequestChallenge(adapter, session);
    await expect(threeDsRequestChallenge(adapter, session)).rejects.toThrow(/challenge-pending/);
  });

  it('threeDsSubmitChallenge throws when session already completed', async () => {
    const adapter = createStripeMock();
    const session = startThreeDs({
      paymentIntentId: 'pi_scomp',
      amountCents: 500,
      customerId: 'cus',
    });
    await threeDsRequestChallenge(adapter, session);
    await threeDsSubmitChallenge(adapter, session, { transStatus: 'Y' });
    await expect(
      threeDsSubmitChallenge(adapter, session, { transStatus: 'N' }),
    ).rejects.toThrow(/completed/);
  });

  it('frictionless metadata carries transStatus Y + eci 05', async () => {
    const adapter = createStripeMock();
    const session = startThreeDs({
      paymentIntentId: 'pi_fr_meta',
      amountCents: 100,
      customerId: 'cus',
    });
    const step = await threeDsFrictionless(adapter, session);
    expect(step.metadata.transStatus).toBe('Y');
    expect(step.metadata.eci).toBe('05');
    expect(step.state).toBe('frictionless');
  });

  it('session history captures request → submit sequence with correct providerEvent names', async () => {
    const adapter = createStripeMock();
    const session = startThreeDs({
      paymentIntentId: 'pi_seq',
      amountCents: 100,
      customerId: 'cus',
    });
    await threeDsRequestChallenge(adapter, session);
    await threeDsSubmitChallenge(adapter, session, { transStatus: 'Y' });
    expect(session.history.map((h) => h.providerEvent)).toEqual([
      providerEventName(adapter.provider, '3ds.challenge_required'),
      providerEventName(adapter.provider, '3ds.challenge_completed'),
    ]);
  });
});
