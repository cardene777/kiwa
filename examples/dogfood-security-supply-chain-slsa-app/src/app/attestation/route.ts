/**
 * `/attestation` HTTP handler — sign provenance + verify attestation
 * ops the runtime exposes to the attestation surface. The route is
 * intentionally shape-neutral — the fidelity harness feeds plain
 * objects in and asserts on plain objects out, so the same test can
 * exercise mock and real without spinning up a cosign + rekor stack.
 *
 * The attestation surface pairs the parent v1.39-1 `supply-chain` axis
 * (signProvenance + verifyAttestation) with `@kiwa-test/security` v0.2
 * — every op emits a neutral event the fidelity harness can compare
 * across mock vs real.
 */

import type { SecurityAdapter } from '../../adapters/interface.js';

export type AttestationOpKind = 'sign-provenance' | 'verify-attestation';

export interface AttestationRequest {
  kind: AttestationOpKind;
  sessionId: string;
  // sign-provenance
  builderId?: string;
  materialsCount?: number;
  signatureAlgorithm?: 'sigstore-cosign' | 'in-toto' | 'gpg';
  // verify-attestation
  attestationType?: 'slsa-provenance' | 'spdx-sbom' | 'cyclone-dx-vex';
  trustRootFingerprint?: string;
  validSignatures?: number;
}

export interface AttestationResponse {
  ok: boolean;
  kind: AttestationOpKind;
  sessionId: string;
  builderId?: string;
  materialsCount?: number;
  signatureAlgorithm?: 'sigstore-cosign' | 'in-toto' | 'gpg';
  attestationType?: 'slsa-provenance' | 'spdx-sbom' | 'cyclone-dx-vex';
  trustRootFingerprint?: string;
  validSignatures?: number;
  errorKind?: string;
}

export function validateAttestationRequest(
  body: unknown,
):
  | { ok: true; value: AttestationRequest }
  | { ok: false; errorKind: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, errorKind: 'body_not_object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b['sessionId'] !== 'string' || !b['sessionId']) {
    return { ok: false, errorKind: 'sessionId_required' };
  }
  const kind = b['kind'];
  if (kind !== 'sign-provenance' && kind !== 'verify-attestation') {
    return {
      ok: false,
      errorKind: 'kind_must_be_sign_provenance_or_verify_attestation',
    };
  }
  const value: AttestationRequest = { kind, sessionId: b['sessionId'] };
  if (kind === 'sign-provenance') {
    if (typeof b['builderId'] !== 'string' || !b['builderId']) {
      return { ok: false, errorKind: 'builderId_required' };
    }
    if (typeof b['materialsCount'] !== 'number' || (b['materialsCount'] as number) < 0) {
      return { ok: false, errorKind: 'materialsCount_required_non_negative_number' };
    }
    const algo = b['signatureAlgorithm'];
    if (algo !== 'sigstore-cosign' && algo !== 'in-toto' && algo !== 'gpg') {
      return {
        ok: false,
        errorKind: 'signatureAlgorithm_must_be_cosign_in_toto_or_gpg',
      };
    }
    value.builderId = b['builderId'];
    value.materialsCount = b['materialsCount'] as number;
    value.signatureAlgorithm = algo;
    return { ok: true, value };
  }
  // kind === 'verify-attestation'
  const attType = b['attestationType'];
  if (
    attType !== 'slsa-provenance' &&
    attType !== 'spdx-sbom' &&
    attType !== 'cyclone-dx-vex'
  ) {
    return {
      ok: false,
      errorKind: 'attestationType_must_be_slsa_spdx_or_cyclonedx',
    };
  }
  if (
    typeof b['trustRootFingerprint'] !== 'string' ||
    !b['trustRootFingerprint']
  ) {
    return { ok: false, errorKind: 'trustRootFingerprint_required' };
  }
  if (
    typeof b['validSignatures'] !== 'number' ||
    (b['validSignatures'] as number) < 1
  ) {
    return { ok: false, errorKind: 'validSignatures_must_be_at_least_1' };
  }
  value.attestationType = attType;
  value.trustRootFingerprint = b['trustRootFingerprint'];
  value.validSignatures = b['validSignatures'] as number;
  return { ok: true, value };
}

export async function handleAttestationRequest(
  adapter: SecurityAdapter,
  req: AttestationRequest,
): Promise<AttestationResponse> {
  try {
    if (req.kind === 'sign-provenance') {
      const result = await adapter.signProvenance({
        sessionId: req.sessionId,
        builderId: req.builderId!,
        materialsCount: req.materialsCount!,
        signatureAlgorithm: req.signatureAlgorithm!,
      });
      return {
        ok: true,
        kind: 'sign-provenance',
        sessionId: result.sessionId,
        builderId: result.builderId,
        materialsCount: result.materialsCount,
        signatureAlgorithm: result.signatureAlgorithm,
      };
    }
    const result = await adapter.verifyAttestation({
      sessionId: req.sessionId,
      attestationType: req.attestationType!,
      trustRootFingerprint: req.trustRootFingerprint!,
      validSignatures: req.validSignatures!,
    });
    return {
      ok: true,
      kind: 'verify-attestation',
      sessionId: result.sessionId,
      attestationType: result.attestationType,
      trustRootFingerprint: result.trustRootFingerprint,
      validSignatures: result.validSignatures,
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
