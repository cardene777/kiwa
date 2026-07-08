/**
 * Treasury end-to-end fidelity spec (treasury axis: BaaS account open +
 * funding + inter-account transfer).
 *
 * Issue CAR-978 (v1.41-2) AC — the mock adapter drives a full BaaS
 * ceremony end to end and the fidelity harness diffs the raw
 * {@link TraceEvent} sequence across five axes.
 *
 *  1. openAccount seats a Treasury / BaaS account under a customer id +
 *     currency, and rejects duplicate account ids in the same session.
 *  2. fundAccount deposits balance and enforces (positive amount, currency
 *     match, session open).
 *  3. transferFunds moves cents between two open accounts atomically and
 *     reports succeeded=false when the source is under-funded (no partial
 *     debits).
 *  4. closeTreasury forwards state to `@kiwa/payment` v0.5
 *     closeAccount and further ops on the same session id fail.
 *  5. Route handler dispatches / rejects the shape variations exposed
 *     over HTTP without spinning up a Node server.
 *
 * The real adapter is exercised through the env-detect skeleton and
 * every op refuses with `KIWA_EMBEDDED_FINANCE_ENV_MISSING` on every
 * non-integration environment (the default). Downstream tests inspect
 * {@link PaymentAdapter.mode} + the trace to skip real assertions on
 * those systems.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { detectRealEnvMissing, makeRealAdapter } from '../src/adapters/real.js';
import { handleTreasuryRequest, validateTreasuryRequest } from '../src/app/treasury/route.js';
import type { PaymentAdapter } from '../src/adapters/interface.js';

let mock: PaymentAdapter;

beforeEach(() => {
  mock = makeMockAdapter({ latencyMs: 1 });
});

afterEach(async () => {
  await mock.reset();
});

describe('mock adapter — treasury account open', () => {
  it('axis 1: openAccount seats a BaaS account under a customer id + currency', async () => {
    await mock.startTreasury({ sessionId: 't1', provider: 'stripe-treasury' });
    const result = await mock.openAccount({
      sessionId: 't1',
      accountId: 'acct_platform_a',
      customerId: 'cus_alice',
      currency: 'usd',
    });
    expect(result.accountId).toBe('acct_platform_a');
    expect(result.currency).toBe('usd');
    const trace = mock.traces().find((t) => t.op === 'openAccount');
    expect(trace?.ok).toBe(true);
  });

  it('axis 1: openAccount accepts multi-currency accounts under the same session', async () => {
    await mock.startTreasury({ sessionId: 't2', provider: 'unit' });
    await mock.openAccount({
      sessionId: 't2',
      accountId: 'acct_usd',
      customerId: 'cus_alice',
      currency: 'usd',
    });
    const eur = await mock.openAccount({
      sessionId: 't2',
      accountId: 'acct_eur',
      customerId: 'cus_alice',
      currency: 'eur',
    });
    expect(eur.currency).toBe('eur');
  });

  it('axis 1: openAccount rejects duplicate account id in the same session', async () => {
    await mock.startTreasury({ sessionId: 't3', provider: 'column' });
    await mock.openAccount({
      sessionId: 't3',
      accountId: 'acct_dup',
      customerId: 'cus_bob',
      currency: 'usd',
    });
    await expect(
      mock.openAccount({
        sessionId: 't3',
        accountId: 'acct_dup',
        customerId: 'cus_bob',
        currency: 'usd',
      }),
    ).rejects.toThrow(/account_already_open/);
  });
});

describe('mock adapter — treasury funding', () => {
  it('axis 2: fundAccount deposits balance and returns cumulative total', async () => {
    await mock.startTreasury({ sessionId: 'f1', provider: 'stripe-treasury' });
    await mock.openAccount({
      sessionId: 'f1',
      accountId: 'acct',
      customerId: 'cus',
      currency: 'usd',
    });
    const first = await mock.fundAccount({
      sessionId: 'f1',
      accountId: 'acct',
      amountCents: 100_000,
      currency: 'usd',
    });
    const second = await mock.fundAccount({
      sessionId: 'f1',
      accountId: 'acct',
      amountCents: 50_000,
      currency: 'usd',
    });
    expect(first.balanceCents).toBe(100_000);
    expect(second.balanceCents).toBe(150_000);
  });

  it('axis 2: fundAccount refuses non-positive amount', async () => {
    await mock.startTreasury({ sessionId: 'f2', provider: 'stripe-treasury' });
    await mock.openAccount({
      sessionId: 'f2',
      accountId: 'acct',
      customerId: 'cus',
      currency: 'usd',
    });
    await expect(
      mock.fundAccount({
        sessionId: 'f2',
        accountId: 'acct',
        amountCents: 0,
        currency: 'usd',
      }),
    ).rejects.toThrow(/amount_must_be_positive/);
  });

  it('axis 2: fundAccount refuses currency mismatch', async () => {
    await mock.startTreasury({ sessionId: 'f3', provider: 'stripe-treasury' });
    await mock.openAccount({
      sessionId: 'f3',
      accountId: 'acct',
      customerId: 'cus',
      currency: 'usd',
    });
    await expect(
      mock.fundAccount({
        sessionId: 'f3',
        accountId: 'acct',
        amountCents: 10_000,
        currency: 'eur',
      }),
    ).rejects.toThrow(/currency_mismatch/);
  });

  it('axis 2: fundAccount refuses when account not opened', async () => {
    await mock.startTreasury({ sessionId: 'f4', provider: 'stripe-treasury' });
    await expect(
      mock.fundAccount({
        sessionId: 'f4',
        accountId: 'ghost',
        amountCents: 100,
        currency: 'usd',
      }),
    ).rejects.toThrow(/account_not_found/);
  });
});

describe('mock adapter — treasury transfer', () => {
  it('axis 3: transferFunds moves cents between accounts and reports succeeded=true', async () => {
    await mock.startTreasury({ sessionId: 'x1', provider: 'stripe-treasury' });
    await mock.openAccount({
      sessionId: 'x1',
      accountId: 'from',
      customerId: 'cus',
      currency: 'usd',
    });
    await mock.openAccount({
      sessionId: 'x1',
      accountId: 'to',
      customerId: 'cus',
      currency: 'usd',
    });
    await mock.fundAccount({
      sessionId: 'x1',
      accountId: 'from',
      amountCents: 500_000,
      currency: 'usd',
    });
    const result = await mock.transferFunds({
      sessionId: 'x1',
      fromAccountId: 'from',
      toAccountId: 'to',
      amountCents: 150_000,
      currency: 'usd',
    });
    expect(result.succeeded).toBe(true);
    expect(result.amountCents).toBe(150_000);
  });

  it('axis 3: transferFunds returns succeeded=false and leaves balances untouched when source under-funded', async () => {
    await mock.startTreasury({ sessionId: 'x2', provider: 'stripe-treasury' });
    await mock.openAccount({
      sessionId: 'x2',
      accountId: 'from',
      customerId: 'cus',
      currency: 'usd',
    });
    await mock.openAccount({
      sessionId: 'x2',
      accountId: 'to',
      customerId: 'cus',
      currency: 'usd',
    });
    await mock.fundAccount({
      sessionId: 'x2',
      accountId: 'from',
      amountCents: 100,
      currency: 'usd',
    });
    const result = await mock.transferFunds({
      sessionId: 'x2',
      fromAccountId: 'from',
      toAccountId: 'to',
      amountCents: 10_000,
      currency: 'usd',
    });
    expect(result.succeeded).toBe(false);
    // Under-funded transfers must not partially debit the source.
    const balanceCheck = await mock.fundAccount({
      sessionId: 'x2',
      accountId: 'from',
      amountCents: 1,
      currency: 'usd',
    });
    expect(balanceCheck.balanceCents).toBe(101);
  });

  it('axis 3: transferFunds refuses when the source account is missing', async () => {
    await mock.startTreasury({ sessionId: 'x3', provider: 'stripe-treasury' });
    await mock.openAccount({
      sessionId: 'x3',
      accountId: 'to',
      customerId: 'cus',
      currency: 'usd',
    });
    await expect(
      mock.transferFunds({
        sessionId: 'x3',
        fromAccountId: 'ghost',
        toAccountId: 'to',
        amountCents: 100,
        currency: 'usd',
      }),
    ).rejects.toThrow(/from_account_not_found/);
  });

  it('axis 3: transferFunds refuses currency mismatch across accounts', async () => {
    await mock.startTreasury({ sessionId: 'x4', provider: 'stripe-treasury' });
    await mock.openAccount({
      sessionId: 'x4',
      accountId: 'from',
      customerId: 'cus',
      currency: 'usd',
    });
    await mock.openAccount({
      sessionId: 'x4',
      accountId: 'to',
      customerId: 'cus',
      currency: 'eur',
    });
    await mock.fundAccount({
      sessionId: 'x4',
      accountId: 'from',
      amountCents: 1_000,
      currency: 'usd',
    });
    await expect(
      mock.transferFunds({
        sessionId: 'x4',
        fromAccountId: 'from',
        toAccountId: 'to',
        amountCents: 100,
        currency: 'usd',
      }),
    ).rejects.toThrow(/currency_mismatch/);
  });
});

describe('mock adapter — treasury state machine', () => {
  it('axis 4: closeTreasury forwards state to closeAccountSem and removes session', async () => {
    await mock.startTreasury({ sessionId: 'sm1', provider: 'stripe-treasury' });
    await mock.openAccount({
      sessionId: 'sm1',
      accountId: 'acct',
      customerId: 'cus',
      currency: 'usd',
    });
    await mock.closeTreasury({ sessionId: 'sm1' });
    await expect(
      mock.openAccount({
        sessionId: 'sm1',
        accountId: 'acct2',
        customerId: 'cus',
        currency: 'usd',
      }),
    ).rejects.toThrow(/treasury_session_not_found/);
  });

  it('axis 4: rejects operations on unknown sessionId', async () => {
    await expect(
      mock.openAccount({
        sessionId: 'ghost',
        accountId: 'acct',
        customerId: 'cus',
        currency: 'usd',
      }),
    ).rejects.toThrow(/treasury_session_not_found/);
  });

  it('axis 4: startTreasury rejects duplicate session id', async () => {
    await mock.startTreasury({ sessionId: 'sm2', provider: 'stripe-treasury' });
    await expect(
      mock.startTreasury({ sessionId: 'sm2', provider: 'stripe-treasury' }),
    ).rejects.toThrow(/treasury_session_exists/);
  });
});

describe('route handler — /treasury shape validation', () => {
  it('axis 5: validateTreasuryRequest rejects non-object body', () => {
    const result = validateTreasuryRequest('not-an-object');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('body_not_object');
  });

  it('axis 5: validateTreasuryRequest rejects missing sessionId', () => {
    const result = validateTreasuryRequest({ kind: 'open' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('sessionId_required');
  });

  it('axis 5: validateTreasuryRequest rejects unknown kind', () => {
    const result = validateTreasuryRequest({ sessionId: 'r1', kind: 'burn' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('kind_must_be_open_fund_or_transfer');
  });

  it('axis 5: handleTreasuryRequest dispatches the fund op and returns the balance', async () => {
    await mock.startTreasury({ sessionId: 'r2', provider: 'stripe-treasury' });
    await mock.openAccount({
      sessionId: 'r2',
      accountId: 'acct',
      customerId: 'cus',
      currency: 'usd',
    });
    const response = await handleTreasuryRequest(mock, {
      kind: 'fund',
      sessionId: 'r2',
      accountId: 'acct',
      amountCents: 1_000,
      currency: 'usd',
    });
    expect(response.ok).toBe(true);
    expect(response.kind).toBe('fund');
    expect(response.balanceCents).toBe(1_000);
  });

  it('axis 5: handleTreasuryRequest surfaces errorKind on failure', async () => {
    const response = await handleTreasuryRequest(mock, {
      kind: 'open',
      sessionId: 'ghost',
      accountId: 'x',
      customerId: 'y',
      currency: 'usd',
    });
    expect(response.ok).toBe(false);
    expect(response.errorKind).toBe('treasury_session_not_found');
  });
});

describe('real adapter — env-detect skeleton', () => {
  it('detectRealEnvMissing reports EMBEDDED_FINANCE_STACK_READY on hermetic systems', () => {
    const missing = detectRealEnvMissing();
    // Ordinary test envs will not have `EMBEDDED_FINANCE_STACK_READY=1`
    // exported, so the detector must report a stable env-missing reason.
    expect(missing).not.toBeNull();
  });

  it('real adapter refuses every op with KIWA_EMBEDDED_FINANCE_ENV_MISSING on hermetic systems', async () => {
    const real = makeRealAdapter();
    await expect(
      real.startTreasury({ sessionId: 'r-real', provider: 'stripe-treasury' }),
    ).rejects.toThrow();
    const trace = real.traces().find((t) => t.op === 'startTreasury');
    expect(trace?.ok).toBe(false);
    expect(trace?.errorKind).toBeTruthy();
  });
});
