/**
 * `/fx` HTTP handler — FX rate lock + settlement initiation + settlement
 * completion + rate expiration + status snapshot ops the runtime exposes
 * to the FX surface. The route is intentionally shape-neutral — the
 * fidelity harness feeds plain objects in and asserts on plain objects
 * out, so the same test can exercise mock and real without spinning up a
 * Wise / Airwallex / Currencycloud account.
 *
 * The FX surface pairs the parent v1.41-1 `fx-cross-border` axis
 * (lockRate + initiateSettlement + completeSettlement + expireRate) with
 * `@kiwa/payment` v0.5 — every op has a neutral event counterpart
 * the fidelity harness can compare across mock vs real.
 */

import type {
  PaymentAdapter,
  SettlementRail,
} from '../../adapters/interface.js';

export type FxOpKind =
  | 'lock'
  | 'initiate'
  | 'complete'
  | 'expire'
  | 'status';

const VALID_RAILS: readonly SettlementRail[] = [
  'SWIFT',
  'SEPA',
  'ACH',
  'FASTER',
  'RTGS',
];

export interface FxRequest {
  kind: FxOpKind;
  sessionId: string;
  transferId: string;
  // lock
  customerId?: string;
  fromCurrency?: string;
  toCurrency?: string;
  rate?: number;
  quoteId?: string;
  amountFromCents?: number;
  rateLockDurationMs?: number;
  settlementRail?: SettlementRail;
  // initiate
  beneficiaryIban?: string;
  beneficiaryBic?: string;
  // complete
  settlementRef?: string;
}

export interface FxResponse {
  ok: boolean;
  kind: FxOpKind;
  sessionId: string;
  transferId: string;
  quoteId?: string | null;
  fromCurrency?: string;
  toCurrency?: string;
  rate?: number | null;
  amountFromCents?: number | null;
  amountToCents?: number | null;
  lockExpiresAt?: number;
  rail?: string;
  beneficiaryIban?: string;
  beneficiaryBic?: string;
  settlementRef?: string;
  settledAmountCents?: number;
  expiredAt?: number;
  state?: string;
  errorKind?: string;
}

export function validateFxRequest(
  body: unknown,
): { ok: true; value: FxRequest } | { ok: false; errorKind: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, errorKind: 'body_not_object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b['sessionId'] !== 'string' || !b['sessionId']) {
    return { ok: false, errorKind: 'sessionId_required' };
  }
  if (typeof b['transferId'] !== 'string' || !b['transferId']) {
    return { ok: false, errorKind: 'transferId_required' };
  }
  const kind = b['kind'];
  if (
    kind !== 'lock' &&
    kind !== 'initiate' &&
    kind !== 'complete' &&
    kind !== 'expire' &&
    kind !== 'status'
  ) {
    return {
      ok: false,
      errorKind: 'kind_must_be_lock_initiate_complete_expire_or_status',
    };
  }
  const value: FxRequest = {
    kind,
    sessionId: b['sessionId'],
    transferId: b['transferId'],
  };
  if (kind === 'lock') {
    if (typeof b['customerId'] !== 'string' || !b['customerId']) {
      return { ok: false, errorKind: 'customerId_required' };
    }
    if (typeof b['fromCurrency'] !== 'string' || !b['fromCurrency']) {
      return { ok: false, errorKind: 'fromCurrency_required' };
    }
    if (typeof b['toCurrency'] !== 'string' || !b['toCurrency']) {
      return { ok: false, errorKind: 'toCurrency_required' };
    }
    if (typeof b['rate'] !== 'number') {
      return { ok: false, errorKind: 'rate_required_number' };
    }
    if (typeof b['quoteId'] !== 'string' || !b['quoteId']) {
      return { ok: false, errorKind: 'quoteId_required' };
    }
    if (typeof b['amountFromCents'] !== 'number') {
      return { ok: false, errorKind: 'amountFromCents_required_number' };
    }
    value.customerId = b['customerId'];
    value.fromCurrency = b['fromCurrency'];
    value.toCurrency = b['toCurrency'];
    value.rate = b['rate'];
    value.quoteId = b['quoteId'];
    value.amountFromCents = b['amountFromCents'];
    if (typeof b['rateLockDurationMs'] === 'number') {
      value.rateLockDurationMs = b['rateLockDurationMs'];
    }
    if (
      typeof b['settlementRail'] === 'string' &&
      VALID_RAILS.includes(b['settlementRail'] as SettlementRail)
    ) {
      value.settlementRail = b['settlementRail'] as SettlementRail;
    }
    return { ok: true, value };
  }
  if (kind === 'initiate') {
    if (typeof b['beneficiaryIban'] === 'string') {
      value.beneficiaryIban = b['beneficiaryIban'];
    }
    if (typeof b['beneficiaryBic'] === 'string') {
      value.beneficiaryBic = b['beneficiaryBic'];
    }
    return { ok: true, value };
  }
  if (kind === 'complete') {
    if (typeof b['settlementRef'] !== 'string' || !b['settlementRef']) {
      return { ok: false, errorKind: 'settlementRef_required' };
    }
    value.settlementRef = b['settlementRef'];
    return { ok: true, value };
  }
  // kind === 'expire' or 'status' — sessionId + transferId only.
  return { ok: true, value };
}

export async function handleFxRequest(
  adapter: PaymentAdapter,
  req: FxRequest,
): Promise<FxResponse> {
  try {
    if (req.kind === 'lock') {
      const lockInput: Parameters<PaymentAdapter['lockRate']>[0] = {
        sessionId: req.sessionId,
        transferId: req.transferId,
        customerId: req.customerId!,
        fromCurrency: req.fromCurrency!,
        toCurrency: req.toCurrency!,
        rate: req.rate!,
        quoteId: req.quoteId!,
        amountFromCents: req.amountFromCents!,
      };
      if (req.rateLockDurationMs !== undefined) {
        lockInput.rateLockDurationMs = req.rateLockDurationMs;
      }
      if (req.settlementRail !== undefined) {
        lockInput.settlementRail = req.settlementRail;
      }
      const result = await adapter.lockRate(lockInput);
      return {
        ok: true,
        kind: 'lock',
        sessionId: result.sessionId,
        transferId: result.transferId,
        quoteId: result.quoteId,
        fromCurrency: result.fromCurrency,
        toCurrency: result.toCurrency,
        rate: result.rate,
        amountFromCents: result.amountFromCents,
        amountToCents: result.amountToCents,
        lockExpiresAt: result.lockExpiresAt,
        state: result.state,
      };
    }
    if (req.kind === 'initiate') {
      const initiateInput: Parameters<PaymentAdapter['initiateSettlement']>[0] = {
        sessionId: req.sessionId,
        transferId: req.transferId,
      };
      if (req.beneficiaryIban !== undefined) {
        initiateInput.beneficiaryIban = req.beneficiaryIban;
      }
      if (req.beneficiaryBic !== undefined) {
        initiateInput.beneficiaryBic = req.beneficiaryBic;
      }
      const result = await adapter.initiateSettlement(initiateInput);
      const response: FxResponse = {
        ok: true,
        kind: 'initiate',
        sessionId: result.sessionId,
        transferId: result.transferId,
        quoteId: result.quoteId,
        rail: result.rail,
        state: result.state,
      };
      if (result.beneficiaryIban !== undefined) {
        response.beneficiaryIban = result.beneficiaryIban;
      }
      if (result.beneficiaryBic !== undefined) {
        response.beneficiaryBic = result.beneficiaryBic;
      }
      return response;
    }
    if (req.kind === 'complete') {
      const result = await adapter.completeSettlement({
        sessionId: req.sessionId,
        transferId: req.transferId,
        settlementRef: req.settlementRef!,
      });
      return {
        ok: true,
        kind: 'complete',
        sessionId: result.sessionId,
        transferId: result.transferId,
        settlementRef: result.settlementRef,
        settledAmountCents: result.settledAmountCents,
        rail: result.rail,
        state: result.state,
      };
    }
    if (req.kind === 'expire') {
      const result = await adapter.expireRate({
        sessionId: req.sessionId,
        transferId: req.transferId,
      });
      return {
        ok: true,
        kind: 'expire',
        sessionId: result.sessionId,
        transferId: result.transferId,
        quoteId: result.quoteId,
        expiredAt: result.expiredAt,
        state: result.state,
      };
    }
    // kind === 'status'
    const result = await adapter.checkFxStatus({
      sessionId: req.sessionId,
      transferId: req.transferId,
    });
    return {
      ok: true,
      kind: 'status',
      sessionId: result.sessionId,
      transferId: result.transferId,
      quoteId: result.quoteId,
      rate: result.rate,
      amountFromCents: result.amountFromCents,
      amountToCents: result.amountToCents,
      settledAmountCents: result.settledAmountCents,
      rail: result.rail,
      state: result.state,
    };
  } catch (err) {
    return {
      ok: false,
      kind: req.kind,
      sessionId: req.sessionId,
      transferId: req.transferId,
      errorKind: coerceErrorKind(err),
    };
  }
}

function coerceErrorKind(err: unknown): string {
  if (err instanceof Error) return err.message;
  return 'unknown_error';
}
