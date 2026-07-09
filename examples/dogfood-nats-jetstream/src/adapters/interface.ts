/**
 * Provider-neutral NATS JetStream + KV + Object + routing adapter contract
 * for the dogfood-nats-jetstream dogfood.
 *
 * The dogfood talks to NATS only through this interface. Two
 * implementations exist: {@link makeMockAdapter} (backed by
 * `@kiwa-lab/streaming`'s NatsMock + JetStream + KV + Object Store) and
 * {@link makeRealAdapter} (probes a live NATS via `NATS_URL`; env-skip
 * variant otherwise).
 *
 * v1 (v1.20-4) covered 5 ops — driveJetStream / driveKV / driveObject /
 * driveRouting / emitFidelity. v1.31-4 extends the surface with 4 v2 ops
 * that exercise the streaming v0.3 advanced NATS semantics end-to-end:
 *
 *   - `driveJetStreamDurable`   — spin up a durable consumer that models
 *                                  ack_wait + max_deliver + backoff schedule.
 *                                  Deliveries walk the ack pending window,
 *                                  a middle message is nacked to trigger
 *                                  backoff, ack_wait sweeps expire the last
 *                                  message, and one message is driven past
 *                                  max_deliver to land in the quarantine
 *                                  window. Reports pending / quarantined /
 *                                  ack floor counts.
 *   - `driveKvRevision`         — bucket revision history walker. Under
 *                                  `historyDepth=5` a key is put + updated
 *                                  3 times + deleted (tombstone), the
 *                                  history array carries the full 5-rev
 *                                  chain, and a watch iterator drains the
 *                                  same events in order.
 *   - `driveObjectChunking`     — chunk-boundary walk. A 1024-byte payload
 *                                  with `chunkSizeBytes=256` produces 4
 *                                  chunks with per-chunk digests, LZ4
 *                                  compression rides on top (marker
 *                                  prefix), and `reassembleObject` returns
 *                                  the original bytes.
 *   - `driveTestcontainersProbe` — probe the NATS 2.10+ testcontainers
 *                                  boot path (peer-dep free duck typing).
 *                                  Under mock mode returns deterministic
 *                                  placeholders; under real mode returns
 *                                  the container-mapped host:port pair or a
 *                                  well-defined divergence when the env is
 *                                  absent.
 *
 * All 9 ops (5 v1 + 4 v2) satisfy the same "op → observation → trace"
 * shape so behavioural fidelity between real vs mock can be measured side-
 * by-side and fed to `@kiwa-lab/quality-metrics` 13-axis release gate.
 */

/** Sample OrderEvent payload the dogfood publishes onto JetStream. */
export interface OrderEvent {
  readonly orderId: string;
  readonly userId: string;
  readonly total: number;
  readonly currency: 'USD' | 'JPY' | 'EUR';
}

/** Sample user profile the dogfood stores in KV. */
export interface UserProfile {
  readonly userId: string;
  readonly displayName: string;
  readonly region: string;
}

/** JetStream step observation — persist + consume + ack + redelivery. */
export interface JetStreamObservation {
  readonly stream: string;
  readonly publishedSeqs: readonly number[];
  readonly consumedCount: number;
  readonly ackedCount: number;
  readonly redeliveredCount: number;
  readonly filterSubject: string;
}

/** KV step observation — put + get + delete + revision bookkeeping. */
export interface KVObservation {
  readonly bucket: string;
  readonly puts: number;
  readonly updates: number;
  readonly deletes: number;
  readonly lastRevision: number;
  readonly finalKeys: readonly string[];
}

/** Object Store step observation — put + list + digest + total bytes. */
export interface ObjectObservation {
  readonly bucket: string;
  readonly objectsPut: number;
  readonly totalBytesStored: number;
  readonly digests: readonly string[];
  readonly deletedNames: readonly string[];
}

/** Routing step observation — literal + wildcard + queue group counts. */
export interface RoutingObservation {
  readonly literalDeliveries: number;
  readonly wildcardDeliveries: number;
  readonly catchAllDeliveries: number;
  readonly queueGroupDeliveries: number;
  readonly queueGroupSize: number;
}

/** Trace event — every adapter op appends 1 entry. */
export interface TraceEvent {
  op: string;
  ok: boolean;
  errorKind?: string | undefined;
  detail?: Record<string, unknown> | undefined;
}

// -----------------------------------------------------------------------------
// v2 (v1.31-4) — durable consumer + KV revision + Object chunking + testcontainers
// probe observations.
// -----------------------------------------------------------------------------

/**
 * Durable consumer step observation — records the ack-pending window walk,
 * a nack-triggered backoff redelivery, an ack_wait sweep expiration, and
 * the final quarantine window (max_deliver exceeded).
 */
export interface JetStreamDurableObservation {
  readonly durableName: string;
  /** Total messages published onto the durable-backed stream. */
  readonly published: number;
  /** Distinct deliveries observed (redeliveries count separately). */
  readonly deliveries: number;
  /** Messages acked cleanly. */
  readonly acked: number;
  /** Backoff-triggered redeliveries (via nack). */
  readonly backoffRedeliveries: number;
  /** ack_wait sweeps that requeued or quarantined a pending message. */
  readonly ackWaitSweeps: number;
  /** Messages driven past max_deliver + landed in quarantine. */
  readonly quarantined: number;
  /** Final ack floor (highest seq acked). */
  readonly ackFloor: number;
  /** Ordered list of backoff delays consumed. */
  readonly backoffScheduleMs: readonly number[];
}

/**
 * KV revision step observation — records a 5-revision history walk under
 * `historyDepth=5` and a watch drain that consumed every history event.
 */
export interface KvRevisionObservation {
  readonly bucket: string;
  /** Key exercised by the history walker. */
  readonly key: string;
  /** History depth requested at bucket creation time. */
  readonly historyDepth: number;
  /** All revisions recorded on the key (put + update + delete tombstone). */
  readonly revisions: readonly {
    readonly revision: number;
    readonly operation: 'put' | 'delete';
  }[];
  /** Whether the final `getKv` returned null because of the delete tombstone. */
  readonly deleteTombstoneObserved: boolean;
  /** Number of watch events drained by the iterator (should match revisions). */
  readonly watchEventCount: number;
}

/**
 * Object Store chunking observation — records the chunk-boundary walk +
 * LZ4-tagged compression + reassembly digest match.
 */
export interface ObjectChunkingObservation {
  readonly bucket: string;
  readonly name: string;
  /** Chunk size in bytes at bucket creation time. */
  readonly chunkSizeBytes: number;
  /** Original byte length. */
  readonly originalSize: number;
  /** Chunk count observed on the ObjectRecord. */
  readonly chunkCount: number;
  /** Per-chunk digest values in delivery order. */
  readonly chunkDigests: readonly string[];
  /** Compression kind applied to the chunk stream. */
  readonly compression: 'none' | 'lz4';
  /** True when `reassembleObject` returned the original bytes. */
  readonly reassembledMatches: boolean;
}

/**
 * Testcontainers probe observation — mirrors the sibling Redpanda +
 * Kafka contracts (endpoint + image tag + reachable flag) so the fidelity
 * harness treats every dogfood uniformly.
 */
export interface TestcontainersProbeObservation {
  readonly natsUrl: string;
  readonly natsImage: string;
  readonly reachable: boolean;
}

/**
 * Provider-neutral NATS driver. 5 v1 ops + 4 v2 ops map to the AC in
 * Issue #1012 (durable consumer + KV bucket revision + Object Store
 * chunking + real NATS 2.10+ testcontainers + Playwright e2e + release
 * gate 13 axis).
 */
export interface NatsJetStreamAdapter {
  readonly mode: 'real' | 'mock';
  readonly traces: () => TraceEvent[];

  driveJetStream(events: readonly OrderEvent[]): Promise<JetStreamObservation>;

  driveKV(profiles: readonly UserProfile[]): Promise<KVObservation>;

  driveObject(): Promise<ObjectObservation>;

  driveRouting(): Promise<RoutingObservation>;

  emitFidelity(): Promise<void>;

  // ---------------------------------------------------------------------------
  // v2 ops — durable consumer + KV revision + Object chunking + testcontainers
  // probe. Each op is scope-boxed so the real driver can report a
  // well-defined divergence when the env is absent.
  // ---------------------------------------------------------------------------

  /**
   * v2 — spin up a durable consumer with ack_wait + max_deliver + backoff
   * schedule. Deliver + nack a middle message to trigger backoff, expire
   * one message via ack_wait sweep, and push one message past max_deliver
   * so it lands in quarantine. Reports the ack pending / quarantined / ack
   * floor counts.
   */
  driveJetStreamDurable(): Promise<JetStreamDurableObservation>;

  /**
   * v2 — write a 5-revision history chain on 1 key (put + 3 updates + 1
   * delete tombstone) under `historyDepth=5` and drain the watch iterator
   * to observe every event. Reports the ordered revision list + tombstone
   * flag + watch event count.
   */
  driveKvRevision(): Promise<KvRevisionObservation>;

  /**
   * v2 — put a 1024-byte payload with `chunkSizeBytes=256` under an
   * Object Store bucket with `compression='lz4'`. Reports the chunk count,
   * per-chunk digest list, compression kind, and whether
   * `reassembleObject` returned the original bytes.
   */
  driveObjectChunking(): Promise<ObjectChunkingObservation>;

  /**
   * v2 — probe the NATS 2.10+ testcontainers boot path. Under mock mode
   * returns deterministic placeholders; under real mode returns the
   * container-mapped host:port pair or a well-defined divergence when the
   * env is absent.
   */
  driveTestcontainersProbe(): Promise<TestcontainersProbeObservation>;

  metrics(): {
    latencySamplesMs: number[];
    jetstreamPublished: number;
    jetstreamAcked: number;
    kvOperations: number;
    objectBytesStored: number;
    routingDeliveries: number;
    // v2 counters — the fidelity report surfaces these alongside the v1 ones.
    durableDeliveries: number;
    durableQuarantined: number;
    kvRevisionsWritten: number;
    objectChunksWritten: number;
    testcontainersProbes: number;
  };

  reset(): Promise<void>;
}

export const OPS_UNDER_TEST: readonly string[] = [
  'driveJetStream',
  'driveKV',
  'driveObject',
  'driveRouting',
  'emitFidelity',
  // v2 ops — advance the surface from 5 → 9 while keeping the v1 ops in place.
  'driveJetStreamDurable',
  'driveKvRevision',
  'driveObjectChunking',
  'driveTestcontainersProbe',
];
