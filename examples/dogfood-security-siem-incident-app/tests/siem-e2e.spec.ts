/**
 * SIEM end-to-end fidelity spec (siem-audit axis: CIM structured event
 * + tamper-evident hash-chain seal + hot/warm/cold retention policy +
 * correlation rule match).
 *
 * Issue CAR-865 (v1.39-3) AC — the mock adapter drives a full SIEM
 * ceremony end to end and the fidelity harness diffs the raw
 * {@link TraceEvent} sequence across five axes.
 *
 *  1. structureEvent records the actor + action + target + result and
 *     assigns a CIM eventId that increments per structured event.
 *  2. sealEvents produces a hash-chain seal that mixes the previous
 *     hash and the batch payload; consecutive seals reject empty
 *     batches and require prior structured events.
 *  3. applyRetention accepts non-negative hot/warm/cold values and
 *     rejects negatives; legalHold is threaded through unchanged.
 *  4. correlate requires the SIEM state machine to have transitioned
 *     through structured -> sealed -> retention-tagged first.
 *  5. Session state machine rejects invalid transitions (correlate
 *     before seal, seal before any structured event, etc).
 *
 * The real adapter is exercised through the env-detect skeleton and
 * every op refuses with `KIWA_SIEM_ENV_MISSING` on every non-integration
 * environment (the default). Downstream tests inspect
 * {@link SecurityAdapter.mode} + the trace to skip real assertions on
 * those systems.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { detectRealEnvMissing, makeRealAdapter } from '../src/adapters/real.js';
import { handleSiemRequest, validateSiemRequest } from '../src/app/siem/route.js';
import type { SecurityAdapter } from '../src/adapters/interface.js';

let mock: SecurityAdapter;

beforeEach(() => {
  mock = makeMockAdapter({ latencyMs: 1 });
});

afterEach(async () => {
  await mock.reset();
});

describe('mock adapter — SIEM structureEvent', () => {
  it('axis 1: structureEvent records actor + action + target + assigns CIM eventId', async () => {
    await mock.startSiem({ sessionId: 's1', target: 'siem-splunk' });
    const result = await mock.structureEvent({
      sessionId: 's1',
      actor: 'user-42',
      action: 'login',
      target: 'billing-api',
      timestamp: 1_700_000_000,
      result: 'success',
    });
    expect(result.actor).toBe('user-42');
    expect(result.action).toBe('login');
    expect(result.eventId).toBe('evt-1');
    expect(result.cimSchemaVersion).toBe('1.0');
    const trace = mock.traces().find((t) => t.op === 'structureEvent');
    expect(trace?.ok).toBe(true);
  });

  it('axis 1: structureEvent increments eventId per structured event', async () => {
    await mock.startSiem({ sessionId: 's-inc', target: 'siem-splunk' });
    const first = await mock.structureEvent({
      sessionId: 's-inc',
      actor: 'user-1',
      action: 'login',
      target: 'api',
      timestamp: 1,
      result: 'success',
    });
    const second = await mock.structureEvent({
      sessionId: 's-inc',
      actor: 'user-2',
      action: 'logout',
      target: 'api',
      timestamp: 2,
      result: 'success',
    });
    expect(first.eventId).toBe('evt-1');
    expect(second.eventId).toBe('evt-2');
  });

  it('axis 1: structureEvent accepts failure result', async () => {
    await mock.startSiem({ sessionId: 's-fail', target: 'siem-splunk' });
    const result = await mock.structureEvent({
      sessionId: 's-fail',
      actor: 'user-x',
      action: 'delete',
      target: 'db',
      timestamp: 1,
      result: 'failure',
    });
    expect(result.eventId).toBe('evt-1');
  });

  it('axis 1: structureEvent rejects when actor / action / target empty', async () => {
    await mock.startSiem({ sessionId: 's-empty', target: 'siem-splunk' });
    await expect(
      mock.structureEvent({
        sessionId: 's-empty',
        actor: '',
        action: 'x',
        target: 'y',
        timestamp: 1,
        result: 'success',
      }),
    ).rejects.toThrow(/actor \/ action \/ target/);
  });

  it('axis 1: structureEvent rejects when session missing', async () => {
    await expect(
      mock.structureEvent({
        sessionId: 'ghost',
        actor: 'u',
        action: 'a',
        target: 't',
        timestamp: 1,
        result: 'success',
      }),
    ).rejects.toThrow(/siem_session_not_found/);
  });
});

describe('mock adapter — SIEM sealEvents', () => {
  it('axis 2: sealEvents produces a sha-prefixed hash for a non-empty batch', async () => {
    await mock.startSiem({ sessionId: 's-seal', target: 'siem-splunk' });
    await mock.structureEvent({
      sessionId: 's-seal',
      actor: 'user-1',
      action: 'login',
      target: 'api',
      timestamp: 1,
      result: 'success',
    });
    const result = await mock.sealEvents({
      sessionId: 's-seal',
      previousHash: 'sha-0',
    });
    expect(result.sealHash.startsWith('sha-')).toBe(true);
    expect(result.eventCount).toBe(1);
    expect(result.previousHash).toBe('sha-0');
  });

  it('axis 2: sealEvents chains subsequent seals against the fresh mock session', async () => {
    // Each SIEM session enforces structured -> sealed -> retention -> correlated
    // linearly, so this test asserts the seal step succeeds twice across
    // two isolated sessions with different previousHash inputs.
    await mock.startSiem({ sessionId: 's-a', target: 'siem-splunk' });
    await mock.structureEvent({
      sessionId: 's-a',
      actor: 'a',
      action: 'a',
      target: 'a',
      timestamp: 1,
      result: 'success',
    });
    const sealA = await mock.sealEvents({ sessionId: 's-a', previousHash: 'sha-0' });

    await mock.startSiem({ sessionId: 's-b', target: 'siem-splunk' });
    await mock.structureEvent({
      sessionId: 's-b',
      actor: 'b',
      action: 'b',
      target: 'b',
      timestamp: 1,
      result: 'success',
    });
    const sealB = await mock.sealEvents({
      sessionId: 's-b',
      previousHash: sealA.sealHash,
    });
    expect(sealB.previousHash).toBe(sealA.sealHash);
    expect(sealB.sealHash).not.toBe(sealA.sealHash);
  });

  it('axis 2: sealEvents rejects when session state has no structured events', async () => {
    await mock.startSiem({ sessionId: 's-idle', target: 'siem-splunk' });
    await expect(
      mock.sealEvents({ sessionId: 's-idle', previousHash: 'sha-0' }),
    ).rejects.toThrow(/no structured events to seal/);
  });

  it('axis 2: sealEvents rejects when session missing', async () => {
    await expect(
      mock.sealEvents({ sessionId: 'ghost', previousHash: 'sha-0' }),
    ).rejects.toThrow(/siem_session_not_found/);
  });
});

describe('mock adapter — SIEM applyRetention', () => {
  it('axis 3: applyRetention sums totalDays and threads legalHold through', async () => {
    await mock.startSiem({ sessionId: 's-ret', target: 'siem-splunk' });
    await mock.structureEvent({
      sessionId: 's-ret',
      actor: 'a',
      action: 'a',
      target: 'a',
      timestamp: 1,
      result: 'success',
    });
    await mock.sealEvents({ sessionId: 's-ret', previousHash: 'sha-0' });
    const result = await mock.applyRetention({
      sessionId: 's-ret',
      hotDays: 7,
      warmDays: 30,
      coldDays: 335,
      legalHold: true,
    });
    expect(result.totalDays).toBe(7 + 30 + 335);
    expect(result.legalHold).toBe(true);
  });

  it('axis 3: applyRetention rejects when events have not been sealed', async () => {
    await mock.startSiem({ sessionId: 's-unsealed', target: 'siem-splunk' });
    await mock.structureEvent({
      sessionId: 's-unsealed',
      actor: 'a',
      action: 'a',
      target: 'a',
      timestamp: 1,
      result: 'success',
    });
    await expect(
      mock.applyRetention({
        sessionId: 's-unsealed',
        hotDays: 7,
        warmDays: 30,
        coldDays: 335,
        legalHold: false,
      }),
    ).rejects.toThrow(/events must be sealed first/);
  });

  it('axis 3: applyRetention rejects negative retention days', async () => {
    await mock.startSiem({ sessionId: 's-neg', target: 'siem-splunk' });
    await mock.structureEvent({
      sessionId: 's-neg',
      actor: 'a',
      action: 'a',
      target: 'a',
      timestamp: 1,
      result: 'success',
    });
    await mock.sealEvents({ sessionId: 's-neg', previousHash: 'sha-0' });
    await expect(
      mock.applyRetention({
        sessionId: 's-neg',
        hotDays: -1,
        warmDays: 30,
        coldDays: 335,
        legalHold: false,
      }),
    ).rejects.toThrow(/non-negative/);
  });
});

describe('mock adapter — SIEM correlate', () => {
  it('axis 4: correlate reports matched=true when all required event ids are present', async () => {
    await mock.startSiem({ sessionId: 's-corr', target: 'siem-splunk' });
    await mock.structureEvent({
      sessionId: 's-corr',
      actor: 'a',
      action: 'login',
      target: 'api',
      timestamp: 1,
      result: 'failure',
    });
    await mock.structureEvent({
      sessionId: 's-corr',
      actor: 'a',
      action: 'login',
      target: 'api',
      timestamp: 2,
      result: 'failure',
    });
    await mock.sealEvents({ sessionId: 's-corr', previousHash: 'sha-0' });
    await mock.applyRetention({
      sessionId: 's-corr',
      hotDays: 7,
      warmDays: 30,
      coldDays: 335,
      legalHold: false,
    });
    const result = await mock.correlate({
      sessionId: 's-corr',
      ruleId: 'brute-force',
      requiredEventIds: ['evt-1', 'evt-2'],
      windowMs: 60_000,
    });
    expect(result.matched).toBe(true);
    expect(result.requiredCount).toBe(2);
    expect(result.ruleId).toBe('brute-force');
  });

  it('axis 4: correlate reports matched=false when required event ids are missing', async () => {
    await mock.startSiem({ sessionId: 's-nom', target: 'siem-splunk' });
    await mock.structureEvent({
      sessionId: 's-nom',
      actor: 'a',
      action: 'a',
      target: 'a',
      timestamp: 1,
      result: 'success',
    });
    await mock.sealEvents({ sessionId: 's-nom', previousHash: 'sha-0' });
    await mock.applyRetention({
      sessionId: 's-nom',
      hotDays: 7,
      warmDays: 30,
      coldDays: 335,
      legalHold: false,
    });
    const result = await mock.correlate({
      sessionId: 's-nom',
      ruleId: 'multi-step',
      requiredEventIds: ['evt-1', 'evt-2', 'evt-3'],
      windowMs: 60_000,
    });
    expect(result.matched).toBe(false);
  });

  it('axis 4: correlate rejects when retention has not been applied', async () => {
    await mock.startSiem({ sessionId: 's-ret-missing', target: 'siem-splunk' });
    await mock.structureEvent({
      sessionId: 's-ret-missing',
      actor: 'a',
      action: 'a',
      target: 'a',
      timestamp: 1,
      result: 'success',
    });
    await mock.sealEvents({
      sessionId: 's-ret-missing',
      previousHash: 'sha-0',
    });
    await expect(
      mock.correlate({
        sessionId: 's-ret-missing',
        ruleId: 'r1',
        requiredEventIds: ['evt-1'],
        windowMs: 60_000,
      }),
    ).rejects.toThrow(/retention must be applied first/);
  });

  it('axis 4: correlate rejects an empty rule requirement list', async () => {
    await mock.startSiem({ sessionId: 's-empty-rule', target: 'siem-splunk' });
    await mock.structureEvent({
      sessionId: 's-empty-rule',
      actor: 'a',
      action: 'a',
      target: 'a',
      timestamp: 1,
      result: 'success',
    });
    await mock.sealEvents({
      sessionId: 's-empty-rule',
      previousHash: 'sha-0',
    });
    await mock.applyRetention({
      sessionId: 's-empty-rule',
      hotDays: 7,
      warmDays: 30,
      coldDays: 335,
      legalHold: false,
    });
    await expect(
      mock.correlate({
        sessionId: 's-empty-rule',
        ruleId: 'r1',
        requiredEventIds: [],
        windowMs: 60_000,
      }),
    ).rejects.toThrow(/require >= 1 event id/);
  });
});

describe('mock adapter — SIEM session lifecycle', () => {
  it('axis 5: startSiem rejects duplicate session ids', async () => {
    await mock.startSiem({ sessionId: 'dup', target: 'siem-splunk' });
    await expect(
      mock.startSiem({ sessionId: 'dup', target: 'siem-splunk' }),
    ).rejects.toThrow(/siem_session_exists/);
  });

  it('axis 5: closeSiem removes session from bookkeeping', async () => {
    await mock.startSiem({ sessionId: 's-close', target: 'siem-splunk' });
    await mock.closeSiem({ sessionId: 's-close' });
    await expect(mock.closeSiem({ sessionId: 's-close' })).rejects.toThrow(
      /siem_session_not_found/,
    );
  });
});

describe('mock adapter — /siem route validation', () => {
  it('accepts structure requests with all required fields', () => {
    const parsed = validateSiemRequest({
      kind: 'structure',
      sessionId: 's1',
      actor: 'u',
      action: 'a',
      target: 't',
      timestamp: 1,
      result: 'success',
    });
    expect(parsed.ok).toBe(true);
  });

  it('rejects seal requests without previousHash', () => {
    const parsed = validateSiemRequest({
      kind: 'seal',
      sessionId: 's1',
    });
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.errorKind).toBe('previousHash_required_string');
  });

  it('rejects retention requests with negative hotDays', () => {
    const parsed = validateSiemRequest({
      kind: 'retention',
      sessionId: 's1',
      hotDays: -1,
      warmDays: 30,
      coldDays: 335,
      legalHold: false,
    });
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.errorKind).toBe('hotDays_required_non_negative_number');
    }
  });

  it('rejects correlate requests with non-positive windowMs', () => {
    const parsed = validateSiemRequest({
      kind: 'correlate',
      sessionId: 's1',
      ruleId: 'r',
      requiredEventIds: ['evt-1'],
      windowMs: 0,
    });
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.errorKind).toBe('windowMs_must_be_positive');
  });

  it('rejects an unknown kind', () => {
    const parsed = validateSiemRequest({
      kind: 'unknown',
      sessionId: 's1',
    });
    expect(parsed.ok).toBe(false);
  });

  it('rejects a missing sessionId', () => {
    const parsed = validateSiemRequest({ kind: 'seal' });
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.errorKind).toBe('sessionId_required');
  });

  it('rejects a non-object body', () => {
    const parsed = validateSiemRequest(null);
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.errorKind).toBe('body_not_object');
  });
});

describe('mock adapter — /siem route handler', () => {
  it('serves a structure request end to end', async () => {
    await mock.startSiem({ sessionId: 'route-s', target: 'siem-splunk' });
    const parsed = validateSiemRequest({
      kind: 'structure',
      sessionId: 'route-s',
      actor: 'u',
      action: 'login',
      target: 'api',
      timestamp: 1,
      result: 'success',
    });
    if (!parsed.ok) throw new Error(parsed.errorKind);
    const res = await handleSiemRequest(mock, parsed.value);
    expect(res.ok).toBe(true);
    expect(res.eventId).toBe('evt-1');
  });

  it('reports an adapter error via errorKind on route response', async () => {
    const parsed = validateSiemRequest({
      kind: 'seal',
      sessionId: 'ghost',
      previousHash: 'sha-0',
    });
    if (!parsed.ok) throw new Error(parsed.errorKind);
    const res = await handleSiemRequest(mock, parsed.value);
    expect(res.ok).toBe(false);
    expect(res.errorKind).toBe('siem_session_not_found');
  });
});

describe('real adapter — SIEM env-detect skeleton', () => {
  it('detects KIWA_SIEM_ENV_MISSING when SIEM_STACK_READY is unset', () => {
    const prevMode = process.env['KIWA_MODE'];
    const prevReady = process.env['SIEM_STACK_READY'];
    delete process.env['KIWA_MODE'];
    delete process.env['SIEM_STACK_READY'];
    try {
      expect(detectRealEnvMissing()).toBe('KIWA_SIEM_ENV_MISSING');
    } finally {
      if (prevMode !== undefined) process.env['KIWA_MODE'] = prevMode;
      if (prevReady !== undefined) process.env['SIEM_STACK_READY'] = prevReady;
    }
  });

  it('reports each missing env key by name when SIEM_STACK_READY=1', () => {
    const backup = {
      KIWA_MODE: process.env['KIWA_MODE'],
      SIEM_STACK_READY: process.env['SIEM_STACK_READY'],
      KIWA_SIEM_ENDPOINT: process.env['KIWA_SIEM_ENDPOINT'],
      KIWA_PAGERDUTY_URL: process.env['KIWA_PAGERDUTY_URL'],
      KIWA_LOKI_URL: process.env['KIWA_LOKI_URL'],
      KIWA_SIEM_TOKEN: process.env['KIWA_SIEM_TOKEN'],
    };
    try {
      delete process.env['KIWA_MODE'];
      process.env['SIEM_STACK_READY'] = '1';
      delete process.env['KIWA_SIEM_ENDPOINT'];
      delete process.env['KIWA_PAGERDUTY_URL'];
      delete process.env['KIWA_LOKI_URL'];
      delete process.env['KIWA_SIEM_TOKEN'];
      expect(detectRealEnvMissing()).toBe('KIWA_SIEM_ENDPOINT_MISSING');

      process.env['KIWA_SIEM_ENDPOINT'] = 'https://splunk.example';
      expect(detectRealEnvMissing()).toBe('KIWA_PAGERDUTY_URL_MISSING');

      process.env['KIWA_PAGERDUTY_URL'] = 'https://pd.example';
      expect(detectRealEnvMissing()).toBe('KIWA_LOKI_URL_MISSING');

      process.env['KIWA_LOKI_URL'] = 'https://loki.example';
      expect(detectRealEnvMissing()).toBe('KIWA_SIEM_TOKEN_MISSING');

      process.env['KIWA_SIEM_TOKEN'] = 'tok-abc';
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
      real.startSiem({ sessionId: 's', target: 'siem-splunk' }),
    ).rejects.toThrow(/KIWA_SIEM/);
    expect(real.mode).toBe('real');
    expect(real.traces().length).toBeGreaterThan(0);
  });
});
