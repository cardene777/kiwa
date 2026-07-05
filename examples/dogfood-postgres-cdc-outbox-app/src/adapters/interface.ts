/**
 * Provider-neutral Postgres CDC + outbox pipeline adapter contract for the
 * dogfood-postgres-cdc-outbox-app dogfood (v1.26-2).
 *
 * The dogfood talks to the pipeline only through this interface. Two
 * implementations exist: {@link makeMockAdapter} (backed by
 * `@kiwa-test/orm`'s CDC + logical-replication + replication semantics) and
 * {@link makeRealAdapter} (probes a Postgres 16 broker via
 * `POSTGRES_BOOTSTRAP` when set, else returns a skipped variant whose every
 * method records a `POSTGRES_ENV_MISSING` trace).
 *
 * Both satisfy the same 5-op surface so behavioural fidelity between real
 * vs mock can be measured side-by-side and fed to `@kiwa-test/quality-metrics`
 * 7-axis release gate.
 */

import type { CdcEvent } from '@kiwa-test/orm';

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
}

/**
 * Provider-neutral Postgres CDC + outbox pipeline driver. 5 ops map to the
 * AC in Issue #941 (outbox write → CDC pickup → Redis Streams delivery /
 * streaming replication + read replica lag / idempotent consumer + duplicate
 * delivery / logical publication + subscription lifecycle / fidelity report
 * generation).
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
];

/** Re-export CdcEvent so downstream consumers can type against the same shape. */
export type { CdcEvent };
