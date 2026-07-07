/**
 * `/kyc` HTTP handler — individual verify + business verify + score
 * threshold ops the runtime exposes to the kyc surface. The route is
 * intentionally shape-neutral — the fidelity harness feeds plain objects
 * in and asserts on plain objects out, so the same test can exercise
 * mock and real without spinning up a Persona / Stripe Identity endpoint.
 *
 * The kyc surface pairs the parent v1.41-1 `embedded-finance` axis
 * (verifyKyc + verifyKyb) with a runtime aggregate score threshold check
 * that a real KYC / KYB platform lets a downstream program layer on top
 * — every op has a neutral event counterpart the fidelity harness can
 * compare across mock vs real.
 */

import type { PaymentAdapter } from '../../adapters/interface.js';

export type KycOpKind = 'individual' | 'business' | 'threshold';

export interface KycRequest {
  kind: KycOpKind;
  sessionId: string;
  // individual
  score?: number;
  minScore?: number;
  // business
  businessId?: string;
  registryOk?: boolean;
  // threshold
  aggregateScore?: number;
  minRequired?: number;
}

export interface KycResponse {
  ok: boolean;
  kind: KycOpKind;
  sessionId: string;
  customerId?: string;
  businessId?: string;
  score?: number;
  aggregateScore?: number;
  minRequired?: number;
  registryOk?: boolean;
  passed?: boolean;
  errorKind?: string;
}

export function validateKycRequest(
  body: unknown,
): { ok: true; value: KycRequest } | { ok: false; errorKind: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, errorKind: 'body_not_object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b['sessionId'] !== 'string' || !b['sessionId']) {
    return { ok: false, errorKind: 'sessionId_required' };
  }
  const kind = b['kind'];
  if (kind !== 'individual' && kind !== 'business' && kind !== 'threshold') {
    return { ok: false, errorKind: 'kind_must_be_individual_business_or_threshold' };
  }
  const value: KycRequest = { kind, sessionId: b['sessionId'] };
  if (kind === 'individual') {
    if (typeof b['score'] !== 'number') {
      return { ok: false, errorKind: 'score_required_number' };
    }
    if (typeof b['minScore'] !== 'number') {
      return { ok: false, errorKind: 'minScore_required_number' };
    }
    value.score = b['score'];
    value.minScore = b['minScore'];
    return { ok: true, value };
  }
  if (kind === 'business') {
    if (typeof b['businessId'] !== 'string' || !b['businessId']) {
      return { ok: false, errorKind: 'businessId_required' };
    }
    if (typeof b['registryOk'] !== 'boolean') {
      return { ok: false, errorKind: 'registryOk_required_boolean' };
    }
    value.businessId = b['businessId'];
    value.registryOk = b['registryOk'];
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

export async function handleKycRequest(
  adapter: PaymentAdapter,
  req: KycRequest,
): Promise<KycResponse> {
  try {
    if (req.kind === 'individual') {
      const result = await adapter.verifyIndividual({
        sessionId: req.sessionId,
        score: req.score!,
        minScore: req.minScore!,
      });
      return {
        ok: true,
        kind: 'individual',
        sessionId: result.sessionId,
        customerId: result.customerId,
        score: result.score,
        passed: result.passed,
      };
    }
    if (req.kind === 'business') {
      const result = await adapter.verifyBusiness({
        sessionId: req.sessionId,
        businessId: req.businessId!,
        registryOk: req.registryOk!,
      });
      return {
        ok: true,
        kind: 'business',
        sessionId: result.sessionId,
        businessId: result.businessId,
        registryOk: result.registryOk,
        passed: result.passed,
      };
    }
    const result = await adapter.checkScoreThreshold({
      sessionId: req.sessionId,
      aggregateScore: req.aggregateScore!,
      minRequired: req.minRequired!,
    });
    return {
      ok: true,
      kind: 'threshold',
      sessionId: result.sessionId,
      aggregateScore: result.aggregateScore,
      minRequired: result.minRequired,
      passed: result.passed,
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
