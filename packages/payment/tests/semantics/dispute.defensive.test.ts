import { describe, expect, it } from 'vitest';
import {
  createStripeMock,
  escalateArbitration,
  finalizeDispute,
  openDispute,
  providerEventName,
  representDispute,
  shiftLiability,
  submitDisputeEvidence,
} from '../../src/index.js';

describe('Dispute axis — defensive branch closure', () => {
  it('openDispute stores currency when provided', () => {
    const session = openDispute({
      disputeId: 'd_cur',
      chargeId: 'ch_1',
      amountCents: 5000,
      customerId: 'cus',
      currency: 'EUR',
      reason: 'fraudulent',
    });
    expect(session.currency).toBe('EUR');
    expect(session.state).toBe('opened');
    expect(session.liabilityShifted).toBe(false);
    expect(session.arbitrationOpenedAt).toBeNull();
    expect(session.evidence).toEqual([]);
  });

  it('openDispute leaves currency undefined when omitted', () => {
    const session = openDispute({
      disputeId: 'd_nocur',
      chargeId: 'ch_1',
      amountCents: 5000,
      customerId: 'cus',
      reason: 'not_received',
    });
    expect(session.currency).toBeUndefined();
  });

  it('submitDisputeEvidence propagates currency in signed webhook', async () => {
    const adapter = createStripeMock();
    const received: Array<{ type: string; currency?: string }> = [];
    adapter.onWebhook((e) => { received.push({ type: e.type, currency: e.currency }); });
    const session = openDispute({
      disputeId: 'd_ev',
      chargeId: 'ch_1',
      amountCents: 5000,
      customerId: 'cus',
      currency: 'GBP',
      reason: 'fraudulent',
    });
    await submitDisputeEvidence(adapter, session, { evidenceIds: ['ev1'] });
    expect(received[0]?.currency).toBe('GBP');
  });

  it('submitDisputeEvidence accepts additional evidence after first submit', async () => {
    const adapter = createStripeMock();
    const session = openDispute({
      disputeId: 'd_add',
      chargeId: 'ch_1',
      amountCents: 5000,
      customerId: 'cus',
      reason: 'fraudulent',
    });
    await submitDisputeEvidence(adapter, session, { evidenceIds: ['ev1'] });
    const step = await submitDisputeEvidence(adapter, session, { evidenceIds: ['ev2', 'ev3'] });
    expect(session.evidence).toEqual(['ev1', 'ev2', 'ev3']);
    expect(step.metadata.evidenceCount).toBe(3);
  });

  it('submitDisputeEvidence throws when session already represented', async () => {
    const adapter = createStripeMock();
    const session = openDispute({
      disputeId: 'd_rep',
      chargeId: 'ch_1',
      amountCents: 5000,
      customerId: 'cus',
      reason: 'fraudulent',
    });
    await submitDisputeEvidence(adapter, session, { evidenceIds: ['ev1'] });
    await representDispute(adapter, session);
    await expect(
      submitDisputeEvidence(adapter, session, { evidenceIds: ['ev2'] }),
    ).rejects.toThrow(/represented/);
  });

  it('representDispute throws when no evidence submitted (before evidence-submitted)', async () => {
    const adapter = createStripeMock();
    const session = openDispute({
      disputeId: 'd_noev',
      chargeId: 'ch_1',
      amountCents: 5000,
      customerId: 'cus',
      reason: 'fraudulent',
    });
    await expect(representDispute(adapter, session)).rejects.toThrow(/evidence must be submitted/);
  });

  it('representDispute throws when evidence array empty (state advanced but empty)', async () => {
    const adapter = createStripeMock();
    const session = openDispute({
      disputeId: 'd_empty',
      chargeId: 'ch_1',
      amountCents: 5000,
      customerId: 'cus',
      reason: 'fraudulent',
    });
    await submitDisputeEvidence(adapter, session, { evidenceIds: [] });
    await expect(representDispute(adapter, session)).rejects.toThrow(/cannot represent without evidence/);
  });

  it('escalateArbitration throws when not yet represented', async () => {
    const adapter = createStripeMock();
    const session = openDispute({
      disputeId: 'd_no_rep',
      chargeId: 'ch_1',
      amountCents: 5000,
      customerId: 'cus',
      reason: 'fraudulent',
    });
    await submitDisputeEvidence(adapter, session, { evidenceIds: ['ev1'] });
    await expect(escalateArbitration(adapter, session)).rejects.toThrow(/represented first/);
  });

  it('escalateArbitration sets arbitrationOpenedAt timestamp', async () => {
    const adapter = createStripeMock();
    const session = openDispute({
      disputeId: 'd_arb',
      chargeId: 'ch_1',
      amountCents: 5000,
      customerId: 'cus',
      reason: 'fraudulent',
    });
    await submitDisputeEvidence(adapter, session, { evidenceIds: ['ev1'] });
    await representDispute(adapter, session);
    const before = Date.now();
    await escalateArbitration(adapter, session);
    const after = Date.now();
    expect(session.arbitrationOpenedAt).not.toBeNull();
    expect(session.arbitrationOpenedAt!).toBeGreaterThanOrEqual(before);
    expect(session.arbitrationOpenedAt!).toBeLessThanOrEqual(after);
    expect(session.state).toBe('arbitration-opened');
  });

  it('shiftLiability marks session liability-shifted with 3DS auth code', async () => {
    const adapter = createStripeMock();
    const session = openDispute({
      disputeId: 'd_shift',
      chargeId: 'ch_1',
      amountCents: 5000,
      customerId: 'cus',
      reason: 'fraudulent',
    });
    const step = await shiftLiability(adapter, session, { threeDsAuthCode: 'auth_abc' });
    expect(session.liabilityShifted).toBe(true);
    expect(session.state).toBe('liability-shifted');
    expect(step.metadata.threeDsAuthCode).toBe('auth_abc');
  });

  it('shiftLiability throws when already shifted', async () => {
    const adapter = createStripeMock();
    const session = openDispute({
      disputeId: 'd_dup',
      chargeId: 'ch_1',
      amountCents: 5000,
      customerId: 'cus',
      reason: 'fraudulent',
    });
    await shiftLiability(adapter, session, { threeDsAuthCode: 'auth_1' });
    await expect(
      shiftLiability(adapter, session, { threeDsAuthCode: 'auth_2' }),
    ).rejects.toThrow(/already shifted/);
  });

  it('finalizeDispute with won:true sets state won', () => {
    const session = openDispute({
      disputeId: 'd_won',
      chargeId: 'ch_1',
      amountCents: 5000,
      customerId: 'cus',
      reason: 'fraudulent',
    });
    const finalized = finalizeDispute(session, { won: true });
    expect(finalized.state).toBe('won');
  });

  it('finalizeDispute with won:false sets state lost', () => {
    const session = openDispute({
      disputeId: 'd_lost',
      chargeId: 'ch_1',
      amountCents: 5000,
      customerId: 'cus',
      reason: 'fraudulent',
    });
    const finalized = finalizeDispute(session, { won: false });
    expect(finalized.state).toBe('lost');
  });

  it('escalateArbitration emits filing fee 500', async () => {
    const adapter = createStripeMock();
    const session = openDispute({
      disputeId: 'd_fee',
      chargeId: 'ch_1',
      amountCents: 5000,
      customerId: 'cus',
      reason: 'fraudulent',
    });
    await submitDisputeEvidence(adapter, session, { evidenceIds: ['ev1'] });
    await representDispute(adapter, session);
    const step = await escalateArbitration(adapter, session);
    expect(step.metadata.filingFeeCents).toBe(500);
    expect(step.neutralEvent).toBe('dispute.arbitration_opened');
  });

  it('history captures all step providerEvents in order', async () => {
    const adapter = createStripeMock();
    const session = openDispute({
      disputeId: 'd_hist',
      chargeId: 'ch_1',
      amountCents: 5000,
      customerId: 'cus',
      reason: 'fraudulent',
    });
    await submitDisputeEvidence(adapter, session, { evidenceIds: ['ev1'] });
    await representDispute(adapter, session);
    await escalateArbitration(adapter, session);
    expect(session.history.map((h) => h.providerEvent)).toEqual([
      providerEventName(adapter.provider, 'dispute.evidence_submitted'),
      providerEventName(adapter.provider, 'dispute.represented'),
      providerEventName(adapter.provider, 'dispute.arbitration_opened'),
    ]);
  });
});
