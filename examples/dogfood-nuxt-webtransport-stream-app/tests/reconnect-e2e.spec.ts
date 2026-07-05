/**
 * Reset stream + connection migration harness.
 *
 * Sub-Issue #973 (v1.28-3) AC — the mock adapter drives stream reset,
 * connection migration, and 0-RTT resumption under network hiccup. The
 * fidelity harness diffs the raw {@link TraceEvent} sequence across four
 * axes.
 *
 *  1. resetStream on a uni stream fires the underlying reset primitive and
 *     records the error code on the trace. aioquic exposes the same
 *     stop-sending / reset-stream frames on the QUIC layer, so the mock
 *     matches the shape.
 *  2. resetStream on a bi stream closes the stream so downstream reads
 *     return null. The trace records the reset op distinctly from a natural
 *     close so the fidelity harness can measure divergence between the two.
 *  3. migrateConnection records a path validation attempt and increments
 *     the migration counter. Callers can opt out of validation to observe
 *     the fail-fast branch (aioquic's `path_challenge` frame is optional
 *     when the client already has a valid connection ID).
 *  4. openSession twice with `zeroRtt: true` records the 0-RTT reuse on the
 *     second session. The first session cold-starts because there is no
 *     resumption ticket yet.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { detectRealEnvMissing, makeRealAdapter } from '../src/adapters/real.js';
import { createResetHandler, validateResetRequest } from '../server/api/reset.post.js';
import type { WebTransportStreamAdapter } from '../src/adapters/interface.js';

const encoder = new TextEncoder();

let mock: WebTransportStreamAdapter;

beforeEach(() => {
  mock = makeMockAdapter({ seed: 13, latencyMs: 1 });
});

afterEach(async () => {
  await mock.reset();
});

describe('mock adapter — reset stream + migration + 0-RTT', () => {
  it('axis 1: resetStream on a uni stream records the error code on the trace', async () => {
    await mock.openSession({ sessionId: 'rc-1', url: 'https://origin.example/wt' });
    const uni = await mock.openUniStream({ sessionId: 'rc-1' });
    const res = await mock.resetStream({
      sessionId: 'rc-1',
      streamId: uni.streamId,
      errorCode: 42,
    });
    expect(res.errorCode).toBe(42);

    const resetTrace = mock.traces().filter((t) => t.op === 'resetStream');
    expect(resetTrace).toHaveLength(1);
    expect(resetTrace[0]?.ok).toBe(true);
    expect(resetTrace[0]?.detail?.['errorCode']).toBe(42);

    const metrics = mock.metrics();
    expect(metrics.resetsTotal).toBe(1);
  });

  it('axis 2: resetStream on a bi stream closes it so subsequent reads return zero bytes', async () => {
    await mock.openSession({ sessionId: 'rc-2', url: 'https://origin.example/wt' });
    const bi = await mock.openBiStream({ sessionId: 'rc-2' });
    await mock.writeStream({
      sessionId: 'rc-2',
      streamId: bi.streamId,
      data: encoder.encode('doomed'),
    });
    await mock.resetStream({
      sessionId: 'rc-2',
      streamId: bi.streamId,
      errorCode: 7,
    });
    // Reading after reset returns null in the mock (bi stream state=closed).
    // The interface flattens null to byteLength=0 so downstream tests can
    // assert on the length without a null check.
    const read = await mock.readStream({
      sessionId: 'rc-2',
      streamId: bi.streamId,
    });
    expect(read.byteLength).toBe(0);
  });

  it('axis 3: migrateConnection with validate: true records the migration + latency', async () => {
    await mock.openSession({ sessionId: 'rc-3', url: 'https://origin.example/wt' });
    const res = await mock.migrateConnection({ sessionId: 'rc-3', validate: true });
    expect(res.validated).toBe(true);

    const metrics = mock.metrics();
    expect(metrics.migrations).toBe(1);
    expect(metrics.migrationLatencySamplesMs).toHaveLength(1);
  });

  it('axis 4: migrateConnection with validate: false records the unvalidated branch', async () => {
    await mock.openSession({ sessionId: 'rc-4', url: 'https://origin.example/wt' });
    const res = await mock.migrateConnection({ sessionId: 'rc-4', validate: false });
    expect(res.validated).toBe(false);

    const trace = mock.traces().filter((t) => t.op === 'migrateConnection');
    expect(trace[0]?.detail?.['validated']).toBe(false);
  });

  it('axis 5: openSession twice with zeroRtt: true records the 0-RTT reuse on the second attempt', async () => {
    const first = await mock.openSession({
      sessionId: 'rc-zr-1',
      url: 'https://origin.example/wt',
      zeroRtt: true,
    });
    expect(first.zeroRttUsed).toBe(false);

    const second = await mock.openSession({
      sessionId: 'rc-zr-2',
      url: 'https://origin.example/wt',
      zeroRtt: true,
    });
    expect(second.zeroRttUsed).toBe(true);

    const metrics = mock.metrics();
    expect(metrics.zeroRttUses).toBe(1);
  });

  it('axis 6: three sequential migrateConnection calls each surface a fresh migration sample', async () => {
    await mock.openSession({ sessionId: 'rc-6', url: 'https://origin.example/wt' });
    for (let i = 0; i < 3; i += 1) {
      await mock.migrateConnection({ sessionId: 'rc-6' });
    }
    const metrics = mock.metrics();
    expect(metrics.migrations).toBe(3);
    expect(metrics.migrationLatencySamplesMs).toHaveLength(3);
  });
});

describe('/api/reset — reset + migration handler', () => {
  it('rejects reset-stream when streamId or errorCode is missing', () => {
    const missingStream = validateResetRequest({
      kind: 'reset-stream',
      sessionId: 's-1',
      errorCode: 0,
    });
    expect(missingStream.ok).toBe(false);
    if (!missingStream.ok) expect(missingStream.errorKind).toBe('missing_stream_id');

    const missingCode = validateResetRequest({
      kind: 'reset-stream',
      sessionId: 's-1',
      streamId: 'bi-1',
    });
    expect(missingCode.ok).toBe(false);
    if (!missingCode.ok) expect(missingCode.errorKind).toBe('missing_error_code');
  });

  it('routes reset-stream and migrate-connection through the adapter', async () => {
    const handler = createResetHandler({ adapter: mock });
    await mock.openSession({ sessionId: 'rh-1', url: 'https://origin.example/wt' });
    const bi = await mock.openBiStream({ sessionId: 'rh-1' });

    const reset = await handler({
      kind: 'reset-stream',
      sessionId: 'rh-1',
      streamId: bi.streamId,
      errorCode: 5,
    });
    expect(reset.ok).toBe(true);
    expect(reset.errorCode).toBe(5);

    const migrate = await handler({
      kind: 'migrate-connection',
      sessionId: 'rh-1',
      validate: true,
    });
    expect(migrate.ok).toBe(true);
    expect(migrate.validated).toBe(true);
  });
});

describe('real adapter — reset + migration env-detect skeleton', () => {
  it('refuses resetStream + migrateConnection with KIWA_WEBTRANSPORT_ENV_MISSING', async () => {
    const real = makeRealAdapter();
    expect(detectRealEnvMissing()).toBe('KIWA_WEBTRANSPORT_ENV_MISSING');
    await expect(
      real.resetStream({ sessionId: 'r-1', streamId: 'phantom', errorCode: 0 }),
    ).rejects.toThrow(/KIWA_WEBTRANSPORT_ENV_MISSING/);
    await expect(
      real.migrateConnection({ sessionId: 'r-1' }),
    ).rejects.toThrow(/KIWA_WEBTRANSPORT_ENV_MISSING/);

    const t = real.traces();
    expect(t.some((e) => e.op === 'resetStream' && !e.ok)).toBe(true);
    expect(t.some((e) => e.op === 'migrateConnection' && !e.ok)).toBe(true);
  });
});
