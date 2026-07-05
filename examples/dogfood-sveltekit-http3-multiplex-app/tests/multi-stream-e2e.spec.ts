/**
 * Multi-stream + priority scheduling end-to-end fidelity harness.
 *
 * Sub-Issue #974 (v1.28-4) AC — the mock adapter drives a full HTTP/3
 * multi-stream ceremony end to end and the fidelity harness diffs the raw
 * {@link TraceEvent} sequence across four axes.
 *
 *  1. A connection opens against the HTTP/3 origin and returns a 0-RTT
 *     acceptance flag so downstream resumption paths are observable at the
 *     adapter boundary.
 *  2. Multiple request streams open with explicit priorities, and the
 *     scheduler drains them in ascending priority order (lowest number wins).
 *  3. `concurrentSend` opens N streams + records a drain order that matches
 *     the priority-based scheduling nginx-quic exposes on its default config.
 *  4. Writing to a closed connection records the errorKind so the handler
 *     rejection path stays observable end-to-end.
 *
 * The real adapter is exercised through the env-detect skeleton and every op
 * refuses with `KIWA_HTTP3_ENV_MISSING` on every non-integration environment
 * (the default). Downstream tests inspect
 * {@link Http3MultiplexAdapter.mode} + the trace to skip real assertions on
 * those systems.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { detectRealEnvMissing, makeRealAdapter } from '../src/adapters/real.js';
import {
  createMultiStreamHandler,
  validateMultiStreamRequest,
} from '../src/routes/api/multi-stream/handler.js';
import type { Http3MultiplexAdapter } from '../src/adapters/interface.js';

const encoder = new TextEncoder();

function encodeBase64(input: string): string {
  return Buffer.from(encoder.encode(input)).toString('base64');
}

let mock: Http3MultiplexAdapter;

beforeEach(() => {
  mock = makeMockAdapter({ seed: 7, latencyMs: 1 });
});

afterEach(async () => {
  await mock.reset();
});

describe('mock adapter — multi-stream + priority scheduling', () => {
  it('axis 1: openConnection records URL, 0-RTT decision, and latency sample', async () => {
    const res = await mock.openConnection({
      connectionId: 'conn-1',
      url: 'https://origin.example/h3',
      zeroRtt: false,
    });
    expect(res.connectionId).toBe('conn-1');
    expect(res.url).toBe('https://origin.example/h3');
    expect(res.zeroRttUsed).toBe(false);
    expect(res.earlyDataAccepted).toBe(0);
    expect(res.latencyMs).toBeGreaterThanOrEqual(0);

    const traces = mock.traces();
    const openTraces = traces.filter((t) => t.op === 'openConnection');
    expect(openTraces).toHaveLength(1);
    expect(openTraces[0]?.ok).toBe(true);

    const metrics = mock.metrics();
    expect(metrics.connectionsOpened).toBe(1);
    expect(metrics.openConnectionLatencySamplesMs).toHaveLength(1);
  });

  it('axis 2: openStream returns distinct ids per call and records the priority on the trace', async () => {
    await mock.openConnection({ connectionId: 'c-a', url: 'https://origin.example/h3' });
    const a = await mock.openStream({ connectionId: 'c-a', priority: 100 });
    const b = await mock.openStream({ connectionId: 'c-a', priority: 50 });

    expect(a.streamId).not.toBe(b.streamId);
    expect(a.priority).toBe(100);
    expect(b.priority).toBe(50);
    const metrics = mock.metrics();
    expect(metrics.streamsOpened).toBe(2);

    const openTraces = mock.traces().filter((t) => t.op === 'openStream');
    expect(openTraces[0]?.detail?.['priority']).toBe(100);
    expect(openTraces[1]?.detail?.['priority']).toBe(50);
  });

  it('axis 3: concurrentSend drains streams in ascending priority order', async () => {
    await mock.openConnection({ connectionId: 'c-b', url: 'https://origin.example/h3' });
    const res = await mock.concurrentSend({
      connectionId: 'c-b',
      streams: [
        { priority: 200, byteLength: 4 },
        { priority: 10, byteLength: 16 },
        { priority: 128, byteLength: 8 },
      ],
    });
    expect(res.streamIds).toHaveLength(3);
    expect(res.drainOrder).toHaveLength(3);
    expect(res.totalBytes).toBe(28);
    // Drain order must match ascending priority — 10 < 128 < 200. The mock's
    // getActiveStreams sorts by priority so the drain order surfaces the
    // strict-priority scheduling nginx-quic uses by default.
    const drainedIdx = res.drainOrder.map((id) => res.streamIds.indexOf(id));
    // The scheduler picks priority 10 first, priority 128 second, priority 200 last.
    expect(drainedIdx[0]).toBe(1);
    expect(drainedIdx[1]).toBe(2);
    expect(drainedIdx[2]).toBe(0);

    const metrics = mock.metrics();
    expect(metrics.concurrentSendsTotal).toBe(1);
    expect(metrics.concurrentSendLatencySamplesMs).toHaveLength(1);
  });

  it('axis 4: writing bytes into a stream records the byteLength + write latency sample', async () => {
    await mock.openConnection({ connectionId: 'c-w', url: 'https://origin.example/h3' });
    const stream = await mock.openStream({ connectionId: 'c-w' });
    const res = await mock.writeStream({
      connectionId: 'c-w',
      streamId: stream.streamId,
      data: encoder.encode('http3 payload'),
    });
    expect(res.byteLength).toBe(13);

    const read = await mock.readStream({
      connectionId: 'c-w',
      streamId: stream.streamId,
    });
    expect(read.byteLength).toBe(13);

    const metrics = mock.metrics();
    expect(metrics.writesTotal).toBe(1);
    expect(metrics.readsTotal).toBe(1);
    expect(metrics.writeLatencySamplesMs).toHaveLength(1);
  });

  it('axis 5: closeStream releases the stream + records the trace + increments the counter', async () => {
    await mock.openConnection({ connectionId: 'c-c', url: 'https://origin.example/h3' });
    const stream = await mock.openStream({ connectionId: 'c-c' });
    await mock.closeStream({
      connectionId: 'c-c',
      streamId: stream.streamId,
    });
    const metrics = mock.metrics();
    expect(metrics.streamsClosed).toBe(1);
    const closeTraces = mock.traces().filter((t) => t.op === 'closeStream');
    expect(closeTraces).toHaveLength(1);
    expect(closeTraces[0]?.ok).toBe(true);
  });

  it('axis 6: openConnection twice with the same id rejects and records the divergence', async () => {
    await mock.openConnection({ connectionId: 'c-dup', url: 'https://origin.example/h3' });
    await expect(
      mock.openConnection({ connectionId: 'c-dup', url: 'https://origin.example/h3' }),
    ).rejects.toThrow(/already open/);

    const rejected = mock
      .traces()
      .filter((t) => t.op === 'openConnection' && !t.ok);
    expect(rejected).toHaveLength(1);
    expect(rejected[0]?.errorKind).toBe('connection_already_open');
  });

  it('axis 7: writing to a closed connection records session_not_found style errorKind', async () => {
    await expect(
      mock.writeStream({
        connectionId: 'never-opened',
        streamId: 'phantom',
        data: encoder.encode('x'),
      }),
    ).rejects.toThrow(/connection.*not open|connection_not_found/);

    const rejected = mock.traces().filter((t) => t.op === 'writeStream' && !t.ok);
    expect(rejected).toHaveLength(1);
    expect(rejected[0]?.errorKind).toBe('connection_not_found');
  });
});

describe('/api/multi-stream — handler routing', () => {
  it('rejects payloads that fail schema validation before touching the adapter', () => {
    const bodyMissingConn = validateMultiStreamRequest({ kind: 'open-connection' });
    expect(bodyMissingConn.ok).toBe(false);
    if (!bodyMissingConn.ok) {
      expect(bodyMissingConn.errorKind).toBe('missing_connection_id');
    }

    const bodyUnknownKind = validateMultiStreamRequest({
      connectionId: 'c-1',
      kind: 'delete-connection',
    });
    expect(bodyUnknownKind.ok).toBe(false);
    if (!bodyUnknownKind.ok) {
      expect(bodyUnknownKind.errorKind).toBe('unknown_kind');
    }

    const invalidStreams = validateMultiStreamRequest({
      connectionId: 'c-1',
      kind: 'concurrent-send',
      streams: [{ priority: 'not-a-number', byteLength: 4 }],
    });
    expect(invalidStreams.ok).toBe(false);
    if (!invalidStreams.ok) {
      expect(invalidStreams.errorKind).toBe('invalid_stream_entry');
    }
  });

  it('routes open-connection -> openConnection and returns the 0-RTT flag', async () => {
    const handler = createMultiStreamHandler({ adapter: mock });
    const res = await handler({
      kind: 'open-connection',
      connectionId: 'h-1',
      url: 'https://origin.example/h3',
      zeroRtt: true,
    });
    expect(res.ok).toBe(true);
    expect(res.zeroRttUsed).toBe(false);
    expect(res.earlyDataAccepted).toBe(0);
  });

  it('routes write-stream -> writeStream with the decoded payload size', async () => {
    const handler = createMultiStreamHandler({ adapter: mock });
    await handler({
      kind: 'open-connection',
      connectionId: 'h-2',
      url: 'https://origin.example/h3',
    });
    const open = await handler({
      kind: 'open-stream',
      connectionId: 'h-2',
    });
    const write = await handler({
      kind: 'write-stream',
      connectionId: 'h-2',
      streamId: open.streamId!,
      dataBase64: encodeBase64('hello h3'),
    });
    expect(write.ok).toBe(true);
    expect(write.byteLength).toBe(8);
  });

  it('routes concurrent-send -> concurrentSend and surfaces the drain order', async () => {
    const handler = createMultiStreamHandler({ adapter: mock });
    await handler({
      kind: 'open-connection',
      connectionId: 'h-cs',
      url: 'https://origin.example/h3',
    });
    const res = await handler({
      kind: 'concurrent-send',
      connectionId: 'h-cs',
      streams: [
        { priority: 200, byteLength: 100 },
        { priority: 50, byteLength: 200 },
      ],
    });
    expect(res.ok).toBe(true);
    expect(res.streamIds).toHaveLength(2);
    expect(res.drainOrder).toHaveLength(2);
    expect(res.totalBytes).toBe(300);
  });
});

describe('real adapter — multi-stream env-detect skeleton', () => {
  it('refuses openConnection with KIWA_HTTP3_ENV_MISSING and records the trace', async () => {
    const real = makeRealAdapter();
    expect(real.mode).toBe('real');
    expect(detectRealEnvMissing()).toBe('KIWA_HTTP3_ENV_MISSING');

    await expect(
      real.openConnection({ connectionId: 'r-1', url: 'https://origin.example/h3' }),
    ).rejects.toThrow(/KIWA_HTTP3_ENV_MISSING/);
    const t = real.traces().filter((e) => e.op === 'openConnection');
    expect(t[0]?.errorKind).toBe('KIWA_HTTP3_ENV_MISSING');
  });

  it('idempotent closeConnection still records the env-missing errorKind for the harness', async () => {
    const real = makeRealAdapter();
    await real.closeConnection({ connectionId: 'r-1' });
    const t = real.traces().filter((e) => e.op === 'closeConnection');
    expect(t).toHaveLength(1);
    expect(t[0]?.errorKind).toBe('KIWA_HTTP3_ENV_MISSING');
  });

  it('refuses concurrentSend + writeStream + closeStream with KIWA_HTTP3_ENV_MISSING', async () => {
    const real = makeRealAdapter();
    await expect(
      real.concurrentSend({
        connectionId: 'r-2',
        streams: [{ priority: 50, byteLength: 4 }],
      }),
    ).rejects.toThrow(/KIWA_HTTP3_ENV_MISSING/);
    await expect(
      real.writeStream({
        connectionId: 'r-2',
        streamId: 'phantom',
        data: encoder.encode('x'),
      }),
    ).rejects.toThrow(/KIWA_HTTP3_ENV_MISSING/);
    await expect(
      real.closeStream({ connectionId: 'r-2', streamId: 'phantom' }),
    ).rejects.toThrow(/KIWA_HTTP3_ENV_MISSING/);

    const t = real.traces();
    expect(t.some((e) => e.op === 'concurrentSend' && !e.ok)).toBe(true);
    expect(t.some((e) => e.op === 'writeStream' && !e.ok)).toBe(true);
    expect(t.some((e) => e.op === 'closeStream' && !e.ok)).toBe(true);
  });
});
