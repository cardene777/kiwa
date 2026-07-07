/**
 * `/collection` HTTP handler — BNPL late fee + installment mark paid +
 * settle terminal + status snapshot ops the runtime exposes to the
 * collection surface. The route is intentionally shape-neutral — the
 * fidelity harness feeds plain objects in and asserts on plain objects
 * out, so the same test can exercise mock and real without spinning up a
 * Klarna / Affirm / Afterpay collection endpoint.
 *
 * The collection surface pairs the parent v1.41-1 `bnpl` axis
 * (chargeLateFee + markInstallmentPaid) with a runtime settle +
 * status-check that a real BNPL platform layers on top — every op has a
 * neutral event counterpart the fidelity harness can compare across mock
 * vs real.
 */

import type { PaymentAdapter } from '../../adapters/interface.js';

export type CollectionOpKind = 'lateFee' | 'markPaid' | 'settle' | 'status';

export interface CollectionRequest {
  kind: CollectionOpKind;
  sessionId: string;
  planId: string;
  // lateFee
  installmentIndex?: number;
}

export interface CollectionResponse {
  ok: boolean;
  kind: CollectionOpKind;
  sessionId: string;
  planId: string;
  installmentIndex?: number;
  lateFeeCents?: number;
  totalLateFeesCents?: number;
  installmentsPaid?: number;
  installmentsScheduled?: number;
  installmentsRemaining?: number;
  state?: string;
  errorKind?: string;
}

export function validateCollectionRequest(
  body: unknown,
): { ok: true; value: CollectionRequest } | { ok: false; errorKind: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, errorKind: 'body_not_object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b['sessionId'] !== 'string' || !b['sessionId']) {
    return { ok: false, errorKind: 'sessionId_required' };
  }
  if (typeof b['planId'] !== 'string' || !b['planId']) {
    return { ok: false, errorKind: 'planId_required' };
  }
  const kind = b['kind'];
  if (
    kind !== 'lateFee' &&
    kind !== 'markPaid' &&
    kind !== 'settle' &&
    kind !== 'status'
  ) {
    return {
      ok: false,
      errorKind: 'kind_must_be_lateFee_markPaid_settle_or_status',
    };
  }
  const value: CollectionRequest = {
    kind,
    sessionId: b['sessionId'],
    planId: b['planId'],
  };
  if (kind === 'lateFee') {
    if (typeof b['installmentIndex'] !== 'number') {
      return { ok: false, errorKind: 'installmentIndex_required_number' };
    }
    value.installmentIndex = b['installmentIndex'];
    return { ok: true, value };
  }
  return { ok: true, value };
}

export async function handleCollectionRequest(
  adapter: PaymentAdapter,
  req: CollectionRequest,
): Promise<CollectionResponse> {
  try {
    if (req.kind === 'lateFee') {
      const result = await adapter.chargeLateFee({
        sessionId: req.sessionId,
        planId: req.planId,
        installmentIndex: req.installmentIndex!,
      });
      return {
        ok: true,
        kind: 'lateFee',
        sessionId: result.sessionId,
        planId: result.planId,
        installmentIndex: result.installmentIndex,
        lateFeeCents: result.lateFeeCents,
        totalLateFeesCents: result.totalLateFeesCents,
        state: result.state,
      };
    }
    if (req.kind === 'markPaid') {
      const result = await adapter.markPaid({
        sessionId: req.sessionId,
        planId: req.planId,
      });
      return {
        ok: true,
        kind: 'markPaid',
        sessionId: result.sessionId,
        planId: result.planId,
        installmentsPaid: result.installmentsPaid,
        installmentsScheduled: result.installmentsScheduled,
        state: result.state,
      };
    }
    if (req.kind === 'settle') {
      const result = await adapter.settlePlan({
        sessionId: req.sessionId,
        planId: req.planId,
      });
      return {
        ok: true,
        kind: 'settle',
        sessionId: result.sessionId,
        planId: result.planId,
        installmentsPaid: result.installmentsPaid,
        totalLateFeesCents: result.totalLateFeesCents,
        state: result.state,
      };
    }
    const result = await adapter.checkCollectionStatus({
      sessionId: req.sessionId,
      planId: req.planId,
    });
    return {
      ok: true,
      kind: 'status',
      sessionId: result.sessionId,
      planId: result.planId,
      installmentsPaid: result.installmentsPaid,
      installmentsScheduled: result.installmentsScheduled,
      installmentsRemaining: result.installmentsRemaining,
      totalLateFeesCents: result.totalLateFeesCents,
      state: result.state,
    };
  } catch (err) {
    return {
      ok: false,
      kind: req.kind,
      sessionId: req.sessionId,
      planId: req.planId,
      errorKind: coerceErrorKind(err),
    };
  }
}

function coerceErrorKind(err: unknown): string {
  if (err instanceof Error) return err.message;
  return 'unknown_error';
}
