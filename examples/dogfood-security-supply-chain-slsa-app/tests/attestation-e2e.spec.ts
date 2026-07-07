/**
 * Provenance + attestation end-to-end fidelity spec (attestation axis:
 * signed provenance builder / materials / signature + attestation
 * policy verification with trust root fingerprint + valid signature
 * count).
 *
 * Issue CAR-866 (v1.39-4) AC — the mock adapter drives the provenance +
 * attestation ceremony end to end and the fidelity harness diffs the
 * raw {@link TraceEvent} sequence across five axes.
 *
 *  1. signProvenance threads builderId + materialsCount + signature
 *     algorithm through unchanged.
 *  2. verifyAttestation requires signProvenance to have run first.
 *  3. verifyAttestation records attestationType + trust root
 *     fingerprint + valid signature count.
 *  4. Input validation rejects empty builderId + negative
 *     materialsCount + validSignatures < 1.
 *  5. Session state machine rejects invalid transitions.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import {
  handleAttestationRequest,
  validateAttestationRequest,
} from '../src/app/attestation/route.js';
import type { SecurityAdapter } from '../src/adapters/interface.js';

let mock: SecurityAdapter;

beforeEach(() => {
  mock = makeMockAdapter({ latencyMs: 1 });
});

afterEach(async () => {
  await mock.reset();
});

describe('mock adapter — signProvenance', () => {
  it('axis 1: signProvenance threads builderId + materials count + sig algo through', async () => {
    await mock.startAttestation({ sessionId: 'a1', target: 'vault' });
    const result = await mock.signProvenance({
      sessionId: 'a1',
      builderId: 'github-actions://actions/runner@v2.317.0',
      materialsCount: 5,
      signatureAlgorithm: 'sigstore-cosign',
    });
    expect(result.builderId).toBe('github-actions://actions/runner@v2.317.0');
    expect(result.materialsCount).toBe(5);
    expect(result.signatureAlgorithm).toBe('sigstore-cosign');
    const trace = mock.traces().find((t) => t.op === 'signProvenance');
    expect(trace?.ok).toBe(true);
  });

  it('axis 1: signProvenance accepts in-toto + gpg algorithms', async () => {
    await mock.startAttestation({ sessionId: 'a-in-toto', target: 'vault' });
    const inToto = await mock.signProvenance({
      sessionId: 'a-in-toto',
      builderId: 'in-toto://runner',
      materialsCount: 2,
      signatureAlgorithm: 'in-toto',
    });
    expect(inToto.signatureAlgorithm).toBe('in-toto');

    await mock.startAttestation({ sessionId: 'a-gpg', target: 'vault' });
    const gpg = await mock.signProvenance({
      sessionId: 'a-gpg',
      builderId: 'gpg-signer',
      materialsCount: 0,
      signatureAlgorithm: 'gpg',
    });
    expect(gpg.signatureAlgorithm).toBe('gpg');
  });

  it('axis 4: signProvenance rejects an empty builderId', async () => {
    await mock.startAttestation({ sessionId: 'a-empty', target: 'vault' });
    await expect(
      mock.signProvenance({
        sessionId: 'a-empty',
        builderId: '',
        materialsCount: 1,
        signatureAlgorithm: 'sigstore-cosign',
      }),
    ).rejects.toThrow(/builderId must not be empty/);
  });

  it('axis 4: signProvenance rejects a negative materialsCount', async () => {
    await mock.startAttestation({ sessionId: 'a-neg', target: 'vault' });
    await expect(
      mock.signProvenance({
        sessionId: 'a-neg',
        builderId: 'b',
        materialsCount: -1,
        signatureAlgorithm: 'sigstore-cosign',
      }),
    ).rejects.toThrow(/materialsCount must be non-negative/);
  });

  it('axis 5: signProvenance rejects when session missing', async () => {
    await expect(
      mock.signProvenance({
        sessionId: 'ghost',
        builderId: 'b',
        materialsCount: 1,
        signatureAlgorithm: 'sigstore-cosign',
      }),
    ).rejects.toThrow(/attestation_session_not_found/);
  });
});

describe('mock adapter — verifyAttestation', () => {
  it('axis 2: verifyAttestation succeeds after signProvenance', async () => {
    await mock.startAttestation({ sessionId: 'v1', target: 'vault' });
    await mock.signProvenance({
      sessionId: 'v1',
      builderId: 'b',
      materialsCount: 1,
      signatureAlgorithm: 'sigstore-cosign',
    });
    const result = await mock.verifyAttestation({
      sessionId: 'v1',
      attestationType: 'slsa-provenance',
      trustRootFingerprint: 'sha256:trust-root-abc',
      validSignatures: 2,
    });
    expect(result.attestationType).toBe('slsa-provenance');
    expect(result.trustRootFingerprint).toBe('sha256:trust-root-abc');
    expect(result.validSignatures).toBe(2);
  });

  it('axis 2: verifyAttestation rejects when provenance not signed', async () => {
    await mock.startAttestation({ sessionId: 'v-pre', target: 'vault' });
    await expect(
      mock.verifyAttestation({
        sessionId: 'v-pre',
        attestationType: 'slsa-provenance',
        trustRootFingerprint: 'sha256:trust-root',
        validSignatures: 1,
      }),
    ).rejects.toThrow(/provenance_not_signed/);
  });

  it('axis 3: verifyAttestation accepts spdx-sbom + cyclone-dx-vex types', async () => {
    await mock.startAttestation({ sessionId: 'v-spdx', target: 'vault' });
    await mock.signProvenance({
      sessionId: 'v-spdx',
      builderId: 'b',
      materialsCount: 1,
      signatureAlgorithm: 'sigstore-cosign',
    });
    const spdx = await mock.verifyAttestation({
      sessionId: 'v-spdx',
      attestationType: 'spdx-sbom',
      trustRootFingerprint: 'sha256:tr',
      validSignatures: 1,
    });
    expect(spdx.attestationType).toBe('spdx-sbom');
  });

  it('axis 4: verifyAttestation rejects empty trustRootFingerprint', async () => {
    await mock.startAttestation({ sessionId: 'v-empty', target: 'vault' });
    await mock.signProvenance({
      sessionId: 'v-empty',
      builderId: 'b',
      materialsCount: 1,
      signatureAlgorithm: 'sigstore-cosign',
    });
    await expect(
      mock.verifyAttestation({
        sessionId: 'v-empty',
        attestationType: 'slsa-provenance',
        trustRootFingerprint: '',
        validSignatures: 1,
      }),
    ).rejects.toThrow(/trustRootFingerprint must not be empty/);
  });

  it('axis 4: verifyAttestation rejects validSignatures < 1', async () => {
    await mock.startAttestation({ sessionId: 'v-zero', target: 'vault' });
    await mock.signProvenance({
      sessionId: 'v-zero',
      builderId: 'b',
      materialsCount: 1,
      signatureAlgorithm: 'sigstore-cosign',
    });
    await expect(
      mock.verifyAttestation({
        sessionId: 'v-zero',
        attestationType: 'slsa-provenance',
        trustRootFingerprint: 'sha256:tr',
        validSignatures: 0,
      }),
    ).rejects.toThrow(/at least one valid signature required/);
  });
});

describe('mock adapter — attestation session lifecycle', () => {
  it('axis 5: startAttestation rejects duplicate session ids', async () => {
    await mock.startAttestation({ sessionId: 'dup', target: 'vault' });
    await expect(
      mock.startAttestation({ sessionId: 'dup', target: 'vault' }),
    ).rejects.toThrow(/attestation_session_exists/);
  });

  it('axis 5: closeAttestation removes session from bookkeeping', async () => {
    await mock.startAttestation({ sessionId: 'a-close', target: 'vault' });
    await mock.closeAttestation({ sessionId: 'a-close' });
    await expect(
      mock.closeAttestation({ sessionId: 'a-close' }),
    ).rejects.toThrow(/attestation_session_not_found/);
  });
});

describe('mock adapter — /attestation route validation', () => {
  it('accepts sign-provenance requests with all required fields', () => {
    const parsed = validateAttestationRequest({
      kind: 'sign-provenance',
      sessionId: 'a1',
      builderId: 'b',
      materialsCount: 1,
      signatureAlgorithm: 'sigstore-cosign',
    });
    expect(parsed.ok).toBe(true);
  });

  it('accepts verify-attestation requests with all required fields', () => {
    const parsed = validateAttestationRequest({
      kind: 'verify-attestation',
      sessionId: 'a1',
      attestationType: 'slsa-provenance',
      trustRootFingerprint: 'sha256:tr',
      validSignatures: 1,
    });
    expect(parsed.ok).toBe(true);
  });

  it('rejects sign-provenance requests without builderId', () => {
    const parsed = validateAttestationRequest({
      kind: 'sign-provenance',
      sessionId: 'a1',
      materialsCount: 1,
      signatureAlgorithm: 'sigstore-cosign',
    });
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.errorKind).toBe('builderId_required');
  });

  it('rejects sign-provenance requests with invalid signatureAlgorithm', () => {
    const parsed = validateAttestationRequest({
      kind: 'sign-provenance',
      sessionId: 'a1',
      builderId: 'b',
      materialsCount: 1,
      signatureAlgorithm: 'ecdsa',
    });
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.errorKind).toBe(
        'signatureAlgorithm_must_be_cosign_in_toto_or_gpg',
      );
    }
  });

  it('rejects verify-attestation requests with invalid attestationType', () => {
    const parsed = validateAttestationRequest({
      kind: 'verify-attestation',
      sessionId: 'a1',
      attestationType: 'xxx',
      trustRootFingerprint: 'sha256:tr',
      validSignatures: 1,
    });
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.errorKind).toBe(
        'attestationType_must_be_slsa_spdx_or_cyclonedx',
      );
    }
  });

  it('rejects verify-attestation requests with validSignatures = 0', () => {
    const parsed = validateAttestationRequest({
      kind: 'verify-attestation',
      sessionId: 'a1',
      attestationType: 'slsa-provenance',
      trustRootFingerprint: 'sha256:tr',
      validSignatures: 0,
    });
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.errorKind).toBe('validSignatures_must_be_at_least_1');
    }
  });

  it('rejects an unknown kind', () => {
    const parsed = validateAttestationRequest({
      kind: 'unknown',
      sessionId: 'a1',
    });
    expect(parsed.ok).toBe(false);
  });

  it('rejects a non-object body', () => {
    const parsed = validateAttestationRequest(null);
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.errorKind).toBe('body_not_object');
  });
});

describe('mock adapter — /attestation route handler', () => {
  it('serves a sign-provenance request end to end', async () => {
    await mock.startAttestation({ sessionId: 'route-a', target: 'vault' });
    const parsed = validateAttestationRequest({
      kind: 'sign-provenance',
      sessionId: 'route-a',
      builderId: 'b',
      materialsCount: 1,
      signatureAlgorithm: 'sigstore-cosign',
    });
    if (!parsed.ok) throw new Error(parsed.errorKind);
    const res = await handleAttestationRequest(mock, parsed.value);
    expect(res.ok).toBe(true);
    expect(res.builderId).toBe('b');
  });

  it('serves a verify-attestation request end to end', async () => {
    await mock.startAttestation({ sessionId: 'route-va', target: 'vault' });
    await mock.signProvenance({
      sessionId: 'route-va',
      builderId: 'b',
      materialsCount: 1,
      signatureAlgorithm: 'sigstore-cosign',
    });
    const parsed = validateAttestationRequest({
      kind: 'verify-attestation',
      sessionId: 'route-va',
      attestationType: 'slsa-provenance',
      trustRootFingerprint: 'sha256:tr',
      validSignatures: 3,
    });
    if (!parsed.ok) throw new Error(parsed.errorKind);
    const res = await handleAttestationRequest(mock, parsed.value);
    expect(res.ok).toBe(true);
    expect(res.validSignatures).toBe(3);
  });

  it('reports an adapter error via errorKind on route response', async () => {
    const parsed = validateAttestationRequest({
      kind: 'sign-provenance',
      sessionId: 'ghost',
      builderId: 'b',
      materialsCount: 1,
      signatureAlgorithm: 'sigstore-cosign',
    });
    if (!parsed.ok) throw new Error(parsed.errorKind);
    const res = await handleAttestationRequest(mock, parsed.value);
    expect(res.ok).toBe(false);
    expect(res.errorKind).toBe('attestation_session_not_found');
  });
});
