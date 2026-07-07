/**
 * SLSA-to-attestation policy orchestrator end-to-end fidelity spec
 * (orchestrator axis: fused SLSA level gate → reproducible → provenance
 * → attestation policy pipeline).
 *
 * Issue CAR-866 (v1.39-4) AC — the mock adapter drives a fused decision
 * that mirrors a release script's gate check.
 *
 *  1. orchestrateDecision passes when SLSA level >= minRequiredLevel +
 *     reproducibleMatched + provenanceSigned + (attestationVerified
 *     when required).
 *  2. orchestrateDecision fails when SLSA level < minRequiredLevel.
 *  3. orchestrateDecision fails when reproducibleMatched=false even
 *     though the SLSA level passes.
 *  4. orchestrateDecision fails when provenance is not signed.
 *  5. orchestrateDecision fails when attestation is required but not
 *     verified.
 *  6. Session state machine rejects invalid transitions.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import {
  handleScOrchestratorRequest,
  validateScOrchestratorRequest,
} from '../src/app/sc-orchestrator/route.js';
import type { SecurityAdapter } from '../src/adapters/interface.js';

const FULL_ORCH = {
  slsaLevel: 3 as const,
  reproducibleMatched: true,
  provenanceSigned: true,
  attestationVerified: true,
  minRequiredLevel: 3 as const,
  requireAttestation: true,
};

let mock: SecurityAdapter;

beforeEach(() => {
  mock = makeMockAdapter({ latencyMs: 1 });
});

afterEach(async () => {
  await mock.reset();
});

describe('mock adapter — sc-orchestrator fused policy decision', () => {
  it('axis 1: policy passes when SLSA level ≥ minRequiredLevel + all 3 gates green', async () => {
    await mock.startOrchestrator({
      sessionId: 'o1',
      slsaTarget: 'opa',
      reproducibleTarget: 'opa',
      attestationTarget: 'vault',
    });
    const result = await mock.orchestrateDecision({
      sessionId: 'o1',
      ...FULL_ORCH,
    });
    expect(result.policyPassed).toBe(true);
    expect(result.slsaLevel).toBe(3);
    const trace = mock.traces().find((t) => t.op === 'orchestrateDecision');
    expect(trace?.ok).toBe(true);
  });

  it('axis 2: policy fails when SLSA level < minRequiredLevel', async () => {
    await mock.startOrchestrator({
      sessionId: 'o-low',
      slsaTarget: 'opa',
      reproducibleTarget: 'opa',
      attestationTarget: 'vault',
    });
    const result = await mock.orchestrateDecision({
      sessionId: 'o-low',
      ...FULL_ORCH,
      slsaLevel: 2,
    });
    expect(result.policyPassed).toBe(false);
    expect(result.slsaLevel).toBe(2);
  });

  it('axis 3: policy fails when reproducibleMatched=false', async () => {
    await mock.startOrchestrator({
      sessionId: 'o-repro',
      slsaTarget: 'opa',
      reproducibleTarget: 'opa',
      attestationTarget: 'vault',
    });
    const result = await mock.orchestrateDecision({
      sessionId: 'o-repro',
      ...FULL_ORCH,
      reproducibleMatched: false,
    });
    expect(result.policyPassed).toBe(false);
    expect(result.reproducibleMatched).toBe(false);
  });

  it('axis 4: policy fails when provenance is not signed', async () => {
    await mock.startOrchestrator({
      sessionId: 'o-nosig',
      slsaTarget: 'opa',
      reproducibleTarget: 'opa',
      attestationTarget: 'vault',
    });
    const result = await mock.orchestrateDecision({
      sessionId: 'o-nosig',
      ...FULL_ORCH,
      provenanceSigned: false,
    });
    expect(result.policyPassed).toBe(false);
    expect(result.provenanceSigned).toBe(false);
  });

  it('axis 5: policy fails when attestation is required but not verified', async () => {
    await mock.startOrchestrator({
      sessionId: 'o-noatt',
      slsaTarget: 'opa',
      reproducibleTarget: 'opa',
      attestationTarget: 'vault',
    });
    const result = await mock.orchestrateDecision({
      sessionId: 'o-noatt',
      ...FULL_ORCH,
      attestationVerified: false,
    });
    expect(result.policyPassed).toBe(false);
    expect(result.attestationVerified).toBe(false);
  });

  it('axis 5: policy passes when attestation is not verified but not required', async () => {
    await mock.startOrchestrator({
      sessionId: 'o-optatt',
      slsaTarget: 'opa',
      reproducibleTarget: 'opa',
      attestationTarget: 'vault',
    });
    const result = await mock.orchestrateDecision({
      sessionId: 'o-optatt',
      ...FULL_ORCH,
      attestationVerified: false,
      requireAttestation: false,
    });
    expect(result.policyPassed).toBe(true);
  });

  it('axis 6: orchestrateDecision rejects when session missing', async () => {
    await expect(
      mock.orchestrateDecision({
        sessionId: 'ghost',
        ...FULL_ORCH,
      }),
    ).rejects.toThrow(/orchestrator_session_not_found/);
  });
});

describe('mock adapter — sc-orchestrator session lifecycle', () => {
  it('axis 6: startOrchestrator rejects duplicate session ids', async () => {
    await mock.startOrchestrator({
      sessionId: 'dup',
      slsaTarget: 'opa',
      reproducibleTarget: 'opa',
      attestationTarget: 'vault',
    });
    await expect(
      mock.startOrchestrator({
        sessionId: 'dup',
        slsaTarget: 'opa',
        reproducibleTarget: 'opa',
        attestationTarget: 'vault',
      }),
    ).rejects.toThrow(/orchestrator_session_exists/);
  });

  it('axis 6: closeOrchestrator removes session from bookkeeping', async () => {
    await mock.startOrchestrator({
      sessionId: 'o-close',
      slsaTarget: 'opa',
      reproducibleTarget: 'opa',
      attestationTarget: 'vault',
    });
    await mock.closeOrchestrator({ sessionId: 'o-close' });
    await expect(
      mock.closeOrchestrator({ sessionId: 'o-close' }),
    ).rejects.toThrow(/orchestrator_session_not_found/);
  });
});

describe('mock adapter — /sc-orchestrator route validation', () => {
  it('accepts decide requests with all required fields', () => {
    const parsed = validateScOrchestratorRequest({
      kind: 'decide',
      sessionId: 'o1',
      ...FULL_ORCH,
    });
    expect(parsed.ok).toBe(true);
  });

  it('rejects decide requests with slsaLevel out of range', () => {
    const parsed = validateScOrchestratorRequest({
      kind: 'decide',
      sessionId: 'o1',
      ...FULL_ORCH,
      slsaLevel: 5,
    });
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.errorKind).toBe('slsaLevel_must_be_0_to_4');
  });

  it('rejects decide requests with minRequiredLevel = 0', () => {
    const parsed = validateScOrchestratorRequest({
      kind: 'decide',
      sessionId: 'o1',
      ...FULL_ORCH,
      minRequiredLevel: 0,
    });
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.errorKind).toBe('minRequiredLevel_must_be_1_to_4');
    }
  });

  it('rejects decide requests missing reproducibleMatched', () => {
    const parsed = validateScOrchestratorRequest({
      kind: 'decide',
      sessionId: 'o1',
      slsaLevel: 3,
      provenanceSigned: true,
      attestationVerified: true,
      minRequiredLevel: 3,
      requireAttestation: true,
    });
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.errorKind).toBe('reproducibleMatched_required_boolean');
    }
  });

  it('rejects an unknown kind', () => {
    const parsed = validateScOrchestratorRequest({
      kind: 'unknown',
      sessionId: 'o1',
    });
    expect(parsed.ok).toBe(false);
  });

  it('rejects a non-object body', () => {
    const parsed = validateScOrchestratorRequest(null);
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.errorKind).toBe('body_not_object');
  });
});

describe('mock adapter — /sc-orchestrator route handler', () => {
  it('serves a decide request end to end', async () => {
    await mock.startOrchestrator({
      sessionId: 'route-o',
      slsaTarget: 'opa',
      reproducibleTarget: 'opa',
      attestationTarget: 'vault',
    });
    const parsed = validateScOrchestratorRequest({
      kind: 'decide',
      sessionId: 'route-o',
      ...FULL_ORCH,
    });
    if (!parsed.ok) throw new Error(parsed.errorKind);
    const res = await handleScOrchestratorRequest(mock, parsed.value);
    expect(res.ok).toBe(true);
    expect(res.policyPassed).toBe(true);
  });

  it('reports an adapter error via errorKind on route response', async () => {
    const parsed = validateScOrchestratorRequest({
      kind: 'decide',
      sessionId: 'ghost',
      ...FULL_ORCH,
    });
    if (!parsed.ok) throw new Error(parsed.errorKind);
    const res = await handleScOrchestratorRequest(mock, parsed.value);
    expect(res.ok).toBe(false);
    expect(res.errorKind).toBe('orchestrator_session_not_found');
  });
});
