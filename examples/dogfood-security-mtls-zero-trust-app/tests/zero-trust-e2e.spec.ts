/**
 * Zero-trust end-to-end fidelity spec (zero-trust axis: device posture +
 * risk score + JIT access + micro-segmentation).
 *
 * Issue CAR-864 (v1.39-2) AC — the mock adapter drives a full
 * zero-trust ceremony end to end and the fidelity harness diffs the raw
 * {@link TraceEvent} sequence across five axes.
 *
 *  1. evaluatePosture returns passed=true only when all four device
 *     signals (OS / disk / EDR / MDM) are true.
 *  2. scoreRisk adds weighted contributions (unusualLocation 25 +
 *     unusualTime 15 + newDevice 20 + threatIntelHit 40).
 *  3. requestJit grants when riskScore < 50; denies otherwise.
 *  4. requestJit rejects invalid TTL (>3600 or <=0) and short
 *     justification (< 10 chars).
 *  5. enforceMicroSegment returns allowed=true iff the requested peer
 *     is in the allowed list.
 *
 * The real adapter is exercised through the env-detect skeleton and
 * every op refuses with `KIWA_MTLS_ENV_MISSING` on every non-integration
 * environment (the default).
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import { handleZtRequest, validateZtRequest } from '../src/app/zero-trust/route.js';
import type { SecurityAdapter } from '../src/adapters/interface.js';

let mock: SecurityAdapter;

beforeEach(() => {
  mock = makeMockAdapter({ latencyMs: 1 });
});

afterEach(async () => {
  await mock.reset();
});

describe('mock adapter — device posture evaluation', () => {
  it('axis 1: evaluatePosture passes when all four signals are true', async () => {
    await mock.startZeroTrust({ sessionId: 'p1', target: 'opa' });
    const result = await mock.evaluatePosture({
      sessionId: 'p1',
      osUpToDate: true,
      diskEncrypted: true,
      edrRunning: true,
      mdmEnrolled: true,
    });
    expect(result.passed).toBe(true);
  });

  it('axis 1: evaluatePosture fails when any signal is false', async () => {
    await mock.startZeroTrust({ sessionId: 'p2', target: 'opa' });
    const result = await mock.evaluatePosture({
      sessionId: 'p2',
      osUpToDate: true,
      diskEncrypted: false,
      edrRunning: true,
      mdmEnrolled: true,
    });
    expect(result.passed).toBe(false);
  });

  it('axis 1: evaluatePosture rejects duplicate call on same session', async () => {
    await mock.startZeroTrust({ sessionId: 'p3', target: 'opa' });
    await mock.evaluatePosture({
      sessionId: 'p3',
      osUpToDate: true,
      diskEncrypted: true,
      edrRunning: true,
      mdmEnrolled: true,
    });
    await expect(
      mock.evaluatePosture({
        sessionId: 'p3',
        osUpToDate: true,
        diskEncrypted: true,
        edrRunning: true,
        mdmEnrolled: true,
      }),
    ).rejects.toThrow(/evaluatePosture/);
  });
});

describe('mock adapter — risk scoring', () => {
  it('axis 2: scoreRisk returns 0 when all signals are false', async () => {
    await mock.startZeroTrust({ sessionId: 'r1', target: 'opa' });
    await mock.evaluatePosture({
      sessionId: 'r1',
      osUpToDate: true,
      diskEncrypted: true,
      edrRunning: true,
      mdmEnrolled: true,
    });
    const result = await mock.scoreRisk({
      sessionId: 'r1',
      unusualLocation: false,
      unusualTime: false,
      newDevice: false,
      threatIntelHit: false,
    });
    expect(result.riskScore).toBe(0);
  });

  it('axis 2: scoreRisk sums the weighted contributions', async () => {
    await mock.startZeroTrust({ sessionId: 'r2', target: 'opa' });
    await mock.evaluatePosture({
      sessionId: 'r2',
      osUpToDate: true,
      diskEncrypted: true,
      edrRunning: true,
      mdmEnrolled: true,
    });
    const result = await mock.scoreRisk({
      sessionId: 'r2',
      unusualLocation: true,
      unusualTime: true,
      newDevice: false,
      threatIntelHit: false,
    });
    // 25 (unusualLocation) + 15 (unusualTime) = 40
    expect(result.riskScore).toBe(40);
  });

  it('axis 2: scoreRisk maxes to 100 with all signals set', async () => {
    await mock.startZeroTrust({ sessionId: 'r3', target: 'opa' });
    await mock.evaluatePosture({
      sessionId: 'r3',
      osUpToDate: true,
      diskEncrypted: true,
      edrRunning: true,
      mdmEnrolled: true,
    });
    const result = await mock.scoreRisk({
      sessionId: 'r3',
      unusualLocation: true,
      unusualTime: true,
      newDevice: true,
      threatIntelHit: true,
    });
    // 25 + 15 + 20 + 40 = 100
    expect(result.riskScore).toBe(100);
  });

  it('axis 2: scoreRisk rejects call before posture evaluated', async () => {
    await mock.startZeroTrust({ sessionId: 'r4', target: 'opa' });
    await expect(
      mock.scoreRisk({
        sessionId: 'r4',
        unusualLocation: false,
        unusualTime: false,
        newDevice: false,
        threatIntelHit: false,
      }),
    ).rejects.toThrow(/posture/);
  });
});

describe('mock adapter — JIT access grant', () => {
  it('axis 3: requestJit grants when riskScore < 50', async () => {
    await mock.startZeroTrust({ sessionId: 'j1', target: 'opa' });
    await mock.evaluatePosture({
      sessionId: 'j1',
      osUpToDate: true,
      diskEncrypted: true,
      edrRunning: true,
      mdmEnrolled: true,
    });
    await mock.scoreRisk({
      sessionId: 'j1',
      unusualLocation: false,
      unusualTime: false,
      newDevice: false,
      threatIntelHit: false,
    });
    const result = await mock.requestJit({
      sessionId: 'j1',
      requestedRole: 'db:reader',
      justification: 'debug session 12345',
      ttlSeconds: 900,
    });
    expect(result.granted).toBe(true);
    expect(result.requestedRole).toBe('db:reader');
  });

  it('axis 3: requestJit denies when riskScore >= 50', async () => {
    await mock.startZeroTrust({ sessionId: 'j2', target: 'opa' });
    await mock.evaluatePosture({
      sessionId: 'j2',
      osUpToDate: true,
      diskEncrypted: true,
      edrRunning: true,
      mdmEnrolled: true,
    });
    await mock.scoreRisk({
      sessionId: 'j2',
      unusualLocation: false,
      unusualTime: false,
      newDevice: true,
      threatIntelHit: true,
    });
    // 20 + 40 = 60 >= 50
    const result = await mock.requestJit({
      sessionId: 'j2',
      requestedRole: 'db:reader',
      justification: 'debug session 12345',
      ttlSeconds: 900,
    });
    expect(result.granted).toBe(false);
  });

  it('axis 4: requestJit rejects TTL > 3600', async () => {
    await mock.startZeroTrust({ sessionId: 'j3', target: 'opa' });
    await mock.evaluatePosture({
      sessionId: 'j3',
      osUpToDate: true,
      diskEncrypted: true,
      edrRunning: true,
      mdmEnrolled: true,
    });
    await mock.scoreRisk({
      sessionId: 'j3',
      unusualLocation: false,
      unusualTime: false,
      newDevice: false,
      threatIntelHit: false,
    });
    await expect(
      mock.requestJit({
        sessionId: 'j3',
        requestedRole: 'db:reader',
        justification: 'debug session 12345',
        ttlSeconds: 4000,
      }),
    ).rejects.toThrow(/ttlSeconds/);
  });

  it('axis 4: requestJit rejects short justification', async () => {
    await mock.startZeroTrust({ sessionId: 'j4', target: 'opa' });
    await mock.evaluatePosture({
      sessionId: 'j4',
      osUpToDate: true,
      diskEncrypted: true,
      edrRunning: true,
      mdmEnrolled: true,
    });
    await mock.scoreRisk({
      sessionId: 'j4',
      unusualLocation: false,
      unusualTime: false,
      newDevice: false,
      threatIntelHit: false,
    });
    await expect(
      mock.requestJit({
        sessionId: 'j4',
        requestedRole: 'db:reader',
        justification: 'short',
        ttlSeconds: 900,
      }),
    ).rejects.toThrow(/justification/);
  });

  it('axis 4: requestJit rejects TTL <= 0', async () => {
    await mock.startZeroTrust({ sessionId: 'j5', target: 'opa' });
    await mock.evaluatePosture({
      sessionId: 'j5',
      osUpToDate: true,
      diskEncrypted: true,
      edrRunning: true,
      mdmEnrolled: true,
    });
    await mock.scoreRisk({
      sessionId: 'j5',
      unusualLocation: false,
      unusualTime: false,
      newDevice: false,
      threatIntelHit: false,
    });
    await expect(
      mock.requestJit({
        sessionId: 'j5',
        requestedRole: 'db:reader',
        justification: 'debug session 12345',
        ttlSeconds: 0,
      }),
    ).rejects.toThrow(/ttlSeconds/);
  });
});

describe('mock adapter — micro-segmentation', () => {
  it('axis 5: enforceMicroSegment allows when peer is in allowed list', async () => {
    await mock.startZeroTrust({ sessionId: 'm1', target: 'opa' });
    await mock.evaluatePosture({
      sessionId: 'm1',
      osUpToDate: true,
      diskEncrypted: true,
      edrRunning: true,
      mdmEnrolled: true,
    });
    await mock.scoreRisk({
      sessionId: 'm1',
      unusualLocation: false,
      unusualTime: false,
      newDevice: false,
      threatIntelHit: false,
    });
    await mock.requestJit({
      sessionId: 'm1',
      requestedRole: 'db:reader',
      justification: 'debug session 12345',
      ttlSeconds: 900,
    });
    const result = await mock.enforceMicroSegment({
      sessionId: 'm1',
      workload: 'billing-api',
      allowedPeers: ['db-primary', 'db-replica'],
      requestedPeer: 'db-primary',
    });
    expect(result.allowed).toBe(true);
  });

  it('axis 5: enforceMicroSegment denies when peer is not in allowed list', async () => {
    await mock.startZeroTrust({ sessionId: 'm2', target: 'opa' });
    await mock.evaluatePosture({
      sessionId: 'm2',
      osUpToDate: true,
      diskEncrypted: true,
      edrRunning: true,
      mdmEnrolled: true,
    });
    await mock.scoreRisk({
      sessionId: 'm2',
      unusualLocation: false,
      unusualTime: false,
      newDevice: false,
      threatIntelHit: false,
    });
    await mock.requestJit({
      sessionId: 'm2',
      requestedRole: 'db:reader',
      justification: 'debug session 12345',
      ttlSeconds: 900,
    });
    const result = await mock.enforceMicroSegment({
      sessionId: 'm2',
      workload: 'billing-api',
      allowedPeers: ['db-primary'],
      requestedPeer: 'analytics-warehouse',
    });
    expect(result.allowed).toBe(false);
  });

  it('axis 5: enforceMicroSegment rejects when JIT was denied', async () => {
    await mock.startZeroTrust({ sessionId: 'm3', target: 'opa' });
    await mock.evaluatePosture({
      sessionId: 'm3',
      osUpToDate: true,
      diskEncrypted: true,
      edrRunning: true,
      mdmEnrolled: true,
    });
    await mock.scoreRisk({
      sessionId: 'm3',
      unusualLocation: false,
      unusualTime: false,
      newDevice: true,
      threatIntelHit: true,
    });
    await mock.requestJit({
      sessionId: 'm3',
      requestedRole: 'db:reader',
      justification: 'debug session 12345',
      ttlSeconds: 900,
    });
    await expect(
      mock.enforceMicroSegment({
        sessionId: 'm3',
        workload: 'billing-api',
        allowedPeers: ['db-primary'],
        requestedPeer: 'db-primary',
      }),
    ).rejects.toThrow(/JIT/);
  });
});

describe('validateZtRequest — request shape', () => {
  it('rejects non-object body', () => {
    expect(validateZtRequest(null).ok).toBe(false);
  });

  it('rejects unknown kind', () => {
    const parsed = validateZtRequest({ kind: 'nope', sessionId: 's' });
    expect(parsed.ok).toBe(false);
  });

  it('parses posture kind with all four booleans', () => {
    const parsed = validateZtRequest({
      kind: 'posture',
      sessionId: 's',
      osUpToDate: true,
      diskEncrypted: true,
      edrRunning: true,
      mdmEnrolled: true,
    });
    expect(parsed.ok).toBe(true);
  });

  it('parses risk kind with all four booleans', () => {
    const parsed = validateZtRequest({
      kind: 'risk',
      sessionId: 's',
      unusualLocation: false,
      unusualTime: false,
      newDevice: false,
      threatIntelHit: false,
    });
    expect(parsed.ok).toBe(true);
  });

  it('parses jit kind with role + justification + ttlSeconds', () => {
    const parsed = validateZtRequest({
      kind: 'jit',
      sessionId: 's',
      requestedRole: 'db:reader',
      justification: 'debug session 12345',
      ttlSeconds: 900,
    });
    expect(parsed.ok).toBe(true);
  });

  it('rejects jit kind with non-positive ttl', () => {
    const parsed = validateZtRequest({
      kind: 'jit',
      sessionId: 's',
      requestedRole: 'db:reader',
      justification: 'debug session 12345',
      ttlSeconds: 0,
    });
    expect(parsed.ok).toBe(false);
  });

  it('parses segment kind with workload + peers', () => {
    const parsed = validateZtRequest({
      kind: 'segment',
      sessionId: 's',
      workload: 'billing-api',
      allowedPeers: ['db'],
      requestedPeer: 'db',
    });
    expect(parsed.ok).toBe(true);
  });
});

describe('handleZtRequest — dispatch', () => {
  it('dispatches posture through the adapter', async () => {
    await mock.startZeroTrust({ sessionId: 'h1', target: 'opa' });
    const response = await handleZtRequest(mock, {
      kind: 'posture',
      sessionId: 'h1',
      osUpToDate: true,
      diskEncrypted: true,
      edrRunning: true,
      mdmEnrolled: true,
    });
    expect(response.ok).toBe(true);
    expect(response.passed).toBe(true);
  });

  it('returns errorKind on adapter failure', async () => {
    const response = await handleZtRequest(mock, {
      kind: 'posture',
      sessionId: 'ghost',
      osUpToDate: true,
      diskEncrypted: true,
      edrRunning: true,
      mdmEnrolled: true,
    });
    expect(response.ok).toBe(false);
    expect(response.errorKind).toBe('zt_session_not_found');
  });
});

describe('real adapter — env gate', () => {
  it('reports KIWA_MTLS_ENV_MISSING for zero-trust ops in default env', async () => {
    const real = makeRealAdapter();
    await expect(
      real.startZeroTrust({ sessionId: 's', target: 'opa' }),
    ).rejects.toThrow(/KIWA_MTLS_ENV_MISSING|KIWA_MODE=mock/);
  });
});
