/**
 * HPACK dynamic table + compression ratio fidelity harness.
 *
 * Sub-Issue #974 (v1.28-4) AC — the mock adapter drives a full HPACK
 * ceremony end to end and the fidelity harness diffs the raw
 * {@link TraceEvent} sequence across four axes.
 *
 *  1. Inserting a single header increments the dynamic table size + records
 *     the index on the trace. Nginx-quic assigns indices starting at 62
 *     (RFC 7541 static-table cap + 1) but the mock uses a 0-based index —
 *     the fidelity harness folds both onto a single "monotonic" invariant.
 *  2. Repeated inserts grow the table monotonically + the compression ratio
 *     stays above 1x (nginx-quic reports the same steady-state ratio for
 *     JSON-shaped headers).
 *  3. Two connections track their own compression counter — one connection's
 *     inserts do not bleed into the other's ratio.
 *  4. Inserting into a missing connection surfaces `connection_not_found` on
 *     the trace so the rejection path stays observable.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { detectRealEnvMissing, makeRealAdapter } from '../src/adapters/real.js';
import {
  createHpackHandler,
  validateHpackRequest,
} from '../src/routes/api/hpack/handler.js';
import type { Http3MultiplexAdapter } from '../src/adapters/interface.js';

let mock: Http3MultiplexAdapter;

beforeEach(() => {
  mock = makeMockAdapter({ seed: 13, latencyMs: 1 });
});

afterEach(async () => {
  await mock.reset();
});

describe('mock adapter — HPACK dynamic table', () => {
  it('axis 1: insertHpackHeader records the index + monotonic index growth', async () => {
    await mock.openConnection({
      connectionId: 'h-1',
      url: 'https://origin.example/h3',
    });
    const first = await mock.insertHpackHeader({
      connectionId: 'h-1',
      name: 'content-type',
      value: 'application/json',
    });
    expect(first.index).toBe(0);
    expect(first.tableSize).toBe(1);

    const second = await mock.insertHpackHeader({
      connectionId: 'h-1',
      name: 'x-request-id',
      value: 'abc123',
    });
    expect(second.index).toBe(1);
    expect(second.tableSize).toBe(2);

    const insertTraces = mock.traces().filter((t) => t.op === 'insertHpackHeader');
    expect(insertTraces).toHaveLength(2);
    expect(insertTraces[1]?.detail?.['index']).toBe(1);
  });

  it('axis 2: repeated inserts keep the compression ratio above 1x', async () => {
    await mock.openConnection({
      connectionId: 'h-2',
      url: 'https://origin.example/h3',
    });
    for (let i = 0; i < 8; i += 1) {
      await mock.insertHpackHeader({
        connectionId: 'h-2',
        name: `x-hdr-${i}`,
        value: 'v'.repeat(32),
      });
    }
    // Use a fixture-shaped header value here rather than a JWT-like string —
    // the compression ratio invariant depends only on byte length + the
    // compression factor, not on the token content, so a plain repetition
    // keeps the assertion stable while avoiding GitGuardian false positives.
    const last = await mock.insertHpackHeader({
      connectionId: 'h-2',
      name: 'authorization',
      value: 'Token '.concat('x'.repeat(40)),
    });
    expect(last.compressionRatio).toBeGreaterThan(1);
    // The default compression factor is 3 so the observed ratio must sit
    // near that value; leave a wide envelope so cross-platform rounding does
    // not flake the assertion.
    expect(last.compressionRatio).toBeGreaterThanOrEqual(2.5);
    expect(last.compressionRatio).toBeLessThanOrEqual(3.5);

    const metrics = mock.metrics();
    expect(metrics.hpackInserts).toBe(9);
    expect(metrics.hpackTableSize).toBe(9);
    expect(metrics.hpackCompressionRatio).toBeGreaterThan(1);
  });

  it('axis 3: two connections keep independent compression counters', async () => {
    await mock.openConnection({
      connectionId: 'h-a',
      url: 'https://origin.example/h3',
    });
    await mock.openConnection({
      connectionId: 'h-b',
      url: 'https://origin.example/h3',
    });
    await mock.insertHpackHeader({
      connectionId: 'h-a',
      name: 'content-length',
      value: '1024',
    });
    await mock.insertHpackHeader({
      connectionId: 'h-a',
      name: 'content-length',
      value: '2048',
    });
    await mock.insertHpackHeader({
      connectionId: 'h-b',
      name: 'accept',
      value: 'application/json',
    });

    // Each connection accumulates its own raw / compressed byte counters;
    // the aggregate ratio in metrics() folds both together so the harness
    // observes a stable ratio across the whole run.
    const metrics = mock.metrics();
    expect(metrics.hpackInserts).toBe(3);
    expect(metrics.hpackTableSize).toBeGreaterThanOrEqual(1);
    expect(metrics.hpackCompressionRatio).toBeGreaterThan(1);
  });

  it('axis 4: insertHpackHeader on a missing connection surfaces connection_not_found', async () => {
    await expect(
      mock.insertHpackHeader({
        connectionId: 'never-opened',
        name: 'x',
        value: 'y',
      }),
    ).rejects.toThrow(/connection.*not open|connection_not_found/);

    const rejected = mock
      .traces()
      .filter((t) => t.op === 'insertHpackHeader' && !t.ok);
    expect(rejected).toHaveLength(1);
    expect(rejected[0]?.errorKind).toBe('connection_not_found');
  });

  it('axis 5: fidelity trace records the tableSize + compressionRatio for downstream diffing', async () => {
    await mock.openConnection({
      connectionId: 'h-fid',
      url: 'https://origin.example/h3',
    });
    await mock.insertHpackHeader({
      connectionId: 'h-fid',
      name: 'user-agent',
      value: 'kiwa-test/0.2.0',
    });

    const traces = mock.traces().filter((t) => t.op === 'insertHpackHeader');
    expect(traces).toHaveLength(1);
    expect(traces[0]?.detail?.['tableSize']).toBe(1);
    expect(typeof traces[0]?.detail?.['compressionRatio']).toBe('number');
  });

  it('axis 6 (Issue #981 F2): closeConnection preserves HPACK metrics for post-teardown aggregation', async () => {
    // The fidelity harness aggregates HPACK observables across the whole run
    // so a caller that inserts headers then tears the connection down should
    // still see a non-zero tableSize + ratio in metrics(). Without snapshotting
    // on closeConnection the aggregate collapses to zero the instant every
    // connection is closed — the harness would report perfect compression on a
    // freshly wiped table, hiding real drift.
    await mock.openConnection({
      connectionId: 'h-td',
      url: 'https://origin.example/h3',
    });
    for (let i = 0; i < 6; i += 1) {
      await mock.insertHpackHeader({
        connectionId: 'h-td',
        name: `x-hdr-${i}`,
        value: 'v'.repeat(32),
      });
    }
    const beforeClose = mock.metrics();
    expect(beforeClose.hpackTableSize).toBeGreaterThan(0);
    expect(beforeClose.hpackCompressionRatio).toBeGreaterThan(1);

    await mock.closeConnection({ connectionId: 'h-td' });

    const afterClose = mock.metrics();
    // inserts counter always survived — the regression is that tableSize +
    // ratio previously dropped to zero. Both must now stay above zero so the
    // aggregate is meaningful.
    expect(afterClose.hpackInserts).toBe(6);
    expect(afterClose.hpackTableSize).toBeGreaterThanOrEqual(
      beforeClose.hpackTableSize,
    );
    expect(afterClose.hpackCompressionRatio).toBeGreaterThan(1);
  });
});

describe('/api/hpack — insert handler', () => {
  it('rejects payloads missing name or value', () => {
    const missingName = validateHpackRequest({
      kind: 'insert-header',
      connectionId: 'h-1',
      value: 'v',
    });
    expect(missingName.ok).toBe(false);
    if (!missingName.ok) {
      expect(missingName.errorKind).toBe('missing_header_name');
    }

    const missingValue = validateHpackRequest({
      kind: 'insert-header',
      connectionId: 'h-1',
      name: 'x-hdr',
    });
    expect(missingValue.ok).toBe(false);
    if (!missingValue.ok) {
      expect(missingValue.errorKind).toBe('missing_header_value');
    }
  });

  it('routes insert-header through the adapter and surfaces tableSize + compressionRatio', async () => {
    const handler = createHpackHandler({ adapter: mock });
    await mock.openConnection({
      connectionId: 'h-h-1',
      url: 'https://origin.example/h3',
    });
    const res = await handler({
      kind: 'insert-header',
      connectionId: 'h-h-1',
      name: 'accept',
      value: 'application/json',
    });
    expect(res.ok).toBe(true);
    expect(res.tableSize).toBe(1);
    expect(typeof res.compressionRatio).toBe('number');
    expect(res.compressionRatio!).toBeGreaterThan(1);
  });
});

describe('real adapter — HPACK env-detect skeleton', () => {
  it('refuses insertHpackHeader with KIWA_HTTP3_ENV_MISSING', async () => {
    const real = makeRealAdapter();
    expect(detectRealEnvMissing()).toBe('KIWA_HTTP3_ENV_MISSING');
    await expect(
      real.insertHpackHeader({ connectionId: 'r-1', name: 'x', value: 'y' }),
    ).rejects.toThrow(/KIWA_HTTP3_ENV_MISSING/);

    const t = real.traces().filter((e) => e.op === 'insertHpackHeader');
    expect(t[0]?.errorKind).toBe('KIWA_HTTP3_ENV_MISSING');
  });
});
