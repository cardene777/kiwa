import { describe, expect, it } from 'vitest';
import {
  createStripeMock,
  providerEventName,
  scaAuthenticate,
  scaEvaluate,
  startSca,
} from '../../src/index.js';

describe('SCA axis — defensive branch closure', () => {
  it('startSca stores currency when provided (defined path)', () => {
    const session = startSca({
      paymentIntentId: 'pi_cur',
      amountCents: 1000,
      currency: 'EUR',
      customerId: 'cus',
    });
    expect(session.currency).toBe('EUR');
    expect(session.state).toBe('evaluating');
    expect(session.history).toEqual([]);
  });

  it('startSca leaves currency undefined when omitted (undefined path)', () => {
    const session = startSca({
      paymentIntentId: 'pi_nocur',
      amountCents: 1000,
      customerId: 'cus',
    });
    expect(session.currency).toBeUndefined();
  });

  it('scaEvaluate exempt path with currency includes currency in signed webhook', async () => {
    const adapter = createStripeMock();
    const received: Array<{ type: string; currency?: string }> = [];
    adapter.onWebhook((e) => {
      received.push({ type: e.type, currency: e.currency });
    });
    const session = startSca({
      paymentIntentId: 'pi_exempt_cur',
      amountCents: 200,
      currency: 'GBP',
      customerId: 'cus',
    });
    const step = await scaEvaluate(adapter, session, { exemption: 'trusted-beneficiary' });
    expect(step.state).toBe('exempt');
    expect(received[0]?.currency).toBe('GBP');
    expect(step.metadata.exemption).toBe('trusted-beneficiary');
  });

  it('scaEvaluate required path with currency includes currency in signed webhook', async () => {
    const adapter = createStripeMock();
    const received: Array<{ type: string; currency?: string }> = [];
    adapter.onWebhook((e) => {
      received.push({ type: e.type, currency: e.currency });
    });
    const session = startSca({
      paymentIntentId: 'pi_req_cur',
      amountCents: 3000,
      currency: 'JPY',
      customerId: 'cus',
    });
    await scaEvaluate(adapter, session, {});
    expect(received[0]?.type).toBe(providerEventName(adapter.provider, 'sca.required'));
    expect(received[0]?.currency).toBe('JPY');
  });

  it('scaAuthenticate with currency includes currency in signed webhook', async () => {
    const adapter = createStripeMock();
    const received: Array<{ type: string; currency?: string }> = [];
    adapter.onWebhook((e) => {
      received.push({ type: e.type, currency: e.currency });
    });
    const session = startSca({
      paymentIntentId: 'pi_auth_cur',
      amountCents: 3000,
      currency: 'CHF',
      customerId: 'cus',
    });
    await scaEvaluate(adapter, session, {});
    await scaAuthenticate(adapter, session);
    const authWebhook = received.find(
      (r) => r.type === providerEventName(adapter.provider, 'sca.authenticated'),
    );
    expect(authWebhook?.currency).toBe('CHF');
  });

  it('scaEvaluate rejects when already exempt (state guard)', async () => {
    const adapter = createStripeMock();
    const session = startSca({
      paymentIntentId: 'pi_exempt_guard',
      amountCents: 100,
      customerId: 'cus',
    });
    await scaEvaluate(adapter, session, { exemption: 'low-value' });
    await expect(scaEvaluate(adapter, session, {})).rejects.toThrow(/exempt/);
  });

  it('scaEvaluate rejects when already required (state guard)', async () => {
    const adapter = createStripeMock();
    const session = startSca({
      paymentIntentId: 'pi_required_guard',
      amountCents: 3000,
      customerId: 'cus',
    });
    await scaEvaluate(adapter, session, {});
    await expect(scaEvaluate(adapter, session, {})).rejects.toThrow(/required/);
  });

  it('scaEvaluate rejects when already authenticated (state guard)', async () => {
    const adapter = createStripeMock();
    const session = startSca({
      paymentIntentId: 'pi_auth_guard',
      amountCents: 3000,
      customerId: 'cus',
    });
    await scaEvaluate(adapter, session, {});
    await scaAuthenticate(adapter, session);
    await expect(scaEvaluate(adapter, session, {})).rejects.toThrow(/authenticated/);
  });

  it('history records all steps in order for required → authenticated path', async () => {
    const adapter = createStripeMock();
    const session = startSca({
      paymentIntentId: 'pi_hist',
      amountCents: 3000,
      customerId: 'cus',
    });
    await scaEvaluate(adapter, session, {});
    await scaAuthenticate(adapter, session);
    expect(session.history.map((h) => h.state)).toEqual(['required', 'authenticated']);
    expect(session.history[0]?.metadata.requiresRedirect).toBe(true);
    expect(session.history[1]?.metadata.validForMs).toBe(90 * 24 * 60 * 60 * 1000);
  });

  it('history records exempt step with corporate exemption metadata', async () => {
    const adapter = createStripeMock();
    const session = startSca({
      paymentIntentId: 'pi_corp',
      amountCents: 50000,
      customerId: 'cus',
    });
    await scaEvaluate(adapter, session, { exemption: 'corporate' });
    expect(session.history).toHaveLength(1);
    expect(session.history[0]?.metadata.exemption).toBe('corporate');
    expect(session.history[0]?.state).toBe('exempt');
  });

  it('strong auth token embeds unique timestamp per session', async () => {
    const adapter = createStripeMock();
    const s1 = startSca({ paymentIntentId: 'pi_t1', amountCents: 1000, customerId: 'c' });
    const s2 = startSca({ paymentIntentId: 'pi_t2', amountCents: 1000, customerId: 'c' });
    await scaEvaluate(adapter, s1, {});
    await scaEvaluate(adapter, s2, {});
    await scaAuthenticate(adapter, s1);
    await scaAuthenticate(adapter, s2);
    expect(s1.strongAuthToken).not.toBe(s2.strongAuthToken);
    expect(s1.strongAuthToken).toContain('pi_t1');
    expect(s2.strongAuthToken).toContain('pi_t2');
  });

  it('all 6 PSD2 exemption values are accepted (exhaustive union coverage)', async () => {
    const adapter = createStripeMock();
    const exemptions = [
      'low-value',
      'trusted-beneficiary',
      'transaction-risk-analysis',
      'merchant-initiated',
      'recurring-subsequent',
      'corporate',
    ] as const;
    for (const exemption of exemptions) {
      const session = startSca({
        paymentIntentId: `pi_${exemption}`,
        amountCents: 100,
        customerId: 'cus',
      });
      const step = await scaEvaluate(adapter, session, { exemption });
      expect(step.state).toBe('exempt');
      expect(step.metadata.exemption).toBe(exemption);
    }
  });
});
