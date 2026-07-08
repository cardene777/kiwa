/**
 * Provider-neutral Security Adapter surface for the SLSA supply chain
 * dogfood.
 *
 * The app talks to the supply-chain security surface only through this
 * interface. Two implementations exist —
 *  - {@link makeRealAdapter} — drives a real in-toto + sigstore + cosign
 *    supply chain stack (KIWA_COSIGN_BIN + KIWA_IN_TOTO_URL +
 *    KIWA_REKOR_URL + KIWA_COSIGN_TRUST_ROOT) when `KIWA_MODE=real` +
 *    `COSIGN_STACK_READY=1` are set; otherwise every op reports
 *    `KIWA_COSIGN_ENV_MISSING`.
 *  - {@link makeMockAdapter} — backed by `@kiwa/security` v0.2
 *    supply-chain semantics (startSupplyChainSession / verifySlsaLevel /
 *    matchReproducibleBuild / signProvenance / verifyAttestation).
 *
 * Both must satisfy the same 15-op contract so behavioural fidelity
 * between real vs mock can be measured side-by-side across the 4 domain
 * surfaces this dogfood covers —
 *  - supply-chain (SLSA level 0-4 gate)
 *  - reproducible (build hash matching + toolchain pinning)
 *  - provenance + attestation (signed provenance builder / materials /
 *    signature + attestation type / trust root / valid signature count)
 *  - orchestrator (fused SLSA gate → reproducible → provenance →
 *    attestation policy pipeline)
 *
 * The AC anchors this contract on the 4 domain surfaces the harness
 * runs against both adapters —
 *  - slsa-e2e (SLSA level 0-4 gate)
 *  - reproducible-e2e (build hash matching)
 *  - attestation-e2e (provenance + attestation)
 *  - orchestrator-e2e (fused policy pipeline)
 * Each spec exercises a distinct subset of the ops below so the
 * fidelity report can point at the ops that diverged.
 */

/** Result of verifying an SLSA level 0-4 gate. */
export interface SlsaLevelResult {
  sessionId: string;
  level: 0 | 1 | 2 | 3 | 4;
  buildScriptedFromRepo: boolean;
  provenanceExists: boolean;
  buildIsolated: boolean;
  latencyMs: number;
}

/** Result of matching a reproducible build's twin hashes. */
export interface ReproducibleResult {
  sessionId: string;
  matched: boolean;
  toolchainVersion: string;
  hashA: string;
  hashB: string;
  latencyMs: number;
}

/** Result of signing a provenance statement. */
export interface ProvenanceResult {
  sessionId: string;
  builderId: string;
  materialsCount: number;
  signatureAlgorithm: 'sigstore-cosign' | 'in-toto' | 'gpg';
  latencyMs: number;
}

/** Result of verifying an attestation policy. */
export interface AttestationResult {
  sessionId: string;
  attestationType: 'slsa-provenance' | 'spdx-sbom' | 'cyclone-dx-vex';
  trustRootFingerprint: string;
  validSignatures: number;
  latencyMs: number;
}

/** Result of a fused SLSA gate → attestation policy pipeline decision. */
export interface OrchestrateResult {
  sessionId: string;
  slsaLevel: 0 | 1 | 2 | 3 | 4;
  reproducibleMatched: boolean;
  provenanceSigned: boolean;
  attestationVerified: boolean;
  policyPassed: boolean;
  latencyMs: number;
}

/** Neutral trace event — mock and real adapters emit the same shape. */
export interface TraceEvent {
  op:
    | 'startSlsa'
    | 'verifySlsaLevel'
    | 'closeSlsa'
    | 'startReproducible'
    | 'matchReproducibleBuild'
    | 'closeReproducible'
    | 'startAttestation'
    | 'signProvenance'
    | 'verifyAttestation'
    | 'closeAttestation'
    | 'startOrchestrator'
    | 'orchestrateDecision'
    | 'closeOrchestrator';
  ok: boolean;
  errorKind?: string;
  detail?: unknown;
}

export type ProviderTarget = 'istio' | 'opa' | 'siem-splunk' | 'vault';

/** Input for opening a SLSA supply chain session. */
export interface SlsaSessionInput {
  sessionId: string;
  target: ProviderTarget;
}

/** Input for opening a reproducible build session. */
export interface ReproducibleSessionInput {
  sessionId: string;
  target: ProviderTarget;
}

/** Input for opening a provenance + attestation session. */
export interface AttestationSessionInput {
  sessionId: string;
  target: ProviderTarget;
}

/** Input for opening a fused orchestrator session. */
export interface OrchestratorSessionInput {
  sessionId: string;
  slsaTarget: ProviderTarget;
  reproducibleTarget: ProviderTarget;
  attestationTarget: ProviderTarget;
}

/** The Security Adapter — 13 ops across 4 domain surfaces. */
export interface SecurityAdapter {
  readonly mode: 'real' | 'mock';

  // slsa-gate surface (slsa-e2e axis: level 0-4)
  startSlsa(input: SlsaSessionInput): Promise<void>;
  verifySlsaLevel(input: {
    sessionId: string;
    buildScriptedFromRepo: boolean;
    buildServiceIsTrustworthy: boolean;
    buildParameterizable: boolean;
    buildIsolated: boolean;
    provenanceExists: boolean;
    provenanceAuthenticated: boolean;
    provenanceServiceGenerated: boolean;
    provenanceNonFalsifiable: boolean;
  }): Promise<SlsaLevelResult>;
  closeSlsa(input: { sessionId: string }): Promise<void>;

  // reproducible surface (reproducible-e2e axis: hash matching + toolchain)
  startReproducible(input: ReproducibleSessionInput): Promise<void>;
  matchReproducibleBuild(input: {
    sessionId: string;
    buildA_hash: string;
    buildB_hash: string;
    toolchainVersion: string;
  }): Promise<ReproducibleResult>;
  closeReproducible(input: { sessionId: string }): Promise<void>;

  // attestation surface (attestation-e2e axis: provenance + attestation)
  startAttestation(input: AttestationSessionInput): Promise<void>;
  signProvenance(input: {
    sessionId: string;
    builderId: string;
    materialsCount: number;
    signatureAlgorithm: 'sigstore-cosign' | 'in-toto' | 'gpg';
  }): Promise<ProvenanceResult>;
  verifyAttestation(input: {
    sessionId: string;
    attestationType: 'slsa-provenance' | 'spdx-sbom' | 'cyclone-dx-vex';
    trustRootFingerprint: string;
    validSignatures: number;
  }): Promise<AttestationResult>;
  closeAttestation(input: { sessionId: string }): Promise<void>;

  // orchestrator surface (orchestrator-e2e axis: fused SLSA → attestation policy)
  startOrchestrator(input: OrchestratorSessionInput): Promise<void>;
  orchestrateDecision(input: {
    sessionId: string;
    slsaLevel: 0 | 1 | 2 | 3 | 4;
    reproducibleMatched: boolean;
    provenanceSigned: boolean;
    attestationVerified: boolean;
    minRequiredLevel: 1 | 2 | 3 | 4;
    requireAttestation: boolean;
  }): Promise<OrchestrateResult>;
  closeOrchestrator(input: { sessionId: string }): Promise<void>;

  /** trace snapshot — used by the fidelity harness. */
  traces(): readonly TraceEvent[];

  /** clear all state — invoked between test cases. */
  reset(): Promise<void>;
}
