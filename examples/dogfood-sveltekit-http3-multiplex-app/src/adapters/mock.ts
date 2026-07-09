/**
 * Mock adapter — drives `@kiwa-lab/realtime` v0.2's `createQuicMultiplexMock`
 * so the same app code exercises a deterministic HTTP/3 multiplex ceremony
 * without touching an nginx-quic container or a Chromium instance running
 * the QUIC origin trial. Both mock and real adapters satisfy
 * {@link Http3MultiplexAdapter}, so the fidelity harness can diff them
 * side-by-side.
 *
 * State model — one connection manager tracks connections by id; each
 * connection owns a QuicMultiplexMock instance so per-connection metrics
 * stay isolated. That matches how nginx-quic allocates HTTP/3 connection
 * state per QUIC connection in production. A separate HPACK tracker keeps
 * cumulative header-table size + a rolling compression ratio so the fidelity
 * harness can observe compression fidelity end-to-end.
 *
 * The 9-op contract widens the underlying v1.28-1 mock —
 *  - `openStream` maps onto `QuicMultiplexMock.openStream` with priority
 *  - `concurrentSend` opens N streams and simulates the scheduler by draining
 *    the send queue in ascending priority order (nginx-quic default)
 *  - `insertHpackHeader` maps onto `QuicMultiplexMock.insertHpackHeader` +
 *    tracks raw / compressed byte counters to expose a compression ratio
 *  - `resumeZeroRtt` maps onto `QuicMultiplexMock.resumeWithZeroRtt` +
 *    tracks accepted early-data bytes so anti-replay refusal is observable
 */

import {
  createQuicMultiplexMock,
  type QuicMultiplexMock,
  type QuicStreamHandle,
} from '@kiwa-lab/realtime';
import type {
  CloseStreamResult,
  ConcurrentSendResult,
  Http3MultiplexAdapter,
  Http3StreamDirection,
  HpackInsertResult,
  OpenConnectionResult,
  OpenStreamResult,
  ReadStreamResult,
  ResumeZeroRttResult,
  TraceEvent,
  WriteStreamResult,
} from './interface.js';

interface StreamRecord {
  handle: QuicStreamHandle;
  direction: Http3StreamDirection;
  bufferedReadBytes: number;
}

interface ConnectionState {
  url: string;
  mock: QuicMultiplexMock;
  streams: Map<string, StreamRecord>;
  zeroRttUsed: boolean;
  earlyDataAccepted: number;
  hpackRawBytes: number;
  hpackCompressedBytes: number;
}

export interface MakeMockAdapterOptions {
  /** deterministic seed used by the underlying mock; default 1. */
  seed?: number;
  /** artificial latency injected into every mock op (ms、 default 1). */
  latencyMs?: number;
  /** whether openConnection should honour the requested 0-RTT flag; default true. */
  allowZeroRtt?: boolean;
  /**
   * Simulated compression ratio — raw header bytes divided by this factor
   * become "compressed" bytes so the fidelity harness sees a stable ratio.
   * nginx-quic reports a table-size-dependent ratio; 3 is the observed
   * steady-state for JSON-shaped headers, matching the default.
   */
  hpackCompressionFactor?: number;
}

const DEFAULT_HPACK_COMPRESSION_FACTOR = 3;

export function makeMockAdapter(
  opts: MakeMockAdapterOptions = {},
): Http3MultiplexAdapter {
  const trace: TraceEvent[] = [];
  const connections = new Map<string, ConnectionState>();
  // Each connection needs a distinct seed so stream ids do not collide when
  // two connections run in parallel — nginx-quic gives every HTTP/3
  // connection its own state so the mock must not accidentally share stream
  // ids across connections.
  let connectionSeq = 0;
  let connectionsOpened = 0;
  let connectionsClosed = 0;
  let streamsOpened = 0;
  let streamsClosed = 0;
  let writesTotal = 0;
  let readsTotal = 0;
  let concurrentSendsTotal = 0;
  let hpackInserts = 0;
  let zeroRttUses = 0;
  let zeroRttEarlyDataAccepted = 0;
  const openConnectionLatencySamplesMs: number[] = [];
  const openStreamLatencySamplesMs: number[] = [];
  const writeLatencySamplesMs: number[] = [];
  const concurrentSendLatencySamplesMs: number[] = [];
  let requests = 0;
  // F2 (Issue #981) — HPACK metrics must survive closeConnection because the
  // fidelity harness aggregates across the whole run. Track the highest
  // observed table size + a cumulative raw / compressed byte pair so the
  // ratio does not collapse when a connection is torn down mid-run. Nginx-quic
  // reports the peak table size + steady-state compression ratio across the
  // process lifetime, so aggregating post-close is the closest match.
  let hpackTableSizeAggregate = 0;
  let hpackRawBytesAggregate = 0;
  let hpackCompressedBytesAggregate = 0;
  // F3 (Issue #981) — 0-RTT resumption tickets are keyed by origin (RFC 8446
  // §4.6.1 + §8). Cross-origin reuse would violate the same-origin invariant
  // + open the door to session-fixation attacks. Track which origins have a
  // ticket available so only same-origin resumption paths flip zeroRttUsed on.
  const originTickets = new Set<string>();

  function originOf(url: string): string {
    try {
      const u = new URL(url);
      return `${u.protocol}//${u.host}`;
    } catch {
      // A malformed URL cannot carry a ticket — treat as a fresh origin so
      // 0-RTT never accepts on invalid input. The openConnection path already
      // records the invalid URL as a normal request; we just gate resumption.
      return url;
    }
  }

  function record(op: TraceEvent['op'], ok: boolean, extra?: Partial<TraceEvent>): void {
    const entry: TraceEvent = { op, ok };
    if (extra?.errorKind !== undefined) entry.errorKind = extra.errorKind;
    if (extra?.detail !== undefined) entry.detail = extra.detail;
    trace.push(entry);
  }

  function getConnection(connectionId: string): ConnectionState | null {
    return connections.get(connectionId) ?? null;
  }

  function createConnection(url: string): ConnectionState {
    connectionSeq += 1;
    const baseSeed = opts.seed ?? 1;
    // Offset the seed per connection so nginx-quic's per-connection
    // unique-stream-id guarantee is preserved. Prime 2654435761 (Knuth
    // multiplicative hash) scatters small integer connectionSeq inputs so
    // connection #1 vs #2 do not accidentally produce colliding stream ids.
    const cfg = {
      seed: (baseSeed * 2654435761 + connectionSeq * 1000003) & 0x7fffffff,
      artificialLatencyMs: opts.latencyMs ?? 1,
      enable0RTT: true,
    };
    return {
      url,
      mock: createQuicMultiplexMock(cfg),
      streams: new Map(),
      zeroRttUsed: false,
      earlyDataAccepted: 0,
      hpackRawBytes: 0,
      hpackCompressedBytes: 0,
    };
  }

  function totalHpackTableSize(): number {
    // Aggregate across every open connection — nginx-quic reports a
    // per-connection table but the fidelity harness rolls up to a single
    // observed maximum. F2 (Issue #981) — fold in torn-down connections'
    // peak table size so closeConnection does not zero the observed maximum.
    let max = hpackTableSizeAggregate;
    for (const conn of connections.values()) {
      if (conn.mock.hpackTableSize > max) max = conn.mock.hpackTableSize;
    }
    return max;
  }

  function averageCompressionRatio(): number {
    // F2 (Issue #981) — seed with the aggregate byte counters so torn-down
    // connections continue to weight the observed ratio. Without this the
    // ratio collapses to zero the moment the caller closes every connection.
    let raw = hpackRawBytesAggregate;
    let compressed = hpackCompressedBytesAggregate;
    for (const conn of connections.values()) {
      raw += conn.hpackRawBytes;
      compressed += conn.hpackCompressedBytes;
    }
    if (compressed === 0) return 0;
    return raw / compressed;
  }

  return {
    mode: 'mock',
    traces: () => [...trace],

    async openConnection(input): Promise<OpenConnectionResult> {
      requests += 1;
      const t0 = Date.now();
      if (connections.has(input.connectionId)) {
        record('openConnection', false, { errorKind: 'connection_already_open' });
        throw new Error(
          `makeMockAdapter.openConnection: connection ${input.connectionId} is already open`,
        );
      }
      const conn = createConnection(input.url);
      const wantZeroRtt = input.zeroRtt === true;
      const allowZeroRtt = opts.allowZeroRtt ?? true;
      // F3 (Issue #981) — 0-RTT resumption is bound to the origin that issued
      // the ticket (RFC 8446 §4.6.1). Cross-origin resumption would violate
      // the same-origin invariant, so gate acceptance on a per-origin ticket
      // Map instead of the global connectionSeq counter. A fresh origin
      // always cold-starts even if other origins have prior tickets.
      const origin = originOf(input.url);
      const hasTicketForOrigin = originTickets.has(origin);
      conn.zeroRttUsed = wantZeroRtt && allowZeroRtt && hasTicketForOrigin;
      if (conn.zeroRttUsed) {
        // Early data acceptance is capped by nginx-quic's default 16 KB
        // early-data limit; anything above is queued for post-handshake.
        const requested = input.earlyDataBytes ?? 0;
        conn.earlyDataAccepted = Math.min(requested, 16384);
        zeroRttUses += 1;
        zeroRttEarlyDataAccepted += conn.earlyDataAccepted;
        // Also fire the underlying mock's zero-rtt-used event so the semantic
        // trace records the resumption alongside the adapter trace.
        await conn.mock.resumeWithZeroRtt();
      }
      // Record the origin ticket after handshake — the second (and later)
      // connections against the same origin can now reuse it.
      originTickets.add(origin);
      connections.set(input.connectionId, conn);
      connectionsOpened += 1;
      const latencyMs = Date.now() - t0;
      openConnectionLatencySamplesMs.push(latencyMs);
      record('openConnection', true, {
        detail: {
          connectionId: input.connectionId,
          url: input.url,
          zeroRttUsed: conn.zeroRttUsed,
          earlyDataAccepted: conn.earlyDataAccepted,
        },
      });
      return {
        connectionId: input.connectionId,
        url: input.url,
        zeroRttUsed: conn.zeroRttUsed,
        earlyDataAccepted: conn.earlyDataAccepted,
        latencyMs,
      };
    },

    async closeConnection(input) {
      requests += 1;
      const conn = getConnection(input.connectionId);
      if (!conn) {
        record('closeConnection', false, { errorKind: 'connection_not_found' });
        return;
      }
      // Release every open stream so the nginx-quic connection.close event
      // count matches — reset streams and closed streams are both consumed
      // here.
      for (const [, sr] of conn.streams) {
        if (sr.handle.state === 'open') {
          await sr.handle.close();
        }
      }
      // F2 (Issue #981) — snapshot HPACK observables into the aggregate
      // before tearing down the underlying mock. Without this the metrics
      // ratio + tableSize collapse to zero the moment every connection is
      // closed, even though the harness inserted headers earlier in the run.
      if (conn.mock.hpackTableSize > hpackTableSizeAggregate) {
        hpackTableSizeAggregate = conn.mock.hpackTableSize;
      }
      hpackRawBytesAggregate += conn.hpackRawBytes;
      hpackCompressedBytesAggregate += conn.hpackCompressedBytes;
      conn.streams.clear();
      conn.mock.reset();
      connections.delete(input.connectionId);
      connectionsClosed += 1;
      record('closeConnection', true, { detail: { connectionId: input.connectionId } });
    },

    async openStream(input): Promise<OpenStreamResult> {
      requests += 1;
      const t0 = Date.now();
      const conn = getConnection(input.connectionId);
      if (!conn) {
        record('openStream', false, { errorKind: 'connection_not_found' });
        throw new Error(
          `makeMockAdapter.openStream: connection ${input.connectionId} is not open`,
        );
      }
      const priority = input.priority ?? 128;
      const direction: Http3StreamDirection = input.direction ?? 'client-initiated';
      const handle = await conn.mock.openStream({ priority });
      conn.streams.set(handle.id, { handle, direction, bufferedReadBytes: 0 });
      streamsOpened += 1;
      const latencyMs = Date.now() - t0;
      openStreamLatencySamplesMs.push(latencyMs);
      record('openStream', true, {
        detail: {
          connectionId: input.connectionId,
          streamId: handle.id,
          priority,
          direction,
        },
      });
      return {
        connectionId: input.connectionId,
        streamId: handle.id,
        priority,
        direction,
        latencyMs,
      };
    },

    async concurrentSend(input): Promise<ConcurrentSendResult> {
      requests += 1;
      const t0 = Date.now();
      const conn = getConnection(input.connectionId);
      if (!conn) {
        record('concurrentSend', false, { errorKind: 'connection_not_found' });
        throw new Error(
          `makeMockAdapter.concurrentSend: connection ${input.connectionId} is not open`,
        );
      }
      // Open every requested stream first — the priorities are recorded on
      // the underlying mock so getActiveStreams reflects the scheduler order.
      const opened: OpenStreamResult[] = [];
      for (const req of input.streams) {
        const handle = await conn.mock.openStream({ priority: req.priority });
        conn.streams.set(handle.id, {
          handle,
          direction: 'client-initiated',
          bufferedReadBytes: req.byteLength,
        });
        opened.push({
          connectionId: input.connectionId,
          streamId: handle.id,
          priority: req.priority,
          direction: 'client-initiated',
          latencyMs: 0,
        });
      }
      streamsOpened += opened.length;
      // Drain in ascending priority (lowest number = highest priority) —
      // nginx-quic uses strict priority scheduling by default so any observed
      // divergence between real + mock lands on the drain-order axis.
      const drainOrder = conn.mock
        .getActiveStreams()
        .filter((s) => opened.some((o) => o.streamId === s.id))
        .map((s) => s.id);
      concurrentSendsTotal += 1;
      let totalBytes = 0;
      for (const req of input.streams) totalBytes += req.byteLength;
      const latencyMs = Date.now() - t0;
      concurrentSendLatencySamplesMs.push(latencyMs);
      record('concurrentSend', true, {
        detail: {
          connectionId: input.connectionId,
          streamCount: input.streams.length,
          drainOrder,
          totalBytes,
        },
      });
      return {
        connectionId: input.connectionId,
        streamIds: opened.map((o) => o.streamId),
        drainOrder,
        totalBytes,
        latencyMs,
      };
    },

    async writeStream(input): Promise<WriteStreamResult> {
      requests += 1;
      const t0 = Date.now();
      const conn = getConnection(input.connectionId);
      if (!conn) {
        record('writeStream', false, { errorKind: 'connection_not_found' });
        throw new Error(
          `makeMockAdapter.writeStream: connection ${input.connectionId} is not open`,
        );
      }
      const stream = conn.streams.get(input.streamId);
      if (!stream) {
        record('writeStream', false, { errorKind: 'stream_not_found' });
        throw new Error(
          `makeMockAdapter.writeStream: stream ${input.streamId} is not open`,
        );
      }
      // Echo the write into the buffered-read counter so a single-peer test
      // can drive the full request / response cycle without a second
      // adapter. nginx-quic delivers written frames back to the peer read
      // side too, so mirroring here keeps behavioural fidelity high.
      stream.bufferedReadBytes += input.data.byteLength;
      writesTotal += 1;
      const latencyMs = Date.now() - t0;
      writeLatencySamplesMs.push(latencyMs);
      record('writeStream', true, {
        detail: {
          connectionId: input.connectionId,
          streamId: input.streamId,
          byteLength: input.data.byteLength,
        },
      });
      return {
        connectionId: input.connectionId,
        streamId: input.streamId,
        byteLength: input.data.byteLength,
        latencyMs,
      };
    },

    async readStream(input): Promise<ReadStreamResult> {
      requests += 1;
      const t0 = Date.now();
      const conn = getConnection(input.connectionId);
      if (!conn) {
        record('readStream', false, { errorKind: 'connection_not_found' });
        throw new Error(
          `makeMockAdapter.readStream: connection ${input.connectionId} is not open`,
        );
      }
      const stream = conn.streams.get(input.streamId);
      if (!stream) {
        record('readStream', false, { errorKind: 'stream_not_found' });
        throw new Error(
          `makeMockAdapter.readStream: stream ${input.streamId} is not open`,
        );
      }
      const byteLength = stream.bufferedReadBytes;
      stream.bufferedReadBytes = 0;
      readsTotal += 1;
      const latencyMs = Date.now() - t0;
      record('readStream', true, {
        detail: {
          connectionId: input.connectionId,
          streamId: input.streamId,
          byteLength,
        },
      });
      return {
        connectionId: input.connectionId,
        streamId: input.streamId,
        byteLength,
        latencyMs,
      };
    },

    async closeStream(input): Promise<CloseStreamResult> {
      requests += 1;
      const t0 = Date.now();
      const conn = getConnection(input.connectionId);
      if (!conn) {
        record('closeStream', false, { errorKind: 'connection_not_found' });
        throw new Error(
          `makeMockAdapter.closeStream: connection ${input.connectionId} is not open`,
        );
      }
      const stream = conn.streams.get(input.streamId);
      if (!stream) {
        record('closeStream', false, { errorKind: 'stream_not_found' });
        throw new Error(
          `makeMockAdapter.closeStream: stream ${input.streamId} is not open`,
        );
      }
      await stream.handle.close();
      // F1 (Issue #981) — HTTP/3 emits FIN and releases the stream on close,
      // so subsequent write / read against the same streamId must fail with
      // stream_not_found. Removing the record from the connection Map is the
      // stream_not_found gate; without this a caller could write to a closed
      // stream and the mock would happily buffer bytes into a phantom queue.
      conn.streams.delete(input.streamId);
      streamsClosed += 1;
      const latencyMs = Date.now() - t0;
      record('closeStream', true, {
        detail: { connectionId: input.connectionId, streamId: input.streamId },
      });
      return {
        connectionId: input.connectionId,
        streamId: input.streamId,
        latencyMs,
      };
    },

    async insertHpackHeader(input): Promise<HpackInsertResult> {
      requests += 1;
      const t0 = Date.now();
      const conn = getConnection(input.connectionId);
      if (!conn) {
        record('insertHpackHeader', false, { errorKind: 'connection_not_found' });
        throw new Error(
          `makeMockAdapter.insertHpackHeader: connection ${input.connectionId} is not open`,
        );
      }
      const entry = await conn.mock.insertHpackHeader(input.name, input.value);
      // Track raw + compressed byte counters so the compression ratio stays
      // observable across every insert.
      const rawBytes = input.name.length + input.value.length + 32; // HPACK entry overhead
      const factor = opts.hpackCompressionFactor ?? DEFAULT_HPACK_COMPRESSION_FACTOR;
      const compressedBytes = Math.max(1, Math.round(rawBytes / factor));
      conn.hpackRawBytes += rawBytes;
      conn.hpackCompressedBytes += compressedBytes;
      hpackInserts += 1;
      const tableSize = conn.mock.hpackTableSize;
      const compressionRatio = conn.hpackRawBytes / conn.hpackCompressedBytes;
      const latencyMs = Date.now() - t0;
      record('insertHpackHeader', true, {
        detail: {
          connectionId: input.connectionId,
          name: input.name,
          index: entry.index,
          tableSize,
          compressionRatio,
        },
      });
      return {
        connectionId: input.connectionId,
        name: input.name,
        value: input.value,
        index: entry.index,
        tableSize,
        compressionRatio,
        latencyMs,
      };
    },

    async resumeZeroRtt(input): Promise<ResumeZeroRttResult> {
      requests += 1;
      const t0 = Date.now();
      const conn = getConnection(input.connectionId);
      if (!conn) {
        record('resumeZeroRtt', false, { errorKind: 'connection_not_found' });
        throw new Error(
          `makeMockAdapter.resumeZeroRtt: connection ${input.connectionId} is not open`,
        );
      }
      // Anti-replay — the mock accepts up to 16 KB of early data per
      // connection; anything above is refused so the client falls back to
      // 1-RTT. nginx-quic uses the same 16 KB default so the mock stays
      // production-realistic without extra tuning.
      const requested = input.earlyDataBytes;
      const accepted = Math.min(requested, 16384);
      const isReplay = requested > 16384;
      if (!isReplay) {
        await conn.mock.resumeWithZeroRtt();
        conn.zeroRttUsed = true;
        conn.earlyDataAccepted += accepted;
        zeroRttUses += 1;
        zeroRttEarlyDataAccepted += accepted;
      }
      const latencyMs = Date.now() - t0;
      record('resumeZeroRtt', true, {
        detail: {
          connectionId: input.connectionId,
          requested,
          accepted: isReplay ? 0 : accepted,
          acceptedResumption: !isReplay,
        },
      });
      return {
        connectionId: input.connectionId,
        accepted: !isReplay,
        earlyDataAccepted: isReplay ? 0 : accepted,
        latencyMs,
      };
    },

    metrics() {
      return {
        connectionsOpened,
        connectionsClosed,
        streamsOpened,
        streamsClosed,
        writesTotal,
        readsTotal,
        concurrentSendsTotal,
        hpackInserts,
        zeroRttUses,
        zeroRttEarlyDataAccepted,
        openConnectionLatencySamplesMs: [...openConnectionLatencySamplesMs],
        openStreamLatencySamplesMs: [...openStreamLatencySamplesMs],
        writeLatencySamplesMs: [...writeLatencySamplesMs],
        concurrentSendLatencySamplesMs: [...concurrentSendLatencySamplesMs],
        hpackTableSize: totalHpackTableSize(),
        hpackCompressionRatio: averageCompressionRatio(),
        requests,
      };
    },

    async reset(): Promise<void> {
      connections.clear();
      connectionSeq = 0;
      connectionsOpened = 0;
      connectionsClosed = 0;
      streamsOpened = 0;
      streamsClosed = 0;
      writesTotal = 0;
      readsTotal = 0;
      concurrentSendsTotal = 0;
      hpackInserts = 0;
      zeroRttUses = 0;
      zeroRttEarlyDataAccepted = 0;
      openConnectionLatencySamplesMs.length = 0;
      openStreamLatencySamplesMs.length = 0;
      writeLatencySamplesMs.length = 0;
      concurrentSendLatencySamplesMs.length = 0;
      requests = 0;
      // F2 / F3 (Issue #981) — clear the HPACK aggregate + origin ticket
      // Map so a reset returns to the fresh-adapter baseline; otherwise
      // resumption tickets and header table peaks would leak across the
      // reset boundary.
      hpackTableSizeAggregate = 0;
      hpackRawBytesAggregate = 0;
      hpackCompressedBytesAggregate = 0;
      originTickets.clear();
      trace.length = 0;
      record('reset', true);
    },
  };
}
