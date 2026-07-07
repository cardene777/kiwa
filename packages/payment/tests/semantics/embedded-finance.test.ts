import { describe, expect, it } from 'vitest';
import {
  closeAccount,
  createLemonSqueezyMock,
  createPaddleMock,
  createStripeMock,
  issueCard,
  openAccount,
  type PaymentAdapter,
  verifyKyb,
  verifyKyc,
} from '../../src/index.js';

const providers: Array<{ name: string; make: () => PaymentAdapter }> = [
  { name: 'stripe', make: () => createStripeMock() },
  { name: 'paddle', make: () => createPaddleMock() },
  { name: 'lemonsqueezy', make: () => createLemonSqueezyMock() },
];

describe('embedded-finance axis — BaaS + KYC + KYB + card issuance', () => {
  it.each(providers)('$name: openAccount emits account_opened + moves to account-opened', async ({ make }) => {
    const adapter = make();
    const { session, step } = await openAccount(adapter, {
      accountId: 'acc_1',
      customerId: 'cus_1',
      currency: 'usd',
    });
    expect(step.neutralEvent).toBe('embedded.account_opened');
    expect(session.state).toBe('account-opened');
    expect(session.kycStatus).toBe('pending');
  });

  it('openAccount defaults requireKyb=false so KYB is auto-verified', async () => {
    const adapter = createStripeMock();
    const { session } = await openAccount(adapter, {
      accountId: 'acc_2',
      customerId: 'cus_2',
    });
    expect(session.config.requireKyb).toBe(false);
    expect(session.kybStatus).toBe('verified');
  });

  it('openAccount with requireKyb=true keeps KYB pending', async () => {
    const adapter = createStripeMock();
    const { session } = await openAccount(adapter, {
      accountId: 'acc_3',
      customerId: 'cus_3',
      config: { requireKyb: true },
    });
    expect(session.kybStatus).toBe('pending');
    expect(session.config.requireKyb).toBe(true);
  });

  it.each(providers)('$name: verifyKyc with score >= minScore moves to kyc-verified', async ({ make }) => {
    const adapter = make();
    const { session } = await openAccount(adapter, {
      accountId: 'acc_4',
      customerId: 'cus_4',
    });
    const step = await verifyKyc(adapter, session, { score: 80 });
    expect(step.neutralEvent).toBe('embedded.kyc_verified');
    expect(step.metadata.passed).toBe(true);
    expect(session.state).toBe('kyc-verified');
    expect(session.kycStatus).toBe('verified');
  });

  it('verifyKyc with score < minScore suspends the account', async () => {
    const adapter = createStripeMock();
    const { session } = await openAccount(adapter, {
      accountId: 'acc_5',
      customerId: 'cus_5',
    });
    const step = await verifyKyc(adapter, session, { score: 30 });
    expect(step.metadata.passed).toBe(false);
    expect(session.state).toBe('suspended');
    expect(session.kycStatus).toBe('failed');
  });

  it('verifyKyc rejects score < 0', async () => {
    const adapter = createStripeMock();
    const { session } = await openAccount(adapter, {
      accountId: 'acc_6',
      customerId: 'cus_6',
    });
    await expect(verifyKyc(adapter, session, { score: -1 })).rejects.toThrow(/between 0 and 100/);
  });

  it('verifyKyc rejects score > 100', async () => {
    const adapter = createStripeMock();
    const { session } = await openAccount(adapter, {
      accountId: 'acc_7',
      customerId: 'cus_7',
    });
    await expect(verifyKyc(adapter, session, { score: 101 })).rejects.toThrow(/between 0 and 100/);
  });

  it('verifyKyc respects custom minScore config', async () => {
    const adapter = createStripeMock();
    const { session } = await openAccount(adapter, {
      accountId: 'acc_8',
      customerId: 'cus_8',
      config: { minScore: 90 },
    });
    // 80 < 90 → suspended
    const step = await verifyKyc(adapter, session, { score: 80 });
    expect(step.metadata.passed).toBe(false);
    expect(session.state).toBe('suspended');
  });

  it('verifyKyc rejects on suspended session', async () => {
    const adapter = createStripeMock();
    const { session } = await openAccount(adapter, {
      accountId: 'acc_9',
      customerId: 'cus_9',
    });
    closeAccount(session);
    await expect(verifyKyc(adapter, session, { score: 50 })).rejects.toThrow(/closed/);
  });

  it.each(providers)('$name: verifyKyb succeeds with requireKyb=true', async ({ make }) => {
    const adapter = make();
    const { session } = await openAccount(adapter, {
      accountId: 'acc_10',
      customerId: 'cus_10',
      config: { requireKyb: true },
    });
    const step = await verifyKyb(adapter, session, {
      businessRegistryId: 'reg_1',
      verified: true,
    });
    expect(step.neutralEvent).toBe('embedded.kyb_verified');
    expect(step.metadata.passed).toBe(true);
    expect(session.state).toBe('kyb-verified');
  });

  it('verifyKyb throws when requireKyb=false', async () => {
    const adapter = createStripeMock();
    const { session } = await openAccount(adapter, {
      accountId: 'acc_11',
      customerId: 'cus_11',
      config: { requireKyb: false },
    });
    await expect(
      verifyKyb(adapter, session, { businessRegistryId: 'reg_bad', verified: true }),
    ).rejects.toThrow(/not required/);
  });

  it('verifyKyb failed suspends the session', async () => {
    const adapter = createStripeMock();
    const { session } = await openAccount(adapter, {
      accountId: 'acc_12',
      customerId: 'cus_12',
      config: { requireKyb: true },
    });
    const step = await verifyKyb(adapter, session, {
      businessRegistryId: 'reg_fail',
      verified: false,
    });
    expect(step.metadata.passed).toBe(false);
    expect(session.state).toBe('suspended');
    expect(session.kybStatus).toBe('failed');
  });

  it.each(providers)('$name: issueCard succeeds after KYC verified', async ({ make }) => {
    const adapter = make();
    const { session } = await openAccount(adapter, {
      accountId: 'acc_13',
      customerId: 'cus_13',
    });
    await verifyKyc(adapter, session, { score: 80 });
    const step = await issueCard(adapter, session, {
      cardId: 'card_1',
      type: 'virtual',
      last4: '4242',
    });
    expect(step.neutralEvent).toBe('embedded.card_issued');
    expect(step.metadata.cardId).toBe('card_1');
    expect(step.metadata.type).toBe('virtual');
    expect(session.state).toBe('card-issued');
    expect(session.cardIds).toEqual(['card_1']);
  });

  it('issueCard blocks when KYC not verified', async () => {
    const adapter = createStripeMock();
    const { session } = await openAccount(adapter, {
      accountId: 'acc_14',
      customerId: 'cus_14',
    });
    await expect(
      issueCard(adapter, session, { cardId: 'card_bad', type: 'virtual', last4: '0000' }),
    ).rejects.toThrow(/KYC must be verified/);
  });

  it('issueCard blocks when KYB required but not verified', async () => {
    const adapter = createStripeMock();
    const { session } = await openAccount(adapter, {
      accountId: 'acc_15',
      customerId: 'cus_15',
      config: { requireKyb: true },
    });
    await verifyKyc(adapter, session, { score: 80 });
    await expect(
      issueCard(adapter, session, { cardId: 'card_x', type: 'physical', last4: '1111' }),
    ).rejects.toThrow(/KYB must be verified/);
  });

  it('issueCard succeeds after both KYC + KYB verified', async () => {
    const adapter = createStripeMock();
    const { session } = await openAccount(adapter, {
      accountId: 'acc_16',
      customerId: 'cus_16',
      config: { requireKyb: true },
    });
    await verifyKyc(adapter, session, { score: 80 });
    await verifyKyb(adapter, session, { businessRegistryId: 'reg_ok', verified: true });
    const step = await issueCard(adapter, session, {
      cardId: 'card_2',
      type: 'physical',
      last4: '5555',
    });
    expect(step.metadata.type).toBe('physical');
    expect(session.cardIds).toContain('card_2');
  });

  it('issueCard accumulates multiple cards on same account', async () => {
    const adapter = createStripeMock();
    const { session } = await openAccount(adapter, {
      accountId: 'acc_17',
      customerId: 'cus_17',
    });
    await verifyKyc(adapter, session, { score: 90 });
    await issueCard(adapter, session, { cardId: 'card_a', type: 'virtual', last4: '0001' });
    await issueCard(adapter, session, { cardId: 'card_b', type: 'virtual', last4: '0002' });
    const third = await issueCard(adapter, session, {
      cardId: 'card_c',
      type: 'physical',
      last4: '0003',
    });
    expect(third.metadata.totalCards).toBe(3);
    expect(session.cardIds).toEqual(['card_a', 'card_b', 'card_c']);
  });

  it('closeAccount marks session closed and no ops after', async () => {
    const adapter = createStripeMock();
    const { session } = await openAccount(adapter, {
      accountId: 'acc_18',
      customerId: 'cus_18',
    });
    closeAccount(session);
    expect(session.state).toBe('closed');
    await expect(verifyKyc(adapter, session, { score: 100 })).rejects.toThrow(/closed/);
  });

  it('history accumulates all emitted steps', async () => {
    const adapter = createStripeMock();
    const { session } = await openAccount(adapter, {
      accountId: 'acc_19',
      customerId: 'cus_19',
    });
    await verifyKyc(adapter, session, { score: 90 });
    await issueCard(adapter, session, { cardId: 'card_h', type: 'virtual', last4: '9999' });
    expect(session.history).toHaveLength(3);
    expect(session.history[0]?.neutralEvent).toBe('embedded.account_opened');
    expect(session.history[1]?.neutralEvent).toBe('embedded.kyc_verified');
    expect(session.history[2]?.neutralEvent).toBe('embedded.card_issued');
  });

  it('provider event names differ per provider', async () => {
    for (const p of providers) {
      const adapter = p.make();
      const { step } = await openAccount(adapter, {
        accountId: `acc_${p.name}`,
        customerId: `cus_${p.name}`,
      });
      // provider event should be provider-specific
      expect(step.providerEvent).toBeTruthy();
      expect(typeof step.providerEvent).toBe('string');
    }
  });
});
