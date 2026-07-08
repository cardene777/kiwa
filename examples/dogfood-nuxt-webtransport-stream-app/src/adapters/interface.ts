/**
 * Provider-neutral WebTransport streaming surface for the Nuxt 3 dogfood app.
 *
 * The Nuxt 3 runtime talks to WebTransport only through this interface. Two
 * implementations exist —
 *  - {@link makeRealAdapter} (drives aioquic HTTP/3 testcontainers when
 *    `KIWA_MODE=real` + `WEBTRANSPORT_KEY=1` are set; otherwise every op
 *    reports `KIWA_WEBTRANSPORT_ENV_MISSING`)
 *  - {@link makeMockAdapter} (backed by `@kiwa/realtime` v0.2's
 *    `createWebTransportUniMock` + `createWebTransportBiMock`)
 *
 * Both must satisfy the same 8-op contract so behavioural fidelity between
 * real vs mock can be measured side-by-side across the WebTransport axes
 * (uni stream / bi stream / datagram / reset / connection migration) that
 * an aioquic HTTP/3 server makes observable in production.
 *
 * The AC anchors this contract on 3 e2e specs the harness runs against both
 * adapters — uni-stream-e2e (uni send + datagram receive), bi-stream-e2e
 * (bi + flow control + backpressure), reconnect-e2e (reset stream +
 * connection migration). Each spec exercises a distinct subset of the ops
 * below so the fidelity report can point at the ops that diverged.
 */

/** WebTransport stream direction. */
export type StreamDirection = 'uni' | 'bi';

/** Result of opening a WebTransport session (`transport.ready`). */
export interface OpenSessionResult {
  sessionId: string;
  /** URL the client used to reach the HTTP/3 server. */
  url: string;
  /** Whether the underlying HTTP/3 connection reused a resumption ticket. */
  zeroRttUsed: boolean;
  latencyMs: number;
}

/** Result of opening a uni-directional stream. */
export interface OpenUniStreamResult {
  sessionId: string;
  streamId: string;
  latencyMs: number;
}

/** Result of opening a bi-directional stream. */
export interface OpenBiStreamResult {
  sessionId: string;
  streamId: string;
  /** Flow-control window size the server advertised (bytes). */
  windowSize: number;
  latencyMs: number;
}

/** Result of a write into a stream. */
export interface WriteStreamResult {
  sessionId: string;
  streamId: string;
  byteLength: number;
  /** Whether the write triggered a backpressure event (bi streams only). */
  backpressure: boolean;
  /** Bytes remaining in the flow-control window after the write (bi only). */
  windowRemaining: number;
  latencyMs: number;
}

/** Result of reading a chunk from a bi-directional stream. */
export interface ReadStreamResult {
  sessionId: string;
  streamId: string;
  byteLength: number;
  latencyMs: number;
}

/** Result of resetting a stream (`writer.abort()` equivalent). */
export interface ResetStreamResult {
  sessionId: string;
  streamId: string;
  errorCode: number;
  latencyMs: number;
}

/** Result of sending a datagram (unreliable, unordered). */
export interface SendDatagramResult {
  sessionId: string;
  byteLength: number;
  latencyMs: number;
}

/** Result of a connection migration (path change / NAT rebinding). */
export interface MigrateConnectionResult {
  sessionId: string;
  /** Whether the migration was accepted by the server (validation completed). */
  validated: boolean;
  latencyMs: number;
}

/**
 * Trace event — every adapter method appends one entry to a shared trace
 * buffer. Downstream tests diff the trace across mock vs real to detect
 * behavioural divergences.
 */
export interface TraceEvent {
  op:
    | 'openSession'
    | 'closeSession'
    | 'openUniStream'
    | 'openBiStream'
    | 'writeStream'
    | 'readStream'
    | 'resetStream'
    | 'sendDatagram'
    | 'migrateConnection'
    | 'reset';
  ok: boolean;
  errorKind?: string | undefined;
  detail?: Record<string, unknown> | undefined;
}

/**
 * WebTransport stream adapter — the dogfood app performs 8 ops:
 *
 * - `openSession` — establish an HTTP/3 WebTransport session (`await
 *   transport.ready`), possibly reusing a 0-RTT resumption ticket
 * - `closeSession` — tear down the session and release streams
 * - `openUniStream` — allocate a unidirectional stream for send-only payloads
 * - `openBiStream` — allocate a bidirectional stream with a flow-control
 *   window
 * - `writeStream` — push a payload into a stream (bi streams may emit
 *   backpressure when the window drains)
 * - `readStream` — pull a chunk from a bi-directional stream
 * - `resetStream` — abort a stream mid-flight with an error code
 * - `sendDatagram` — dispatch an unreliable / unordered datagram
 * - `migrateConnection` — trigger a path migration and observe the server's
 *   path-validation response (NAT rebinding equivalent)
 *
 * `metrics()` exposes rolling aggregates the fidelity harness uses to
 * populate the release-gate rows (perf.p95Ms + fidelity.ratio in
 * particular).
 */
export interface WebTransportStreamAdapter {
  readonly mode: 'real' | 'mock';
  readonly traces: () => TraceEvent[];

  openSession(input: {
    sessionId: string;
    url: string;
    /** Ask the client to attempt 0-RTT resumption; server may still refuse. */
    zeroRtt?: boolean;
  }): Promise<OpenSessionResult>;

  closeSession(input: { sessionId: string }): Promise<void>;

  openUniStream(input: { sessionId: string }): Promise<OpenUniStreamResult>;

  openBiStream(input: {
    sessionId: string;
    /** Override the default 16384-byte window (used by backpressure tests). */
    windowSize?: number;
  }): Promise<OpenBiStreamResult>;

  writeStream(input: {
    sessionId: string;
    streamId: string;
    data: Uint8Array;
  }): Promise<WriteStreamResult>;

  readStream(input: {
    sessionId: string;
    streamId: string;
  }): Promise<ReadStreamResult>;

  resetStream(input: {
    sessionId: string;
    streamId: string;
    errorCode: number;
  }): Promise<ResetStreamResult>;

  sendDatagram(input: {
    sessionId: string;
    data: Uint8Array;
  }): Promise<SendDatagramResult>;

  migrateConnection(input: {
    sessionId: string;
    /** Whether the server should validate the new path (fail-fast when false). */
    validate?: boolean;
  }): Promise<MigrateConnectionResult>;

  /** Rolling metric aggregate for the fidelity harness. */
  metrics(): {
    sessionsOpened: number;
    sessionsClosed: number;
    uniStreamsOpened: number;
    biStreamsOpened: number;
    writesTotal: number;
    readsTotal: number;
    resetsTotal: number;
    datagramsSent: number;
    migrations: number;
    backpressureEvents: number;
    zeroRttUses: number;
    openSessionLatencySamplesMs: number[];
    openStreamLatencySamplesMs: number[];
    writeLatencySamplesMs: number[];
    migrationLatencySamplesMs: number[];
    requests: number;
  };

  reset(): Promise<void>;
}

/** Session snapshot — used by tests to enumerate open sessions + streams. */
export interface SessionSnapshot {
  sessionId: string;
  url: string;
  streams: Array<{
    streamId: string;
    direction: StreamDirection;
    state: 'open' | 'closed' | 'reset';
  }>;
}
