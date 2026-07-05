/**
 * SSE streaming e2e spec (streaming-response axis focus).
 *
 * Sub-Issue GH-916 (v1.24-3) AC — SSE Response + backpressure + Vercel
 * KV integration. Covers the streaming-response axis (openStream +
 * sendChunk + resumeStream + closeStream) end-to-end.
 *
 * Fidelity axes covered here:
 *  1. driveSseOpen delivers the initial event chunk and reports
 *     chunksSent = 1 on the snapshot.
 *  2. driveSseBackpressure writes N chunks; a run whose byte total stays
 *     below high-water mark closes with hitBackpressure = false.
 *  3. A run whose byte total exceeds high-water mark closes with
 *     hitBackpressure = true — the underlying axis session flipped to
 *     `backpressure` mid-stream.
 *  4. closeStream is idempotent from the harness perspective — the
 *     backpressure op closes cleanly and a subsequent close is skipped.
 *  5. driveSseOpen + driveSseBackpressure combine into a single stream
 *     session per streamId (byte counters accumulate across ops).
 *  6. Vercel KV integration — writing a value + streaming it back via SSE
 *     preserves the payload byte-for-byte.
 *  7. serializeSseFrame produces valid SSE wire format for multi-line
 *     data + id + event fields.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/lib/mock.js';
import { makeRealAdapter, SkippedError } from '../src/lib/real.js';
import { handleSse, serializeSseFrame } from '../src/app/api/stream/route.js';

describe('mock adapter — SSE streaming', () => {
  let adapter: ReturnType<typeof makeMockAdapter>;

  beforeEach(() => {
    adapter = makeMockAdapter();
  });

  afterEach(async () => {
    await adapter.reset();
  });

  it('axis 1: driveSseOpen delivers the initial event chunk', async () => {
    const snapshot = await adapter.driveSseOpen({
      streamId: 's1',
      firstChunk: 'data: hello\n\n',
    });
    expect(snapshot.streamId).toBe('s1');
    expect(snapshot.firstChunk).toBe('data: hello\n\n');
    expect(snapshot.chunksSent).toBe(1);
  });

  it('axis 2: small run stays under high-water; closes without backpressure', async () => {
    const snapshot = await adapter.driveSseBackpressure({
      streamId: 's2',
      chunks: ['data: chunk-1\n\n', 'data: chunk-2\n\n', 'data: chunk-3\n\n'],
      highWaterMark: 8192,
    });
    expect(snapshot.chunksSent).toBe(3);
    expect(snapshot.hitBackpressure).toBe(false);
    expect(snapshot.closed).toBe(true);
  });

  it('axis 3: overwhelming run hits backpressure mid-stream', async () => {
    // Deliberately small high-water mark + long chunks → backpressure.
    const bigChunk = 'x'.repeat(500);
    const snapshot = await adapter.driveSseBackpressure({
      streamId: 's3',
      chunks: [bigChunk, bigChunk, bigChunk, bigChunk],
      highWaterMark: 512,
    });
    expect(snapshot.chunksSent).toBe(4);
    expect(snapshot.hitBackpressure).toBe(true);
    expect(snapshot.bytesSent).toBeGreaterThan(512);
    expect(snapshot.closed).toBe(true);
  });

  it('axis 4: reusing a closed streamId throws — silent retry hides bugs', async () => {
    await adapter.driveSseBackpressure({
      streamId: 's4',
      chunks: ['data: 1\n\n'],
      highWaterMark: 8192,
    });
    // Reusing the same streamId after close is a caller error. The
    // adapter records a failure trace and throws so retries do not
    // silently drop chunks.
    await expect(
      adapter.driveSseBackpressure({
        streamId: 's4',
        chunks: ['data: retry\n\n'],
        highWaterMark: 8192,
      }),
    ).rejects.toThrow(/already closed/);
    // A fresh streamId works.
    const second = await adapter.driveSseBackpressure({
      streamId: 's4-b',
      chunks: ['data: 2\n\n'],
      highWaterMark: 8192,
    });
    expect(second.closed).toBe(true);
  });

  it('axis 5: driveSseOpen + driveSseBackpressure share the stream session', async () => {
    await adapter.driveSseOpen({
      streamId: 's5',
      firstChunk: 'data: init\n\n',
    });
    const snapshot = await adapter.driveSseBackpressure({
      streamId: 's5',
      chunks: ['data: follow-1\n\n', 'data: follow-2\n\n'],
      highWaterMark: 8192,
    });
    // chunksSent counts the initial + follow-ups = 3 total on the same session.
    expect(snapshot.chunksSent).toBe(3);
  });

  it('axis 6: Vercel KV integration — writing then streaming preserves payload', async () => {
    const payload = 'stream-me-back-verbatim';
    // Write to KV first.
    const write = await adapter.driveKvWrite({
      key: 'stream:payload:1',
      value: payload,
    });
    expect(write.invalidatedCache).toBe(false);
    // Then stream it as an SSE event.
    const read = await adapter.driveKvRead({ key: 'stream:payload:1' });
    expect(read.value).toBe(payload);
    const stream = await adapter.driveSseOpen({
      streamId: 's6-kv',
      firstChunk: serializeSseFrame({ id: 'kv-1', event: 'kv', data: read.value ?? '' }),
    });
    expect(stream.firstChunk).toContain(payload);
  });

  it('axis 7: serializeSseFrame emits valid SSE wire format', () => {
    const frame = serializeSseFrame({
      id: 42,
      event: 'update',
      data: 'multi\nline',
    });
    expect(frame).toBe('id: 42\nevent: update\ndata: multi\ndata: line\n\n');
  });

  it('axis 8: /api/stream route drives open + backpressure with the adapter', async () => {
    const bigChunk = 'x'.repeat(200);
    const response = await handleSse(adapter, {
      streamId: 's8-route',
      firstChunk: 'data: init\n\n',
      followUpChunks: [bigChunk, bigChunk, bigChunk],
      highWaterMark: 300,
    });
    expect(response.status).toBe(200);
    expect(response.body.hitBackpressure).toBe(true);
    expect(response.body.closed).toBe(true);
  });

  it('axis 9: metrics counters + latency samples accumulate on every stream op', async () => {
    await adapter.driveSseOpen({ streamId: 'm1', firstChunk: 'data: 1\n\n' });
    await adapter.driveSseBackpressure({
      streamId: 'm1',
      chunks: ['data: 2\n\n'],
      highWaterMark: 8192,
    });
    const m = adapter.metrics();
    expect(m.sseOpenCount).toBe(1);
    expect(m.sseBackpressureCount).toBe(1);
    expect(m.latencySamplesMs.length).toBe(2);
  });
});

describe('real adapter — env-gate skip path', () => {
  it('records KIWA_VERCEL_EDGE_ENV_MISSING for SSE open when env absent', async () => {
    const real = makeRealAdapter();
    await expect(
      real.driveSseOpen({ streamId: 'r1', firstChunk: 'data: 1\n\n' }),
    ).rejects.toBeInstanceOf(SkippedError);
    expect(real.traces()[0]?.errorKind).toBe('KIWA_VERCEL_EDGE_ENV_MISSING');
  });

  it('records KIWA_VERCEL_EDGE_ENV_MISSING for backpressure when env absent', async () => {
    const real = makeRealAdapter();
    await expect(
      real.driveSseBackpressure({
        streamId: 'r2',
        chunks: ['data: 1\n\n'],
        highWaterMark: 8192,
      }),
    ).rejects.toBeInstanceOf(SkippedError);
    expect(real.traces()[0]?.errorKind).toBe('KIWA_VERCEL_EDGE_ENV_MISSING');
  });
});
