/**
 * `/card` HTTP handler — card issue + activate + spend ops the runtime
 * exposes to the card surface. The route is intentionally shape-neutral
 * — the fidelity harness feeds plain objects in and asserts on plain
 * objects out, so the same test can exercise mock and real without
 * spinning up a Stripe Issuing endpoint.
 *
 * The card surface pairs the parent v1.41-1 `embedded-finance` axis
 * (issueCard) with the runtime activate + spend authorization that a
 * real card issuance platform layers on top — every op has a neutral
 * event counterpart the fidelity harness can compare across mock vs
 * real.
 */

import type { PaymentAdapter } from '../../adapters/interface.js';

export type CardOpKind = 'issue' | 'activate' | 'spend';

export interface CardRequest {
  kind: CardOpKind;
  sessionId: string;
  cardId: string;
  // issue
  type?: 'virtual' | 'physical';
  last4?: string;
  // spend
  amountCents?: number;
  currency?: string;
  availableBalanceCents?: number;
}

export interface CardResponse {
  ok: boolean;
  kind: CardOpKind;
  sessionId: string;
  cardId: string;
  type?: 'virtual' | 'physical';
  last4?: string;
  status?: 'inactive' | 'active';
  amountCents?: number;
  currency?: string;
  approved?: boolean;
  reason?: string;
  errorKind?: string;
}

export function validateCardRequest(
  body: unknown,
): { ok: true; value: CardRequest } | { ok: false; errorKind: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, errorKind: 'body_not_object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b['sessionId'] !== 'string' || !b['sessionId']) {
    return { ok: false, errorKind: 'sessionId_required' };
  }
  if (typeof b['cardId'] !== 'string' || !b['cardId']) {
    return { ok: false, errorKind: 'cardId_required' };
  }
  const kind = b['kind'];
  if (kind !== 'issue' && kind !== 'activate' && kind !== 'spend') {
    return { ok: false, errorKind: 'kind_must_be_issue_activate_or_spend' };
  }
  const value: CardRequest = {
    kind,
    sessionId: b['sessionId'],
    cardId: b['cardId'],
  };
  if (kind === 'issue') {
    if (b['type'] !== 'virtual' && b['type'] !== 'physical') {
      return { ok: false, errorKind: 'type_must_be_virtual_or_physical' };
    }
    if (typeof b['last4'] !== 'string' || !b['last4']) {
      return { ok: false, errorKind: 'last4_required' };
    }
    value.type = b['type'];
    value.last4 = b['last4'];
    return { ok: true, value };
  }
  if (kind === 'activate') {
    return { ok: true, value };
  }
  // kind === 'spend'
  if (typeof b['amountCents'] !== 'number') {
    return { ok: false, errorKind: 'amountCents_required_number' };
  }
  if (typeof b['currency'] !== 'string' || !b['currency']) {
    return { ok: false, errorKind: 'currency_required' };
  }
  if (typeof b['availableBalanceCents'] !== 'number') {
    return { ok: false, errorKind: 'availableBalanceCents_required_number' };
  }
  value.amountCents = b['amountCents'];
  value.currency = b['currency'];
  value.availableBalanceCents = b['availableBalanceCents'];
  return { ok: true, value };
}

export async function handleCardRequest(
  adapter: PaymentAdapter,
  req: CardRequest,
): Promise<CardResponse> {
  try {
    if (req.kind === 'issue') {
      const result = await adapter.issueCard({
        sessionId: req.sessionId,
        cardId: req.cardId,
        type: req.type!,
        last4: req.last4!,
      });
      return {
        ok: true,
        kind: 'issue',
        sessionId: result.sessionId,
        cardId: result.cardId,
        type: result.type,
        last4: result.last4,
        status: result.status,
      };
    }
    if (req.kind === 'activate') {
      const result = await adapter.activateCard({
        sessionId: req.sessionId,
        cardId: req.cardId,
      });
      return {
        ok: true,
        kind: 'activate',
        sessionId: result.sessionId,
        cardId: result.cardId,
        status: result.status,
      };
    }
    const result = await adapter.spendCard({
      sessionId: req.sessionId,
      cardId: req.cardId,
      amountCents: req.amountCents!,
      currency: req.currency!,
      availableBalanceCents: req.availableBalanceCents!,
    });
    return {
      ok: true,
      kind: 'spend',
      sessionId: result.sessionId,
      cardId: result.cardId,
      amountCents: result.amountCents,
      currency: result.currency,
      approved: result.approved,
      reason: result.reason,
    };
  } catch (err) {
    return {
      ok: false,
      kind: req.kind,
      sessionId: req.sessionId,
      cardId: req.cardId,
      errorKind: coerceErrorKind(err),
    };
  }
}

function coerceErrorKind(err: unknown): string {
  if (err instanceof Error) return err.message;
  return 'unknown_error';
}
