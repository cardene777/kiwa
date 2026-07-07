/**
 * Card end-to-end fidelity spec (card axis: issuance + activation +
 * spend authorization).
 *
 * Issue CAR-978 (v1.41-2) AC — the mock adapter drives a full card
 * issuance ceremony end to end and the fidelity harness diffs the raw
 * {@link TraceEvent} sequence across five axes.
 *
 *  1. issueCard mints an inactive card under an open card session,
 *     enforces (4-digit last4, unique cardId) and rejects duplicate
 *     issuance.
 *  2. activateCard flips status from inactive to active exactly once and
 *     rejects double activation.
 *  3. spendCard approves when the card is active + available balance
 *     covers the request, and declines with a stable reason otherwise.
 *  4. closeCard removes the session; subsequent ops on the same
 *     sessionId fail.
 *  5. Route handler dispatches the shape variations exposed over HTTP
 *     without spinning up a Node server.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { detectRealEnvMissing, makeRealAdapter } from '../src/adapters/real.js';
import { handleCardRequest, validateCardRequest } from '../src/app/card/route.js';
import type { PaymentAdapter } from '../src/adapters/interface.js';

let mock: PaymentAdapter;

beforeEach(() => {
  mock = makeMockAdapter({ latencyMs: 1 });
});

afterEach(async () => {
  await mock.reset();
});

describe('mock adapter — card issuance', () => {
  it('axis 1: issueCard mints an inactive card of the requested type', async () => {
    await mock.startCard({ sessionId: 'c1', accountId: 'acct_a' });
    const result = await mock.issueCard({
      sessionId: 'c1',
      cardId: 'card_1',
      type: 'virtual',
      last4: '4242',
    });
    expect(result.type).toBe('virtual');
    expect(result.last4).toBe('4242');
    expect(result.status).toBe('inactive');
    const trace = mock.traces().find((t) => t.op === 'issueCard');
    expect(trace?.ok).toBe(true);
  });

  it('axis 1: issueCard accepts physical cards too', async () => {
    await mock.startCard({ sessionId: 'c2', accountId: 'acct_a' });
    const result = await mock.issueCard({
      sessionId: 'c2',
      cardId: 'card_phys',
      type: 'physical',
      last4: '1234',
    });
    expect(result.type).toBe('physical');
  });

  it('axis 1: issueCard rejects duplicate cardId in the same session', async () => {
    await mock.startCard({ sessionId: 'c3', accountId: 'acct_a' });
    await mock.issueCard({
      sessionId: 'c3',
      cardId: 'card_dup',
      type: 'virtual',
      last4: '0000',
    });
    await expect(
      mock.issueCard({
        sessionId: 'c3',
        cardId: 'card_dup',
        type: 'virtual',
        last4: '1111',
      }),
    ).rejects.toThrow(/card_already_issued/);
  });

  it('axis 1: issueCard rejects malformed last4', async () => {
    await mock.startCard({ sessionId: 'c4', accountId: 'acct_a' });
    await expect(
      mock.issueCard({
        sessionId: 'c4',
        cardId: 'card_bad',
        type: 'virtual',
        last4: '12a4',
      }),
    ).rejects.toThrow(/last4_must_be_4_digits/);
  });
});

describe('mock adapter — card activation', () => {
  it('axis 2: activateCard flips status from inactive to active', async () => {
    await mock.startCard({ sessionId: 'a1', accountId: 'acct_a' });
    await mock.issueCard({
      sessionId: 'a1',
      cardId: 'card_act',
      type: 'virtual',
      last4: '4242',
    });
    const result = await mock.activateCard({
      sessionId: 'a1',
      cardId: 'card_act',
    });
    expect(result.status).toBe('active');
  });

  it('axis 2: activateCard rejects double activation', async () => {
    await mock.startCard({ sessionId: 'a2', accountId: 'acct_a' });
    await mock.issueCard({
      sessionId: 'a2',
      cardId: 'card_x',
      type: 'virtual',
      last4: '4242',
    });
    await mock.activateCard({ sessionId: 'a2', cardId: 'card_x' });
    await expect(
      mock.activateCard({ sessionId: 'a2', cardId: 'card_x' }),
    ).rejects.toThrow(/card_already_active/);
  });

  it('axis 2: activateCard rejects unknown cardId', async () => {
    await mock.startCard({ sessionId: 'a3', accountId: 'acct_a' });
    await expect(
      mock.activateCard({ sessionId: 'a3', cardId: 'ghost' }),
    ).rejects.toThrow(/card_not_found/);
  });
});

describe('mock adapter — card spend authorization', () => {
  it('axis 3: spendCard approves when active + available balance covers request', async () => {
    await mock.startCard({ sessionId: 's1', accountId: 'acct_a' });
    await mock.issueCard({
      sessionId: 's1',
      cardId: 'card_s',
      type: 'virtual',
      last4: '4242',
    });
    await mock.activateCard({ sessionId: 's1', cardId: 'card_s' });
    const result = await mock.spendCard({
      sessionId: 's1',
      cardId: 'card_s',
      amountCents: 5_000,
      currency: 'usd',
      availableBalanceCents: 10_000,
    });
    expect(result.approved).toBe(true);
    expect(result.reason).toBe('approved');
  });

  it('axis 3: spendCard declines with insufficient_funds when balance short', async () => {
    await mock.startCard({ sessionId: 's2', accountId: 'acct_a' });
    await mock.issueCard({
      sessionId: 's2',
      cardId: 'card_s',
      type: 'virtual',
      last4: '4242',
    });
    await mock.activateCard({ sessionId: 's2', cardId: 'card_s' });
    const result = await mock.spendCard({
      sessionId: 's2',
      cardId: 'card_s',
      amountCents: 20_000,
      currency: 'usd',
      availableBalanceCents: 5_000,
    });
    expect(result.approved).toBe(false);
    expect(result.reason).toBe('insufficient_funds');
  });

  it('axis 3: spendCard declines with card_inactive when card never activated', async () => {
    await mock.startCard({ sessionId: 's3', accountId: 'acct_a' });
    await mock.issueCard({
      sessionId: 's3',
      cardId: 'card_i',
      type: 'virtual',
      last4: '4242',
    });
    const result = await mock.spendCard({
      sessionId: 's3',
      cardId: 'card_i',
      amountCents: 100,
      currency: 'usd',
      availableBalanceCents: 100_000,
    });
    expect(result.approved).toBe(false);
    expect(result.reason).toBe('card_inactive');
  });

  it('axis 3: spendCard rejects non-positive amount', async () => {
    await mock.startCard({ sessionId: 's4', accountId: 'acct_a' });
    await mock.issueCard({
      sessionId: 's4',
      cardId: 'card_z',
      type: 'virtual',
      last4: '4242',
    });
    await mock.activateCard({ sessionId: 's4', cardId: 'card_z' });
    await expect(
      mock.spendCard({
        sessionId: 's4',
        cardId: 'card_z',
        amountCents: 0,
        currency: 'usd',
        availableBalanceCents: 100,
      }),
    ).rejects.toThrow(/amount_must_be_positive/);
  });
});

describe('mock adapter — card session state machine', () => {
  it('axis 4: closeCard removes the session; further ops fail', async () => {
    await mock.startCard({ sessionId: 'sm1', accountId: 'acct_a' });
    await mock.closeCard({ sessionId: 'sm1' });
    await expect(
      mock.issueCard({
        sessionId: 'sm1',
        cardId: 'card',
        type: 'virtual',
        last4: '4242',
      }),
    ).rejects.toThrow(/card_session_not_found/);
  });

  it('axis 4: startCard rejects duplicate session id', async () => {
    await mock.startCard({ sessionId: 'sm2', accountId: 'acct_a' });
    await expect(
      mock.startCard({ sessionId: 'sm2', accountId: 'acct_a' }),
    ).rejects.toThrow(/card_session_exists/);
  });

  it('axis 4: rejects issueCard on unknown session', async () => {
    await expect(
      mock.issueCard({
        sessionId: 'ghost',
        cardId: 'card',
        type: 'virtual',
        last4: '4242',
      }),
    ).rejects.toThrow(/card_session_not_found/);
  });
});

describe('route handler — /card shape validation', () => {
  it('axis 5: validateCardRequest rejects missing cardId', () => {
    const result = validateCardRequest({ sessionId: 'r1', kind: 'issue' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('cardId_required');
  });

  it('axis 5: validateCardRequest rejects unknown kind', () => {
    const result = validateCardRequest({
      sessionId: 'r2',
      cardId: 'x',
      kind: 'melt',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('kind_must_be_issue_activate_or_spend');
  });

  it('axis 5: handleCardRequest dispatches the activate op after issuance', async () => {
    await mock.startCard({ sessionId: 'r3', accountId: 'acct_a' });
    await mock.issueCard({
      sessionId: 'r3',
      cardId: 'card_r',
      type: 'virtual',
      last4: '4242',
    });
    const response = await handleCardRequest(mock, {
      kind: 'activate',
      sessionId: 'r3',
      cardId: 'card_r',
    });
    expect(response.ok).toBe(true);
    expect(response.status).toBe('active');
  });

  it('axis 5: handleCardRequest surfaces errorKind on failure', async () => {
    const response = await handleCardRequest(mock, {
      kind: 'issue',
      sessionId: 'ghost',
      cardId: 'card_x',
      type: 'virtual',
      last4: '4242',
    });
    expect(response.ok).toBe(false);
    expect(response.errorKind).toBe('card_session_not_found');
  });
});

describe('real adapter — env-detect skeleton', () => {
  it('detectRealEnvMissing agrees with treasury env-detect on hermetic systems', () => {
    expect(detectRealEnvMissing()).not.toBeNull();
  });

  it('real adapter refuses issueCard on hermetic systems', async () => {
    const real = makeRealAdapter();
    await expect(
      real.issueCard({
        sessionId: 'r-real',
        cardId: 'card',
        type: 'virtual',
        last4: '4242',
      }),
    ).rejects.toThrow();
    const trace = real.traces().find((t) => t.op === 'issueCard');
    expect(trace?.ok).toBe(false);
  });
});
