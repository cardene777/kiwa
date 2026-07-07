/**
 * `/sc-orchestrator` HTTP handler — fused SLSA gate → reproducible →
 * provenance → attestation policy pipeline op the runtime exposes to
 * the orchestrator surface. The route is intentionally shape-neutral —
 * the fidelity harness feeds plain objects in and asserts on plain
 * objects out, so the same test can exercise mock and real without
 * spinning up a cosign + rekor sidecar.
 *
 * The orchestrator surface layers a fused policy decision on top of
 * the 4 axis outputs — the caller reports the SLSA level + whether the
 * reproducible build matched + whether the provenance was signed +
 * whether the attestation verified, plus the release-gate
 * (`minRequiredLevel` + `requireAttestation`). The orchestrator picks a
 * single `policyPassed` boolean so downstream release scripts can gate
 * on one signal.
 */

import type { SecurityAdapter } from '../../adapters/interface.js';

export type ScOrchestratorOpKind = 'decide';

export interface ScOrchestratorRequest {
  kind: ScOrchestratorOpKind;
  sessionId: string;
  slsaLevel?: 0 | 1 | 2 | 3 | 4;
  reproducibleMatched?: boolean;
  provenanceSigned?: boolean;
  attestationVerified?: boolean;
  minRequiredLevel?: 1 | 2 | 3 | 4;
  requireAttestation?: boolean;
}

export interface ScOrchestratorResponse {
  ok: boolean;
  kind: ScOrchestratorOpKind;
  sessionId: string;
  slsaLevel?: 0 | 1 | 2 | 3 | 4;
  reproducibleMatched?: boolean;
  provenanceSigned?: boolean;
  attestationVerified?: boolean;
  policyPassed?: boolean;
  errorKind?: string;
}

export function validateScOrchestratorRequest(
  body: unknown,
):
  | { ok: true; value: ScOrchestratorRequest }
  | { ok: false; errorKind: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, errorKind: 'body_not_object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b['sessionId'] !== 'string' || !b['sessionId']) {
    return { ok: false, errorKind: 'sessionId_required' };
  }
  if (b['kind'] !== 'decide') {
    return { ok: false, errorKind: 'kind_must_be_decide' };
  }
  const level = b['slsaLevel'];
  if (
    level !== 0 &&
    level !== 1 &&
    level !== 2 &&
    level !== 3 &&
    level !== 4
  ) {
    return { ok: false, errorKind: 'slsaLevel_must_be_0_to_4' };
  }
  if (typeof b['reproducibleMatched'] !== 'boolean') {
    return { ok: false, errorKind: 'reproducibleMatched_required_boolean' };
  }
  if (typeof b['provenanceSigned'] !== 'boolean') {
    return { ok: false, errorKind: 'provenanceSigned_required_boolean' };
  }
  if (typeof b['attestationVerified'] !== 'boolean') {
    return { ok: false, errorKind: 'attestationVerified_required_boolean' };
  }
  const min = b['minRequiredLevel'];
  if (min !== 1 && min !== 2 && min !== 3 && min !== 4) {
    return { ok: false, errorKind: 'minRequiredLevel_must_be_1_to_4' };
  }
  if (typeof b['requireAttestation'] !== 'boolean') {
    return { ok: false, errorKind: 'requireAttestation_required_boolean' };
  }
  return {
    ok: true,
    value: {
      kind: 'decide',
      sessionId: b['sessionId'],
      slsaLevel: level,
      reproducibleMatched: b['reproducibleMatched'],
      provenanceSigned: b['provenanceSigned'],
      attestationVerified: b['attestationVerified'],
      minRequiredLevel: min,
      requireAttestation: b['requireAttestation'],
    },
  };
}

export async function handleScOrchestratorRequest(
  adapter: SecurityAdapter,
  req: ScOrchestratorRequest,
): Promise<ScOrchestratorResponse> {
  try {
    const result = await adapter.orchestrateDecision({
      sessionId: req.sessionId,
      slsaLevel: req.slsaLevel!,
      reproducibleMatched: req.reproducibleMatched!,
      provenanceSigned: req.provenanceSigned!,
      attestationVerified: req.attestationVerified!,
      minRequiredLevel: req.minRequiredLevel!,
      requireAttestation: req.requireAttestation!,
    });
    return {
      ok: true,
      kind: 'decide',
      sessionId: result.sessionId,
      slsaLevel: result.slsaLevel,
      reproducibleMatched: result.reproducibleMatched,
      provenanceSigned: result.provenanceSigned,
      attestationVerified: result.attestationVerified,
      policyPassed: result.policyPassed,
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
