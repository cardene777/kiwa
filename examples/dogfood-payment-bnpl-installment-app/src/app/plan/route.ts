/**
 * `/plan` HTTP handler — BNPL plan creation + per-installment schedule
 * ops the runtime exposes to the plan surface. The route is intentionally
 * shape-neutral — the fidelity harness feeds plain objects in and asserts
 * on plain objects out, so the same test can exercise mock and real
 * without spinning up a Klarna / Affirm / Afterpay account.
 *
 * The plan surface pairs the parent v1.41-1 `bnpl` axis (createBnplPlan +
 * scheduleInstallment) with `@kiwa-test/payment` v0.5 — every op has a
 * neutral event counterpart the fidelity harness can compare across mock
 * vs real.
 */

import type { PaymentAdapter } from '../../adapters/interface.js';

export type PlanOpKind = 'create' | 'schedule';

export interface PlanRequest {
  kind: PlanOpKind;
  sessionId: string;
  planId: string;
  // create
  customerId?: string;
  totalCents?: number;
  currency?: string;
  installments?: number;
  installmentIntervalMs?: number;
  minRiskScore?: number;
  lateFeeCents?: number;
}

export interface PlanResponse {
  ok: boolean;
  kind: PlanOpKind;
  sessionId: string;
  planId: string;
  customerId?: string;
  totalCents?: number;
  currency?: string;
  installments?: number;
  installmentAmountCents?: number;
  installmentIndex?: number;
  dueOffsetMs?: number;
  state?: string;
  errorKind?: string;
}

export function validatePlanRequest(
  body: unknown,
): { ok: true; value: PlanRequest } | { ok: false; errorKind: string } {
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
  if (kind !== 'create' && kind !== 'schedule') {
    return { ok: false, errorKind: 'kind_must_be_create_or_schedule' };
  }
  const value: PlanRequest = {
    kind,
    sessionId: b['sessionId'],
    planId: b['planId'],
  };
  if (kind === 'create') {
    if (typeof b['customerId'] !== 'string' || !b['customerId']) {
      return { ok: false, errorKind: 'customerId_required' };
    }
    if (typeof b['totalCents'] !== 'number') {
      return { ok: false, errorKind: 'totalCents_required_number' };
    }
    if (typeof b['currency'] !== 'string' || !b['currency']) {
      return { ok: false, errorKind: 'currency_required' };
    }
    if (typeof b['installments'] !== 'number') {
      return { ok: false, errorKind: 'installments_required_number' };
    }
    value.customerId = b['customerId'];
    value.totalCents = b['totalCents'];
    value.currency = b['currency'];
    value.installments = b['installments'];
    if (typeof b['installmentIntervalMs'] === 'number') {
      value.installmentIntervalMs = b['installmentIntervalMs'];
    }
    if (typeof b['minRiskScore'] === 'number') {
      value.minRiskScore = b['minRiskScore'];
    }
    if (typeof b['lateFeeCents'] === 'number') {
      value.lateFeeCents = b['lateFeeCents'];
    }
    return { ok: true, value };
  }
  // kind === 'schedule' — sessionId + planId only.
  return { ok: true, value };
}

export async function handlePlanRequest(
  adapter: PaymentAdapter,
  req: PlanRequest,
): Promise<PlanResponse> {
  try {
    if (req.kind === 'create') {
      const createInput: {
        sessionId: string;
        planId: string;
        customerId: string;
        totalCents: number;
        currency: string;
        installments: number;
        installmentIntervalMs?: number;
        minRiskScore?: number;
        lateFeeCents?: number;
      } = {
        sessionId: req.sessionId,
        planId: req.planId,
        customerId: req.customerId!,
        totalCents: req.totalCents!,
        currency: req.currency!,
        installments: req.installments!,
      };
      if (req.installmentIntervalMs !== undefined) {
        createInput.installmentIntervalMs = req.installmentIntervalMs;
      }
      if (req.minRiskScore !== undefined) {
        createInput.minRiskScore = req.minRiskScore;
      }
      if (req.lateFeeCents !== undefined) {
        createInput.lateFeeCents = req.lateFeeCents;
      }
      const result = await adapter.createPlan(createInput);
      return {
        ok: true,
        kind: 'create',
        sessionId: result.sessionId,
        planId: result.planId,
        customerId: result.customerId,
        totalCents: result.totalCents,
        currency: result.currency,
        installments: result.installments,
        installmentAmountCents: result.installmentAmountCents,
        state: result.state,
      };
    }
    const result = await adapter.scheduleInstallment({
      sessionId: req.sessionId,
      planId: req.planId,
    });
    return {
      ok: true,
      kind: 'schedule',
      sessionId: result.sessionId,
      planId: result.planId,
      installmentIndex: result.installmentIndex,
      installmentAmountCents: result.installmentAmountCents,
      dueOffsetMs: result.dueOffsetMs,
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
