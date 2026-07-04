/**
 * Dunning full-flow vitest spec — payment fail → retry → grace period →
 * cancel.
 *
 * Sub-Issue #901 (v1.23-2) AC — the dunning axis (payment retry sequence +
 * grace period) is exercised end-to-end. Real Stripe drives Smart Retries on
 * their own schedule (default 4 attempts over ~1 week); the mock reproduces
 * the observable envelope so the fidelity harness can diff attempt cadence,
 * grace period, and terminal state without running the wall clock.
 *
 * Fidelity axes covered here —
 *  1. `startDunningForInvoice` → `dunning.attempt` webhook events emitted for
 *      each retry.
 *  2. Attempt count matches `DunningConfig.maxAttempts`.
 *  3. Terminal state (`recovered` vs `exhausted`) is set by `finalizeDunning`
 *      and mirrored in webhook events.
 *  4. Invoice moves to `uncollectible` after dunning exhausts.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { providerEventName } from '@kiwa-test/payment';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { createInvoiceActionHandler } from '../src/app/invoice/route.js';

describe('dunning full flow — mock adapter', () => {
  let adapter: ReturnType<typeof makeMockAdapter>;
  let invoiceId: string;

  beforeEach(async () => {
    adapter = makeMockAdapter();
    // Bootstrap: draft + open an invoice so dunning has something to retry.
    const invoice = await adapter.draftInvoice({
      customerId: 'cus_dunning',
      amountCents: 1000,
    });
    invoiceId = invoice.id;
    await adapter.openInvoice(invoiceId);
  });

  afterEach(async () => {
    await adapter.reset();
  });

  it('axis 1: startDunningForInvoice emits no events at start + reads default config', async () => {
    const eventsBefore = adapter.eventsEmitted().length;
    const session = await adapter.startDunningForInvoice(invoiceId);
    // startDunning is a local state constructor — no webhook.
    expect(adapter.eventsEmitted().length).toBe(eventsBefore);
    // Default config from packages/payment/src/semantics/dunning.ts —
    // 4 attempts, 3 days between attempts, 24h grace period.
    expect(session.config.maxAttempts).toBe(4);
    expect(session.state).toBe('active');
    expect(session.attempt).toBe(0);
  });

  it('axis 2: runDunningAttempt fires 4 attempts, last attempt → in-grace-period', async () => {
    await adapter.startDunningForInvoice(invoiceId);
    for (let i = 1; i <= 4; i += 1) {
      const session = await adapter.runDunningAttempt(invoiceId);
      expect(session.attempt).toBe(i);
      if (i < 4) {
        expect(session.state).toBe('active');
      } else {
        expect(session.state).toBe('in-grace-period');
      }
    }
    const events = adapter.eventsEmitted();
    const attemptEvents = events.filter(
      (e) => e.type === providerEventName('stripe', 'dunning.attempt'),
    );
    expect(attemptEvents).toHaveLength(4);
  });

  it('axis 3: exhausted terminal state fires dunning.exhausted event', async () => {
    await adapter.startDunningForInvoice(invoiceId);
    for (let i = 0; i < 4; i += 1) {
      await adapter.runDunningAttempt(invoiceId);
    }
    const session = await adapter.finalizeDunning(invoiceId, false);
    expect(session.state).toBe('exhausted');
    const events = adapter.eventsEmitted();
    const exhausted = events.find(
      (e) => e.type === providerEventName('stripe', 'dunning.exhausted'),
    );
    expect(exhausted).toBeDefined();
    // Exhausted event carries 0 amount (real Stripe marks the retry as
    // final-failed, no fund movement).
    expect(exhausted?.amountCents).toBe(0);
  });

  it('recovered terminal state fires dunning.recovered event with amount', async () => {
    await adapter.startDunningForInvoice(invoiceId);
    await adapter.runDunningAttempt(invoiceId);
    const session = await adapter.finalizeDunning(invoiceId, true);
    expect(session.state).toBe('recovered');
    const events = adapter.eventsEmitted();
    const recovered = events.find(
      (e) => e.type === providerEventName('stripe', 'dunning.recovered'),
    );
    expect(recovered).toBeDefined();
    // Recovered event carries the full invoice amount (retry success).
    expect(recovered?.amountCents).toBe(1000);
  });

  it('axis 4: invoice transition to uncollectible after dunning exhausts (via route handler)', async () => {
    await adapter.startDunningForInvoice(invoiceId);
    for (let i = 0; i < 4; i += 1) {
      await adapter.runDunningAttempt(invoiceId);
    }
    await adapter.finalizeDunning(invoiceId, false);
    // A real integration would run this transition in the webhook handler
    // for `dunning.exhausted`; the dogfood mock exposes it explicitly.
    const invoiceActionHandler = createInvoiceActionHandler(adapter);
    const res = await invoiceActionHandler(
      new Request('http://localhost/invoice/action', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'markUncollectible',
          invoiceId,
        }),
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { invoice: { state: string } };
    expect(body.invoice.state).toBe('uncollectible');
    const events = adapter.eventsEmitted();
    const uncollectible = events.find(
      (e) => e.type === providerEventName('stripe', 'invoice.uncollectible'),
    );
    expect(uncollectible).toBeDefined();
  });

  it('runDunningAttempt on non-active session rejects with dunning_wrong_state', async () => {
    await adapter.startDunningForInvoice(invoiceId);
    // Exhaust the session.
    for (let i = 0; i < 4; i += 1) {
      await adapter.runDunningAttempt(invoiceId);
    }
    // Now in `in-grace-period`; another attempt is illegal.
    await expect(adapter.runDunningAttempt(invoiceId)).rejects.toThrow(/is in-grace-period/);
    const trace = adapter.traces();
    const failed = trace.find((t) => t.op === 'dunningAttempt' && !t.ok);
    expect(failed).toBeDefined();
    expect(failed?.errorKind).toBe('dunning_wrong_state');
  });

  it('startDunningForInvoice on missing invoice rejects with entity_not_found', async () => {
    await expect(adapter.startDunningForInvoice('inv_does_not_exist')).rejects.toThrow(
      /not found/,
    );
    const trace = adapter.traces();
    const failed = trace.find((t) => t.op === 'startDunning' && !t.ok);
    expect(failed).toBeDefined();
    expect(failed?.errorKind).toBe('entity_not_found');
  });

  it('finalizeDunning idempotency — second call after terminal rejects', async () => {
    await adapter.startDunningForInvoice(invoiceId);
    await adapter.finalizeDunning(invoiceId, true);
    await expect(adapter.finalizeDunning(invoiceId, false)).rejects.toThrow(
      /already recovered/,
    );
  });
});
