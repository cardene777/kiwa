/**
 * Provider-neutral Postgres CDC + outbox pipeline adapter contract for the
 * dogfood-postgres-cdc-outbox-app dogfood.
 *
 * The dogfood talks to the pipeline only through this interface. Two
 * implementations exist: {@link makeMockAdapter} (backed by
 * `@kiwa-lab/orm`'s CDC + logical-replication + replication + orm v0.10
 * advanced semantics) and {@link makeRealAdapter} (probes a Postgres 16
 * broker via `POSTGRES_BOOTSTRAP` when set, else returns a skipped variant
 * whose every method records a `POSTGRES_ENV_MISSING` trace).
 *
 * v1 (v1.26-2) covered 5 ops — driveOutbox / driveCdcPickup /
 * driveReplication / driveAtLeastOnce / emitFidelity. v1.32-2 extends the
 * surface with 4 v2 ops that exercise the orm v0.10 advanced Postgres
 * semantics end-to-end:
 *
 *   - `driveLogicalReplicationAdvanced` — Postgres 16 logical replication
 *                                          protocol start + replication
 *                                          origin tracking + two-safe
 *                                          synchronous commit confirmation
 *                                          + cascaded subscription sync.
 *                                          Reports the streaming LSN,
 *                                          origin id, confirmed flush LSN,
 *                                          and cascade subscriber count.
 *   - `driveSlotAdvance`               — replication slot lifecycle: a
 *                                          logical slot is created, its
 *                                          confirmed flush LSN is advanced
 *                                          past retained WAL, and the slot
 *                                          is dropped. Reports the retained
 *                                          + advanced + dropped state.
 *   - `drivePgvector`                  — pgvector approximate nearest
 *                                          neighbour walk: an IVFFlat index
 *                                          is built, a k-NN cosine query is
 *                                          issued, a hybrid search combines
 *                                          vector + full-text scoring, and
 *                                          the raw distance between two
 *                                          vectors is computed. Reports the
 *                                          index kind, search count, and
 *                                          computed distance.
 *   - `driveTestcontainersProbe`       — Postgres 16 + pgvector container
 *                                          image probe. Under mock mode
 *                                          returns deterministic
 *                                          placeholders; under real mode
 *                                          returns the container-mapped
 *                                          host:port pair or a well-defined
 *                                          divergence when the env is
 *                                          absent.
 *
 * All 9 ops (5 v1 + 4 v2) satisfy the same "op → observation → trace"
 * shape so behavioural fidelity between real vs mock can be measured side-
 * by-side and fed to `@kiwa-lab/quality-metrics` 13-axis release gate.
 */

import type { CdcEvent } from '@kiwa-lab/orm';

export interface OrderRow {
  readonly orderId: string;
  readonly region: 'us' | 'eu' | 'apac';
  readonly total: number;
}

/** Outbox step observation — LSN range + at-least-once state. */
export interface OutboxObservation {
  readonly writes: number;
  readonly highWaterLsn: number;
  readonly ackedLsn: number;
  readonly sealed: boolean;
}

/** CDC pickup step observation — decoded events + consumer group backlog. */
export interface CdcObservation {
  readonly decodedCount: number;
  readonly delivered: number;
  readonly pending: number;
  readonly duplicates: number;
}

/** Replication step observation — primary write flow + read replica lag. */
export interface ReplicationObservation {
  readonly primaryLsn: number;
  readonly replicaLag: number;
  readonly failoverState: 'streaming' | 'lagged' | 'failover-in-progress' | 'promoted';
  readonly promotedReplicaId?: string;
}

/** At-least-once step observation — idempotent consumer + duplicate handling. */
export interface AtLeastOnceObservation {
  readonly deliveredMessages: number;
  readonly duplicateAttempts: number;
  readonly ackedLsn: number;
  readonly redeliveries: number;
}

/** Trace event — every adapter method appends 1 entry. */
export interface TraceEvent {
  op: string;
  ok: boolean;
  errorKind?: string | undefined;
  detail?: Record<string, unknown> | undefined;
}

export interface AdapterMetrics {
  latencySamplesMs: number[];
  outboxWrites: number;
  cdcDelivered: number;
  replicationBytes: number;
  atLeastOnceDeliveries: number;
  duplicatesHandled: number;
  // v2 counters — the fidelity report surfaces these alongside the v1 ones.
  logicalReplicationSteps: number;
  slotAdvanceOps: number;
  pgvectorSearches: number;
  testcontainersProbes: number;
}

// -----------------------------------------------------------------------------
// v2 (v1.32-2) — logical replication advanced + slot advance + pgvector +
// testcontainers probe observations.
// -----------------------------------------------------------------------------

/**
 * Logical replication advanced step observation — records the 4-state walk
 * (streaming → origin-tracked → two-safe-confirmed → cascade-synced) that
 * mirrors Postgres 16 pgoutput protocol + replication origin + synchronous
 * standby confirmation + cascaded subscription primitives.
 */
export interface LogicalReplicationAdvancedObservation {
  /** Streaming replication protocol start LSN. */
  readonly startLsn: number;
  /** Replication origin id tracked by the subscriber. */
  readonly originId: string;
  /** Confirmed flush LSN after the two-safe synchronous commit. */
  readonly confirmedFlushLsn: number;
  /** Number of synchronous standbys confirmed by the two-safe commit. */
  readonly synchronousStandbys: number;
  /** Cascaded subscriber count after the cascade sync step. */
  readonly cascadedSubscribers: number;
  /** Final state reached by the session (`cascade-synced` on success). */
  readonly finalState:
    | 'idle'
    | 'streaming'
    | 'origin-tracked'
    | 'two-safe-confirmed'
    | 'cascade-synced';
}

/**
 * Replication slot advance step observation — records slot creation,
 * confirmed LSN advance past retained WAL, and slot drop.
 */
export interface SlotAdvanceObservation {
  readonly slotName: string;
  /** Retained LSN at slot creation time (before any advance). */
  readonly retainedLsn: number;
  /** Advanced confirmed flush LSN (must be > retainedLsn). */
  readonly advancedLsn: number;
  /** True after `pg_drop_replication_slot` completes. */
  readonly dropped: boolean;
  /** Advance delta in bytes released for WAL recycling. */
  readonly recycledBytes: number;
}

/**
 * pgvector step observation — records IVFFlat index build, cosine k-NN
 * search, hybrid vector + full-text search, and raw distance computation.
 */
export interface PgvectorObservation {
  /** ANN index kind selected (`ivfflat` for the v1.32-2 default). */
  readonly indexKind: 'ivfflat' | 'hnsw';
  readonly dimensions: number;
  /** Number of IVFFlat lists (partitions) when kind = ivfflat. */
  readonly lists: number;
  /** Total search operations (knn + hybrid). */
  readonly searchCount: number;
  /** Cosine distance computed between the two probe vectors. */
  readonly computedDistance: number;
  /** True when both knn + hybrid searches recorded `vector.searched` states. */
  readonly bothSearchesRecorded: boolean;
}

/**
 * Testcontainers probe observation — Postgres 16 + pgvector image lookup +
 * host:port pair.
 */
export interface TestcontainersProbeObservation {
  readonly postgresUrl: string;
  readonly postgresImage: string;
  readonly pgvectorImage: string;
  readonly reachable: boolean;
}

/**
 * Provider-neutral Postgres CDC + outbox pipeline driver. 5 v1 ops + 4 v2
 * ops map to the AC in Issue #1023 (Postgres 16 logical replication + slot
 * advance + pgvector real driver + testcontainers fidelity + Playwright
 * e2e + release gate 13 axis).
 *
 * 1. `driveOutbox`       — write N rows to the outbox inside a transaction,
 *                          seal the batch with LSN ordering
 * 2. `driveCdcPickup`    — read outbox events, ingest them into a Redis
 *                          Streams consumer group, ack up to a chosen LSN
 * 3. `driveReplication`  — primary write flow + a lagged replica + a
 *                          failover + a replica promotion
 * 4. `driveAtLeastOnce`  — re-deliver an already-acked message → idempotent
 *                          consumer drops the duplicate
 * 5. `emitFidelity`      — assemble a quality-report + release-gate
 *                          verdict, write to quality-report/
 *
 * v2 — 4 ops that exercise orm v0.10 advanced Postgres semantics.
 */
export interface PostgresCdcOutboxAdapter {
  readonly mode: 'real' | 'mock';
  readonly traces: () => TraceEvent[];

  driveOutbox(orders: readonly OrderRow[]): Promise<OutboxObservation>;

  driveCdcPickup(input: {
    orders: readonly OrderRow[];
    ackBatchSize: number;
  }): Promise<CdcObservation>;

  driveReplication(input: {
    writes: readonly { bytes: number }[];
    laggedReplicaId: string;
    laggedAppliedLsn: number;
    failoverReason: string;
    promoteReplicaId: string;
  }): Promise<ReplicationObservation>;

  driveAtLeastOnce(input: {
    orders: readonly OrderRow[];
    duplicateOrders: readonly OrderRow[];
  }): Promise<AtLeastOnceObservation>;

  emitFidelity(): Promise<void>;

  // ---------------------------------------------------------------------------
  // v2 ops — Postgres 16 logical replication + slot advance + pgvector +
  // testcontainers probe. Each op is scope-boxed so the real driver can
  // report a well-defined divergence when the env is absent.
  // ---------------------------------------------------------------------------

  /**
   * v2 — walk the Postgres 16 logical replication advanced protocol: start
   * streaming from a chosen LSN, track a replication origin, confirm a
   * two-safe synchronous commit, and sync a cascaded subscriber. Reports
   * the final state + LSN checkpoints.
   */
  driveLogicalReplicationAdvanced(): Promise<LogicalReplicationAdvancedObservation>;

  /**
   * v2 — create a logical replication slot, advance its confirmed flush
   * LSN past retained WAL, and drop the slot. Reports the retained +
   * advanced LSN pair and the recycled WAL byte count.
   */
  driveSlotAdvance(): Promise<SlotAdvanceObservation>;

  /**
   * v2 — build a pgvector IVFFlat index, run a cosine k-NN search, run a
   * hybrid vector + full-text search, and compute the raw distance between
   * two probe vectors. Reports the search count + computed distance.
   */
  drivePgvector(): Promise<PgvectorObservation>;

  /**
   * v2 — probe the Postgres 16 + pgvector testcontainers boot path. Under
   * mock mode returns deterministic placeholders; under real mode returns
   * the container-mapped host:port pair or a well-defined divergence when
   * the env is absent.
   */
  driveTestcontainersProbe(): Promise<TestcontainersProbeObservation>;

  metrics(): AdapterMetrics;

  reset(): Promise<void>;
}

/** Convenience sample factory for tests + perf. */
export function sampleOrderRow(overrides: Partial<OrderRow> = {}): OrderRow {
  return {
    orderId: overrides.orderId ?? 'o-sample',
    region: overrides.region ?? 'us',
    total: overrides.total ?? 100,
  };
}

/** Neutral op names that fidelity harness diffs across mock vs real. */
export const OPS_UNDER_TEST: readonly string[] = [
  'driveOutbox',
  'driveCdcPickup',
  'driveReplication',
  'driveAtLeastOnce',
  'emitFidelity',
  // v2 ops — advance the surface from 5 → 9 while keeping the v1 ops in place.
  'driveLogicalReplicationAdvanced',
  'driveSlotAdvance',
  'drivePgvector',
  'driveTestcontainersProbe',
];

/** Re-export CdcEvent so downstream consumers can type against the same shape. */
export type { CdcEvent };
