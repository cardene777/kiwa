/**
 * Mock adapter — drives `@kiwa/security` v0.2 supply-chain
 * semantics (startSupplyChainSession / verifySlsaLevel /
 * matchReproducibleBuild / signProvenance / verifyAttestation) so the
 * same app code exercises a deterministic SLSA supply chain ceremony
 * without a real cosign + rekor + in-toto binary. Both mock and real
 * adapters satisfy {@link SecurityAdapter}, so the fidelity harness can
 * diff them side-by-side.
 *
 * State model — the supply-chain state machine is strictly linear
 * (idle → slsa-verified → reproducible-matched → provenance-signed →
 * attestation-verified) so the dogfood binds one semantics session per
 * surface (slsa / reproducible / attestation) and lets the harness
 * exercise each op in isolation. The orchestrator surface layers a
 * fused SLSA → attestation policy decision on top so callers can drive
 * both an axis-only flow and a fused flow through the same adapter.
 *
 * The mock intentionally piggy-backs on the same neutral event
 * vocabulary that the parent v1.39-1 semantics package emits — every op
 * appends the matching neutral event into the trace so the fidelity
 * harness can assert the mock and real adapters produce identical event
 * orderings.
 */

import {
  matchReproducibleBuild as reproducibleSem,
  signProvenance as provenanceSem,
  startSupplyChainSession,
  verifyAttestation as attestationSem,
  verifySlsaLevel as slsaSem,
  type SecurityAdvTarget,
  type SlsaLevel,
  type SupplyChainSession,
} from '@kiwa/security';
import type {
  AttestationResult,
  OrchestrateResult,
  ProvenanceResult,
  ReproducibleResult,
  SecurityAdapter,
  SlsaLevelResult,
  TraceEvent,
} from './interface.js';

export interface MakeMockAdapterOptions {
  /** artificial latency injected into every mock op (ms、 default 1). */
  latencyMs?: number;
}

interface SlsaSlot {
  target: SecurityAdvTarget;
  sessionId: string;
  session: SupplyChainSession;
}

interface ReproducibleSlot {
  target: SecurityAdvTarget;
  sessionId: string;
  session: SupplyChainSession;
}

interface AttestationSlot {
  target: SecurityAdvTarget;
  sessionId: string;
  session: SupplyChainSession;
  provenanceReady: boolean;
}

interface OrchestratorSlot {
  sessionId: string;
  slsaTarget: SecurityAdvTarget;
  reproducibleTarget: SecurityAdvTarget;
  attestationTarget: SecurityAdvTarget;
  closed: boolean;
}

export function makeMockAdapter(opts: MakeMockAdapterOptions = {}): SecurityAdapter {
  const latencyMs = opts.latencyMs ?? 1;
  const trace: TraceEvent[] = [];
  const slsa = new Map<string, SlsaSlot>();
  const reproducible = new Map<string, ReproducibleSlot>();
  const attestation = new Map<string, AttestationSlot>();
  const orchestrator = new Map<string, OrchestratorSlot>();

  function record(
    op: TraceEvent['op'],
    ok: boolean,
    extra?: Partial<TraceEvent>,
  ): void {
    const entry: TraceEvent = { op, ok };
    if (extra?.errorKind !== undefined) entry.errorKind = extra.errorKind;
    if (extra?.detail !== undefined) entry.detail = extra.detail;
    trace.push(entry);
  }

  function coerceErrorKind(err: unknown): string {
    if (err instanceof Error) return err.message;
    return 'unknown_error';
  }

  return {
    mode: 'mock',

    async startSlsa(input) {
      if (slsa.has(input.sessionId)) {
        record('startSlsa', false, { errorKind: 'slsa_session_exists' });
        throw new Error('slsa_session_exists');
      }
      const session = startSupplyChainSession({
        target: input.target,
        sessionId: input.sessionId,
      });
      slsa.set(input.sessionId, {
        target: input.target,
        sessionId: input.sessionId,
        session,
      });
      record('startSlsa', true, {
        detail: { sessionId: input.sessionId, target: input.target },
      });
    },

    async verifySlsaLevel(input) {
      const slot = slsa.get(input.sessionId);
      if (!slot) {
        record('verifySlsaLevel', false, { errorKind: 'slsa_session_not_found' });
        throw new Error('slsa_session_not_found');
      }
      try {
        const step = slsaSem(slot.session, {
          buildScriptedFromRepo: input.buildScriptedFromRepo,
          buildServiceIsTrustworthy: input.buildServiceIsTrustworthy,
          buildParameterizable: input.buildParameterizable,
          buildIsolated: input.buildIsolated,
          provenanceExists: input.provenanceExists,
          provenanceAuthenticated: input.provenanceAuthenticated,
          provenanceServiceGenerated: input.provenanceServiceGenerated,
          provenanceNonFalsifiable: input.provenanceNonFalsifiable,
        });
        const level = (step.metadata['level'] as SlsaLevel) ?? 0;
        const result: SlsaLevelResult = {
          sessionId: input.sessionId,
          level,
          buildScriptedFromRepo: input.buildScriptedFromRepo,
          provenanceExists: input.provenanceExists,
          buildIsolated: input.buildIsolated,
          latencyMs,
        };
        record('verifySlsaLevel', true, { detail: result });
        return result;
      } catch (err) {
        record('verifySlsaLevel', false, { errorKind: coerceErrorKind(err) });
        throw err;
      }
    },

    async closeSlsa(input) {
      if (!slsa.has(input.sessionId)) {
        record('closeSlsa', false, { errorKind: 'slsa_session_not_found' });
        throw new Error('slsa_session_not_found');
      }
      slsa.delete(input.sessionId);
      record('closeSlsa', true, { detail: { sessionId: input.sessionId } });
    },

    async startReproducible(input) {
      if (reproducible.has(input.sessionId)) {
        record('startReproducible', false, {
          errorKind: 'reproducible_session_exists',
        });
        throw new Error('reproducible_session_exists');
      }
      // Seed the semantics session through the slsa-verified state so
      // matchReproducibleBuild's precondition (state === 'slsa-verified')
      // is met. This is a mock-only shortcut that keeps the reproducible
      // surface driveable in isolation — the real driver runs the actual
      // SLSA level 3 gate before the reproducible check.
      const session = startSupplyChainSession({
        target: input.target,
        sessionId: input.sessionId,
      });
      slsaSem(session, {
        buildScriptedFromRepo: true,
        buildServiceIsTrustworthy: true,
        buildParameterizable: true,
        buildIsolated: true,
        provenanceExists: true,
        provenanceAuthenticated: true,
        provenanceServiceGenerated: true,
        provenanceNonFalsifiable: true,
      });
      reproducible.set(input.sessionId, {
        target: input.target,
        sessionId: input.sessionId,
        session,
      });
      record('startReproducible', true, {
        detail: { sessionId: input.sessionId, target: input.target },
      });
    },

    async matchReproducibleBuild(input) {
      const slot = reproducible.get(input.sessionId);
      if (!slot) {
        record('matchReproducibleBuild', false, {
          errorKind: 'reproducible_session_not_found',
        });
        throw new Error('reproducible_session_not_found');
      }
      try {
        const step = reproducibleSem(slot.session, {
          buildA_hash: input.buildA_hash,
          buildB_hash: input.buildB_hash,
          toolchainVersion: input.toolchainVersion,
        });
        const matched = (step.metadata['matched'] as boolean) ?? false;
        const result: ReproducibleResult = {
          sessionId: input.sessionId,
          matched,
          toolchainVersion: input.toolchainVersion,
          hashA: input.buildA_hash,
          hashB: input.buildB_hash,
          latencyMs,
        };
        record('matchReproducibleBuild', true, { detail: result });
        return result;
      } catch (err) {
        record('matchReproducibleBuild', false, {
          errorKind: coerceErrorKind(err),
        });
        throw err;
      }
    },

    async closeReproducible(input) {
      if (!reproducible.has(input.sessionId)) {
        record('closeReproducible', false, {
          errorKind: 'reproducible_session_not_found',
        });
        throw new Error('reproducible_session_not_found');
      }
      reproducible.delete(input.sessionId);
      record('closeReproducible', true, { detail: { sessionId: input.sessionId } });
    },

    async startAttestation(input) {
      if (attestation.has(input.sessionId)) {
        record('startAttestation', false, {
          errorKind: 'attestation_session_exists',
        });
        throw new Error('attestation_session_exists');
      }
      // The attestation surface drives signProvenance + verifyAttestation
      // which require the SLSA → reproducible chain to have already run.
      // Seed the semantics session through those two states so the
      // attestation surface is driveable in isolation.
      const session = startSupplyChainSession({
        target: input.target,
        sessionId: input.sessionId,
      });
      slsaSem(session, {
        buildScriptedFromRepo: true,
        buildServiceIsTrustworthy: true,
        buildParameterizable: true,
        buildIsolated: true,
        provenanceExists: true,
        provenanceAuthenticated: true,
        provenanceServiceGenerated: true,
        provenanceNonFalsifiable: true,
      });
      reproducibleSem(session, {
        buildA_hash: 'sha256:seed-a',
        buildB_hash: 'sha256:seed-a',
        toolchainVersion: 'seed',
      });
      attestation.set(input.sessionId, {
        target: input.target,
        sessionId: input.sessionId,
        session,
        provenanceReady: false,
      });
      record('startAttestation', true, {
        detail: { sessionId: input.sessionId, target: input.target },
      });
    },

    async signProvenance(input) {
      const slot = attestation.get(input.sessionId);
      if (!slot) {
        record('signProvenance', false, {
          errorKind: 'attestation_session_not_found',
        });
        throw new Error('attestation_session_not_found');
      }
      try {
        provenanceSem(slot.session, {
          builderId: input.builderId,
          materialsCount: input.materialsCount,
          signatureAlgorithm: input.signatureAlgorithm,
        });
        slot.provenanceReady = true;
        const result: ProvenanceResult = {
          sessionId: input.sessionId,
          builderId: input.builderId,
          materialsCount: input.materialsCount,
          signatureAlgorithm: input.signatureAlgorithm,
          latencyMs,
        };
        record('signProvenance', true, { detail: result });
        return result;
      } catch (err) {
        record('signProvenance', false, { errorKind: coerceErrorKind(err) });
        throw err;
      }
    },

    async verifyAttestation(input) {
      const slot = attestation.get(input.sessionId);
      if (!slot) {
        record('verifyAttestation', false, {
          errorKind: 'attestation_session_not_found',
        });
        throw new Error('attestation_session_not_found');
      }
      if (!slot.provenanceReady) {
        record('verifyAttestation', false, {
          errorKind: 'provenance_not_signed',
        });
        throw new Error('provenance_not_signed');
      }
      try {
        attestationSem(slot.session, {
          attestationType: input.attestationType,
          trustRootFingerprint: input.trustRootFingerprint,
          validSignatures: input.validSignatures,
        });
        const result: AttestationResult = {
          sessionId: input.sessionId,
          attestationType: input.attestationType,
          trustRootFingerprint: input.trustRootFingerprint,
          validSignatures: input.validSignatures,
          latencyMs,
        };
        record('verifyAttestation', true, { detail: result });
        return result;
      } catch (err) {
        record('verifyAttestation', false, {
          errorKind: coerceErrorKind(err),
        });
        throw err;
      }
    },

    async closeAttestation(input) {
      if (!attestation.has(input.sessionId)) {
        record('closeAttestation', false, {
          errorKind: 'attestation_session_not_found',
        });
        throw new Error('attestation_session_not_found');
      }
      attestation.delete(input.sessionId);
      record('closeAttestation', true, { detail: { sessionId: input.sessionId } });
    },

    async startOrchestrator(input) {
      if (orchestrator.has(input.sessionId)) {
        record('startOrchestrator', false, {
          errorKind: 'orchestrator_session_exists',
        });
        throw new Error('orchestrator_session_exists');
      }
      orchestrator.set(input.sessionId, {
        sessionId: input.sessionId,
        slsaTarget: input.slsaTarget,
        reproducibleTarget: input.reproducibleTarget,
        attestationTarget: input.attestationTarget,
        closed: false,
      });
      record('startOrchestrator', true, {
        detail: {
          sessionId: input.sessionId,
          slsaTarget: input.slsaTarget,
          reproducibleTarget: input.reproducibleTarget,
          attestationTarget: input.attestationTarget,
        },
      });
    },

    async orchestrateDecision(input) {
      const session = orchestrator.get(input.sessionId);
      if (!session) {
        record('orchestrateDecision', false, {
          errorKind: 'orchestrator_session_not_found',
        });
        throw new Error('orchestrator_session_not_found');
      }
      if (session.closed) {
        record('orchestrateDecision', false, {
          errorKind: 'orchestrator_session_closed',
        });
        throw new Error('orchestrator_session_closed');
      }
      const policyPassed = decidePolicy({
        slsaLevel: input.slsaLevel,
        reproducibleMatched: input.reproducibleMatched,
        provenanceSigned: input.provenanceSigned,
        attestationVerified: input.attestationVerified,
        minRequiredLevel: input.minRequiredLevel,
        requireAttestation: input.requireAttestation,
      });
      const result: OrchestrateResult = {
        sessionId: input.sessionId,
        slsaLevel: input.slsaLevel,
        reproducibleMatched: input.reproducibleMatched,
        provenanceSigned: input.provenanceSigned,
        attestationVerified: input.attestationVerified,
        policyPassed,
        latencyMs,
      };
      record('orchestrateDecision', true, { detail: result });
      return result;
    },

    async closeOrchestrator(input) {
      const session = orchestrator.get(input.sessionId);
      if (!session) {
        record('closeOrchestrator', false, {
          errorKind: 'orchestrator_session_not_found',
        });
        throw new Error('orchestrator_session_not_found');
      }
      session.closed = true;
      orchestrator.delete(input.sessionId);
      record('closeOrchestrator', true, {
        detail: { sessionId: input.sessionId },
      });
    },

    traces() {
      return trace;
    },

    async reset() {
      trace.length = 0;
      slsa.clear();
      reproducible.clear();
      attestation.clear();
      orchestrator.clear();
    },
  };
}

/**
 * Fused policy classifier — the orchestrator gates on 4 conditions
 * simultaneously: SLSA level ≥ minRequiredLevel + reproducible build
 * hashes matched + provenance signed + (attestation verified when the
 * caller asked for it). Failing any single condition fails the policy
 * so downstream release gates can rely on `policyPassed` as a single
 * boolean signal.
 */
function decidePolicy(input: {
  slsaLevel: 0 | 1 | 2 | 3 | 4;
  reproducibleMatched: boolean;
  provenanceSigned: boolean;
  attestationVerified: boolean;
  minRequiredLevel: 1 | 2 | 3 | 4;
  requireAttestation: boolean;
}): boolean {
  if (input.slsaLevel < input.minRequiredLevel) return false;
  if (!input.reproducibleMatched) return false;
  if (!input.provenanceSigned) return false;
  if (input.requireAttestation && !input.attestationVerified) return false;
  return true;
}
