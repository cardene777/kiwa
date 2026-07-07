/**
 * Advanced security headers end-to-end fidelity spec (headers axis:
 * HSTS + X-Frame-Options + X-Content-Type-Options + Referrer-Policy +
 * Permissions-Policy).
 *
 * Sub-Issue CAR-826 (v1.37-2) AC — the mock adapter drives a full
 * security-headers builder ceremony end to end and the fidelity harness
 * diffs the raw {@link TraceEvent} sequence across five axes.
 *
 *  1. applyHsts writes `Strict-Transport-Security` with max-age /
 *     includeSubDomains / preload flags.
 *  2. applyReferrerPolicy writes `Referrer-Policy`.
 *  3. applyPermissionsPolicy writes `Permissions-Policy` with per-feature
 *     allowlists.
 *  4. emitHeaderBundle folds in `X-Frame-Options` + `X-Content-Type-
 *     Options: nosniff` when requested.
 *  5. validateSecurityHeaders (guard) rejects preload without
 *     includeSubDomains or max-age < 1 year.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { detectRealEnvMissing, makeRealAdapter } from '../src/adapters/real.js';
import {
  handleHeadersRequest,
  validateHeadersRequest,
} from '../src/app/headers/route.js';
import type { SecurityAdapter } from '../src/adapters/interface.js';

const ONE_YEAR_SEC = 31_536_000;

let mock: SecurityAdapter;

beforeEach(() => {
  mock = makeMockAdapter({ latencyMs: 1 });
});

afterEach(async () => {
  await mock.reset();
});

describe('mock adapter — HSTS', () => {
  it('axis 1: applyHsts writes Strict-Transport-Security header', async () => {
    await mock.startHeaders({ routeId: '/app', bundleId: 'h1' });
    await mock.applyHsts({
      routeId: '/app',
      bundleId: 'h1',
      maxAgeSec: ONE_YEAR_SEC,
      includeSubDomains: true,
      preload: false,
    });
    const out = await mock.emitHeaderBundle({
      routeId: '/app',
      bundleId: 'h1',
    });
    expect(out.headers['Strict-Transport-Security']).toContain(
      `max-age=${ONE_YEAR_SEC}`,
    );
    expect(out.headers['Strict-Transport-Security']).toContain(
      'includeSubDomains',
    );
    expect(out.applied).toContain('Strict-Transport-Security');
  });

  it('axis 1: applyHsts preload requires includeSubDomains + maxAge >= 1 year', async () => {
    await mock.startHeaders({ routeId: '/app', bundleId: 'h2' });
    await mock.applyHsts({
      routeId: '/app',
      bundleId: 'h2',
      maxAgeSec: 100,
      includeSubDomains: false,
      preload: true,
    });
    await expect(
      mock.emitHeaderBundle({ routeId: '/app', bundleId: 'h2' }),
    ).rejects.toThrow(/preload requires includeSubDomains/);
  });

  it('axis 1: applyHsts trace records maxAge, includeSubDomains, preload', async () => {
    await mock.startHeaders({ routeId: '/app', bundleId: 'h3' });
    await mock.applyHsts({
      routeId: '/app',
      bundleId: 'h3',
      maxAgeSec: ONE_YEAR_SEC,
      includeSubDomains: true,
      preload: true,
    });
    const trace = mock.traces().find((t) => t.op === 'applyHsts');
    expect((trace?.detail as { maxAgeSec?: number })?.maxAgeSec).toBe(
      ONE_YEAR_SEC,
    );
    expect(
      (trace?.detail as { includeSubDomains?: boolean })?.includeSubDomains,
    ).toBe(true);
    expect((trace?.detail as { preload?: boolean })?.preload).toBe(true);
  });

  it('axis 1: applyHsts without startHeaders fails', async () => {
    await expect(
      mock.applyHsts({
        routeId: '/app',
        bundleId: 'no-start',
        maxAgeSec: ONE_YEAR_SEC,
        includeSubDomains: true,
        preload: false,
      }),
    ).rejects.toThrow(/headers_session_missing/);
  });
});

describe('mock adapter — Referrer-Policy', () => {
  it('axis 2: applyReferrerPolicy writes Referrer-Policy header', async () => {
    await mock.startHeaders({ routeId: '/app', bundleId: 'r1' });
    await mock.applyReferrerPolicy({
      routeId: '/app',
      bundleId: 'r1',
      policy: 'strict-origin-when-cross-origin',
    });
    const out = await mock.emitHeaderBundle({ routeId: '/app', bundleId: 'r1' });
    expect(out.headers['Referrer-Policy']).toBe(
      'strict-origin-when-cross-origin',
    );
    expect(out.applied).toContain('Referrer-Policy');
  });

  it('axis 2: applyReferrerPolicy trace records the policy value', async () => {
    await mock.startHeaders({ routeId: '/app', bundleId: 'r2' });
    await mock.applyReferrerPolicy({
      routeId: '/app',
      bundleId: 'r2',
      policy: 'no-referrer',
    });
    const trace = mock.traces().find((t) => t.op === 'applyReferrerPolicy');
    expect((trace?.detail as { policy?: string })?.policy).toBe('no-referrer');
  });

  it('axis 2: applyReferrerPolicy with an invalid value marks validation warn', async () => {
    await mock.startHeaders({ routeId: '/app', bundleId: 'r3' });
    await mock.applyReferrerPolicy({
      routeId: '/app',
      bundleId: 'r3',
      policy: 'nonsense-policy',
    });
    const out = await mock.emitHeaderBundle({ routeId: '/app', bundleId: 'r3' });
    expect(out.validationOk).toBe(false);
    expect(out.validationErrors.join(';')).toMatch(/referrer-policy/);
  });
});

describe('mock adapter — Permissions-Policy', () => {
  it('axis 3: applyPermissionsPolicy writes Permissions-Policy header', async () => {
    await mock.startHeaders({ routeId: '/app', bundleId: 'p1' });
    await mock.applyPermissionsPolicy({
      routeId: '/app',
      bundleId: 'p1',
      features: {
        geolocation: 'self',
        camera: 'none',
        microphone: '*',
      },
    });
    const out = await mock.emitHeaderBundle({ routeId: '/app', bundleId: 'p1' });
    expect(out.headers['Permissions-Policy']).toContain('geolocation=(self)');
    expect(out.headers['Permissions-Policy']).toContain('camera=()');
    expect(out.headers['Permissions-Policy']).toContain('microphone=*');
  });

  it('axis 3: applyPermissionsPolicy with explicit origin list emits quoted origins', async () => {
    await mock.startHeaders({ routeId: '/app', bundleId: 'p2' });
    await mock.applyPermissionsPolicy({
      routeId: '/app',
      bundleId: 'p2',
      features: {
        payment: { origins: ['https://a.example.com', 'https://b.example.com'] },
      },
    });
    const out = await mock.emitHeaderBundle({ routeId: '/app', bundleId: 'p2' });
    expect(out.headers['Permissions-Policy']).toContain(
      'payment=("https://a.example.com" "https://b.example.com")',
    );
  });

  it('axis 3: applyPermissionsPolicy trace records feature count', async () => {
    await mock.startHeaders({ routeId: '/app', bundleId: 'p3' });
    await mock.applyPermissionsPolicy({
      routeId: '/app',
      bundleId: 'p3',
      features: {
        geolocation: 'self',
        camera: 'none',
      },
    });
    const trace = mock.traces().find((t) => t.op === 'applyPermissionsPolicy');
    expect((trace?.detail as { featureCount?: number })?.featureCount).toBe(2);
  });
});

describe('mock adapter — X-Frame-Options + X-Content-Type-Options', () => {
  it('axis 4: emitHeaderBundle with xFrame=DENY emits X-Frame-Options', async () => {
    await mock.startHeaders({ routeId: '/app', bundleId: 'x1' });
    const out = await mock.emitHeaderBundle({
      routeId: '/app',
      bundleId: 'x1',
      xFrame: 'DENY',
    });
    expect(out.headers['X-Frame-Options']).toBe('DENY');
    expect(out.applied).toContain('X-Frame-Options');
  });

  it('axis 4: emitHeaderBundle with xFrame=SAMEORIGIN emits SAMEORIGIN', async () => {
    await mock.startHeaders({ routeId: '/app', bundleId: 'x2' });
    const out = await mock.emitHeaderBundle({
      routeId: '/app',
      bundleId: 'x2',
      xFrame: 'SAMEORIGIN',
    });
    expect(out.headers['X-Frame-Options']).toBe('SAMEORIGIN');
  });

  it('axis 4: emitHeaderBundle with xContentTypeOptions=true emits nosniff', async () => {
    await mock.startHeaders({ routeId: '/app', bundleId: 'x3' });
    const out = await mock.emitHeaderBundle({
      routeId: '/app',
      bundleId: 'x3',
      xContentTypeOptions: true,
    });
    expect(out.headers['X-Content-Type-Options']).toBe('nosniff');
    expect(out.applied).toContain('X-Content-Type-Options');
  });

  it('axis 4: emitHeaderBundle without xFrame omits X-Frame-Options', async () => {
    await mock.startHeaders({ routeId: '/app', bundleId: 'x4' });
    const out = await mock.emitHeaderBundle({
      routeId: '/app',
      bundleId: 'x4',
    });
    expect(out.headers['X-Frame-Options']).toBeUndefined();
  });
});

describe('mock adapter — full 5-header bundle', () => {
  it('axis 5: emitHeaderBundle can carry all 5 advanced headers at once', async () => {
    await mock.startHeaders({ routeId: '/app', bundleId: 'all' });
    await mock.applyHsts({
      routeId: '/app',
      bundleId: 'all',
      maxAgeSec: ONE_YEAR_SEC,
      includeSubDomains: true,
      preload: false,
    });
    await mock.applyReferrerPolicy({
      routeId: '/app',
      bundleId: 'all',
      policy: 'strict-origin-when-cross-origin',
    });
    await mock.applyPermissionsPolicy({
      routeId: '/app',
      bundleId: 'all',
      features: { geolocation: 'self' },
    });
    const out = await mock.emitHeaderBundle({
      routeId: '/app',
      bundleId: 'all',
      xFrame: 'DENY',
      xContentTypeOptions: true,
    });
    expect(Object.keys(out.headers).sort()).toEqual(
      [
        'Permissions-Policy',
        'Referrer-Policy',
        'Strict-Transport-Security',
        'X-Content-Type-Options',
        'X-Frame-Options',
      ].sort(),
    );
    expect(out.validationOk).toBe(true);
  });

  it('axis 5: emitHeaderBundle trace records validationOk + headerCount', async () => {
    await mock.startHeaders({ routeId: '/app', bundleId: 'trace1' });
    await mock.applyHsts({
      routeId: '/app',
      bundleId: 'trace1',
      maxAgeSec: ONE_YEAR_SEC,
      includeSubDomains: true,
      preload: false,
    });
    await mock.emitHeaderBundle({
      routeId: '/app',
      bundleId: 'trace1',
    });
    const trace = mock.traces().find((t) => t.op === 'emitHeaderBundle');
    expect((trace?.detail as { validationOk?: boolean })?.validationOk).toBe(
      true,
    );
    expect((trace?.detail as { headerCount?: number })?.headerCount).toBe(1);
  });

  it('axis 5: emitHeaderBundle applied list is de-duplicated', async () => {
    await mock.startHeaders({ routeId: '/app', bundleId: 'dedup1' });
    await mock.applyHsts({
      routeId: '/app',
      bundleId: 'dedup1',
      maxAgeSec: ONE_YEAR_SEC,
      includeSubDomains: true,
      preload: false,
    });
    // apply a second time — should not duplicate the applied entry
    await mock.applyHsts({
      routeId: '/app',
      bundleId: 'dedup1',
      maxAgeSec: 2 * ONE_YEAR_SEC,
      includeSubDomains: true,
      preload: false,
    });
    const out = await mock.emitHeaderBundle({
      routeId: '/app',
      bundleId: 'dedup1',
    });
    const hstsCount = out.applied.filter(
      (h) => h === 'Strict-Transport-Security',
    ).length;
    expect(hstsCount).toBe(1);
  });

  it('axis 5: separate bundleIds do not share HSTS state', async () => {
    await mock.startHeaders({ routeId: '/a', bundleId: 'A' });
    await mock.startHeaders({ routeId: '/b', bundleId: 'B' });
    await mock.applyHsts({
      routeId: '/a',
      bundleId: 'A',
      maxAgeSec: ONE_YEAR_SEC,
      includeSubDomains: true,
      preload: false,
    });
    const outA = await mock.emitHeaderBundle({ routeId: '/a', bundleId: 'A' });
    const outB = await mock.emitHeaderBundle({ routeId: '/b', bundleId: 'B' });
    expect(outA.headers['Strict-Transport-Security']).toBeDefined();
    expect(outB.headers['Strict-Transport-Security']).toBeUndefined();
  });
});

describe('headers route handler — validation', () => {
  it('validateHeadersRequest requires routeId', () => {
    const res = validateHeadersRequest({ kind: 'build', bundleId: 'b' });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errorKind).toBe('routeId_required');
  });

  it('validateHeadersRequest requires bundleId', () => {
    const res = validateHeadersRequest({ kind: 'build', routeId: '/x' });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errorKind).toBe('bundleId_required');
  });

  it('validateHeadersRequest requires hsts.maxAgeSec when hsts present', () => {
    const res = validateHeadersRequest({
      kind: 'build',
      routeId: '/x',
      bundleId: 'b',
      hsts: { includeSubDomains: true, preload: false },
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errorKind).toBe('hsts_maxAgeSec_required');
  });

  it('handleHeadersRequest returns applied list and headers', async () => {
    const res = await handleHeadersRequest(mock, {
      kind: 'build',
      routeId: '/app',
      bundleId: 'h1',
      hsts: {
        maxAgeSec: ONE_YEAR_SEC,
        includeSubDomains: true,
        preload: false,
      },
      referrerPolicy: 'no-referrer',
      permissionsPolicy: { geolocation: 'self' },
      xFrame: 'DENY',
      xContentTypeOptions: true,
    });
    expect(res.ok).toBe(true);
    expect(res.applied?.sort()).toEqual(
      [
        'Permissions-Policy',
        'Referrer-Policy',
        'Strict-Transport-Security',
        'X-Content-Type-Options',
        'X-Frame-Options',
      ].sort(),
    );
    expect(res.validationOk).toBe(true);
  });
});

describe('real adapter — headers refusal', () => {
  it('real adapter refuses emitHeaderBundle with KIWA_CSP_ENV_MISSING', async () => {
    const real = makeRealAdapter();
    await expect(
      real.emitHeaderBundle({ routeId: '/app', bundleId: 'b' }),
    ).rejects.toThrow(/KIWA_CSP_ENV_MISSING/);
    expect(detectRealEnvMissing()).toBe('KIWA_CSP_ENV_MISSING');
  });
});
