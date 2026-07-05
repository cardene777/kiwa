/**
 * 0-RTT resumption + early data + anti-replay fidelity harness.
 *
 * Sub-Issue #974 (v1.28-4) AC — the mock adapter drives a full HTTP/3 0-RTT
 * ceremony end to end and the fidelity harness diffs the raw
 * {@link TraceEvent} sequence across four axes.
 *
 *  1. openConnection twice with `zeroRtt: true` — the first connection cold-
 *     starts (no ticket), the second reuses the ticket and reports the
 *     accepted early-data byte count on the trace.
 *  2. resumeZeroRtt with earlyDataBytes below the 16 KB anti-replay cap
 *     succeeds + records the accepted byte count on the trace.
 *  3. resumeZeroRtt with earlyDataBytes above the 16 KB cap is refused
 *     (anti-replay) + records `accepted: false` on the trace so the harness
 *     surfaces the anti-replay branch distinctly from acceptance.
 *  4. The metrics counter surfaces cumulative zero-RTT uses across every
 *     accepted resumption on the same adapter instance.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { detectRealEnvMissing, makeRealAdapter } from '../src/adapters/real.js';
import {
  createZeroRttHandler,
  validateZeroRttRequest,
} from '../src/routes/api/0-rtt/handler.js';
import type { Http3MultiplexAdapter } from '../src/adapters/interface.js';

let mock: Http3MultiplexAdapter;

beforeEach(() => {
  mock = makeMockAdapter({ seed: 11, latencyMs: 1 });
});

afterEach(async () => {
  await mock.reset();
});

describe('mock adapter — 0-RTT resumption + anti-replay', () => {
  it('axis 1: openConnection twice with zeroRtt: true records the resumption on the second attempt', async () => {
    const first = await mock.openConnection({
      connectionId: 'z-1',
      url: 'https://origin.example/h3',
      zeroRtt: true,
      earlyDataBytes: 4096,
    });
    expect(first.zeroRttUsed).toBe(false);
    expect(first.earlyDataAccepted).toBe(0);

    const second = await mock.openConnection({
      connectionId: 'z-2',
      url: 'https://origin.example/h3',
      zeroRtt: true,
      earlyDataBytes: 4096,
    });
    expect(second.zeroRttUsed).toBe(true);
    expect(second.earlyDataAccepted).toBe(4096);

    const metrics = mock.metrics();
    expect(metrics.zeroRttUses).toBe(1);
    expect(metrics.zeroRttEarlyDataAccepted).toBe(4096);
  });

  it('axis 2: resumeZeroRtt under the 16 KB anti-replay cap accepts the requested bytes', async () => {
    await mock.openConnection({
      connectionId: 'z-3',
      url: 'https://origin.example/h3',
    });
    const res = await mock.resumeZeroRtt({
      connectionId: 'z-3',
      earlyDataBytes: 8192,
    });
    expect(res.accepted).toBe(true);
    expect(res.earlyDataAccepted).toBe(8192);

    const resumeTraces = mock.traces().filter((t) => t.op === 'resumeZeroRtt');
    expect(resumeTraces).toHaveLength(1);
    expect(resumeTraces[0]?.detail?.['acceptedResumption']).toBe(true);
    expect(resumeTraces[0]?.detail?.['accepted']).toBe(8192);
  });

  it('axis 3: resumeZeroRtt over the 16 KB cap is refused for anti-replay', async () => {
    await mock.openConnection({
      connectionId: 'z-4',
      url: 'https://origin.example/h3',
    });
    const res = await mock.resumeZeroRtt({
      connectionId: 'z-4',
      earlyDataBytes: 32768,
    });
    expect(res.accepted).toBe(false);
    expect(res.earlyDataAccepted).toBe(0);

    const trace = mock.traces().filter((t) => t.op === 'resumeZeroRtt');
    expect(trace[0]?.detail?.['acceptedResumption']).toBe(false);
    expect(trace[0]?.detail?.['accepted']).toBe(0);
  });

  it('axis 4: multiple resumeZeroRtt calls accumulate the accepted byte counter', async () => {
    await mock.openConnection({
      connectionId: 'z-5',
      url: 'https://origin.example/h3',
    });
    await mock.resumeZeroRtt({ connectionId: 'z-5', earlyDataBytes: 4000 });
    await mock.resumeZeroRtt({ connectionId: 'z-5', earlyDataBytes: 8000 });

    const metrics = mock.metrics();
    expect(metrics.zeroRttUses).toBe(2);
    expect(metrics.zeroRttEarlyDataAccepted).toBe(12000);
  });

  it('axis 5: resumeZeroRtt on a missing connection surfaces connection_not_found', async () => {
    await expect(
      mock.resumeZeroRtt({ connectionId: 'never-opened', earlyDataBytes: 1024 }),
    ).rejects.toThrow(/connection.*not open|connection_not_found/);

    const rejected = mock
      .traces()
      .filter((t) => t.op === 'resumeZeroRtt' && !t.ok);
    expect(rejected).toHaveLength(1);
    expect(rejected[0]?.errorKind).toBe('connection_not_found');
  });
});

describe('/api/0-rtt — resume handler', () => {
  it('rejects a payload without earlyDataBytes', () => {
    const missingBytes = validateZeroRttRequest({
      kind: 'resume-zero-rtt',
      connectionId: 'z-1',
    });
    expect(missingBytes.ok).toBe(false);
    if (!missingBytes.ok) {
      expect(missingBytes.errorKind).toBe('missing_early_data_bytes');
    }

    const unknownKind = validateZeroRttRequest({
      kind: 'resume-full',
      connectionId: 'z-1',
      earlyDataBytes: 4096,
    });
    expect(unknownKind.ok).toBe(false);
    if (!unknownKind.ok) {
      expect(unknownKind.errorKind).toBe('unknown_kind');
    }
  });

  it('routes resume-zero-rtt through the adapter', async () => {
    const handler = createZeroRttHandler({ adapter: mock });
    await mock.openConnection({
      connectionId: 'z-h-1',
      url: 'https://origin.example/h3',
    });
    const res = await handler({
      kind: 'resume-zero-rtt',
      connectionId: 'z-h-1',
      earlyDataBytes: 2048,
    });
    expect(res.ok).toBe(true);
    expect(res.accepted).toBe(true);
    expect(res.earlyDataAccepted).toBe(2048);
  });
});

describe('real adapter — 0-RTT env-detect skeleton', () => {
  it('refuses resumeZeroRtt with KIWA_HTTP3_ENV_MISSING', async () => {
    const real = makeRealAdapter();
    expect(detectRealEnvMissing()).toBe('KIWA_HTTP3_ENV_MISSING');
    await expect(
      real.resumeZeroRtt({ connectionId: 'r-1', earlyDataBytes: 4096 }),
    ).rejects.toThrow(/KIWA_HTTP3_ENV_MISSING/);

    const t = real.traces().filter((e) => e.op === 'resumeZeroRtt');
    expect(t[0]?.errorKind).toBe('KIWA_HTTP3_ENV_MISSING');
  });
});
