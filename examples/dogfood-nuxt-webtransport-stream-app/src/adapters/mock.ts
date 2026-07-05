/**
 * Mock adapter — drives `@kiwa-test/realtime` v0.2's
 * `createWebTransportUniMock` + `createWebTransportBiMock` so the same app
 * code exercises a deterministic WebTransport ceremony without touching an
 * HTTP/3 server or a Chromium instance running the origin-trial flag. Both
 * mock and real adapters satisfy {@link WebTransportStreamAdapter}, so the
 * fidelity harness can diff them side-by-side.
 *
 * State model — one session manager tracks sessions by id; each session owns
 * a uni mock + bi mock so per-session metrics stay isolated. That matches
 * how aioquic allocates HTTP/3 connection state per WebTransport session in
 * production.
 */

import {
  createWebTransportBiMock,
  createWebTransportUniMock,
  type BiStreamHandle,
  type UniStreamHandle,
  type WebTransportBiMock,
  type WebTransportUniMock,
} from '@kiwa-test/realtime';
import type {
  MigrateConnectionResult,
  OpenBiStreamResult,
  OpenSessionResult,
  OpenUniStreamResult,
  ReadStreamResult,
  ResetStreamResult,
  SendDatagramResult,
  StreamDirection,
  TraceEvent,
  WebTransportStreamAdapter,
  WriteStreamResult,
} from './interface.js';

interface StreamRecord {
  direction: StreamDirection;
  uniHandle?: UniStreamHandle;
  biHandle?: BiStreamHandle;
  windowSize: number;
}

interface SessionState {
  url: string;
  uni: WebTransportUniMock;
  bi: WebTransportBiMock;
  streams: Map<string, StreamRecord>;
  migrations: number;
  zeroRttUsed: boolean;
}

export interface MakeMockAdapterOptions {
  /** deterministic seed used by the mocks; default 1. */
  seed?: number;
  /** artificial latency injected into every mock op (ms、 default 1). */
  latencyMs?: number;
  /** whether openSession should honour the requested 0-RTT flag; default true. */
  allowZeroRtt?: boolean;
}

export function makeMockAdapter(opts: MakeMockAdapterOptions = {}): WebTransportStreamAdapter {
  const trace: TraceEvent[] = [];
  const sessions = new Map<string, SessionState>();
  // Each session needs a distinct seed so read queues + stream ids do not
  // collide when two sessions run in parallel — aioquic gives every
  // WebTransport session its own connection so the mock must not accidentally
  // share stream ids across sessions.
  let sessionSeq = 0;
  let sessionsOpened = 0;
  let sessionsClosed = 0;
  let uniStreamsOpened = 0;
  let biStreamsOpened = 0;
  let writesTotal = 0;
  let readsTotal = 0;
  let resetsTotal = 0;
  let datagramsSent = 0;
  let migrations = 0;
  let backpressureEvents = 0;
  let zeroRttUses = 0;
  const openSessionLatencySamplesMs: number[] = [];
  const openStreamLatencySamplesMs: number[] = [];
  const writeLatencySamplesMs: number[] = [];
  const migrationLatencySamplesMs: number[] = [];
  let requests = 0;

  function record(op: TraceEvent['op'], ok: boolean, extra?: Partial<TraceEvent>): void {
    const entry: TraceEvent = { op, ok };
    if (extra?.errorKind !== undefined) entry.errorKind = extra.errorKind;
    if (extra?.detail !== undefined) entry.detail = extra.detail;
    trace.push(entry);
  }

  function getSession(sessionId: string): SessionState | null {
    return sessions.get(sessionId) ?? null;
  }

  function createSession(url: string): SessionState {
    sessionSeq += 1;
    const baseSeed = opts.seed ?? 1;
    // Offset the seed per session so aioquic's per-connection unique-stream-id
    // guarantee is preserved. Prime 2654435761 (Knuth multiplicative hash)
    // scatters small integer sessionSeq inputs so session #1 vs #2 do not
    // accidentally produce colliding uni stream ids.
    const cfg = {
      seed: (baseSeed * 2654435761 + sessionSeq * 1000003) & 0x7fffffff,
      artificialLatencyMs: opts.latencyMs ?? 1,
    };
    return {
      url,
      uni: createWebTransportUniMock(cfg),
      bi: createWebTransportBiMock(cfg),
      streams: new Map(),
      migrations: 0,
      zeroRttUsed: false,
    };
  }

  return {
    mode: 'mock',
    traces: () => [...trace],

    async openSession(input): Promise<OpenSessionResult> {
      requests += 1;
      const t0 = Date.now();
      if (sessions.has(input.sessionId)) {
        record('openSession', false, { errorKind: 'session_already_open' });
        throw new Error(
          `makeMockAdapter.openSession: session ${input.sessionId} is already open`,
        );
      }
      const session = createSession(input.url);
      const wantZeroRtt = input.zeroRtt === true;
      const allowZeroRtt = opts.allowZeroRtt ?? true;
      // Simulate 0-RTT resumption acceptance — a fresh session (no prior
      // ticket in memory) always cold-starts, subsequent sessions on the
      // same origin may reuse the ticket if the caller opted in.
      session.zeroRttUsed = wantZeroRtt && allowZeroRtt && sessionSeq > 1;
      if (session.zeroRttUsed) zeroRttUses += 1;
      sessions.set(input.sessionId, session);
      sessionsOpened += 1;
      const latencyMs = Date.now() - t0;
      openSessionLatencySamplesMs.push(latencyMs);
      record('openSession', true, {
        detail: {
          sessionId: input.sessionId,
          url: input.url,
          zeroRttUsed: session.zeroRttUsed,
        },
      });
      return {
        sessionId: input.sessionId,
        url: input.url,
        zeroRttUsed: session.zeroRttUsed,
        latencyMs,
      };
    },

    async closeSession(input) {
      requests += 1;
      const session = getSession(input.sessionId);
      if (!session) {
        record('closeSession', false, { errorKind: 'session_not_found' });
        return;
      }
      // Release every open stream so the aioquic connection.close event count
      // matches — reset streams and closed streams are both consumed here.
      for (const [, sr] of session.streams) {
        if (sr.uniHandle && sr.uniHandle.state === 'open') {
          await sr.uniHandle.close();
        } else if (sr.biHandle && sr.biHandle.state === 'open') {
          await sr.biHandle.close();
        }
      }
      session.streams.clear();
      session.uni.reset();
      session.bi.reset();
      sessions.delete(input.sessionId);
      sessionsClosed += 1;
      record('closeSession', true, { detail: { sessionId: input.sessionId } });
    },

    async openUniStream(input): Promise<OpenUniStreamResult> {
      requests += 1;
      const t0 = Date.now();
      const session = getSession(input.sessionId);
      if (!session) {
        record('openUniStream', false, { errorKind: 'session_not_found' });
        throw new Error(
          `makeMockAdapter.openUniStream: session ${input.sessionId} is not open`,
        );
      }
      const handle = await session.uni.createUniStream();
      session.streams.set(handle.id, {
        direction: 'uni',
        uniHandle: handle,
        windowSize: 0,
      });
      uniStreamsOpened += 1;
      const latencyMs = Date.now() - t0;
      openStreamLatencySamplesMs.push(latencyMs);
      record('openUniStream', true, {
        detail: { sessionId: input.sessionId, streamId: handle.id },
      });
      return { sessionId: input.sessionId, streamId: handle.id, latencyMs };
    },

    async openBiStream(input): Promise<OpenBiStreamResult> {
      requests += 1;
      const t0 = Date.now();
      const session = getSession(input.sessionId);
      if (!session) {
        record('openBiStream', false, { errorKind: 'session_not_found' });
        throw new Error(
          `makeMockAdapter.openBiStream: session ${input.sessionId} is not open`,
        );
      }
      const options: { windowSize?: number } = {};
      if (input.windowSize !== undefined) options.windowSize = input.windowSize;
      const handle = await session.bi.createBiStream(options);
      const window = input.windowSize ?? 16384;
      session.streams.set(handle.id, {
        direction: 'bi',
        biHandle: handle,
        windowSize: window,
      });
      biStreamsOpened += 1;
      const latencyMs = Date.now() - t0;
      openStreamLatencySamplesMs.push(latencyMs);
      record('openBiStream', true, {
        detail: {
          sessionId: input.sessionId,
          streamId: handle.id,
          windowSize: window,
        },
      });
      return {
        sessionId: input.sessionId,
        streamId: handle.id,
        windowSize: window,
        latencyMs,
      };
    },

    async writeStream(input): Promise<WriteStreamResult> {
      requests += 1;
      const t0 = Date.now();
      const session = getSession(input.sessionId);
      if (!session) {
        record('writeStream', false, { errorKind: 'session_not_found' });
        throw new Error(
          `makeMockAdapter.writeStream: session ${input.sessionId} is not open`,
        );
      }
      const stream = session.streams.get(input.streamId);
      if (!stream) {
        record('writeStream', false, { errorKind: 'stream_not_found' });
        throw new Error(
          `makeMockAdapter.writeStream: stream ${input.streamId} is not open`,
        );
      }
      let backpressure = false;
      let windowRemaining = 0;
      if (stream.direction === 'bi' && stream.biHandle) {
        // Detect backpressure by comparing the requested write size against
        // the current window — the underlying mock refills the window after
        // sleep, but the trace still records the backpressure event so the
        // harness can observe it.
        const beforeRemaining = stream.biHandle.windowRemaining;
        if (input.data.byteLength > beforeRemaining) {
          backpressure = true;
          backpressureEvents += 1;
        }
        await stream.biHandle.write(input.data);
        windowRemaining = stream.biHandle.windowRemaining;
      } else if (stream.direction === 'uni' && stream.uniHandle) {
        await stream.uniHandle.write(input.data);
      } else {
        record('writeStream', false, { errorKind: 'stream_handle_missing' });
        throw new Error(
          `makeMockAdapter.writeStream: stream ${input.streamId} has no handle`,
        );
      }
      writesTotal += 1;
      const latencyMs = Date.now() - t0;
      writeLatencySamplesMs.push(latencyMs);
      record('writeStream', true, {
        detail: {
          sessionId: input.sessionId,
          streamId: input.streamId,
          byteLength: input.data.byteLength,
          backpressure,
        },
      });
      return {
        sessionId: input.sessionId,
        streamId: input.streamId,
        byteLength: input.data.byteLength,
        backpressure,
        windowRemaining,
        latencyMs,
      };
    },

    async readStream(input): Promise<ReadStreamResult> {
      requests += 1;
      const t0 = Date.now();
      const session = getSession(input.sessionId);
      if (!session) {
        record('readStream', false, { errorKind: 'session_not_found' });
        throw new Error(
          `makeMockAdapter.readStream: session ${input.sessionId} is not open`,
        );
      }
      const stream = session.streams.get(input.streamId);
      if (!stream) {
        record('readStream', false, { errorKind: 'stream_not_found' });
        throw new Error(
          `makeMockAdapter.readStream: stream ${input.streamId} is not open`,
        );
      }
      if (stream.direction !== 'bi' || !stream.biHandle) {
        record('readStream', false, { errorKind: 'uni_streams_are_write_only' });
        throw new Error(
          `makeMockAdapter.readStream: stream ${input.streamId} is uni-directional`,
        );
      }
      const chunk = await stream.biHandle.read();
      const byteLength = chunk ? chunk.byteLength : 0;
      readsTotal += 1;
      const latencyMs = Date.now() - t0;
      record('readStream', true, {
        detail: {
          sessionId: input.sessionId,
          streamId: input.streamId,
          byteLength,
        },
      });
      return {
        sessionId: input.sessionId,
        streamId: input.streamId,
        byteLength,
        latencyMs,
      };
    },

    async resetStream(input): Promise<ResetStreamResult> {
      requests += 1;
      const t0 = Date.now();
      const session = getSession(input.sessionId);
      if (!session) {
        record('resetStream', false, { errorKind: 'session_not_found' });
        throw new Error(
          `makeMockAdapter.resetStream: session ${input.sessionId} is not open`,
        );
      }
      const stream = session.streams.get(input.streamId);
      if (!stream) {
        record('resetStream', false, { errorKind: 'stream_not_found' });
        throw new Error(
          `makeMockAdapter.resetStream: stream ${input.streamId} is not open`,
        );
      }
      if (stream.direction === 'uni' && stream.uniHandle) {
        await stream.uniHandle.reset(input.errorCode);
      } else if (stream.direction === 'bi' && stream.biHandle) {
        // bi streams do not expose a reset primitive in the mock — close the
        // stream so downstream reads return null. The trace still records the
        // reset op so the fidelity harness can observe divergence between mock
        // + real (aioquic distinguishes close vs reset at the QUIC layer).
        await stream.biHandle.close();
      }
      resetsTotal += 1;
      const latencyMs = Date.now() - t0;
      record('resetStream', true, {
        detail: {
          sessionId: input.sessionId,
          streamId: input.streamId,
          errorCode: input.errorCode,
        },
      });
      return {
        sessionId: input.sessionId,
        streamId: input.streamId,
        errorCode: input.errorCode,
        latencyMs,
      };
    },

    async sendDatagram(input): Promise<SendDatagramResult> {
      requests += 1;
      const t0 = Date.now();
      const session = getSession(input.sessionId);
      if (!session) {
        record('sendDatagram', false, { errorKind: 'session_not_found' });
        throw new Error(
          `makeMockAdapter.sendDatagram: session ${input.sessionId} is not open`,
        );
      }
      await session.uni.sendDatagram(input.data);
      datagramsSent += 1;
      const latencyMs = Date.now() - t0;
      record('sendDatagram', true, {
        detail: {
          sessionId: input.sessionId,
          byteLength: input.data.byteLength,
        },
      });
      return {
        sessionId: input.sessionId,
        byteLength: input.data.byteLength,
        latencyMs,
      };
    },

    async migrateConnection(input): Promise<MigrateConnectionResult> {
      requests += 1;
      const t0 = Date.now();
      const session = getSession(input.sessionId);
      if (!session) {
        record('migrateConnection', false, { errorKind: 'session_not_found' });
        throw new Error(
          `makeMockAdapter.migrateConnection: session ${input.sessionId} is not open`,
        );
      }
      // Path validation always succeeds in the mock when the caller asked for
      // it; when the caller opts out the migration is recorded but marked as
      // unvalidated so the harness can observe the fail-fast branch.
      const validate = input.validate ?? true;
      session.migrations += 1;
      migrations += 1;
      const latencyMs = Date.now() - t0;
      migrationLatencySamplesMs.push(latencyMs);
      record('migrateConnection', true, {
        detail: {
          sessionId: input.sessionId,
          validated: validate,
        },
      });
      return {
        sessionId: input.sessionId,
        validated: validate,
        latencyMs,
      };
    },

    metrics() {
      return {
        sessionsOpened,
        sessionsClosed,
        uniStreamsOpened,
        biStreamsOpened,
        writesTotal,
        readsTotal,
        resetsTotal,
        datagramsSent,
        migrations,
        backpressureEvents,
        zeroRttUses,
        openSessionLatencySamplesMs: [...openSessionLatencySamplesMs],
        openStreamLatencySamplesMs: [...openStreamLatencySamplesMs],
        writeLatencySamplesMs: [...writeLatencySamplesMs],
        migrationLatencySamplesMs: [...migrationLatencySamplesMs],
        requests,
      };
    },

    async reset(): Promise<void> {
      sessions.clear();
      sessionSeq = 0;
      sessionsOpened = 0;
      sessionsClosed = 0;
      uniStreamsOpened = 0;
      biStreamsOpened = 0;
      writesTotal = 0;
      readsTotal = 0;
      resetsTotal = 0;
      datagramsSent = 0;
      migrations = 0;
      backpressureEvents = 0;
      zeroRttUses = 0;
      openSessionLatencySamplesMs.length = 0;
      openStreamLatencySamplesMs.length = 0;
      writeLatencySamplesMs.length = 0;
      migrationLatencySamplesMs.length = 0;
      requests = 0;
      trace.length = 0;
      record('reset', true);
    },
  };
}
