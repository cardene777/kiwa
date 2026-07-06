import { describe, expect, it } from 'vitest';
import {
  createLemonSqueezyMock,
  createPaddleMock,
  createStripeMock,
  escalateArbitration,
  finalizeDispute,
  openDispute,
  representDispute,
  shiftLiability,
  submitDisputeEvidence,
  type PaymentAdapter,
} from '../../src/index.js';

const providers: Array<{ name: string; make: () => PaymentAdapter }> = [
  { name: 'stripe', make: () => createStripeMock() },
  { name: 'paddle', make: () => createPaddleMock() },
  { name: 'lemonsqueezy', make: () => createLemonSqueezyMock() },
];

describe('dispute lifecycle axis — 3 provider', () => {
  it.each(providers)(
    '$name: full evidence → represent → arbitration → won',
    async ({ make }) => {
      const adapter = make();
      const session = openDispute({
        disputeId: 'dp_1',
        chargeId: 'ch_1',
        amountCents: 4000,
        customerId: 'cus_1',
        reason: 'product_not_received',
      });
      expect(session.state).toBe('opened');
      const evidence = await submitDisputeEvidence(adapter, session, {
        evidenceIds: ['ev_1', 'ev_2'],
      });
      expect(evidence.neutralEvent).toBe('dispute.evidence_submitted');
      expect(evidence.metadata.evidenceCount).toBe(2);
      const represented = await representDispute(adapter, session);
      expect(represented.neutralEvent).toBe('dispute.represented');
      const arb = await escalateArbitration(adapter, session);
      expect(arb.neutralEvent).toBe('dispute.arbitration_opened');
      expect(session.arbitrationOpenedAt).not.toBeNull();
      finalizeDispute(session, { won: true });
      expect(session.state).toBe('won');
    },
  );

  it('representDispute rejects without evidence', async () => {
    const adapter = createStripeMock();
    const session = openDispute({
      disputeId: 'dp_2',
      chargeId: 'ch_2',
      amountCents: 100,
      customerId: 'cus_2',
      reason: 'fraudulent',
    });
    await expect(representDispute(adapter, session)).rejects.toThrow(/must be submitted/);
  });

  it('escalateArbitration rejects before represent', async () => {
    const adapter = createPaddleMock();
    const session = openDispute({
      disputeId: 'dp_3',
      chargeId: 'ch_3',
      amountCents: 200,
      customerId: 'cus_3',
      reason: 'duplicate',
    });
    await submitDisputeEvidence(adapter, session, { evidenceIds: ['e'] });
    await expect(escalateArbitration(adapter, session)).rejects.toThrow(/must be represented/);
  });

  it('shiftLiability records 3DS auth code', async () => {
    const adapter = createStripeMock();
    const session = openDispute({
      disputeId: 'dp_4',
      chargeId: 'ch_4',
      amountCents: 8000,
      customerId: 'cus_4',
      reason: 'unauthorized',
    });
    const step = await shiftLiability(adapter, session, { threeDsAuthCode: 'AUTH123' });
    expect(step.neutralEvent).toBe('dispute.liability_shifted');
    expect(session.liabilityShifted).toBe(true);
    expect(step.metadata.threeDsAuthCode).toBe('AUTH123');
  });

  it('shiftLiability rejects double-invocation', async () => {
    const adapter = createLemonSqueezyMock();
    const session = openDispute({
      disputeId: 'dp_5',
      chargeId: 'ch_5',
      amountCents: 100,
      customerId: 'cus_5',
      reason: 'fraudulent',
    });
    await shiftLiability(adapter, session, { threeDsAuthCode: 'A' });
    await expect(shiftLiability(adapter, session, { threeDsAuthCode: 'B' })).rejects.toThrow(
      /already shifted/,
    );
  });

  it('submitDisputeEvidence accumulates ids across calls', async () => {
    const adapter = createStripeMock();
    const session = openDispute({
      disputeId: 'dp_6',
      chargeId: 'ch_6',
      amountCents: 500,
      customerId: 'cus_6',
      reason: 'general',
    });
    await submitDisputeEvidence(adapter, session, { evidenceIds: ['a', 'b'] });
    const step = await submitDisputeEvidence(adapter, session, { evidenceIds: ['c'] });
    expect(step.metadata.evidenceCount).toBe(3);
    expect(session.evidence).toEqual(['a', 'b', 'c']);
  });
});
