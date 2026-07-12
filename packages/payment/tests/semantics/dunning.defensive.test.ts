import { describe, expect, it } from 'vitest';
import {
  createStripeMock,
  dunningAttempt,
  finalizeDunning,
  startDunning,
} from '../../src/index.js';

// Closes the reachable branches in packages/payment/src/semantics/dunning.ts
// that dunning.test.ts leaves open: `state !== 'active'` guard on attempt,
// `state === 'recovered' || 'exhausted'` finalize guard, the `input.currency
// !== undefined` arm, and the isLast → in-grace-period transition path with
// non-default maxAttempts.

describe('dunning — defensive guards', () => {
  it('T-PAY-C-DN-001 dunningAttempt throws when session already recovered', async () => {
    const adapter = createStripeMock();
    const session = startDunning({
      invoiceId: 'inv_dn_1',
      amountCents: 500,
      customerId: 'cus_dn_1',
    });
    await finalizeDunning(adapter, session, { succeed: true });
    await expect(dunningAttempt(adapter, session)).rejects.toThrow(/cannot attempt/);
  });

  it('T-PAY-C-DN-002 finalizeDunning throws when already recovered', async () => {
    const adapter = createStripeMock();
    const session = startDunning({
      invoiceId: 'inv_dn_2',
      amountCents: 500,
      customerId: 'cus_dn_2',
    });
    await finalizeDunning(adapter, session, { succeed: true });
    await expect(
      finalizeDunning(adapter, session, { succeed: false }),
    ).rejects.toThrow(/already recovered/);
  });

  it('T-PAY-C-DN-003 finalizeDunning throws when already exhausted', async () => {
    const adapter = createStripeMock();
    const session = startDunning({
      invoiceId: 'inv_dn_3',
      amountCents: 500,
      customerId: 'cus_dn_3',
    });
    await finalizeDunning(adapter, session, { succeed: false });
    await expect(
      finalizeDunning(adapter, session, { succeed: true }),
    ).rejects.toThrow(/already exhausted/);
  });

  it('T-PAY-C-DN-004 currency propagates from startDunning to session', () => {
    const session = startDunning({
      invoiceId: 'inv_dn_4',
      amountCents: 500,
      customerId: 'cus_dn_4',
      currency: 'CAD',
    });
    expect(session.currency).toBe('CAD');
  });

  it('T-PAY-C-DN-005 last attempt transitions to in-grace-period with graceEndsAt > 0', async () => {
    const adapter = createStripeMock();
    const session = startDunning({
      invoiceId: 'inv_dn_5',
      amountCents: 500,
      customerId: 'cus_dn_5',
      config: { maxAttempts: 1 },
    });
    const step = await dunningAttempt(adapter, session);
    expect(session.state).toBe('in-grace-period');
    expect(step.metadata.graceEndsAt).toBeGreaterThan(0);
    expect(step.metadata.remainingAttempts).toBe(0);
  });

  it('T-PAY-C-DN-006 non-last attempt keeps state=active with graceEndsAt=0', async () => {
    const adapter = createStripeMock();
    const session = startDunning({
      invoiceId: 'inv_dn_6',
      amountCents: 500,
      customerId: 'cus_dn_6',
      config: { maxAttempts: 3 },
    });
    const step = await dunningAttempt(adapter, session);
    expect(session.state).toBe('active');
    expect(step.metadata.graceEndsAt).toBe(0);
    expect(step.metadata.remainingAttempts).toBe(2);
  });

  it('T-PAY-C-DN-007 finalize(succeed=true) with currency defined emits full amount', async () => {
    const adapter = createStripeMock();
    const session = startDunning({
      invoiceId: 'inv_dn_7',
      amountCents: 1_500,
      customerId: 'cus_dn_7',
      currency: 'EUR',
    });
    const step = await finalizeDunning(adapter, session, { succeed: true });
    expect(step.neutralEvent).toBe('dunning.recovered');
    expect(step.amountCents).toBe(1_500);
  });

  it('T-PAY-C-DN-008 finalize(succeed=false) emits zero-amount exhausted event', async () => {
    const adapter = createStripeMock();
    const session = startDunning({
      invoiceId: 'inv_dn_8',
      amountCents: 1_500,
      customerId: 'cus_dn_8',
    });
    const step = await finalizeDunning(adapter, session, { succeed: false });
    expect(step.neutralEvent).toBe('dunning.exhausted');
    expect(step.amountCents).toBe(0);
    expect(session.state).toBe('exhausted');
  });

  it('T-PAY-C-DN-009 config undefined defaults to DUNNING_DEFAULTS', () => {
    const session = startDunning({
      invoiceId: 'inv_dn_9',
      amountCents: 500,
      customerId: 'cus_dn_9',
    });
    expect(session.config.maxAttempts).toBe(4);
    expect(session.config.retryIntervalMs).toBe(3 * 24 * 60 * 60 * 1000);
    expect(session.config.gracePeriodMs).toBe(24 * 60 * 60 * 1000);
  });
});
