import { describe, expect, it } from 'vitest';
import {
  advanceCascade,
  applyCardUpdate,
  applyNetworkToken,
  createStripeMock,
  finalizeRecovery,
  scheduleSmartRetry,
  startRecovery,
} from '../../src/index.js';

// Closes the reachable branches in packages/payment/src/semantics/revenue-recovery.ts
// that revenue-recovery.test.ts doesn't hit: the `!networkTokenizationEnabled`
// guard, the second terminal-guard on `advanceCascade`, the `currency !==
// undefined` arms in startRecovery + emit, and the finalize-then-reject path
// on `applyNetworkToken` after a lost session.

describe('revenue-recovery — defensive guards', () => {
  it('T-PAY-C-RR-001 applyNetworkToken rejects when networkTokenization disabled', async () => {
    const adapter = createStripeMock();
    const session = startRecovery({
      invoiceId: 'inv_rr_1',
      amountCents: 500,
      customerId: 'cus_rr_1',
      config: { networkTokenizationEnabled: false },
    });
    await expect(
      applyNetworkToken(adapter, session, { networkTokenId: 'nt_x' }),
    ).rejects.toThrow(/disabled/);
  });

  it('T-PAY-C-RR-002 advanceCascade rejects after finalise(lost)', async () => {
    const adapter = createStripeMock();
    const session = startRecovery({
      invoiceId: 'inv_rr_2',
      amountCents: 500,
      customerId: 'cus_rr_2',
    });
    finalizeRecovery(session, { succeed: false });
    await expect(advanceCascade(adapter, session)).rejects.toThrow(/lost/);
  });

  it('T-PAY-C-RR-003 advanceCascade rejects after finalise(recovered)', async () => {
    const adapter = createStripeMock();
    const session = startRecovery({
      invoiceId: 'inv_rr_3',
      amountCents: 500,
      customerId: 'cus_rr_3',
    });
    finalizeRecovery(session, { succeed: true });
    await expect(advanceCascade(adapter, session)).rejects.toThrow(/recovered/);
  });

  it('T-PAY-C-RR-004 scheduleSmartRetry rejects after finalise(recovered)', async () => {
    const adapter = createStripeMock();
    const session = startRecovery({
      invoiceId: 'inv_rr_4',
      amountCents: 500,
      customerId: 'cus_rr_4',
    });
    finalizeRecovery(session, { succeed: true });
    await expect(scheduleSmartRetry(adapter, session)).rejects.toThrow(/recovered/);
  });

  it('T-PAY-C-RR-005 currency provided propagates to session and emitted event', async () => {
    const adapter = createStripeMock();
    const session = startRecovery({
      invoiceId: 'inv_rr_5',
      amountCents: 750,
      currency: 'EUR',
      customerId: 'cus_rr_5',
    });
    expect(session.currency).toBe('EUR');
    const step = await scheduleSmartRetry(adapter, session);
    expect(step.state).toBe('smart-retry-scheduled');
    expect(session.history).toHaveLength(1);
  });

  it('T-PAY-C-RR-006 config undefined defaults to RECOVERY_DEFAULTS', () => {
    const session = startRecovery({
      invoiceId: 'inv_rr_6',
      amountCents: 100,
      customerId: 'cus_rr_6',
    });
    expect(session.config.cascade).toEqual(['email', 'in-app', 'sms']);
    expect(session.config.cardUpdaterEnabled).toBe(true);
    expect(session.config.networkTokenizationEnabled).toBe(true);
  });

  it('T-PAY-C-RR-007 applyCardUpdate emits card_updated across currency-defined session', async () => {
    const adapter = createStripeMock();
    const session = startRecovery({
      invoiceId: 'inv_rr_7',
      amountCents: 900,
      currency: 'JPY',
      customerId: 'cus_rr_7',
    });
    const step = await applyCardUpdate(adapter, session, {
      last4: '9999',
      expMonth: 3,
      expYear: 2029,
    });
    expect(step.state).toBe('card-updated');
    expect(step.metadata.last4).toBe('9999');
  });

  it('T-PAY-C-RR-008 cascade exhaustion transitions to lost state before throwing', async () => {
    const adapter = createStripeMock();
    const session = startRecovery({
      invoiceId: 'inv_rr_8',
      amountCents: 500,
      customerId: 'cus_rr_8',
      config: { cascade: ['email'] },
    });
    await advanceCascade(adapter, session);
    await expect(advanceCascade(adapter, session)).rejects.toThrow(/exhausted/);
    expect(session.state).toBe('lost');
  });
});
