import { describe, expect, it } from 'vitest';
import {
  completeSettlement,
  createLemonSqueezyMock,
  createPaddleMock,
  createStripeMock,
  expireRate,
  initiateSettlement,
  lockRate,
  type PaymentAdapter,
  startFxTransfer,
} from '../../src/index.js';

const providers: Array<{ name: string; make: () => PaymentAdapter }> = [
  { name: 'stripe', make: () => createStripeMock() },
  { name: 'paddle', make: () => createPaddleMock() },
  { name: 'lemonsqueezy', make: () => createLemonSqueezyMock() },
];

describe('fx-cross-border axis — multi-currency + rate lock + SWIFT/SEPA', () => {
  it('startFxTransfer initialises with default config', () => {
    const session = startFxTransfer({
      transferId: 'tr_1',
      customerId: 'cus_1',
    });
    expect(session.state).toBe('initial');
    expect(session.config.rateLockDurationMs).toBe(60_000);
    expect(session.config.settlementRail).toBe('SWIFT');
    expect(session.quote).toBeNull();
  });

  it('startFxTransfer accepts custom rail + duration', () => {
    const session = startFxTransfer({
      transferId: 'tr_2',
      customerId: 'cus_2',
      config: { settlementRail: 'SEPA', rateLockDurationMs: 120_000 },
    });
    expect(session.config.settlementRail).toBe('SEPA');
    expect(session.config.rateLockDurationMs).toBe(120_000);
  });

  it.each(providers)('$name: lockRate stores quote and emits rate_locked', async ({ make }) => {
    const adapter = make();
    const session = startFxTransfer({
      transferId: 'tr_3',
      customerId: 'cus_3',
    });
    const step = await lockRate(adapter, session, {
      fromCurrency: 'usd',
      toCurrency: 'eur',
      rate: 0.85,
      quoteId: 'q_1',
      amountFromCents: 10000,
    });
    expect(step.neutralEvent).toBe('fx.rate_locked');
    expect(session.state).toBe('rate-locked');
    expect(session.quote?.rate).toBe(0.85);
    expect(session.quote?.amountToCents).toBe(8500);
  });

  it('lockRate rejects rate <= 0', async () => {
    const adapter = createStripeMock();
    const session = startFxTransfer({
      transferId: 'tr_4',
      customerId: 'cus_4',
    });
    await expect(
      lockRate(adapter, session, {
        fromCurrency: 'usd',
        toCurrency: 'eur',
        rate: 0,
        quoteId: 'q_bad',
        amountFromCents: 1000,
      }),
    ).rejects.toThrow(/rate must be positive/);
    await expect(
      lockRate(adapter, session, {
        fromCurrency: 'usd',
        toCurrency: 'eur',
        rate: -0.5,
        quoteId: 'q_bad2',
        amountFromCents: 1000,
      }),
    ).rejects.toThrow(/rate must be positive/);
  });

  it('lockRate rejects amountFromCents <= 0', async () => {
    const adapter = createStripeMock();
    const session = startFxTransfer({
      transferId: 'tr_5',
      customerId: 'cus_5',
    });
    await expect(
      lockRate(adapter, session, {
        fromCurrency: 'usd',
        toCurrency: 'eur',
        rate: 0.9,
        quoteId: 'q_bad3',
        amountFromCents: 0,
      }),
    ).rejects.toThrow(/amountFromCents must be positive/);
  });

  it.each(providers)('$name: initiateSettlement moves to settlement-initiated', async ({ make }) => {
    const adapter = make();
    const session = startFxTransfer({
      transferId: 'tr_6',
      customerId: 'cus_6',
    });
    await lockRate(adapter, session, {
      fromCurrency: 'gbp',
      toCurrency: 'usd',
      rate: 1.27,
      quoteId: 'q_2',
      amountFromCents: 5000,
    });
    const step = await initiateSettlement(adapter, session, {
      beneficiaryIban: 'GB29NWBK60161331926819',
      beneficiaryBic: 'NWBKGB2L',
    });
    expect(step.neutralEvent).toBe('fx.settlement_initiated');
    expect(step.metadata.rail).toBe('SWIFT');
    expect(session.state).toBe('settlement-initiated');
  });

  it('initiateSettlement rejects when no rate locked', async () => {
    const adapter = createStripeMock();
    const session = startFxTransfer({
      transferId: 'tr_7',
      customerId: 'cus_7',
    });
    await expect(
      initiateSettlement(adapter, session, {}),
    ).rejects.toThrow(/no rate locked/);
  });

  it('initiateSettlement rejects when rate expired', async () => {
    const adapter = createStripeMock();
    const session = startFxTransfer({
      transferId: 'tr_8',
      customerId: 'cus_8',
      config: { rateLockDurationMs: 1 },
    });
    await lockRate(adapter, session, {
      fromCurrency: 'usd',
      toCurrency: 'eur',
      rate: 0.85,
      quoteId: 'q_exp',
      amountFromCents: 1000,
    });
    await new Promise((r) => setTimeout(r, 10));
    await expect(
      initiateSettlement(adapter, session, {}),
    ).rejects.toThrow(/rate lock expired/);
    expect(session.state).toBe('expired');
  });

  it.each(providers)('$name: completeSettlement finalises transfer', async ({ make }) => {
    const adapter = make();
    const session = startFxTransfer({
      transferId: 'tr_9',
      customerId: 'cus_9',
    });
    await lockRate(adapter, session, {
      fromCurrency: 'usd',
      toCurrency: 'jpy',
      rate: 154.5,
      quoteId: 'q_jpy',
      amountFromCents: 2000,
    });
    await initiateSettlement(adapter, session, {});
    const step = await completeSettlement(adapter, session, {
      settlementRef: 'REF-JPY-001',
    });
    expect(step.neutralEvent).toBe('fx.settlement_completed');
    expect(step.metadata.settlementRef).toBe('REF-JPY-001');
    expect(session.state).toBe('settlement-completed');
    expect(session.settledAmountCents).toBe(Math.round(2000 * 154.5));
  });

  it('completeSettlement rejects on non-settlement-initiated state', async () => {
    const adapter = createStripeMock();
    const session = startFxTransfer({
      transferId: 'tr_10',
      customerId: 'cus_10',
    });
    await lockRate(adapter, session, {
      fromCurrency: 'usd',
      toCurrency: 'cad',
      rate: 1.36,
      quoteId: 'q_cad',
      amountFromCents: 3000,
    });
    // did not call initiateSettlement
    await expect(
      completeSettlement(adapter, session, { settlementRef: 'X' }),
    ).rejects.toThrow(/must be settlement-initiated/);
  });

  it('expireRate emits rate_expired', async () => {
    const adapter = createStripeMock();
    const session = startFxTransfer({
      transferId: 'tr_11',
      customerId: 'cus_11',
    });
    await lockRate(adapter, session, {
      fromCurrency: 'usd',
      toCurrency: 'chf',
      rate: 0.9,
      quoteId: 'q_chf',
      amountFromCents: 1500,
    });
    const step = await expireRate(adapter, session);
    expect(step.neutralEvent).toBe('fx.rate_expired');
    expect(session.state).toBe('expired');
  });

  it('expireRate rejects when no rate locked', async () => {
    const adapter = createStripeMock();
    const session = startFxTransfer({
      transferId: 'tr_12',
      customerId: 'cus_12',
    });
    await expect(expireRate(adapter, session)).rejects.toThrow(/no rate locked/);
  });

  it('all rails supported via config', async () => {
    const adapter = createStripeMock();
    const rails = ['SWIFT', 'SEPA', 'ACH', 'FASTER', 'RTGS'] as const;
    for (const rail of rails) {
      const session = startFxTransfer({
        transferId: `tr_${rail}`,
        customerId: 'cus',
        config: { settlementRail: rail },
      });
      await lockRate(adapter, session, {
        fromCurrency: 'usd',
        toCurrency: 'eur',
        rate: 0.85,
        quoteId: `q_${rail}`,
        amountFromCents: 1000,
      });
      const step = await initiateSettlement(adapter, session, {});
      expect(step.metadata.rail).toBe(rail);
    }
  });

  it('amountToCents rounds to nearest integer', async () => {
    const adapter = createStripeMock();
    const session = startFxTransfer({
      transferId: 'tr_round',
      customerId: 'cus_round',
    });
    await lockRate(adapter, session, {
      fromCurrency: 'usd',
      toCurrency: 'eur',
      rate: 0.777,
      quoteId: 'q_r',
      amountFromCents: 12345,
    });
    // 12345 * 0.777 = 9592.065 → 9592
    expect(session.quote?.amountToCents).toBe(9592);
  });

  it('history captures full lifecycle', async () => {
    const adapter = createStripeMock();
    const session = startFxTransfer({
      transferId: 'tr_hist',
      customerId: 'cus_hist',
    });
    await lockRate(adapter, session, {
      fromCurrency: 'usd',
      toCurrency: 'eur',
      rate: 0.9,
      quoteId: 'q_h',
      amountFromCents: 1000,
    });
    await initiateSettlement(adapter, session, {});
    await completeSettlement(adapter, session, { settlementRef: 'X' });
    expect(session.history).toHaveLength(3);
    expect(session.history.map((s) => s.neutralEvent)).toEqual([
      'fx.rate_locked',
      'fx.settlement_initiated',
      'fx.settlement_completed',
    ]);
  });
});
