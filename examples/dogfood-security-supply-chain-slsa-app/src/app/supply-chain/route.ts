/**
 * `/supply-chain` HTTP handler — SLSA level 0-4 gate op the runtime
 * exposes to the SLSA supply-chain surface. The route is intentionally
 * shape-neutral — the fidelity harness feeds plain objects in and
 * asserts on plain objects out, so the same test can exercise mock and
 * real without spinning up a cosign + rekor binary.
 *
 * The supply-chain surface pairs the parent v1.39-1 `supply-chain` axis
 * (startSupplyChainSession + verifySlsaLevel) with `@kiwa-lab/security`
 * v0.2 — the verifySlsaLevel op has a neutral event counterpart the
 * fidelity harness can compare across mock vs real.
 */

import type { SecurityAdapter } from '../../adapters/interface.js';

export type SupplyChainOpKind = 'verify-slsa-level';

export interface SupplyChainRequest {
  kind: SupplyChainOpKind;
  sessionId: string;
  // verify-slsa-level
  buildScriptedFromRepo?: boolean;
  buildServiceIsTrustworthy?: boolean;
  buildParameterizable?: boolean;
  buildIsolated?: boolean;
  provenanceExists?: boolean;
  provenanceAuthenticated?: boolean;
  provenanceServiceGenerated?: boolean;
  provenanceNonFalsifiable?: boolean;
}

export interface SupplyChainResponse {
  ok: boolean;
  kind: SupplyChainOpKind;
  sessionId: string;
  level?: 0 | 1 | 2 | 3 | 4;
  buildScriptedFromRepo?: boolean;
  provenanceExists?: boolean;
  buildIsolated?: boolean;
  errorKind?: string;
}

export function validateSupplyChainRequest(
  body: unknown,
):
  | { ok: true; value: SupplyChainRequest }
  | { ok: false; errorKind: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, errorKind: 'body_not_object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b['sessionId'] !== 'string' || !b['sessionId']) {
    return { ok: false, errorKind: 'sessionId_required' };
  }
  const kind = b['kind'];
  if (kind !== 'verify-slsa-level') {
    return {
      ok: false,
      errorKind: 'kind_must_be_verify_slsa_level',
    };
  }
  const value: SupplyChainRequest = { kind, sessionId: b['sessionId'] };
  const boolKeys = [
    'buildScriptedFromRepo',
    'buildServiceIsTrustworthy',
    'buildParameterizable',
    'buildIsolated',
    'provenanceExists',
    'provenanceAuthenticated',
    'provenanceServiceGenerated',
    'provenanceNonFalsifiable',
  ] as const;
  for (const key of boolKeys) {
    if (typeof b[key] !== 'boolean') {
      return { ok: false, errorKind: `${key}_required_boolean` };
    }
  }
  value.buildScriptedFromRepo = b['buildScriptedFromRepo'] as boolean;
  value.buildServiceIsTrustworthy = b['buildServiceIsTrustworthy'] as boolean;
  value.buildParameterizable = b['buildParameterizable'] as boolean;
  value.buildIsolated = b['buildIsolated'] as boolean;
  value.provenanceExists = b['provenanceExists'] as boolean;
  value.provenanceAuthenticated = b['provenanceAuthenticated'] as boolean;
  value.provenanceServiceGenerated = b['provenanceServiceGenerated'] as boolean;
  value.provenanceNonFalsifiable = b['provenanceNonFalsifiable'] as boolean;
  return { ok: true, value };
}

export async function handleSupplyChainRequest(
  adapter: SecurityAdapter,
  req: SupplyChainRequest,
): Promise<SupplyChainResponse> {
  try {
    const result = await adapter.verifySlsaLevel({
      sessionId: req.sessionId,
      buildScriptedFromRepo: req.buildScriptedFromRepo!,
      buildServiceIsTrustworthy: req.buildServiceIsTrustworthy!,
      buildParameterizable: req.buildParameterizable!,
      buildIsolated: req.buildIsolated!,
      provenanceExists: req.provenanceExists!,
      provenanceAuthenticated: req.provenanceAuthenticated!,
      provenanceServiceGenerated: req.provenanceServiceGenerated!,
      provenanceNonFalsifiable: req.provenanceNonFalsifiable!,
    });
    return {
      ok: true,
      kind: 'verify-slsa-level',
      sessionId: result.sessionId,
      level: result.level,
      buildScriptedFromRepo: result.buildScriptedFromRepo,
      provenanceExists: result.provenanceExists,
      buildIsolated: result.buildIsolated,
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
