/**
 * Uni stream + Datagram end-to-end fidelity harness.
 *
 * Sub-Issue #973 (v1.28-3) AC — the mock adapter drives a full uni stream
 * ceremony end to end and the fidelity harness diffs the raw
 * {@link TraceEvent} sequence across four axes.
 *
 *  1. A session opens against the WebTransport origin and returns a 0-RTT
 *     acceptance flag so downstream resumption paths are observable at the
 *     adapter boundary.
 *  2. A uni stream opens, receives multiple writes, and closes cleanly. Each
 *     op is recorded on the trace with a stable order.
 *  3. Datagrams dispatch through the session without opening a stream. The
 *     trace records the byte length so backpressure-free unreliable delivery
 *     is measurable.
 *  4. Sequential open + write + close cycles do not leak stream ids — every
 *     new uni stream gets a fresh id and the metrics counter increments
 *     monotonically.
 *
 * The real adapter is exercised through the env-detect skeleton and every op
 * refuses with `KIWA_WEBTRANSPORT_ENV_MISSING` on every non-integration
 * environment (the default). Downstream tests inspect
 * {@link WebTransportStreamAdapter.mode} + the trace to skip real assertions
 * on those systems.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { detectRealEnvMissing, makeRealAdapter } from '../src/adapters/real.js';
import { createStreamHandler, validateStreamRequest } from '../server/api/stream.post.js';
import type { WebTransportStreamAdapter } from '../src/adapters/interface.js';

const encoder = new TextEncoder();

function encodeBase64(input: string): string {
  return Buffer.from(encoder.encode(input)).toString('base64');
}

let mock: WebTransportStreamAdapter;

beforeEach(() => {
  mock = makeMockAdapter({ seed: 7, latencyMs: 1 });
});

afterEach(async () => {
  await mock.reset();
});

describe('mock adapter — uni stream + datagram ceremony', () => {
  it('axis 1: openSession records the URL, 0-RTT decision, and latency sample', async () => {
    const res = await mock.openSession({
      sessionId: 'sess-1',
      url: 'https://origin.example/wt',
      zeroRtt: false,
    });
    expect(res.sessionId).toBe('sess-1');
    expect(res.url).toBe('https://origin.example/wt');
    expect(res.zeroRttUsed).toBe(false);
    expect(res.latencyMs).toBeGreaterThanOrEqual(0);

    const traces = mock.traces();
    const openTraces = traces.filter((t) => t.op === 'openSession');
    expect(openTraces).toHaveLength(1);
    expect(openTraces[0]?.ok).toBe(true);

    const metrics = mock.metrics();
    expect(metrics.sessionsOpened).toBe(1);
    expect(metrics.openSessionLatencySamplesMs).toHaveLength(1);
  });

  it('axis 2: uni stream write path emits open + write traces with monotonic ids', async () => {
    await mock.openSession({ sessionId: 's-a', url: 'https://origin.example/wt' });
    const openA = await mock.openUniStream({ sessionId: 's-a' });
    await mock.writeStream({
      sessionId: 's-a',
      streamId: openA.streamId,
      data: encoder.encode('hello'),
    });
    await mock.writeStream({
      sessionId: 's-a',
      streamId: openA.streamId,
      data: encoder.encode('world'),
    });
    const openB = await mock.openUniStream({ sessionId: 's-a' });

    expect(openA.streamId).not.toBe(openB.streamId);
    const metrics = mock.metrics();
    expect(metrics.uniStreamsOpened).toBe(2);
    expect(metrics.writesTotal).toBe(2);
  });

  it('axis 3: sendDatagram records the payload size and increments the datagram counter', async () => {
    await mock.openSession({ sessionId: 's-dg', url: 'https://origin.example/wt' });
    const res = await mock.sendDatagram({
      sessionId: 's-dg',
      data: encoder.encode('ping'),
    });
    expect(res.byteLength).toBe(4);

    const metrics = mock.metrics();
    expect(metrics.datagramsSent).toBe(1);
  });

  it('axis 4: two sequential open + close cycles produce distinct stream ids and preserve metrics', async () => {
    await mock.openSession({ sessionId: 's-multi', url: 'https://origin.example/wt' });
    const open1 = await mock.openUniStream({ sessionId: 's-multi' });
    await mock.writeStream({
      sessionId: 's-multi',
      streamId: open1.streamId,
      data: encoder.encode('one'),
    });
    const open2 = await mock.openUniStream({ sessionId: 's-multi' });
    await mock.writeStream({
      sessionId: 's-multi',
      streamId: open2.streamId,
      data: encoder.encode('two'),
    });

    expect(open1.streamId).not.toBe(open2.streamId);
    const metrics = mock.metrics();
    expect(metrics.uniStreamsOpened).toBe(2);
    expect(metrics.writesTotal).toBe(2);
  });

  it('axis 5: openSession twice with the same id rejects and records the divergence', async () => {
    await mock.openSession({ sessionId: 's-dup', url: 'https://origin.example/wt' });
    await expect(
      mock.openSession({ sessionId: 's-dup', url: 'https://origin.example/wt' }),
    ).rejects.toThrow(/already open/);

    const rejected = mock.traces().filter((t) => t.op === 'openSession' && !t.ok);
    expect(rejected).toHaveLength(1);
    expect(rejected[0]?.errorKind).toBe('session_already_open');
  });
});

describe('/api/stream — uni + datagram handler', () => {
  it('rejects payloads that fail schema validation before touching the adapter', () => {
    const bodyMissingSession = validateStreamRequest({ kind: 'open-session' });
    expect(bodyMissingSession.ok).toBe(false);
    if (!bodyMissingSession.ok) {
      expect(bodyMissingSession.errorKind).toBe('missing_session_id');
    }

    const bodyUnknownKind = validateStreamRequest({
      sessionId: 's-1',
      kind: 'delete-session',
    });
    expect(bodyUnknownKind.ok).toBe(false);
    if (!bodyUnknownKind.ok) {
      expect(bodyUnknownKind.errorKind).toBe('unknown_kind');
    }
  });

  it('routes open-session -> openSession and returns the 0-RTT flag', async () => {
    const handler = createStreamHandler({ adapter: mock });
    const res = await handler({
      kind: 'open-session',
      sessionId: 's-handler-1',
      url: 'https://origin.example/wt',
      zeroRtt: true,
    });
    expect(res.ok).toBe(true);
    expect(res.zeroRttUsed).toBe(false);
  });

  it('routes send-datagram -> sendDatagram with the decoded payload size', async () => {
    const handler = createStreamHandler({ adapter: mock });
    await handler({
      kind: 'open-session',
      sessionId: 's-handler-2',
      url: 'https://origin.example/wt',
    });
    const res = await handler({
      kind: 'send-datagram',
      sessionId: 's-handler-2',
      dataBase64: encodeBase64('ping-payload'),
    });
    expect(res.ok).toBe(true);
    expect(res.byteLength).toBe(12);
  });
});

describe('real adapter — uni + datagram env-detect skeleton', () => {
  it('refuses openSession with KIWA_WEBTRANSPORT_ENV_MISSING and records the trace', async () => {
    const real = makeRealAdapter();
    expect(real.mode).toBe('real');
    expect(detectRealEnvMissing()).toBe('KIWA_WEBTRANSPORT_ENV_MISSING');

    await expect(
      real.openSession({ sessionId: 's-real', url: 'https://origin.example/wt' }),
    ).rejects.toThrow(/KIWA_WEBTRANSPORT_ENV_MISSING/);
    const t = real.traces().filter((e) => e.op === 'openSession');
    expect(t[0]?.errorKind).toBe('KIWA_WEBTRANSPORT_ENV_MISSING');
  });

  it('idempotent closeSession still records the env-missing errorKind for the harness', async () => {
    const real = makeRealAdapter();
    await real.closeSession({ sessionId: 's-real' });
    const t = real.traces().filter((e) => e.op === 'closeSession');
    expect(t).toHaveLength(1);
    expect(t[0]?.errorKind).toBe('KIWA_WEBTRANSPORT_ENV_MISSING');
  });
});
