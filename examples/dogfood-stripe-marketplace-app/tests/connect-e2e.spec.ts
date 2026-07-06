/**
 * Connect onboarding + account status fidelity spec.
 *
 * Covers deterministic Express account ids, derived account states,
 * insertion-order listing, trace capture, env-gated real mode, and emitted
 * marketplace webhook events.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { detectRealEnvMissing } from '../src/adapters/real.js';
import { getAccountStatusHandler, getOnboardingLinkHandler, listAccountsHandler } from '../src/app/connect/route.js';

const NOW = 1_700_000_000_000;

describe('mock adapter — connect marketplace flows', () => {
  let adapter: ReturnType<typeof makeMockAdapter>;

  beforeEach(() => {
    adapter = makeMockAdapter({ now: () => NOW });
  });

  afterEach(async () => {
    await adapter.reset();
  });

  it('axis 1: createExpressAccount returns stable acct_test_1 + accountLink URL shape', async () => {
    const account = await adapter.createExpressAccount({ email: 'seller-1@example.com' });
    expect(account.id).toBe('acct_test_1');
    expect(account.onboardingUrl).toContain('https://connect.stripe.com/express/onboarding/acct_test_1');
  });

  it('axis 2: multiple createExpressAccount increments id', async () => {
    const first = await adapter.createExpressAccount({ email: 'seller-1@example.com' });
    const second = await adapter.createExpressAccount({ email: 'seller-2@example.com' });
    expect(first.id).toBe('acct_test_1');
    expect(second.id).toBe('acct_test_2');
  });

  it('axis 3: account state transitions pending to verified', async () => {
    const created = await adapter.createExpressAccount({ email: 'seller@example.com' });
    const stored = adapter.runtime().store.getAccount(created.id);
    expect(stored?.status).toBe('pending');
    expect(stored).not.toBeNull();
    adapter.runtime().store.persistAccount({
      ...stored!,
      detailsSubmitted: true,
      chargesEnabled: true,
      payoutsEnabled: true,
      capabilities: {
        cardPayments: 'active',
        transfers: 'active',
      },
    });

    const account = await adapter.getAccountStatus(created.id);
    expect(account.status).toBe('verified');
  });

  it('axis 4: account state transitions verified to restricted after capabilities revoked', async () => {
    const created = await adapter.createExpressAccount({ email: 'seller@example.com' });
    adapter.runtime().store.persistAccount({
      ...adapter.runtime().store.getAccount(created.id)!,
      detailsSubmitted: true,
      chargesEnabled: true,
      payoutsEnabled: true,
      capabilities: {
        cardPayments: 'revoked',
        transfers: 'active',
      },
    });

    const account = await adapter.getAccountStatus(created.id);
    expect(account.status).toBe('restricted');
  });

  it('axis 5: getAccountStatus returns capabilities', async () => {
    const created = await adapter.createExpressAccount({ email: 'seller@example.com' });
    const account = await adapter.getAccountStatus(created.id);
    expect(account.capabilities).toEqual({
      cardPayments: 'inactive',
      transfers: 'inactive',
    });
  });

  it('axis 6: getOnboardingLink returns stripe.com/express/onboarding URL', async () => {
    const created = await adapter.createExpressAccount({ email: 'seller@example.com' });
    const handler = getOnboardingLinkHandler(adapter);
    const response = await handler(new Request(`http://localhost/connect/onboarding?accountId=${created.id}`, { method: 'GET' }));
    const body = (await response.json()) as { accountId: string; url: string };
    expect(response.status).toBe(200);
    expect(body.accountId).toBe(created.id);
    expect(body.url).toContain('stripe.com/express/onboarding');
  });

  it('axis 7: createExpressAccount malformed input missing email throws invalid_input', async () => {
    await expect(adapter.createExpressAccount({ email: '' })).rejects.toMatchObject({
      reason: 'invalid_input',
    });
  });

  it('axis 8: createExpressAccount duplicate email throws duplicate_email', async () => {
    await adapter.createExpressAccount({ email: 'dup@example.com' });
    await expect(adapter.createExpressAccount({ email: 'dup@example.com' })).rejects.toMatchObject({
      reason: 'duplicate_email',
    });
  });

  it('axis 9: listAccounts returns array in insertion order', async () => {
    await adapter.createExpressAccount({ email: 'first@example.com' });
    await adapter.createExpressAccount({ email: 'second@example.com' });
    const handler = listAccountsHandler(adapter);
    const response = await handler(new Request('http://localhost/connect/accounts', { method: 'GET' }));
    const body = (await response.json()) as { accounts: Array<{ id: string }> };
    expect(body.accounts.map((account) => account.id)).toEqual(['acct_test_1', 'acct_test_2']);
  });

  it('axis 10: real adapter detectRealEnvMissing returns KIWA_MODE not real when unset', () => {
    const prevMode = process.env['KIWA_MODE'];
    const prevKey = process.env['STRIPE_SECRET_KEY'];
    const prevReady = process.env['KIWA_STRIPE_REAL_READY'];
    delete process.env['KIWA_MODE'];
    delete process.env['STRIPE_SECRET_KEY'];
    delete process.env['KIWA_STRIPE_REAL_READY'];
    expect(detectRealEnvMissing()).toBe('KIWA_MODE not real');
    process.env['KIWA_MODE'] = prevMode;
    process.env['STRIPE_SECRET_KEY'] = prevKey;
    process.env['KIWA_STRIPE_REAL_READY'] = prevReady;
  });

  it('axis 11: trace event contains op=createExpressAccount + detail.accountId', async () => {
    const account = await adapter.createExpressAccount({ email: 'trace@example.com' });
    const event = adapter.traces().find((trace) => trace.op === 'createExpressAccount');
    expect(event?.detail?.['accountId']).toBe(account.id);
  });

  it('axis 12: createExpressAccount emits account.updated webhook event', async () => {
    await adapter.createExpressAccount({ email: 'events@example.com' });
    const events = adapter.eventsEmitted();
    expect(events).toHaveLength(1);
    expect(events[0]?.type).toBe('account.updated');
    expect(events[0]?.detail?.['accountId']).toBe('acct_test_1');
  });

  it('webhook route verifies signed account.updated payload and dispatches it', async () => {
    const signed = adapter.runtime().adapter.signWebhook({
      type: 'account.updated',
      amountCents: 0,
      customerId: 'seller@example.com',
      timestamp: NOW,
    });
    const handler = getAccountStatusHandler(adapter);
    const created = await adapter.createExpressAccount({ email: 'seller@example.com' });
    const statusResponse = await handler(new Request(`http://localhost/connect/status?accountId=${created.id}`, { method: 'GET' }));
    expect(statusResponse.status).toBe(200);
    const webhookHandler = (await import('../src/app/webhook/route.js')).createWebhookHandler(adapter);
    const webhookResponse = await webhookHandler(
      new Request('http://localhost/webhook', {
        method: 'POST',
        headers: { 'stripe-signature': signed.signature },
        body: signed.rawBody,
      }),
    );
    const body = (await webhookResponse.json()) as { ok: boolean; dispatched: boolean };
    expect(webhookResponse.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.dispatched).toBe(true);
  });
});
