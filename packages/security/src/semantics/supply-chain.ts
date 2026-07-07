import {
  providerAdvEventName,
  type AxisAdvStep,
  type NeutralAdvEventName,
  type SecurityAdvTarget,
} from './types.js';

/**
 * Supply chain security axis — SLSA level verification + reproducible build
 * matching + signed provenance + SLSA attestation verification state machine。
 *
 * Deterministic mock で 4 signal 系統を提供。 real driver 経路では in-toto /
 * sigstore に対して attestation 検証を発火する。
 */

export type SlsaLevel = 0 | 1 | 2 | 3 | 4;

export type SupplyChainState =
  | 'idle'
  | 'slsa-verified'
  | 'reproducible-matched'
  | 'provenance-signed'
  | 'attestation-verified';

export interface SupplyChainSession {
  target: SecurityAdvTarget;
  sessionId: string;
  state: SupplyChainState;
  history: AxisAdvStep<SupplyChainState>[];
  verifiedLevel: SlsaLevel;
}

export interface SlsaLevelInput {
  buildScriptedFromRepo: boolean;
  buildServiceIsTrustworthy: boolean;
  buildParameterizable: boolean;
  buildIsolated: boolean;
  provenanceExists: boolean;
  provenanceAuthenticated: boolean;
  provenanceServiceGenerated: boolean;
  provenanceNonFalsifiable: boolean;
}

export interface ReproducibleInput {
  buildA_hash: string;
  buildB_hash: string;
  toolchainVersion: string;
}

export interface ProvenanceInput {
  builderId: string;
  materialsCount: number;
  signatureAlgorithm: 'sigstore-cosign' | 'in-toto' | 'gpg';
}

export interface AttestationInput {
  attestationType: 'slsa-provenance' | 'spdx-sbom' | 'cyclone-dx-vex';
  trustRootFingerprint: string;
  validSignatures: number;
}

export function startSupplyChainSession(input: {
  target: SecurityAdvTarget;
  sessionId: string;
}): SupplyChainSession {
  if (input.sessionId.length === 0) {
    throw new Error('startSupplyChainSession: sessionId must not be empty');
  }
  return {
    target: input.target,
    sessionId: input.sessionId,
    state: 'idle',
    history: [],
    verifiedLevel: 0,
  };
}

export function verifySlsaLevel(
  session: SupplyChainSession,
  input: SlsaLevelInput,
): AxisAdvStep<SupplyChainState> {
  if (session.state !== 'idle') {
    throw new Error(`verifySlsaLevel: session is ${session.state}`);
  }
  let level: SlsaLevel = 0;
  if (input.buildScriptedFromRepo && input.provenanceExists) level = 1;
  if (
    level === 1 &&
    input.buildServiceIsTrustworthy &&
    input.provenanceAuthenticated &&
    input.provenanceServiceGenerated
  )
    level = 2;
  if (level === 2 && input.buildIsolated && input.provenanceNonFalsifiable) level = 3;
  if (level === 3 && input.buildParameterizable === false) level = 4;
  session.verifiedLevel = level;
  session.state = 'slsa-verified';
  return emit(session, 'sc.slsa_level_verified', {
    level,
    buildScriptedFromRepo: input.buildScriptedFromRepo,
    provenanceExists: input.provenanceExists,
    buildIsolated: input.buildIsolated,
  });
}

export function matchReproducibleBuild(
  session: SupplyChainSession,
  input: ReproducibleInput,
): AxisAdvStep<SupplyChainState> {
  if (session.state !== 'slsa-verified') {
    throw new Error('matchReproducibleBuild: SLSA level must be verified first');
  }
  if (input.buildA_hash.length === 0 || input.buildB_hash.length === 0) {
    throw new Error('matchReproducibleBuild: build hashes must not be empty');
  }
  const matched = input.buildA_hash === input.buildB_hash;
  session.state = 'reproducible-matched';
  return emit(session, 'sc.reproducible_build_matched', {
    matched,
    toolchainVersion: input.toolchainVersion,
    hashA: input.buildA_hash,
    hashB: input.buildB_hash,
  });
}

export function signProvenance(
  session: SupplyChainSession,
  input: ProvenanceInput,
): AxisAdvStep<SupplyChainState> {
  if (session.state !== 'reproducible-matched') {
    throw new Error('signProvenance: reproducible build must be matched first');
  }
  if (input.builderId.length === 0) {
    throw new Error('signProvenance: builderId must not be empty');
  }
  if (input.materialsCount < 0) {
    throw new Error('signProvenance: materialsCount must be non-negative');
  }
  session.state = 'provenance-signed';
  return emit(session, 'sc.provenance_signed', {
    builderId: input.builderId,
    materialsCount: input.materialsCount,
    signatureAlgorithm: input.signatureAlgorithm,
  });
}

export function verifyAttestation(
  session: SupplyChainSession,
  input: AttestationInput,
): AxisAdvStep<SupplyChainState> {
  if (session.state !== 'provenance-signed') {
    throw new Error('verifyAttestation: provenance must be signed first');
  }
  if (input.trustRootFingerprint.length === 0) {
    throw new Error('verifyAttestation: trustRootFingerprint must not be empty');
  }
  if (input.validSignatures < 1) {
    throw new Error('verifyAttestation: at least one valid signature required');
  }
  session.state = 'attestation-verified';
  return emit(session, 'sc.attestation_verified', {
    attestationType: input.attestationType,
    validSignatures: input.validSignatures,
    trustRootFingerprint: input.trustRootFingerprint,
  });
}

function emit(
  session: SupplyChainSession,
  neutral: NeutralAdvEventName,
  metadata: Record<string, string | number | boolean>,
): AxisAdvStep<SupplyChainState> {
  const step: AxisAdvStep<SupplyChainState> = {
    neutralEvent: neutral,
    providerEvent: providerAdvEventName(session.target, neutral),
    state: session.state,
    timestampMs: session.history.length + 1,
    metadata,
  };
  session.history.push(step);
  return step;
}
