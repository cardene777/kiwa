/**
 * Violation reporting end-to-end fidelity spec (violation axis: report-to +
 * report-uri + violation trace).
 *
 * Sub-Issue CAR-826 (v1.37-2) AC — the mock adapter ingests browser CSP
 * violation reports and drives them through the neutral event vocabulary
 * so the fidelity harness can diff mock vs real event orderings.
 *
 *  1. ingestViolation captures directive + blockedUri + disposition and
 *     appends one violation to the session.
 *  2. recordViolationEvent transitions the last-ingested violation from
 *     accepted to verdicted (allow / deny / warn).
 *  3. closeViolation marks the session terminal so downstream ingest calls
 *     refuse (guard raises).
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { detectRealEnvMissing, makeRealAdapter } from '../src/adapters/real.js';
import {
  handleViolationRequest,
  validateViolationRequest,
} from '../src/app/violation/route.js';
import type { SecurityAdapter } from '../src/adapters/interface.js';

let mock: SecurityAdapter;

beforeEach(() => {
  mock = makeMockAdapter({ latencyMs: 1 });
});

afterEach(async () => {
  await mock.reset();
});

describe('mock adapter — violation ingest', () => {
  it('axis 1: ingestViolation accepts a script-src blocked-uri report', async () => {
    await mock.startViolation({
      routeId: '/app',
      policyId: 'p1',
      reportId: 'r1',
    });
    const res = await mock.ingestViolation({
      routeId: '/app',
      policyId: 'p1',
      reportId: 'r1',
      directive: 'script-src',
      blockedUri: 'https://evil.example.com/x.js',
      disposition: 'enforce',
    });
    expect(res.accepted).toBe(true);
    expect(res.directive).toBe('script-src');
    expect(res.blockedUri).toBe('https://evil.example.com/x.js');
    expect(res.disposition).toBe('enforce');
  });

  it('axis 1: ingestViolation trace records the directive', async () => {
    await mock.startViolation({
      routeId: '/app',
      policyId: 'p2',
      reportId: 'r2',
    });
    await mock.ingestViolation({
      routeId: '/app',
      policyId: 'p2',
      reportId: 'r2',
      directive: 'img-src',
      blockedUri: 'https://tracker.example.com/pixel.gif',
      disposition: 'report',
    });
    const trace = mock.traces().find((t) => t.op === 'ingestViolation');
    expect((trace?.detail as { directive?: string })?.directive).toBe('img-src');
    expect((trace?.detail as { disposition?: string })?.disposition).toBe(
      'report',
    );
  });

  it('axis 1: multiple violations for the same reportId accumulate', async () => {
    await mock.startViolation({
      routeId: '/app',
      policyId: 'p3',
      reportId: 'r3',
    });
    await mock.ingestViolation({
      routeId: '/app',
      policyId: 'p3',
      reportId: 'r3',
      directive: 'script-src',
      blockedUri: 'https://a.example.com/x.js',
      disposition: 'enforce',
    });
    await mock.ingestViolation({
      routeId: '/app',
      policyId: 'p3',
      reportId: 'r3',
      directive: 'style-src',
      blockedUri: 'https://b.example.com/x.css',
      disposition: 'enforce',
    });
    const ingests = mock
      .traces()
      .filter((t) => t.op === 'ingestViolation' && t.ok);
    expect(ingests).toHaveLength(2);
  });

  it('axis 1: ingestViolation without startViolation fails', async () => {
    await expect(
      mock.ingestViolation({
        routeId: '/app',
        policyId: 'ghost',
        reportId: 'r-ghost',
        directive: 'script-src',
        blockedUri: 'https://x.example.com/x.js',
        disposition: 'enforce',
      }),
    ).rejects.toThrow(/violation_session_missing/);
  });
});

describe('mock adapter — recordViolationEvent verdicts', () => {
  it('axis 2: recordViolationEvent(allow) attaches allow verdict to the last violation', async () => {
    await mock.startViolation({
      routeId: '/app',
      policyId: 'v1',
      reportId: 'rv1',
    });
    await mock.ingestViolation({
      routeId: '/app',
      policyId: 'v1',
      reportId: 'rv1',
      directive: 'script-src',
      blockedUri: 'https://cdn.example.com/x.js',
      disposition: 'report',
    });
    await mock.recordViolationEvent({
      routeId: '/app',
      policyId: 'v1',
      reportId: 'rv1',
      verdict: 'allow',
      reason: 'known_cdn',
    });
    const evt = mock.traces().find((t) => t.op === 'recordViolationEvent');
    expect((evt?.detail as { verdict?: string })?.verdict).toBe('allow');
    expect((evt?.detail as { reason?: string })?.reason).toBe('known_cdn');
  });

  it('axis 2: recordViolationEvent supports deny and warn', async () => {
    await mock.startViolation({
      routeId: '/app',
      policyId: 'v2',
      reportId: 'rv2',
    });
    await mock.ingestViolation({
      routeId: '/app',
      policyId: 'v2',
      reportId: 'rv2',
      directive: 'script-src',
      blockedUri: 'https://evil.example.com/x.js',
      disposition: 'enforce',
    });
    await mock.recordViolationEvent({
      routeId: '/app',
      policyId: 'v2',
      reportId: 'rv2',
      verdict: 'deny',
      reason: 'blocklisted_origin',
    });
    await mock.recordViolationEvent({
      routeId: '/app',
      policyId: 'v2',
      reportId: 'rv2',
      verdict: 'warn',
      reason: 'threshold_exceeded',
    });
    const verdicts = mock
      .traces()
      .filter((t) => t.op === 'recordViolationEvent')
      .map((t) => (t.detail as { verdict?: string })?.verdict);
    expect(verdicts).toEqual(['deny', 'warn']);
  });

  it('axis 2: recordViolationEvent without session fails', async () => {
    await expect(
      mock.recordViolationEvent({
        routeId: '/app',
        policyId: 'nope',
        reportId: 'r-nope',
        verdict: 'allow',
        reason: 'x',
      }),
    ).rejects.toThrow(/violation_session_missing/);
  });
});

describe('mock adapter — closeViolation', () => {
  it('axis 3: closeViolation records the violation count', async () => {
    await mock.startViolation({
      routeId: '/app',
      policyId: 'c1',
      reportId: 'rc1',
    });
    await mock.ingestViolation({
      routeId: '/app',
      policyId: 'c1',
      reportId: 'rc1',
      directive: 'script-src',
      blockedUri: 'https://cdn.example.com/a.js',
      disposition: 'enforce',
    });
    await mock.closeViolation({
      routeId: '/app',
      policyId: 'c1',
      reportId: 'rc1',
    });
    const trace = mock.traces().find((t) => t.op === 'closeViolation');
    expect((trace?.detail as { violationCount?: number })?.violationCount).toBe(1);
  });

  it('axis 3: ingest after close is rejected', async () => {
    await mock.startViolation({
      routeId: '/app',
      policyId: 'c2',
      reportId: 'rc2',
    });
    await mock.ingestViolation({
      routeId: '/app',
      policyId: 'c2',
      reportId: 'rc2',
      directive: 'script-src',
      blockedUri: 'https://x.example.com/a.js',
      disposition: 'enforce',
    });
    await mock.closeViolation({
      routeId: '/app',
      policyId: 'c2',
      reportId: 'rc2',
    });
    await expect(
      mock.ingestViolation({
        routeId: '/app',
        policyId: 'c2',
        reportId: 'rc2',
        directive: 'style-src',
        blockedUri: 'https://x.example.com/b.css',
        disposition: 'enforce',
      }),
    ).rejects.toThrow(/violation_session_closed/);
  });

  it('axis 3: closeViolation without session fails', async () => {
    await expect(
      mock.closeViolation({
        routeId: '/app',
        policyId: 'no-close',
        reportId: 'r-no-close',
      }),
    ).rejects.toThrow(/violation_session_missing/);
  });
});

describe('violation route handler — validation', () => {
  it('validateViolationRequest requires routeId', () => {
    const res = validateViolationRequest({ kind: 'ingest', policyId: 'p', reportId: 'r' });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errorKind).toBe('routeId_required');
  });

  it('validateViolationRequest requires reportId', () => {
    const res = validateViolationRequest({
      kind: 'ingest',
      routeId: '/x',
      policyId: 'p',
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errorKind).toBe('reportId_required');
  });

  it('validateViolationRequest requires kind=ingest or close', () => {
    const res = validateViolationRequest({
      kind: 'other',
      routeId: '/x',
      policyId: 'p',
      reportId: 'r',
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errorKind).toBe('kind_must_be_ingest_or_close');
  });

  it('validateViolationRequest ingest without directive fails', () => {
    const res = validateViolationRequest({
      kind: 'ingest',
      routeId: '/x',
      policyId: 'p',
      reportId: 'r',
      blockedUri: 'https://x.example.com/a',
      disposition: 'enforce',
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errorKind).toBe('directive_required');
  });

  it('validateViolationRequest ingest with unknown disposition fails', () => {
    const res = validateViolationRequest({
      kind: 'ingest',
      routeId: '/x',
      policyId: 'p',
      reportId: 'r',
      directive: 'script-src',
      blockedUri: 'https://x.example.com/a',
      disposition: 'strange',
    });
    expect(res.ok).toBe(false);
    if (!res.ok)
      expect(res.errorKind).toBe('disposition_must_be_enforce_or_report');
  });

  it('handleViolationRequest ingest returns accepted=true', async () => {
    const res = await handleViolationRequest(mock, {
      kind: 'ingest',
      routeId: '/app',
      policyId: 'p',
      reportId: 'r',
      directive: 'script-src',
      blockedUri: 'https://evil.example.com/x.js',
      disposition: 'enforce',
      verdict: 'deny',
      reason: 'blocklist',
    });
    expect(res.ok).toBe(true);
    expect(res.accepted).toBe(true);
    expect(res.directive).toBe('script-src');
  });

  it('handleViolationRequest close returns ok=true', async () => {
    await mock.startViolation({
      routeId: '/app',
      policyId: 'p',
      reportId: 'r',
    });
    await mock.ingestViolation({
      routeId: '/app',
      policyId: 'p',
      reportId: 'r',
      directive: 'script-src',
      blockedUri: 'https://x.example.com/a.js',
      disposition: 'enforce',
    });
    const res = await handleViolationRequest(mock, {
      kind: 'close',
      routeId: '/app',
      policyId: 'p',
      reportId: 'r',
    });
    expect(res.ok).toBe(true);
    expect(res.kind).toBe('close');
  });
});

describe('real adapter — violation refusal', () => {
  it('real adapter refuses ingestViolation with KIWA_CSP_ENV_MISSING', async () => {
    const real = makeRealAdapter();
    await expect(
      real.ingestViolation({
        routeId: '/app',
        policyId: 'p',
        reportId: 'r',
        directive: 'script-src',
        blockedUri: 'https://x.example.com/x.js',
        disposition: 'enforce',
      }),
    ).rejects.toThrow(/KIWA_CSP_ENV_MISSING/);
    expect(detectRealEnvMissing()).toBe('KIWA_CSP_ENV_MISSING');
  });
});
