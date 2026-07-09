/**
 * `/treasury` HTTP handler — BaaS account open + funding + transfer ops
 * the runtime exposes to the treasury surface. The route is intentionally
 * shape-neutral — the fidelity harness feeds plain objects in and asserts
 * on plain objects out, so the same test can exercise mock and real
 * without spinning up a Stripe Treasury account.
 *
 * The treasury surface pairs the parent v1.41-1 `embedded-finance` axis
 * (openAccount + verifyKyc + verifyKyb + issueCard + closeAccount) with
 * `@kiwa-lab/payment` v0.5 — every op has a neutral event counterpart
 * the fidelity harness can compare across mock vs real.
 */

import type { PaymentAdapter } from '../../adapters/interface.js';

export type TreasuryOpKind = 'open' | 'fund' | 'transfer';

export interface TreasuryRequest {
  kind: TreasuryOpKind;
  sessionId: string;
  // open
  accountId?: string;
  customerId?: string;
  currency?: string;
  // fund
  amountCents?: number;
  // transfer
  fromAccountId?: string;
  toAccountId?: string;
}

export interface TreasuryResponse {
  ok: boolean;
  kind: TreasuryOpKind;
  sessionId: string;
  accountId?: string;
  currency?: string;
  amountCents?: number;
  balanceCents?: number;
  fromAccountId?: string;
  toAccountId?: string;
  succeeded?: boolean;
  errorKind?: string;
}

export function validateTreasuryRequest(
  body: unknown,
): { ok: true; value: TreasuryRequest } | { ok: false; errorKind: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, errorKind: 'body_not_object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b['sessionId'] !== 'string' || !b['sessionId']) {
    return { ok: false, errorKind: 'sessionId_required' };
  }
  const kind = b['kind'];
  if (kind !== 'open' && kind !== 'fund' && kind !== 'transfer') {
    return { ok: false, errorKind: 'kind_must_be_open_fund_or_transfer' };
  }
  const value: TreasuryRequest = { kind, sessionId: b['sessionId'] };
  if (kind === 'open') {
    if (typeof b['accountId'] !== 'string' || !b['accountId']) {
      return { ok: false, errorKind: 'accountId_required' };
    }
    if (typeof b['customerId'] !== 'string' || !b['customerId']) {
      return { ok: false, errorKind: 'customerId_required' };
    }
    if (typeof b['currency'] !== 'string' || !b['currency']) {
      return { ok: false, errorKind: 'currency_required' };
    }
    value.accountId = b['accountId'];
    value.customerId = b['customerId'];
    value.currency = b['currency'];
    return { ok: true, value };
  }
  if (kind === 'fund') {
    if (typeof b['accountId'] !== 'string' || !b['accountId']) {
      return { ok: false, errorKind: 'accountId_required' };
    }
    if (typeof b['amountCents'] !== 'number') {
      return { ok: false, errorKind: 'amountCents_required_number' };
    }
    if (typeof b['currency'] !== 'string' || !b['currency']) {
      return { ok: false, errorKind: 'currency_required' };
    }
    value.accountId = b['accountId'];
    value.amountCents = b['amountCents'];
    value.currency = b['currency'];
    return { ok: true, value };
  }
  // kind === 'transfer'
  if (typeof b['fromAccountId'] !== 'string' || !b['fromAccountId']) {
    return { ok: false, errorKind: 'fromAccountId_required' };
  }
  if (typeof b['toAccountId'] !== 'string' || !b['toAccountId']) {
    return { ok: false, errorKind: 'toAccountId_required' };
  }
  if (typeof b['amountCents'] !== 'number') {
    return { ok: false, errorKind: 'amountCents_required_number' };
  }
  if (typeof b['currency'] !== 'string' || !b['currency']) {
    return { ok: false, errorKind: 'currency_required' };
  }
  value.fromAccountId = b['fromAccountId'];
  value.toAccountId = b['toAccountId'];
  value.amountCents = b['amountCents'];
  value.currency = b['currency'];
  return { ok: true, value };
}

export async function handleTreasuryRequest(
  adapter: PaymentAdapter,
  req: TreasuryRequest,
): Promise<TreasuryResponse> {
  try {
    if (req.kind === 'open') {
      const result = await adapter.openAccount({
        sessionId: req.sessionId,
        accountId: req.accountId!,
        customerId: req.customerId!,
        currency: req.currency!,
      });
      return {
        ok: true,
        kind: 'open',
        sessionId: result.sessionId,
        accountId: result.accountId,
        currency: result.currency,
      };
    }
    if (req.kind === 'fund') {
      const result = await adapter.fundAccount({
        sessionId: req.sessionId,
        accountId: req.accountId!,
        amountCents: req.amountCents!,
        currency: req.currency!,
      });
      return {
        ok: true,
        kind: 'fund',
        sessionId: result.sessionId,
        accountId: result.accountId,
        amountCents: result.amountCents,
        currency: result.currency,
        balanceCents: result.balanceCents,
      };
    }
    const result = await adapter.transferFunds({
      sessionId: req.sessionId,
      fromAccountId: req.fromAccountId!,
      toAccountId: req.toAccountId!,
      amountCents: req.amountCents!,
      currency: req.currency!,
    });
    return {
      ok: true,
      kind: 'transfer',
      sessionId: result.sessionId,
      fromAccountId: result.fromAccountId,
      toAccountId: result.toAccountId,
      amountCents: result.amountCents,
      currency: result.currency,
      succeeded: result.succeeded,
    };
  } catch (err) {
    return {
      ok: false,
      kind: req.kind,
      sessionId: req.sessionId,
      errorKind: coerceErrorKind(err),
    };
  }
}

function coerceErrorKind(err: unknown): string {
  if (err instanceof Error) return err.message;
  return 'unknown_error';
}
