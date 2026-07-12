import { describe, expect, it } from 'vitest';
import {
  completeSettlement,
  createStripeMock,
  expireRate,
  initiateSettlement,
  lockRate,
  startFxTransfer,
} from '../../src/index.js';

// Closes the reachable branches in packages/payment/src/semantics/fx-cross-border.ts
// that fx-cross-border.test.ts doesn't cover: `rate <= 0` guard, `amountFromCents
// <= 0` guard, `initiateSettlement` without quote / after expiry, `completeSettlement`
// state-guard + no-quote guard, `expireRate` without quote, and the
// `beneficiaryIban ?? ''` / `beneficiaryBic ?? ''` nullish arms.

describe('fx-cross-border — defensive guards', () => {
  it('T-PAY-C-FX-001 lockRate throws on non-positive rate', async () => {
    const adapter = createStripeMock();
    const session = startFxTransfer({
      transferId: 'tx_1',
      customerId: 'cus_fx_1',
    });
    await expect(
      lockRate(adapter, session, {
        fromCurrency: 'USD',
        toCurrency: 'EUR',
        rate: 0,
        quoteId: 'q_1',
        amountFromCents: 10_000,
      }),
    ).rejects.toThrow(/rate must be positive/);
  });

  it('T-PAY-C-FX-002 lockRate throws on non-positive amount', async () => {
    const adapter = createStripeMock();
    const session = startFxTransfer({
      transferId: 'tx_2',
      customerId: 'cus_fx_2',
    });
    await expect(
      lockRate(adapter, session, {
        fromCurrency: 'USD',
        toCurrency: 'EUR',
        rate: 0.9,
        quoteId: 'q_2',
        amountFromCents: 0,
      }),
    ).rejects.toThrow(/amountFromCents must be positive/);
  });

  it('T-PAY-C-FX-003 initiateSettlement throws without prior rate lock', async () => {
    const adapter = createStripeMock();
    const session = startFxTransfer({
      transferId: 'tx_3',
      customerId: 'cus_fx_3',
    });
    await expect(
      initiateSettlement(adapter, session, {
        beneficiaryIban: 'DE89370400440532013000',
      }),
    ).rejects.toThrow(/no rate locked/);
  });

  it('T-PAY-C-FX-004 initiateSettlement throws after lock expires', async () => {
    const adapter = createStripeMock();
    const session = startFxTransfer({
      transferId: 'tx_4',
      customerId: 'cus_fx_4',
      config: { rateLockDurationMs: 1 },
    });
    await lockRate(adapter, session, {
      fromCurrency: 'USD',
      toCurrency: 'EUR',
      rate: 0.9,
      quoteId: 'q_4',
      amountFromCents: 10_000,
    });
    await new Promise((r) => setTimeout(r, 5));
    await expect(
      initiateSettlement(adapter, session, {}),
    ).rejects.toThrow(/rate lock expired/);
    expect(session.state).toBe('expired');
  });

  it('T-PAY-C-FX-005 completeSettlement throws when session not settlement-initiated', async () => {
    const adapter = createStripeMock();
    const session = startFxTransfer({
      transferId: 'tx_5',
      customerId: 'cus_fx_5',
    });
    await lockRate(adapter, session, {
      fromCurrency: 'USD',
      toCurrency: 'EUR',
      rate: 0.9,
      quoteId: 'q_5',
      amountFromCents: 10_000,
    });
    await expect(
      completeSettlement(adapter, session, { settlementRef: 'ref_x' }),
    ).rejects.toThrow(/must be settlement-initiated/);
  });

  it('T-PAY-C-FX-006 expireRate throws without a locked quote', async () => {
    const adapter = createStripeMock();
    const session = startFxTransfer({
      transferId: 'tx_6',
      customerId: 'cus_fx_6',
    });
    await expect(expireRate(adapter, session)).rejects.toThrow(/no rate locked/);
  });

  it('T-PAY-C-FX-007 initiateSettlement without beneficiary details uses empty defaults', async () => {
    const adapter = createStripeMock();
    const session = startFxTransfer({
      transferId: 'tx_7',
      customerId: 'cus_fx_7',
    });
    await lockRate(adapter, session, {
      fromCurrency: 'USD',
      toCurrency: 'EUR',
      rate: 0.9,
      quoteId: 'q_7',
      amountFromCents: 10_000,
    });
    const step = await initiateSettlement(adapter, session, {});
    expect(step.metadata.beneficiaryIban).toBe('');
    expect(step.metadata.beneficiaryBic).toBe('');
    expect(session.state).toBe('settlement-initiated');
  });

  it('T-PAY-C-FX-008 config undefined defaults to FX_DEFAULTS', () => {
    const session = startFxTransfer({
      transferId: 'tx_8',
      customerId: 'cus_fx_8',
    });
    expect(session.config.settlementRail).toBe('SWIFT');
    expect(session.config.rateLockDurationMs).toBe(60_000);
  });

  it('T-PAY-C-FX-009 expireRate transitions to expired and emits fx.rate_expired', async () => {
    const adapter = createStripeMock();
    const session = startFxTransfer({
      transferId: 'tx_9',
      customerId: 'cus_fx_9',
      config: { settlementRail: 'SEPA' },
    });
    await lockRate(adapter, session, {
      fromCurrency: 'USD',
      toCurrency: 'EUR',
      rate: 0.9,
      quoteId: 'q_9',
      amountFromCents: 5_000,
    });
    const step = await expireRate(adapter, session);
    expect(step.neutralEvent).toBe('fx.rate_expired');
    expect(session.state).toBe('expired');
  });

  it('T-PAY-C-FX-010 completeSettlement clears settledAmountCents from quote', async () => {
    const adapter = createStripeMock();
    const session = startFxTransfer({
      transferId: 'tx_10',
      customerId: 'cus_fx_10',
    });
    await lockRate(adapter, session, {
      fromCurrency: 'USD',
      toCurrency: 'EUR',
      rate: 0.9,
      quoteId: 'q_10',
      amountFromCents: 10_000,
    });
    await initiateSettlement(adapter, session, { beneficiaryBic: 'DEUTDEFF' });
    const step = await completeSettlement(adapter, session, { settlementRef: 'ref_10' });
    expect(step.neutralEvent).toBe('fx.settlement_completed');
    expect(session.settledAmountCents).toBe(9_000);
    expect(session.state).toBe('settlement-completed');
  });
});
