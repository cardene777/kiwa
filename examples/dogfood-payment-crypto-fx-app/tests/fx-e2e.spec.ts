/**
 * FX end-to-end fidelity spec (fx-cross-border axis: rate lock +
 * settlement initiate + settlement complete + rate expire + status
 * snapshot).
 *
 * Issue CAR-980 (v1.41-4) AC — the mock adapter drives a full FX
 * cross-border ceremony end to end and the fidelity harness diffs the
 * raw {@link TraceEvent} sequence across six axes.
 *
 *  1. lockRate produces an FX quote (amountFromCents * rate rounded to
 *     amountToCents) and advances the transfer state to `rate-locked`.
 *  2. initiateSettlement advances state to `settlement-initiated` and
 *     records the beneficiary IBAN / BIC pair.
 *  3. completeSettlement advances state to `settlement-completed` and
 *     records the settlement reference + settled amount.
 *  4. expireRate advances state to `expired` and marks the quote unusable.
 *  5. checkFxStatus returns the current snapshot after every op.
 *  6. Route handler dispatches / rejects the shape variations exposed
 *     over HTTP without spinning up a Node server.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import { handleFxRequest, validateFxRequest } from '../src/app/fx/route.js';
import type { PaymentAdapter } from '../src/adapters/interface.js';

let mock: PaymentAdapter;

beforeEach(() => {
  mock = makeMockAdapter({ latencyMs: 1 });
});

afterEach(async () => {
  await mock.reset();
});

describe('mock adapter — lockRate', () => {
  it('axis 1: lockRate produces a quote with amountToCents = round(amountFromCents * rate)', async () => {
    await mock.startFx({ sessionId: 'f1', provider: 'wise' });
    const result = await mock.lockRate({
      sessionId: 'f1',
      transferId: 'tr_alice_1',
      customerId: 'cus_alice',
      fromCurrency: 'USD',
      toCurrency: 'EUR',
      rate: 0.92,
      quoteId: 'q1',
      amountFromCents: 100_00,
    });
    expect(result.state).toBe('rate-locked');
    expect(result.quoteId).toBe('q1');
    expect(result.fromCurrency).toBe('USD');
    expect(result.toCurrency).toBe('EUR');
    expect(result.amountFromCents).toBe(100_00);
    // Math.round(10000 * 0.92) = 9200.
    expect(result.amountToCents).toBe(9_200);
  });

  it('axis 1: lockRate accepts a custom settlement rail', async () => {
    await mock.startFx({ sessionId: 'f2', provider: 'airwallex' });
    const result = await mock.lockRate({
      sessionId: 'f2',
      transferId: 'tr_sepa',
      customerId: 'cus_alice',
      fromCurrency: 'USD',
      toCurrency: 'EUR',
      rate: 0.90,
      quoteId: 'q2',
      amountFromCents: 50_00,
      settlementRail: 'SEPA',
    });
    expect(result.amountToCents).toBe(4_500);
    const status = await mock.checkFxStatus({
      sessionId: 'f2',
      transferId: 'tr_sepa',
    });
    expect(status.rail).toBe('SEPA');
  });

  it('axis 1: lockRate rejects non-positive rate (semantics guard)', async () => {
    await mock.startFx({ sessionId: 'f3', provider: 'wise' });
    await expect(
      mock.lockRate({
        sessionId: 'f3',
        transferId: 'tr_bad',
        customerId: 'cus_alice',
        fromCurrency: 'USD',
        toCurrency: 'EUR',
        rate: 0,
        quoteId: 'q3',
        amountFromCents: 100_00,
      }),
    ).rejects.toThrow();
  });

  it('axis 1: lockRate rejects non-positive amountFromCents (semantics guard)', async () => {
    await mock.startFx({ sessionId: 'f4', provider: 'wise' });
    await expect(
      mock.lockRate({
        sessionId: 'f4',
        transferId: 'tr_bad',
        customerId: 'cus_alice',
        fromCurrency: 'USD',
        toCurrency: 'EUR',
        rate: 0.92,
        quoteId: 'q4',
        amountFromCents: -1,
      }),
    ).rejects.toThrow();
  });

  it('axis 1: lockRate without prior startFx reports fx_session_not_found', async () => {
    await expect(
      mock.lockRate({
        sessionId: 'never-started',
        transferId: 'tr_orphan',
        customerId: 'cus_alice',
        fromCurrency: 'USD',
        toCurrency: 'EUR',
        rate: 0.92,
        quoteId: 'q5',
        amountFromCents: 100_00,
      }),
    ).rejects.toThrow('fx_session_not_found');
  });
});

describe('mock adapter — initiateSettlement + completeSettlement', () => {
  it('axis 2: initiateSettlement advances state to settlement-initiated', async () => {
    await mock.startFx({ sessionId: 'f5', provider: 'wise' });
    await mock.lockRate({
      sessionId: 'f5',
      transferId: 'tr_init',
      customerId: 'cus_alice',
      fromCurrency: 'USD',
      toCurrency: 'EUR',
      rate: 0.92,
      quoteId: 'q_init',
      amountFromCents: 100_00,
    });
    const result = await mock.initiateSettlement({
      sessionId: 'f5',
      transferId: 'tr_init',
      beneficiaryIban: 'DE89370400440532013000',
      beneficiaryBic: 'COBADEFFXXX',
    });
    expect(result.state).toBe('settlement-initiated');
    expect(result.beneficiaryIban).toBe('DE89370400440532013000');
    expect(result.beneficiaryBic).toBe('COBADEFFXXX');
  });

  it('axis 2: initiateSettlement without a locked rate fails', async () => {
    await mock.startFx({ sessionId: 'f6', provider: 'wise' });
    await expect(
      mock.initiateSettlement({
        sessionId: 'f6',
        transferId: 'tr_norate',
      }),
    ).rejects.toThrow('fx_transfer_not_found');
  });

  it('axis 3: completeSettlement records settlement ref + settled amount', async () => {
    await mock.startFx({ sessionId: 'f7', provider: 'wise' });
    await mock.lockRate({
      sessionId: 'f7',
      transferId: 'tr_comp',
      customerId: 'cus_alice',
      fromCurrency: 'USD',
      toCurrency: 'EUR',
      rate: 0.92,
      quoteId: 'q_comp',
      amountFromCents: 100_00,
    });
    await mock.initiateSettlement({
      sessionId: 'f7',
      transferId: 'tr_comp',
    });
    const result = await mock.completeSettlement({
      sessionId: 'f7',
      transferId: 'tr_comp',
      settlementRef: 'SWIFT-REF-42',
    });
    expect(result.state).toBe('settlement-completed');
    expect(result.settlementRef).toBe('SWIFT-REF-42');
    expect(result.settledAmountCents).toBe(9_200);
  });

  it('axis 3: completeSettlement rejects when settlement not initiated', async () => {
    await mock.startFx({ sessionId: 'f8', provider: 'wise' });
    await mock.lockRate({
      sessionId: 'f8',
      transferId: 'tr_early',
      customerId: 'cus_alice',
      fromCurrency: 'USD',
      toCurrency: 'EUR',
      rate: 0.92,
      quoteId: 'q_early',
      amountFromCents: 100_00,
    });
    await expect(
      mock.completeSettlement({
        sessionId: 'f8',
        transferId: 'tr_early',
        settlementRef: 'REF',
      }),
    ).rejects.toThrow();
  });

  it('axis 3: completeSettlement rejects empty settlementRef', async () => {
    await mock.startFx({ sessionId: 'f9', provider: 'wise' });
    await mock.lockRate({
      sessionId: 'f9',
      transferId: 'tr_emptyref',
      customerId: 'cus_alice',
      fromCurrency: 'USD',
      toCurrency: 'EUR',
      rate: 0.92,
      quoteId: 'q_emptyref',
      amountFromCents: 100_00,
    });
    await mock.initiateSettlement({
      sessionId: 'f9',
      transferId: 'tr_emptyref',
    });
    await expect(
      mock.completeSettlement({
        sessionId: 'f9',
        transferId: 'tr_emptyref',
        settlementRef: '',
      }),
    ).rejects.toThrow('settlementRef_required');
  });
});

describe('mock adapter — expireRate + checkFxStatus', () => {
  it('axis 4: expireRate advances state to expired', async () => {
    await mock.startFx({ sessionId: 'f10', provider: 'wise' });
    await mock.lockRate({
      sessionId: 'f10',
      transferId: 'tr_exp',
      customerId: 'cus_alice',
      fromCurrency: 'USD',
      toCurrency: 'EUR',
      rate: 0.92,
      quoteId: 'q_exp',
      amountFromCents: 100_00,
    });
    const result = await mock.expireRate({
      sessionId: 'f10',
      transferId: 'tr_exp',
    });
    expect(result.state).toBe('expired');
    expect(result.quoteId).toBe('q_exp');
    expect(result.expiredAt).toBeGreaterThan(0);
  });

  it('axis 4: expireRate rejects when no quote locked', async () => {
    await mock.startFx({ sessionId: 'f11', provider: 'wise' });
    await expect(
      mock.expireRate({ sessionId: 'f11', transferId: 'tr_norate' }),
    ).rejects.toThrow('fx_transfer_not_found');
  });

  it('axis 5: checkFxStatus on missing transfer reports fx_transfer_not_found', async () => {
    await mock.startFx({ sessionId: 'f12', provider: 'wise' });
    await expect(
      mock.checkFxStatus({
        sessionId: 'f12',
        transferId: 'tr_missing',
      }),
    ).rejects.toThrow('fx_transfer_not_found');
  });

  it('axis 5: checkFxStatus reflects the most recent state after each op', async () => {
    await mock.startFx({ sessionId: 'f13', provider: 'wise' });
    await mock.lockRate({
      sessionId: 'f13',
      transferId: 'tr_stat2',
      customerId: 'cus_alice',
      fromCurrency: 'USD',
      toCurrency: 'EUR',
      rate: 0.92,
      quoteId: 'q_stat',
      amountFromCents: 100_00,
    });
    let status = await mock.checkFxStatus({
      sessionId: 'f13',
      transferId: 'tr_stat2',
    });
    expect(status.state).toBe('rate-locked');
    expect(status.rate).toBe(0.92);
    expect(status.amountToCents).toBe(9_200);
    await mock.initiateSettlement({
      sessionId: 'f13',
      transferId: 'tr_stat2',
    });
    status = await mock.checkFxStatus({
      sessionId: 'f13',
      transferId: 'tr_stat2',
    });
    expect(status.state).toBe('settlement-initiated');
    await mock.completeSettlement({
      sessionId: 'f13',
      transferId: 'tr_stat2',
      settlementRef: 'REF',
    });
    status = await mock.checkFxStatus({
      sessionId: 'f13',
      transferId: 'tr_stat2',
    });
    expect(status.state).toBe('settlement-completed');
    expect(status.settledAmountCents).toBe(9_200);
  });

  it('axis 5: closeFx detaches the session and further ops fail', async () => {
    await mock.startFx({ sessionId: 'f14', provider: 'wise' });
    await mock.lockRate({
      sessionId: 'f14',
      transferId: 'tr_close',
      customerId: 'cus_alice',
      fromCurrency: 'USD',
      toCurrency: 'EUR',
      rate: 0.92,
      quoteId: 'q_close',
      amountFromCents: 100_00,
    });
    await mock.closeFx({ sessionId: 'f14' });
    await expect(
      mock.lockRate({
        sessionId: 'f14',
        transferId: 'tr_close_dup',
        customerId: 'cus_alice',
        fromCurrency: 'USD',
        toCurrency: 'EUR',
        rate: 0.92,
        quoteId: 'q_close_dup',
        amountFromCents: 100_00,
      }),
    ).rejects.toThrow('fx_session_not_found');
  });
});

describe('route validation — HTTP body shape', () => {
  it('axis 6: validateFxRequest accepts lock shape', () => {
    const parsed = validateFxRequest({
      kind: 'lock',
      sessionId: 'f15',
      transferId: 'tr_ok',
      customerId: 'cus_alice',
      fromCurrency: 'USD',
      toCurrency: 'EUR',
      rate: 0.92,
      quoteId: 'q_ok',
      amountFromCents: 100_00,
    });
    expect(parsed.ok).toBe(true);
  });

  it('axis 6: validateFxRequest accepts complete shape', () => {
    const parsed = validateFxRequest({
      kind: 'complete',
      sessionId: 'f15',
      transferId: 'tr_ok',
      settlementRef: 'REF',
    });
    expect(parsed.ok).toBe(true);
  });

  it('axis 6: validateFxRequest rejects lock missing rate', () => {
    const parsed = validateFxRequest({
      kind: 'lock',
      sessionId: 'f15',
      transferId: 'tr_ok',
      customerId: 'cus_alice',
      fromCurrency: 'USD',
      toCurrency: 'EUR',
      quoteId: 'q_ok',
      amountFromCents: 100_00,
    });
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.errorKind).toBe('rate_required_number');
  });

  it('axis 6: validateFxRequest rejects unknown kind', () => {
    const parsed = validateFxRequest({
      kind: 'purge',
      sessionId: 'f15',
      transferId: 'tr_ok',
    });
    expect(parsed.ok).toBe(false);
  });

  it('axis 6: handleFxRequest routes lock + initiate + complete end to end', async () => {
    await mock.startFx({ sessionId: 'f16', provider: 'wise' });
    const lockRes = await handleFxRequest(mock, {
      kind: 'lock',
      sessionId: 'f16',
      transferId: 'tr_route',
      customerId: 'cus_alice',
      fromCurrency: 'USD',
      toCurrency: 'EUR',
      rate: 0.92,
      quoteId: 'q_route',
      amountFromCents: 100_00,
    });
    expect(lockRes.ok).toBe(true);
    const initRes = await handleFxRequest(mock, {
      kind: 'initiate',
      sessionId: 'f16',
      transferId: 'tr_route',
    });
    expect(initRes.ok).toBe(true);
    const compRes = await handleFxRequest(mock, {
      kind: 'complete',
      sessionId: 'f16',
      transferId: 'tr_route',
      settlementRef: 'ROUTE-REF',
    });
    expect(compRes.ok).toBe(true);
    expect(compRes.state).toBe('settlement-completed');
  });

  it('axis 6: handleFxRequest reports errorKind when adapter refuses', async () => {
    const res = await handleFxRequest(mock, {
      kind: 'lock',
      sessionId: 'never-started',
      transferId: 'tr_route',
      customerId: 'cus_alice',
      fromCurrency: 'USD',
      toCurrency: 'EUR',
      rate: 0.92,
      quoteId: 'q_route',
      amountFromCents: 100_00,
    });
    expect(res.ok).toBe(false);
    expect(res.errorKind).toBe('fx_session_not_found');
  });
});

describe('real adapter — env detection for FX ops', () => {
  it('real adapter refuses lockRate on non-integration environments', async () => {
    const real = makeRealAdapter();
    await expect(
      real.lockRate({
        sessionId: 'r2',
        transferId: 'tr_real',
        customerId: 'cus_alice',
        fromCurrency: 'USD',
        toCurrency: 'EUR',
        rate: 0.92,
        quoteId: 'q_real',
        amountFromCents: 100_00,
      }),
    ).rejects.toThrow('KIWA_CRYPTO_FX_ENV_MISSING');
    const trace = real.traces().find((t) => t.op === 'lockRate');
    expect(trace?.ok).toBe(false);
  });
});
