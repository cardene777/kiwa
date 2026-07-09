/**
 * Provider-neutral HTTP/3 + QUIC multiplex surface for the SvelteKit dogfood
 * app.
 *
 * The SvelteKit runtime talks to HTTP/3 only through this interface. Two
 * implementations exist —
 *  - {@link makeRealAdapter} (drives nginx-quic HTTP/3 testcontainers when
 *    `KIWA_MODE=real` + `HTTP3_KEY=1` are set; otherwise every op reports
 *    `KIWA_HTTP3_ENV_MISSING`)
 *  - {@link makeMockAdapter} (backed by `@kiwa-lab/realtime` v0.2's
 *    `createQuicMultiplexMock` + `createHttp3PushMock`)
 *
 * Both must satisfy the same 9-op contract so behavioural fidelity between
 * real vs mock can be measured side-by-side across the QUIC multiplex axes
 * (session open / stream open / concurrent send / priority scheduling / write
 * / read / stream close / 0-RTT resumption / HPACK dynamic table) that an
 * nginx-quic HTTP/3 server makes observable in production.
 *
 * The AC anchors this contract on 3 e2e specs the harness runs against both
 * adapters — multi-stream-e2e (concurrent send + priority scheduling), 0-rtt-e2e
 * (early data + resumption + anti-replay), hpack-e2e (dynamic table insert +
 * compression ratio observation). Each spec exercises a distinct subset of
 * the ops below so the fidelity report can point at the ops that diverged.
 *
 * The v1.28-1 realtime package models QUIC multiplex + HPACK on a single
 * SemanticsMock (see `packages/realtime/src/semantics/quic-multiplex.ts`).
 * This adapter widens that mock's surface — priority-based scheduling +
 * HPACK dynamic-table observability + 0-RTT resumption tracking — so the
 * SvelteKit dogfood exposes the same 8-axis routing as v1.28-1 without
 * having to bolt priority + resumption on top of the raw semantic mock in
 * every downstream caller.
 */

/** HTTP/3 stream direction. */
export type Http3StreamDirection = 'client-initiated' | 'server-push';

/** Result of opening an HTTP/3 QUIC connection (`transport.ready`). */
export interface OpenConnectionResult {
  connectionId: string;
  /** URL the client used to reach the HTTP/3 server. */
  url: string;
  /** Whether the underlying QUIC handshake reused a resumption ticket. */
  zeroRttUsed: boolean;
  /** Bytes the server accepted as 0-RTT early data (0 when 0-RTT not used). */
  earlyDataAccepted: number;
  latencyMs: number;
}

/** Result of opening an HTTP/3 request stream. */
export interface OpenStreamResult {
  connectionId: string;
  streamId: string;
  /** Priority the caller requested (0=highest, 255=lowest, default 128). */
  priority: number;
  direction: Http3StreamDirection;
  latencyMs: number;
}

/** Result of sending N concurrent request stream writes. */
export interface ConcurrentSendResult {
  connectionId: string;
  streamIds: string[];
  /** Streams in the order the scheduler drained the send queue. */
  drainOrder: string[];
  totalBytes: number;
  latencyMs: number;
}

/** Result of a write into a stream. */
export interface WriteStreamResult {
  connectionId: string;
  streamId: string;
  byteLength: number;
  latencyMs: number;
}

/** Result of a read from a stream. */
export interface ReadStreamResult {
  connectionId: string;
  streamId: string;
  byteLength: number;
  latencyMs: number;
}

/** Result of closing a stream. */
export interface CloseStreamResult {
  connectionId: string;
  streamId: string;
  latencyMs: number;
}

/** Result of inserting an HPACK header. */
export interface HpackInsertResult {
  connectionId: string;
  name: string;
  value: string;
  index: number;
  /** Table size after the insert (bytes). Nginx reports header table size in bytes. */
  tableSize: number;
  /** Ratio of raw header bytes vs compressed bytes recorded so far. */
  compressionRatio: number;
  latencyMs: number;
}

/** Result of a 0-RTT resumption attempt (with or without an existing ticket). */
export interface ResumeZeroRttResult {
  connectionId: string;
  /** Whether the server accepted the resumption ticket. */
  accepted: boolean;
  /** Bytes accepted as early data (0 when the server refused). */
  earlyDataAccepted: number;
  latencyMs: number;
}

/**
 * Trace event — every adapter method appends one entry to a shared trace
 * buffer. Downstream tests diff the trace across mock vs real to detect
 * behavioural divergences.
 */
export interface TraceEvent {
  op:
    | 'openConnection'
    | 'closeConnection'
    | 'openStream'
    | 'concurrentSend'
    | 'writeStream'
    | 'readStream'
    | 'closeStream'
    | 'insertHpackHeader'
    | 'resumeZeroRtt'
    | 'reset';
  ok: boolean;
  errorKind?: string | undefined;
  detail?: Record<string, unknown> | undefined;
}

/**
 * HTTP/3 multiplex adapter — the dogfood app performs 9 ops:
 *
 * - `openConnection` — establish an HTTP/3 QUIC connection, possibly reusing
 *   a 0-RTT resumption ticket
 * - `closeConnection` — tear down the connection and release streams
 * - `openStream` — allocate a request stream with an explicit priority
 * - `concurrentSend` — open N streams and enqueue writes so the scheduler
 *   observes concurrent send + priority ordering
 * - `writeStream` — push a payload into a single request stream
 * - `readStream` — pull a chunk from a single request stream
 * - `closeStream` — finish a stream cleanly (FIN)
 * - `insertHpackHeader` — insert a header into the HPACK dynamic table so the
 *   compression ratio + table size are observable
 * - `resumeZeroRtt` — resume a prior connection with a 0-RTT ticket + early
 *   data payload; server may accept or refuse depending on anti-replay
 *
 * `metrics()` exposes rolling aggregates the fidelity harness uses to
 * populate the release-gate rows (perf.p95Ms + fidelity.ratio in particular).
 */
export interface Http3MultiplexAdapter {
  readonly mode: 'real' | 'mock';
  readonly traces: () => TraceEvent[];

  openConnection(input: {
    connectionId: string;
    url: string;
    /** Ask the client to attempt 0-RTT resumption; server may still refuse. */
    zeroRtt?: boolean;
    /** Early data payload size the client wants the server to accept (bytes). */
    earlyDataBytes?: number;
  }): Promise<OpenConnectionResult>;

  closeConnection(input: { connectionId: string }): Promise<void>;

  openStream(input: {
    connectionId: string;
    /** Priority 0..255 (default 128); nginx-quic sorts streams by ascending priority. */
    priority?: number;
    /** Server-push streams have direction 'server-push'; default 'client-initiated'. */
    direction?: Http3StreamDirection;
  }): Promise<OpenStreamResult>;

  concurrentSend(input: {
    connectionId: string;
    /** One entry per stream: priority + payload bytes. */
    streams: Array<{ priority: number; byteLength: number }>;
  }): Promise<ConcurrentSendResult>;

  writeStream(input: {
    connectionId: string;
    streamId: string;
    data: Uint8Array;
  }): Promise<WriteStreamResult>;

  readStream(input: {
    connectionId: string;
    streamId: string;
  }): Promise<ReadStreamResult>;

  closeStream(input: {
    connectionId: string;
    streamId: string;
  }): Promise<CloseStreamResult>;

  insertHpackHeader(input: {
    connectionId: string;
    name: string;
    value: string;
  }): Promise<HpackInsertResult>;

  resumeZeroRtt(input: {
    connectionId: string;
    /** Bytes of early data the client wants the server to accept. */
    earlyDataBytes: number;
  }): Promise<ResumeZeroRttResult>;

  /** Rolling metric aggregate for the fidelity harness. */
  metrics(): {
    connectionsOpened: number;
    connectionsClosed: number;
    streamsOpened: number;
    streamsClosed: number;
    writesTotal: number;
    readsTotal: number;
    concurrentSendsTotal: number;
    hpackInserts: number;
    zeroRttUses: number;
    zeroRttEarlyDataAccepted: number;
    openConnectionLatencySamplesMs: number[];
    openStreamLatencySamplesMs: number[];
    writeLatencySamplesMs: number[];
    concurrentSendLatencySamplesMs: number[];
    hpackTableSize: number;
    hpackCompressionRatio: number;
    requests: number;
  };

  reset(): Promise<void>;
}
