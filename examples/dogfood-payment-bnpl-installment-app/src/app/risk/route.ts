/**
 * `/risk` HTTP handler — BNPL soft credit-check + aggregate threshold ops
 * the runtime exposes to the risk surface. The route is intentionally
 * shape-neutral — the fidelity harness feeds plain objects in and asserts
 * on plain objects out, so the same test can exercise mock and real
 * without spinning up an Experian / Equifax / TransUnion credit bureau
 * endpoint.
 *
 * The risk surface pairs the parent v1.41-1 `bnpl` axis (scoreRisk) with
 * a runtime aggregate threshold check that a real BNPL platform layers
 * on top — every op has a neutral event counterpart the fidelity harness
 * can compare across mock vs real.
 */

import type { PaymentAdapter } from '../../adapters/interface.js';

export type RiskOpKind = 'score' | 'threshold';

export interface RiskRequest {
  kind: RiskOpKind;
  sessionId: string;
  planId: string;
  // score
  score?: number;
  minRequired?: number;
  // threshold
  aggregateScore?: number;
}

export interface RiskResponse {
  ok: boolean;
  kind: RiskOpKind;
  sessionId: string;
  planId: string;
  customerId?: string;
  score?: number;
  aggregateScore?: number;
  minRequired?: number;
  passed?: boolean;
  creditBureau?: string;
  state?: string;
  errorKind?: string;
}

export function validateRiskRequest(
  body: unknown,
): { ok: true; value: RiskRequest } | { ok: false; errorKind: string } {
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
  if (kind !== 'score' && kind !== 'threshold') {
    return { ok: false, errorKind: 'kind_must_be_score_or_threshold' };
  }
  const value: RiskRequest = {
    kind,
    sessionId: b['sessionId'],
    planId: b['planId'],
  };
  if (kind === 'score') {
    if (typeof b['score'] !== 'number') {
      return { ok: false, errorKind: 'score_required_number' };
    }
    if (typeof b['minRequired'] !== 'number') {
      return { ok: false, errorKind: 'minRequired_required_number' };
    }
    value.score = b['score'];
    value.minRequired = b['minRequired'];
    return { ok: true, value };
  }
  // kind === 'threshold'
  if (typeof b['aggregateScore'] !== 'number') {
    return { ok: false, errorKind: 'aggregateScore_required_number' };
  }
  if (typeof b['minRequired'] !== 'number') {
    return { ok: false, errorKind: 'minRequired_required_number' };
  }
  value.aggregateScore = b['aggregateScore'];
  value.minRequired = b['minRequired'];
  return { ok: true, value };
}

export async function handleRiskRequest(
  adapter: PaymentAdapter,
  req: RiskRequest,
): Promise<RiskResponse> {
  try {
    if (req.kind === 'score') {
      const result = await adapter.scoreCustomerRisk({
        sessionId: req.sessionId,
        planId: req.planId,
        score: req.score!,
        minRequired: req.minRequired!,
      });
      return {
        ok: true,
        kind: 'score',
        sessionId: result.sessionId,
        planId: result.planId,
        customerId: result.customerId,
        score: result.score,
        minRequired: result.minRequired,
        passed: result.passed,
        creditBureau: result.creditBureau,
        state: result.state,
      };
    }
    const result = await adapter.checkRiskThreshold({
      sessionId: req.sessionId,
      planId: req.planId,
      aggregateScore: req.aggregateScore!,
      minRequired: req.minRequired!,
    });
    return {
      ok: true,
      kind: 'threshold',
      sessionId: result.sessionId,
      planId: result.planId,
      aggregateScore: result.aggregateScore,
      minRequired: result.minRequired,
      passed: result.passed,
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
