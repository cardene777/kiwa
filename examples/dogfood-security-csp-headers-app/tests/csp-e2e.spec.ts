/**
 * CSP end-to-end fidelity spec (csp axis: nonce + hash + strict-dynamic +
 * trusted-types + report-only).
 *
 * Sub-Issue CAR-826 (v1.37-2) AC — the mock adapter drives a full CSP
 * builder ceremony end to end and the fidelity harness diffs the raw
 * {@link TraceEvent} sequence across five axes.
 *
 *  1. attachNonce grows the script-src `'nonce-...'` source list and
 *     validates the nonce shape (>= 22 base64url chars).
 *  2. attachHash grows the script-src `'sha256-...'` / `'sha384-...'` /
 *     `'sha512-...'` source list.
 *  3. applyStrictDynamic requires at least one nonce or hash in script-src
 *     otherwise the whole policy has no effect (guard raises).
 *  4. applyTrustedTypes adds `trusted-types` + optional
 *     `require-trusted-types-for 'script'`.
 *  5. emitCspHeader flips `Content-Security-Policy` to
 *     `Content-Security-Policy-Report-Only` when reportOnly=true.
 *
 * The real adapter is exercised through the env-detect skeleton and every
 * op refuses with `KIWA_CSP_ENV_MISSING` on every non-integration
 * environment (the default). Downstream tests inspect
 * {@link SecurityAdapter.mode} + the trace to skip real assertions on
 * those systems.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { detectRealEnvMissing, makeRealAdapter } from '../src/adapters/real.js';
import {
  handleCspRequest,
  validateCspRequest,
} from '../src/app/csp/route.js';
import type { SecurityAdapter } from '../src/adapters/interface.js';

const VALID_NONCE = 'AAAAAAAAAAAAAAAAAAAAAA';
const SHORT_NONCE = 'AAAA';
const SECOND_NONCE = 'BBBBBBBBBBBBBBBBBBBBBB';
const HASH_DIGEST = 'YWJjZA==';

let mock: SecurityAdapter;

beforeEach(() => {
  mock = makeMockAdapter({ latencyMs: 1 });
});

afterEach(async () => {
  await mock.reset();
});

describe('mock adapter — CSP nonce', () => {
  it('axis 1: attachNonce appends nonce to script-src', async () => {
    await mock.startCsp({ routeId: '/app', policyId: 'p1' });
    await mock.attachNonce({
      routeId: '/app',
      policyId: 'p1',
      nonce: VALID_NONCE,
    });
    const out = await mock.emitCspHeader({
      routeId: '/app',
      policyId: 'p1',
      reportOnly: false,
    });
    expect(out.headerValue).toContain(`'nonce-${VALID_NONCE}'`);
    expect(out.nonce).toBe(VALID_NONCE);
  });

  it('axis 1: attachNonce trace records the nonce', async () => {
    await mock.startCsp({ routeId: '/app', policyId: 'p2' });
    await mock.attachNonce({
      routeId: '/app',
      policyId: 'p2',
      nonce: VALID_NONCE,
    });
    const trace = mock.traces().find((t) => t.op === 'attachNonce');
    expect(trace?.ok).toBe(true);
    expect((trace?.detail as { nonce?: string })?.nonce).toBe(VALID_NONCE);
  });

  it('axis 1: attachNonce rejects a nonce shorter than 22 chars', async () => {
    await mock.startCsp({ routeId: '/app', policyId: 'p3' });
    await expect(
      mock.attachNonce({
        routeId: '/app',
        policyId: 'p3',
        nonce: SHORT_NONCE,
      }),
    ).rejects.toThrow(/too short/i);
    const trace = mock.traces().find((t) => t.op === 'attachNonce' && !t.ok);
    expect(trace).toBeDefined();
  });

  it('axis 1: two nonces attached to the same policy both appear in the header', async () => {
    await mock.startCsp({ routeId: '/app', policyId: 'p4' });
    await mock.attachNonce({
      routeId: '/app',
      policyId: 'p4',
      nonce: VALID_NONCE,
    });
    await mock.attachNonce({
      routeId: '/app',
      policyId: 'p4',
      nonce: SECOND_NONCE,
    });
    const out = await mock.emitCspHeader({
      routeId: '/app',
      policyId: 'p4',
      reportOnly: false,
    });
    expect(out.headerValue).toContain(`'nonce-${VALID_NONCE}'`);
    expect(out.headerValue).toContain(`'nonce-${SECOND_NONCE}'`);
  });
});

describe('mock adapter — CSP hash', () => {
  it('axis 2: attachHash sha256 appears in script-src', async () => {
    await mock.startCsp({ routeId: '/app', policyId: 'ph1' });
    await mock.attachHash({
      routeId: '/app',
      policyId: 'ph1',
      algorithm: 'sha256',
      digest: HASH_DIGEST,
    });
    const out = await mock.emitCspHeader({
      routeId: '/app',
      policyId: 'ph1',
      reportOnly: false,
    });
    expect(out.headerValue).toContain(`'sha256-${HASH_DIGEST}'`);
  });

  it('axis 2: attachHash supports sha384 and sha512', async () => {
    await mock.startCsp({ routeId: '/app', policyId: 'ph2' });
    await mock.attachHash({
      routeId: '/app',
      policyId: 'ph2',
      algorithm: 'sha384',
      digest: 'ZmFrZQ==',
    });
    await mock.attachHash({
      routeId: '/app',
      policyId: 'ph2',
      algorithm: 'sha512',
      digest: 'ZmFrZTI=',
    });
    const out = await mock.emitCspHeader({
      routeId: '/app',
      policyId: 'ph2',
      reportOnly: false,
    });
    expect(out.headerValue).toContain("'sha384-ZmFrZQ=='");
    expect(out.headerValue).toContain("'sha512-ZmFrZTI='");
  });

  it('axis 2: attachHash trace records algorithm and digest', async () => {
    await mock.startCsp({ routeId: '/app', policyId: 'ph3' });
    await mock.attachHash({
      routeId: '/app',
      policyId: 'ph3',
      algorithm: 'sha256',
      digest: HASH_DIGEST,
    });
    const trace = mock.traces().find((t) => t.op === 'attachHash');
    expect((trace?.detail as { algorithm?: string })?.algorithm).toBe('sha256');
    expect((trace?.detail as { digest?: string })?.digest).toBe(HASH_DIGEST);
  });
});

describe('mock adapter — strict-dynamic', () => {
  it('axis 3: applyStrictDynamic with a nonce emits strict-dynamic in script-src', async () => {
    await mock.startCsp({ routeId: '/app', policyId: 'sd1' });
    await mock.attachNonce({
      routeId: '/app',
      policyId: 'sd1',
      nonce: VALID_NONCE,
    });
    await mock.applyStrictDynamic({ routeId: '/app', policyId: 'sd1' });
    const out = await mock.emitCspHeader({
      routeId: '/app',
      policyId: 'sd1',
      reportOnly: false,
    });
    expect(out.strictDynamicApplied).toBe(true);
    expect(out.headerValue).toContain("'strict-dynamic'");
  });

  it('axis 3: applyStrictDynamic without nonce or hash fails at emit time', async () => {
    await mock.startCsp({ routeId: '/app', policyId: 'sd2' });
    await mock.applyStrictDynamic({ routeId: '/app', policyId: 'sd2' });
    await expect(
      mock.emitCspHeader({
        routeId: '/app',
        policyId: 'sd2',
        reportOnly: false,
      }),
    ).rejects.toThrow(/strict-dynamic requires at least one nonce or hash/);
  });

  it('axis 3: applyStrictDynamic with a hash is enough (nonce not required)', async () => {
    await mock.startCsp({ routeId: '/app', policyId: 'sd3' });
    await mock.attachHash({
      routeId: '/app',
      policyId: 'sd3',
      algorithm: 'sha256',
      digest: HASH_DIGEST,
    });
    await mock.applyStrictDynamic({ routeId: '/app', policyId: 'sd3' });
    const out = await mock.emitCspHeader({
      routeId: '/app',
      policyId: 'sd3',
      reportOnly: false,
    });
    expect(out.headerValue).toContain("'strict-dynamic'");
  });
});

describe('mock adapter — trusted-types', () => {
  it('axis 4: applyTrustedTypes emits trusted-types directive', async () => {
    await mock.startCsp({ routeId: '/app', policyId: 'tt1' });
    await mock.applyTrustedTypes({
      routeId: '/app',
      policyId: 'tt1',
      policies: ['default', 'dompurify'],
      requireForScript: false,
    });
    const out = await mock.emitCspHeader({
      routeId: '/app',
      policyId: 'tt1',
      reportOnly: false,
    });
    expect(out.trustedTypesApplied).toBe(true);
    expect(out.headerValue).toContain('trusted-types default dompurify');
  });

  it('axis 4: applyTrustedTypes with requireForScript adds require-trusted-types-for', async () => {
    await mock.startCsp({ routeId: '/app', policyId: 'tt2' });
    await mock.applyTrustedTypes({
      routeId: '/app',
      policyId: 'tt2',
      policies: ['default'],
      requireForScript: true,
    });
    const out = await mock.emitCspHeader({
      routeId: '/app',
      policyId: 'tt2',
      reportOnly: false,
    });
    expect(out.headerValue).toContain("require-trusted-types-for 'script'");
  });

  it('axis 4: applyTrustedTypes trace records policies and requireForScript', async () => {
    await mock.startCsp({ routeId: '/app', policyId: 'tt3' });
    await mock.applyTrustedTypes({
      routeId: '/app',
      policyId: 'tt3',
      policies: ['default'],
      requireForScript: true,
    });
    const trace = mock.traces().find((t) => t.op === 'applyTrustedTypes');
    expect((trace?.detail as { requireForScript?: boolean })?.requireForScript).toBe(
      true,
    );
  });
});

describe('mock adapter — report-only + report-to', () => {
  it('axis 5: emitCspHeader with reportOnly=true flips the header name', async () => {
    await mock.startCsp({ routeId: '/app', policyId: 'ro1' });
    await mock.attachNonce({
      routeId: '/app',
      policyId: 'ro1',
      nonce: VALID_NONCE,
    });
    const out = await mock.emitCspHeader({
      routeId: '/app',
      policyId: 'ro1',
      reportOnly: true,
    });
    expect(out.headerName).toBe('Content-Security-Policy-Report-Only');
    expect(out.reportOnly).toBe(true);
  });

  it('axis 5: emitCspHeader with reportGroup adds report-to and report-uri', async () => {
    await mock.startCsp({ routeId: '/app', policyId: 'rg1' });
    await mock.attachNonce({
      routeId: '/app',
      policyId: 'rg1',
      nonce: VALID_NONCE,
    });
    const out = await mock.emitCspHeader({
      routeId: '/app',
      policyId: 'rg1',
      reportOnly: false,
      reportGroup: 'csp-endpoint',
    });
    expect(out.headerValue).toContain('report-to csp-endpoint');
    expect(out.headerValue).toContain('report-uri /csp-endpoint');
  });

  it('axis 5: emitCspHeader trace records nonce/hash counts', async () => {
    await mock.startCsp({ routeId: '/app', policyId: 'em1' });
    await mock.attachNonce({
      routeId: '/app',
      policyId: 'em1',
      nonce: VALID_NONCE,
    });
    await mock.attachHash({
      routeId: '/app',
      policyId: 'em1',
      algorithm: 'sha256',
      digest: HASH_DIGEST,
    });
    await mock.emitCspHeader({
      routeId: '/app',
      policyId: 'em1',
      reportOnly: false,
    });
    const trace = mock.traces().find((t) => t.op === 'emitCspHeader');
    expect((trace?.detail as { nonceCount?: number })?.nonceCount).toBe(1);
    expect((trace?.detail as { hashCount?: number })?.hashCount).toBe(1);
  });
});

describe('mock adapter — trace ordering + session isolation', () => {
  it('axis 6: trace order matches lifecycle (start → attach → apply → emit)', async () => {
    await mock.startCsp({ routeId: '/app', policyId: 'ord1' });
    await mock.attachNonce({
      routeId: '/app',
      policyId: 'ord1',
      nonce: VALID_NONCE,
    });
    await mock.applyStrictDynamic({ routeId: '/app', policyId: 'ord1' });
    await mock.applyTrustedTypes({
      routeId: '/app',
      policyId: 'ord1',
      policies: ['default'],
      requireForScript: false,
    });
    await mock.emitCspHeader({
      routeId: '/app',
      policyId: 'ord1',
      reportOnly: false,
    });
    const ops = mock.traces().map((t) => t.op);
    expect(ops).toEqual([
      'startCsp',
      'attachNonce',
      'applyStrictDynamic',
      'applyTrustedTypes',
      'emitCspHeader',
    ]);
  });

  it('axis 6: separate policyIds do not leak nonces', async () => {
    await mock.startCsp({ routeId: '/a', policyId: 'A' });
    await mock.startCsp({ routeId: '/b', policyId: 'B' });
    await mock.attachNonce({
      routeId: '/a',
      policyId: 'A',
      nonce: VALID_NONCE,
    });
    await mock.attachNonce({
      routeId: '/b',
      policyId: 'B',
      nonce: SECOND_NONCE,
    });
    const outA = await mock.emitCspHeader({
      routeId: '/a',
      policyId: 'A',
      reportOnly: false,
    });
    const outB = await mock.emitCspHeader({
      routeId: '/b',
      policyId: 'B',
      reportOnly: false,
    });
    expect(outA.headerValue).toContain(VALID_NONCE);
    expect(outA.headerValue).not.toContain(SECOND_NONCE);
    expect(outB.headerValue).toContain(SECOND_NONCE);
    expect(outB.headerValue).not.toContain(VALID_NONCE);
  });

  it('axis 6: attachNonce without startCsp fails', async () => {
    await expect(
      mock.attachNonce({
        routeId: '/app',
        policyId: 'missing',
        nonce: VALID_NONCE,
      }),
    ).rejects.toThrow(/csp_session_missing/);
  });
});

describe('CSP route handler — validation', () => {
  it('validateCspRequest requires routeId', () => {
    const res = validateCspRequest({ kind: 'build', policyId: 'p' });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errorKind).toBe('routeId_required');
  });

  it('validateCspRequest requires policyId', () => {
    const res = validateCspRequest({ kind: 'build', routeId: '/x' });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errorKind).toBe('policyId_required');
  });

  it('validateCspRequest requires kind=build', () => {
    const res = validateCspRequest({
      kind: 'other',
      routeId: '/x',
      policyId: 'p',
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errorKind).toBe('kind_must_be_build');
  });

  it('handleCspRequest returns headerValue on success', async () => {
    const res = await handleCspRequest(mock, {
      kind: 'build',
      routeId: '/app',
      policyId: 'route1',
      nonce: VALID_NONCE,
      strictDynamic: true,
      trustedTypes: { policies: ['default'], requireForScript: true },
      reportOnly: false,
    });
    expect(res.ok).toBe(true);
    expect(res.headerValue).toContain("'strict-dynamic'");
    expect(res.headerValue).toContain('trusted-types default');
  });

  it('handleCspRequest reports errorKind on adapter throw (short nonce)', async () => {
    const res = await handleCspRequest(mock, {
      kind: 'build',
      routeId: '/app',
      policyId: 'route2',
      nonce: SHORT_NONCE,
    });
    expect(res.ok).toBe(false);
    expect(res.errorKind).toMatch(/too short|short/i);
  });
});

describe('real adapter — env-detect skeleton', () => {
  it('detectRealEnvMissing reports KIWA_CSP_ENV_MISSING by default', () => {
    const previousMode = process.env['KIWA_MODE'];
    const previousReady = process.env['CSP_BROWSER_READY'];
    delete process.env['KIWA_MODE'];
    delete process.env['CSP_BROWSER_READY'];
    try {
      expect(detectRealEnvMissing()).toBe('KIWA_CSP_ENV_MISSING');
    } finally {
      if (previousMode !== undefined) process.env['KIWA_MODE'] = previousMode;
      if (previousReady !== undefined)
        process.env['CSP_BROWSER_READY'] = previousReady;
    }
  });

  it('detectRealEnvMissing returns null when CSP_BROWSER_READY=1', () => {
    const previous = process.env['CSP_BROWSER_READY'];
    process.env['CSP_BROWSER_READY'] = '1';
    try {
      expect(detectRealEnvMissing()).toBeNull();
    } finally {
      if (previous === undefined) {
        delete process.env['CSP_BROWSER_READY'];
      } else {
        process.env['CSP_BROWSER_READY'] = previous;
      }
    }
  });

  it('real adapter refuses every op with KIWA_CSP_ENV_MISSING', async () => {
    const real = makeRealAdapter();
    await expect(
      real.startCsp({ routeId: '/x', policyId: 'p' }),
    ).rejects.toThrow(/KIWA_CSP_ENV_MISSING/);
    const trace = real.traces().find((t) => t.op === 'startCsp' && !t.ok);
    expect(trace?.errorKind).toBe('KIWA_CSP_ENV_MISSING');
  });
});
