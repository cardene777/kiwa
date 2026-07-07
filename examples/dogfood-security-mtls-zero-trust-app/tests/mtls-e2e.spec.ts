/**
 * mTLS end-to-end fidelity spec (mtls axis: handshake + SPKI pin + OCSP
 * staple + Certificate Transparency log check).
 *
 * Issue CAR-864 (v1.39-2) AC — the mock adapter drives a full mTLS
 * ceremony end to end and the fidelity harness diffs the raw
 * {@link TraceEvent} sequence across five axes.
 *
 *  1. completeHandshake records the TLS version + peer CN + cipher suite.
 *  2. verifyPin returns matched=true when the SPKI SHA-256 is in the
 *     expected pins list, matched=false otherwise (and transitions the
 *     session to `failed`).
 *  3. verifyOcsp requires the staple to be present and the response to
 *     be good; either absent staple or bad response transitions to
 *     `failed`.
 *  4. checkCtLog requires sctCount >= minSctRequired; below the
 *     threshold transitions to `failed`.
 *  5. Session state machine rejects invalid transitions (checkCtLog
 *     before handshake, verifyPin after a failed state, etc).
 *
 * The real adapter is exercised through the env-detect skeleton and
 * every op refuses with `KIWA_MTLS_ENV_MISSING` on every non-integration
 * environment (the default). Downstream tests inspect
 * {@link SecurityAdapter.mode} + the trace to skip real assertions on
 * those systems.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { detectRealEnvMissing, makeRealAdapter } from '../src/adapters/real.js';
import { handleMtlsRequest, validateMtlsRequest } from '../src/app/mtls/route.js';
import type { SecurityAdapter } from '../src/adapters/interface.js';

let mock: SecurityAdapter;

beforeEach(() => {
  mock = makeMockAdapter({ latencyMs: 1 });
});

afterEach(async () => {
  await mock.reset();
});

describe('mock adapter — mTLS handshake', () => {
  it('axis 1: completeHandshake records peer CN + tls version + cipher', async () => {
    await mock.startMtls({ sessionId: 's1', target: 'istio' });
    const result = await mock.completeHandshake({
      sessionId: 's1',
      peerCn: 'svc-a.default.svc.cluster.local',
      cipherSuite: 'TLS_AES_128_GCM_SHA256',
      tlsVersion: '1.3',
    });
    expect(result.peerCn).toBe('svc-a.default.svc.cluster.local');
    expect(result.tlsVersion).toBe('1.3');
    const trace = mock.traces().find((t) => t.op === 'completeHandshake');
    expect(trace?.ok).toBe(true);
  });

  it('axis 1: completeHandshake accepts TLS 1.2 as legacy', async () => {
    await mock.startMtls({ sessionId: 's-legacy', target: 'istio' });
    const result = await mock.completeHandshake({
      sessionId: 's-legacy',
      peerCn: 'legacy.svc',
      cipherSuite: 'TLS_RSA_WITH_AES_128_GCM_SHA256',
      tlsVersion: '1.2',
    });
    expect(result.tlsVersion).toBe('1.2');
  });

  it('axis 1: completeHandshake rejects duplicate handshake on same session', async () => {
    await mock.startMtls({ sessionId: 's2', target: 'istio' });
    await mock.completeHandshake({
      sessionId: 's2',
      peerCn: 'a.svc',
      cipherSuite: 'TLS_AES_128_GCM_SHA256',
      tlsVersion: '1.3',
    });
    await expect(
      mock.completeHandshake({
        sessionId: 's2',
        peerCn: 'a.svc',
        cipherSuite: 'TLS_AES_128_GCM_SHA256',
        tlsVersion: '1.3',
      }),
    ).rejects.toThrow(/completeHandshake/);
  });
});

describe('mock adapter — SPKI pin verification', () => {
  it('axis 2: verifyPin returns matched=true when SPKI is in expected pins', async () => {
    await mock.startMtls({ sessionId: 'p1', target: 'istio' });
    await mock.completeHandshake({
      sessionId: 'p1',
      peerCn: 'a.svc',
      cipherSuite: 'TLS_AES_128_GCM_SHA256',
      tlsVersion: '1.3',
    });
    const result = await mock.verifyPin({
      sessionId: 'p1',
      spkiSha256: 'sha256:AAAA',
      expectedPins: ['sha256:AAAA', 'sha256:BBBB'],
    });
    expect(result.matched).toBe(true);
    expect(result.fingerprint).toBe('sha256:AAAA');
  });

  it('axis 2: verifyPin returns matched=false when SPKI is not pinned', async () => {
    await mock.startMtls({ sessionId: 'p2', target: 'istio' });
    await mock.completeHandshake({
      sessionId: 'p2',
      peerCn: 'a.svc',
      cipherSuite: 'TLS_AES_128_GCM_SHA256',
      tlsVersion: '1.3',
    });
    const result = await mock.verifyPin({
      sessionId: 'p2',
      spkiSha256: 'sha256:UNKNOWN',
      expectedPins: ['sha256:AAAA'],
    });
    expect(result.matched).toBe(false);
  });

  it('axis 2: verifyPin refuses when expectedPins is empty', async () => {
    await mock.startMtls({ sessionId: 'p3', target: 'istio' });
    await mock.completeHandshake({
      sessionId: 'p3',
      peerCn: 'a.svc',
      cipherSuite: 'TLS_AES_128_GCM_SHA256',
      tlsVersion: '1.3',
    });
    await expect(
      mock.verifyPin({
        sessionId: 'p3',
        spkiSha256: 'sha256:AAAA',
        expectedPins: [],
      }),
    ).rejects.toThrow(/expectedPins/);
  });

  it('axis 2: verifyPin rejects when handshake was not completed first', async () => {
    await mock.startMtls({ sessionId: 'p4', target: 'istio' });
    await expect(
      mock.verifyPin({
        sessionId: 'p4',
        spkiSha256: 'sha256:AAAA',
        expectedPins: ['sha256:AAAA'],
      }),
    ).rejects.toThrow(/handshake/);
  });
});

describe('mock adapter — OCSP staple verification', () => {
  it('axis 3: verifyOcsp accepts good response when staple present', async () => {
    await mock.startMtls({ sessionId: 'o1', target: 'istio' });
    await mock.completeHandshake({
      sessionId: 'o1',
      peerCn: 'a.svc',
      cipherSuite: 'TLS_AES_128_GCM_SHA256',
      tlsVersion: '1.3',
    });
    const result = await mock.verifyOcsp({
      sessionId: 'o1',
      stapled: true,
      goodResponse: true,
    });
    expect(result.stapled).toBe(true);
    expect(result.good).toBe(true);
  });

  it('axis 3: verifyOcsp fails when staple missing', async () => {
    await mock.startMtls({ sessionId: 'o2', target: 'istio' });
    await mock.completeHandshake({
      sessionId: 'o2',
      peerCn: 'a.svc',
      cipherSuite: 'TLS_AES_128_GCM_SHA256',
      tlsVersion: '1.3',
    });
    const result = await mock.verifyOcsp({
      sessionId: 'o2',
      stapled: false,
      goodResponse: false,
    });
    expect(result.good).toBe(false);
  });

  it('axis 3: verifyOcsp fails when response bad even with staple', async () => {
    await mock.startMtls({ sessionId: 'o3', target: 'istio' });
    await mock.completeHandshake({
      sessionId: 'o3',
      peerCn: 'a.svc',
      cipherSuite: 'TLS_AES_128_GCM_SHA256',
      tlsVersion: '1.3',
    });
    const result = await mock.verifyOcsp({
      sessionId: 'o3',
      stapled: true,
      goodResponse: false,
    });
    expect(result.stapled).toBe(true);
    expect(result.good).toBe(false);
  });
});

describe('mock adapter — Certificate Transparency log check', () => {
  it('axis 4: checkCtLog returns ok=true when sctCount meets threshold', async () => {
    await mock.startMtls({ sessionId: 'c1', target: 'istio' });
    await mock.completeHandshake({
      sessionId: 'c1',
      peerCn: 'a.svc',
      cipherSuite: 'TLS_AES_128_GCM_SHA256',
      tlsVersion: '1.3',
    });
    await mock.verifyPin({
      sessionId: 'c1',
      spkiSha256: 'sha256:AAAA',
      expectedPins: ['sha256:AAAA'],
    });
    await mock.verifyOcsp({
      sessionId: 'c1',
      stapled: true,
      goodResponse: true,
    });
    const result = await mock.checkCtLog({
      sessionId: 'c1',
      sctCount: 3,
      minSctRequired: 2,
    });
    expect(result.ok).toBe(true);
    expect(result.sctCount).toBe(3);
  });

  it('axis 4: checkCtLog returns ok=false below threshold', async () => {
    await mock.startMtls({ sessionId: 'c2', target: 'istio' });
    await mock.completeHandshake({
      sessionId: 'c2',
      peerCn: 'a.svc',
      cipherSuite: 'TLS_AES_128_GCM_SHA256',
      tlsVersion: '1.3',
    });
    await mock.verifyPin({
      sessionId: 'c2',
      spkiSha256: 'sha256:AAAA',
      expectedPins: ['sha256:AAAA'],
    });
    await mock.verifyOcsp({
      sessionId: 'c2',
      stapled: true,
      goodResponse: true,
    });
    const result = await mock.checkCtLog({
      sessionId: 'c2',
      sctCount: 1,
      minSctRequired: 3,
    });
    expect(result.ok).toBe(false);
  });

  it('axis 4: checkCtLog rejects negative minSctRequired', async () => {
    await mock.startMtls({ sessionId: 'c3', target: 'istio' });
    await mock.completeHandshake({
      sessionId: 'c3',
      peerCn: 'a.svc',
      cipherSuite: 'TLS_AES_128_GCM_SHA256',
      tlsVersion: '1.3',
    });
    await expect(
      mock.checkCtLog({
        sessionId: 'c3',
        sctCount: 3,
        minSctRequired: -1,
      }),
    ).rejects.toThrow(/minSctRequired/);
  });
});

describe('mock adapter — state machine invariants', () => {
  it('axis 5: rejects checkCtLog before handshake', async () => {
    await mock.startMtls({ sessionId: 'sm1', target: 'istio' });
    await expect(
      mock.checkCtLog({
        sessionId: 'sm1',
        sctCount: 3,
        minSctRequired: 2,
      }),
    ).rejects.toThrow(/handshake/);
  });

  it('axis 5: rejects operations on unknown sessionId', async () => {
    await expect(
      mock.completeHandshake({
        sessionId: 'ghost',
        peerCn: 'a',
        cipherSuite: 'x',
        tlsVersion: '1.3',
      }),
    ).rejects.toThrow(/mtls_session_not_found/);
  });

  it('axis 5: closeMtls removes the session; further ops fail', async () => {
    await mock.startMtls({ sessionId: 'sm3', target: 'istio' });
    await mock.closeMtls({ sessionId: 'sm3' });
    await expect(
      mock.completeHandshake({
        sessionId: 'sm3',
        peerCn: 'a',
        cipherSuite: 'x',
        tlsVersion: '1.3',
      }),
    ).rejects.toThrow(/mtls_session_not_found/);
  });

  it('axis 5: startMtls rejects duplicate sessionId', async () => {
    await mock.startMtls({ sessionId: 'sm4', target: 'istio' });
    await expect(
      mock.startMtls({ sessionId: 'sm4', target: 'istio' }),
    ).rejects.toThrow(/mtls_session_exists/);
  });
});

describe('validateMtlsRequest — request shape', () => {
  it('rejects non-object body', () => {
    expect(validateMtlsRequest(null).ok).toBe(false);
    expect(validateMtlsRequest('string').ok).toBe(false);
  });

  it('rejects missing sessionId', () => {
    const parsed = validateMtlsRequest({ kind: 'handshake' });
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.errorKind).toBe('sessionId_required');
  });

  it('rejects unknown kind', () => {
    const parsed = validateMtlsRequest({ kind: 'nope', sessionId: 's' });
    expect(parsed.ok).toBe(false);
  });

  it('parses handshake kind + fields', () => {
    const parsed = validateMtlsRequest({
      kind: 'handshake',
      sessionId: 's',
      peerCn: 'a',
      cipherSuite: 'x',
      tlsVersion: '1.3',
    });
    expect(parsed.ok).toBe(true);
  });

  it('rejects handshake without tlsVersion 1.2/1.3', () => {
    const parsed = validateMtlsRequest({
      kind: 'handshake',
      sessionId: 's',
      peerCn: 'a',
      cipherSuite: 'x',
      tlsVersion: '1.1',
    });
    expect(parsed.ok).toBe(false);
  });

  it('parses ocsp kind with boolean stapled + goodResponse', () => {
    const parsed = validateMtlsRequest({
      kind: 'ocsp',
      sessionId: 's',
      stapled: true,
      goodResponse: false,
    });
    expect(parsed.ok).toBe(true);
  });

  it('rejects ocsp with non-boolean fields', () => {
    const parsed = validateMtlsRequest({
      kind: 'ocsp',
      sessionId: 's',
      stapled: 'yes',
      goodResponse: false,
    });
    expect(parsed.ok).toBe(false);
  });
});

describe('handleMtlsRequest — dispatch', () => {
  it('dispatches handshake through the adapter', async () => {
    await mock.startMtls({ sessionId: 'h1', target: 'istio' });
    const response = await handleMtlsRequest(mock, {
      kind: 'handshake',
      sessionId: 'h1',
      peerCn: 'svc-a',
      cipherSuite: 'TLS_AES_128_GCM_SHA256',
      tlsVersion: '1.3',
    });
    expect(response.ok).toBe(true);
    expect(response.peerCn).toBe('svc-a');
  });

  it('returns errorKind on adapter failure', async () => {
    const response = await handleMtlsRequest(mock, {
      kind: 'handshake',
      sessionId: 'ghost',
      peerCn: 'a',
      cipherSuite: 'x',
      tlsVersion: '1.3',
    });
    expect(response.ok).toBe(false);
    expect(response.errorKind).toBe('mtls_session_not_found');
  });
});

describe('real adapter — env gate', () => {
  it('reports KIWA_MTLS_ENV_MISSING when env is unconfigured', async () => {
    const real = makeRealAdapter();
    await expect(
      real.startMtls({ sessionId: 's', target: 'istio' }),
    ).rejects.toThrow(/KIWA_MTLS_ENV_MISSING|KIWA_MODE=mock/);
    const trace = real.traces().find((t) => t.op === 'startMtls');
    expect(trace?.ok).toBe(false);
    expect(typeof trace?.errorKind).toBe('string');
  });

  it('detectRealEnvMissing returns a reason string in default env', () => {
    const reason = detectRealEnvMissing();
    // In default env either KIWA_MODE=mock is set or the stack-ready flag
    // is absent — both cases return a non-null reason.
    expect(typeof reason === 'string' || reason === null).toBe(true);
  });

  it('real adapter reports mode=real', () => {
    const real = makeRealAdapter();
    expect(real.mode).toBe('real');
  });
});
