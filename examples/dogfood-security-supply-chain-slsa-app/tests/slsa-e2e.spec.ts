/**
 * SLSA supply-chain end-to-end fidelity spec (supply-chain axis: SLSA
 * level 0-4 gate).
 *
 * Issue CAR-866 (v1.39-4) AC — the mock adapter drives the SLSA gate
 * end to end and the fidelity harness diffs the raw {@link TraceEvent}
 * sequence across five axes.
 *
 *  1. verifySlsaLevel picks level 1 when the build is scripted from
 *     repo + provenance exists but the service isn't trustworthy.
 *  2. verifySlsaLevel picks level 2 when a trustworthy build service
 *     signs authenticated provenance.
 *  3. verifySlsaLevel picks level 3 when the build is isolated and the
 *     provenance is non-falsifiable.
 *  4. verifySlsaLevel picks level 4 only when the parameterizable
 *     flag is false (SLSA 4 forbids user-controlled build params).
 *  5. Session state machine rejects invalid transitions
 *     (verifySlsaLevel twice on the same session, closeSlsa on ghost).
 *
 * The real adapter is exercised through the env-detect skeleton and
 * every op refuses with `KIWA_COSIGN_ENV_MISSING` on every
 * non-integration environment (the default). Downstream tests inspect
 * {@link SecurityAdapter.mode} + the trace to skip real assertions on
 * those systems.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { detectRealEnvMissing, makeRealAdapter } from '../src/adapters/real.js';
import {
  handleSupplyChainRequest,
  validateSupplyChainRequest,
} from '../src/app/supply-chain/route.js';
import type { SecurityAdapter } from '../src/adapters/interface.js';

const FULL_INPUT = {
  buildScriptedFromRepo: true,
  buildServiceIsTrustworthy: true,
  buildParameterizable: false,
  buildIsolated: true,
  provenanceExists: true,
  provenanceAuthenticated: true,
  provenanceServiceGenerated: true,
  provenanceNonFalsifiable: true,
};

let mock: SecurityAdapter;

beforeEach(() => {
  mock = makeMockAdapter({ latencyMs: 1 });
});

afterEach(async () => {
  await mock.reset();
});

describe('mock adapter — SLSA level 0-4 gate', () => {
  it('axis 1: level 0 when no build is scripted from repo', async () => {
    await mock.startSlsa({ sessionId: 's0', target: 'opa' });
    const result = await mock.verifySlsaLevel({
      sessionId: 's0',
      ...FULL_INPUT,
      buildScriptedFromRepo: false,
      provenanceExists: false,
    });
    expect(result.level).toBe(0);
    const trace = mock.traces().find((t) => t.op === 'verifySlsaLevel');
    expect(trace?.ok).toBe(true);
  });

  it('axis 1: level 1 when build is scripted from repo + provenance exists', async () => {
    await mock.startSlsa({ sessionId: 's1', target: 'opa' });
    const result = await mock.verifySlsaLevel({
      sessionId: 's1',
      ...FULL_INPUT,
      buildServiceIsTrustworthy: false,
      buildIsolated: false,
      provenanceAuthenticated: false,
      provenanceServiceGenerated: false,
      provenanceNonFalsifiable: false,
    });
    expect(result.level).toBe(1);
    expect(result.buildScriptedFromRepo).toBe(true);
    expect(result.provenanceExists).toBe(true);
  });

  it('axis 2: level 2 when trustworthy build service + authenticated + service-generated provenance', async () => {
    await mock.startSlsa({ sessionId: 's2', target: 'opa' });
    const result = await mock.verifySlsaLevel({
      sessionId: 's2',
      ...FULL_INPUT,
      buildIsolated: false,
      provenanceNonFalsifiable: false,
    });
    expect(result.level).toBe(2);
  });

  it('axis 3: level 3 when build is isolated + provenance is non-falsifiable', async () => {
    await mock.startSlsa({ sessionId: 's3', target: 'opa' });
    const result = await mock.verifySlsaLevel({
      sessionId: 's3',
      ...FULL_INPUT,
      buildParameterizable: true,
    });
    expect(result.level).toBe(3);
    expect(result.buildIsolated).toBe(true);
  });

  it('axis 4: level 4 only when parameterizable is false', async () => {
    await mock.startSlsa({ sessionId: 's4', target: 'opa' });
    const result = await mock.verifySlsaLevel({
      sessionId: 's4',
      ...FULL_INPUT,
    });
    expect(result.level).toBe(4);
  });

  it('axis 5: verifySlsaLevel rejects when session missing', async () => {
    await expect(
      mock.verifySlsaLevel({
        sessionId: 'ghost',
        ...FULL_INPUT,
      }),
    ).rejects.toThrow(/slsa_session_not_found/);
  });

  it('axis 5: verifySlsaLevel rejects when called twice on the same session', async () => {
    await mock.startSlsa({ sessionId: 's-dup', target: 'opa' });
    await mock.verifySlsaLevel({ sessionId: 's-dup', ...FULL_INPUT });
    await expect(
      mock.verifySlsaLevel({ sessionId: 's-dup', ...FULL_INPUT }),
    ).rejects.toThrow(/session is/);
  });
});

describe('mock adapter — SLSA session lifecycle', () => {
  it('axis 5: startSlsa rejects duplicate session ids', async () => {
    await mock.startSlsa({ sessionId: 'dup', target: 'opa' });
    await expect(
      mock.startSlsa({ sessionId: 'dup', target: 'opa' }),
    ).rejects.toThrow(/slsa_session_exists/);
  });

  it('axis 5: closeSlsa removes session from bookkeeping', async () => {
    await mock.startSlsa({ sessionId: 's-close', target: 'opa' });
    await mock.closeSlsa({ sessionId: 's-close' });
    await expect(mock.closeSlsa({ sessionId: 's-close' })).rejects.toThrow(
      /slsa_session_not_found/,
    );
  });
});

describe('mock adapter — /supply-chain route validation', () => {
  it('accepts verify-slsa-level requests with all required booleans', () => {
    const parsed = validateSupplyChainRequest({
      kind: 'verify-slsa-level',
      sessionId: 's1',
      ...FULL_INPUT,
    });
    expect(parsed.ok).toBe(true);
  });

  it('rejects verify-slsa-level requests missing a required boolean', () => {
    const parsed = validateSupplyChainRequest({
      kind: 'verify-slsa-level',
      sessionId: 's1',
      buildScriptedFromRepo: true,
      buildServiceIsTrustworthy: true,
      buildParameterizable: true,
      buildIsolated: true,
      provenanceExists: true,
      provenanceAuthenticated: true,
      provenanceServiceGenerated: true,
      // provenanceNonFalsifiable omitted
    });
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.errorKind).toBe('provenanceNonFalsifiable_required_boolean');
    }
  });

  it('rejects an unknown kind', () => {
    const parsed = validateSupplyChainRequest({
      kind: 'unknown',
      sessionId: 's1',
    });
    expect(parsed.ok).toBe(false);
  });

  it('rejects a missing sessionId', () => {
    const parsed = validateSupplyChainRequest({
      kind: 'verify-slsa-level',
      ...FULL_INPUT,
    });
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.errorKind).toBe('sessionId_required');
  });

  it('rejects a non-object body', () => {
    const parsed = validateSupplyChainRequest(null);
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.errorKind).toBe('body_not_object');
  });
});

describe('mock adapter — /supply-chain route handler', () => {
  it('serves a verify-slsa-level request end to end', async () => {
    await mock.startSlsa({ sessionId: 'route-s', target: 'opa' });
    const parsed = validateSupplyChainRequest({
      kind: 'verify-slsa-level',
      sessionId: 'route-s',
      ...FULL_INPUT,
    });
    if (!parsed.ok) throw new Error(parsed.errorKind);
    const res = await handleSupplyChainRequest(mock, parsed.value);
    expect(res.ok).toBe(true);
    expect(res.level).toBe(4);
  });

  it('reports an adapter error via errorKind on route response', async () => {
    const parsed = validateSupplyChainRequest({
      kind: 'verify-slsa-level',
      sessionId: 'ghost',
      ...FULL_INPUT,
    });
    if (!parsed.ok) throw new Error(parsed.errorKind);
    const res = await handleSupplyChainRequest(mock, parsed.value);
    expect(res.ok).toBe(false);
    expect(res.errorKind).toBe('slsa_session_not_found');
  });
});

describe('real adapter — cosign env-detect skeleton', () => {
  it('detects KIWA_COSIGN_ENV_MISSING when COSIGN_STACK_READY is unset', () => {
    const prevMode = process.env['KIWA_MODE'];
    const prevReady = process.env['COSIGN_STACK_READY'];
    delete process.env['KIWA_MODE'];
    delete process.env['COSIGN_STACK_READY'];
    try {
      expect(detectRealEnvMissing()).toBe('KIWA_COSIGN_ENV_MISSING');
    } finally {
      if (prevMode !== undefined) process.env['KIWA_MODE'] = prevMode;
      if (prevReady !== undefined) process.env['COSIGN_STACK_READY'] = prevReady;
    }
  });

  it('reports each missing env key by name when COSIGN_STACK_READY=1', () => {
    const backup = {
      KIWA_MODE: process.env['KIWA_MODE'],
      COSIGN_STACK_READY: process.env['COSIGN_STACK_READY'],
      KIWA_COSIGN_BIN: process.env['KIWA_COSIGN_BIN'],
      KIWA_IN_TOTO_URL: process.env['KIWA_IN_TOTO_URL'],
      KIWA_REKOR_URL: process.env['KIWA_REKOR_URL'],
      KIWA_COSIGN_TRUST_ROOT: process.env['KIWA_COSIGN_TRUST_ROOT'],
    };
    try {
      delete process.env['KIWA_MODE'];
      process.env['COSIGN_STACK_READY'] = '1';
      delete process.env['KIWA_COSIGN_BIN'];
      delete process.env['KIWA_IN_TOTO_URL'];
      delete process.env['KIWA_REKOR_URL'];
      delete process.env['KIWA_COSIGN_TRUST_ROOT'];
      expect(detectRealEnvMissing()).toBe('KIWA_COSIGN_BIN_MISSING');

      process.env['KIWA_COSIGN_BIN'] = '/usr/local/bin/cosign';
      expect(detectRealEnvMissing()).toBe('KIWA_IN_TOTO_URL_MISSING');

      process.env['KIWA_IN_TOTO_URL'] = 'https://in-toto.example';
      expect(detectRealEnvMissing()).toBe('KIWA_REKOR_URL_MISSING');

      process.env['KIWA_REKOR_URL'] = 'https://rekor.example';
      expect(detectRealEnvMissing()).toBe('KIWA_COSIGN_TRUST_ROOT_MISSING');

      process.env['KIWA_COSIGN_TRUST_ROOT'] = 'sha256:trust-root';
      expect(detectRealEnvMissing()).toBeNull();
    } finally {
      for (const [k, v] of Object.entries(backup)) {
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
      }
    }
  });

  it('returns KIWA_MODE=mock when explicit mock override is set', () => {
    const prev = process.env['KIWA_MODE'];
    process.env['KIWA_MODE'] = 'mock';
    try {
      expect(detectRealEnvMissing()).toBe('KIWA_MODE=mock');
    } finally {
      if (prev === undefined) delete process.env['KIWA_MODE'];
      else process.env['KIWA_MODE'] = prev;
    }
  });

  it('every op refuses with the env-missing message when the stack is not ready', async () => {
    const real = makeRealAdapter();
    await expect(
      real.startSlsa({ sessionId: 's', target: 'opa' }),
    ).rejects.toThrow(/KIWA_COSIGN/);
    expect(real.mode).toBe('real');
    expect(real.traces().length).toBeGreaterThan(0);
  });
});
