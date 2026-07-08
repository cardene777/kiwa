/**
 * Mock adapter — spins up 1 outbox run, 1 CDC publication run, 1 Redis
 * Streams consumer, 1 replication session, and 4 orm v0.10 advanced
 * sessions (logical replication + slot + pgvector) against
 * `@kiwa/orm`'s mock semantics. Every op appends 1 latency sample
 * and 1 trace event so the fidelity harness never reads as 0-sample.
 *
 * The mock is drivable from tests deterministically — LSN counters are
 * monotonic, artificial latency is bounded, and no wall-clock scheduling
 * is used.
 *
 * v2 (v1.32-2) adds 4 flows: `driveLogicalReplicationAdvanced`,
 * `driveSlotAdvance`, `drivePgvector`, `driveTestcontainersProbe`. The
 * advanced logical replication + pgvector flows sit on top of the orm
 * v0.10 semantics rather than the coarse-grained v1 replication /
 * publication runs — those cover the coarse-grained CDC v1 patterns, the
 * v0.10 semantics cover the fine-grained protocol / origin / two-safe /
 * ANN behaviour the v2 axes assert against.
 */

import {
  createReplicationSession,
  markReplicaLagged,
  primaryWrite,
  promoteReplica,
  startFailover,
  type ReplicationSession,
} from '@kiwa/orm';
import type {
  AdapterMetrics,
  AtLeastOnceObservation,
  CdcObservation,
  LogicalReplicationAdvancedObservation,
  OrderRow,
  OutboxObservation,
  PgvectorObservation,
  PostgresCdcOutboxAdapter,
  ReplicationObservation,
  SlotAdvanceObservation,
  TestcontainersProbeObservation,
  TraceEvent,
} from './interface.js';
import { OPS_UNDER_TEST } from './interface.js';
import { createOutboxRun, type OutboxRun } from '../outbox/index.js';
import { createPublicationRun, pickupSince, type PublicationRun } from '../cdc/index.js';
import {
  createStreamsConsumerRun,
  type StreamsConsumerRun,
} from '../consumer/index.js';
import { driveLogicalReplicationFlow } from '../logical-replication/index.js';
import { driveSlotAdvanceFlow } from '../slot-advance/index.js';
import { drivePgvectorFlow } from '../pgvector/index.js';

/** Deterministic mock endpoints exposed by `driveTestcontainersProbe`. */
export const MOCK_POSTGRES_URL = 'postgresql://postgres:postgres@postgres-mock:5432/orders';
export const POSTGRES_IMAGE_DEFAULT = 'postgres:16-alpine';
export const PGVECTOR_IMAGE_DEFAULT = 'pgvector/pgvector:pg16';

export interface MockAdapterOptions {
  readonly slotName?: string;
  readonly publisherId?: string;
  readonly consumerGroup?: string;
  readonly maxInFlight?: number;
  readonly replicaIds?: readonly string[];
}

/**
 * Build the mock adapter. Defaults match the v1.26-2 AC — 1 outbox slot,
 * 1 publisher, 1 consumer group with 128-message backpressure cap, and
 * 2 replicas so the failover flow has a promotable target.
 */
export function makeMockAdapter(opts: MockAdapterOptions = {}): PostgresCdcOutboxAdapter {
  const config = {
    slotName: opts.slotName ?? 'outbox_slot',
    publisherId: opts.publisherId ?? 'pub_orders',
    consumerGroup: opts.consumerGroup ?? 'grp_orders',
    maxInFlight: opts.maxInFlight ?? 128,
    replicaIds: opts.replicaIds ?? (['replica-a', 'replica-b'] as const),
  };

  const trace: TraceEvent[] = [];
  const metricsAgg: AdapterMetrics = {
    latencySamplesMs: [],
    outboxWrites: 0,
    cdcDelivered: 0,
    replicationBytes: 0,
    atLeastOnceDeliveries: 0,
    duplicatesHandled: 0,
    logicalReplicationSteps: 0,
    slotAdvanceOps: 0,
    pgvectorSearches: 0,
    testcontainersProbes: 0,
  };

  let outboxRun: OutboxRun | null = null;
  let publicationRun: PublicationRun | null = null;
  let consumerRun: StreamsConsumerRun | null = null;
  let replicationSession: ReplicationSession | null = null;
  let heartbeatCounter = 0;

  function ensureOutbox(): OutboxRun {
    if (outboxRun) return outboxRun;
    outboxRun = createOutboxRun({ slotName: config.slotName });
    return outboxRun;
  }

  function ensurePublication(): PublicationRun {
    if (publicationRun) return publicationRun;
    publicationRun = createPublicationRun({ publisherId: config.publisherId });
    publicationRun.publish('orders_pub', ['orders']);
    publicationRun.subscribe('subscriber-a');
    return publicationRun;
  }

  function ensureConsumer(): StreamsConsumerRun {
    if (consumerRun) return consumerRun;
    consumerRun = createStreamsConsumerRun({
      groupName: config.consumerGroup,
      maxInFlight: config.maxInFlight,
    });
    return consumerRun;
  }

  function ensureReplication(): ReplicationSession {
    if (replicationSession) return replicationSession;
    replicationSession = createReplicationSession({
      primaryId: 'primary-us-east-1',
      provider: 'drizzle',
      backend: 'postgres',
      replicaIds: [...config.replicaIds],
    });
    return replicationSession;
  }

  function record(op: string, ok: boolean, extra?: Partial<TraceEvent>): void {
    const entry: TraceEvent = { op, ok };
    if (extra?.errorKind !== undefined) entry.errorKind = extra.errorKind;
    if (extra?.detail !== undefined) entry.detail = extra.detail;
    trace.push(entry);
  }

  async function timed<T>(op: string, run: () => T | Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      const result = await run();
      metricsAgg.latencySamplesMs.push(performance.now() - start);
      return result;
    } catch (err) {
      metricsAgg.latencySamplesMs.push(performance.now() - start);
      record(op, false, {
        errorKind: 'POSTGRES_MOCK_ERROR',
        detail: { message: err instanceof Error ? err.message : String(err) },
      });
      throw err;
    }
  }

  return {
    mode: 'mock',
    traces: () => [...trace],

    async driveOutbox(orders): Promise<OutboxObservation> {
      return timed('driveOutbox', async () => {
        const run = ensureOutbox();
        const publication = ensurePublication();
        heartbeatCounter += 1;
        publication.beat(heartbeatCounter);
        run.writeBatch(orders.map((o) => ({ kind: 'insert', order: o })));
        run.seal();
        metricsAgg.outboxWrites += orders.length;
        const observation: OutboxObservation = {
          writes: orders.length,
          highWaterLsn: run.highWaterLsn(),
          ackedLsn: run.confirmedLsn(),
          sealed: run.session.state === 'ordered' || run.session.state === 'delivered',
        };
        record('driveOutbox', true, {
          detail: {
            writes: observation.writes,
            highWaterLsn: observation.highWaterLsn,
          },
        });
        return observation;
      });
    },

    async driveCdcPickup(input): Promise<CdcObservation> {
      return timed('driveCdcPickup', async () => {
        const outbox = ensureOutbox();
        outbox.writeBatch(input.orders.map((o) => ({ kind: 'insert', order: o })));
        outbox.seal();
        const consumer = ensureConsumer();

        const pickup = pickupSince(outbox.outbox(), consumer.state().ackedLsn);
        consumer.ingest(pickup.events);

        // Poll in batches of `ackBatchSize` until the pending queue drains or
        // a bounded number of iterations pass — the batch loop mirrors the
        // XREADGROUP + XACK pair a Redis Streams consumer would run.
        let delivered = 0;
        for (let i = 0; i < 32; i += 1) {
          const batch = consumer.poll({ maxBatch: input.ackBatchSize });
          if (batch.length === 0) break;
          const ids = batch.map((m) => m.messageId);
          delivered += consumer.ack(ids);
        }

        if (delivered > 0) {
          outbox.acknowledgeUpTo(consumer.state().ackedLsn);
        }
        metricsAgg.cdcDelivered += delivered;

        const state = consumer.state();
        const observation: CdcObservation = {
          decodedCount: pickup.events.length,
          delivered,
          pending: state.pending.length,
          duplicates: state.duplicates,
        };
        record('driveCdcPickup', true, {
          detail: {
            decoded: observation.decodedCount,
            delivered: observation.delivered,
          },
        });
        return observation;
      });
    },

    async driveReplication(input): Promise<ReplicationObservation> {
      return timed('driveReplication', async () => {
        const session = ensureReplication();
        let totalBytes = 0;
        for (const w of input.writes) {
          primaryWrite(session, { bytes: w.bytes });
          totalBytes += w.bytes;
        }
        markReplicaLagged(session, {
          replicaId: input.laggedReplicaId,
          appliedLsn: input.laggedAppliedLsn,
        });
        // Capture the pre-promotion LSN + lag — `promoteReplica` swaps
        // `session.primaryLsn` to the promoted replica's `appliedLsn` and
        // removes the promoted replica from the map, which would zero the
        // observation for the caller if we read after promotion.
        const capturedPrimaryLsn = session.primaryLsn;
        const laggedReplica = session.replicas.get(input.laggedReplicaId);
        const capturedLag = laggedReplica?.lag ?? 0;

        startFailover(session, { reason: input.failoverReason });
        promoteReplica(session, { replicaId: input.promoteReplicaId });
        metricsAgg.replicationBytes += totalBytes;

        const observation: ReplicationObservation = {
          primaryLsn: capturedPrimaryLsn,
          replicaLag: capturedLag,
          failoverState: session.state,
          promotedReplicaId: input.promoteReplicaId,
        };
        record('driveReplication', true, {
          detail: {
            primaryLsn: observation.primaryLsn,
            lag: observation.replicaLag,
          },
        });
        return observation;
      });
    },

    async driveAtLeastOnce(input): Promise<AtLeastOnceObservation> {
      return timed('driveAtLeastOnce', async () => {
        const outbox = ensureOutbox();
        const consumer = ensureConsumer();
        outbox.writeBatch(input.orders.map((o) => ({ kind: 'insert', order: o })));
        outbox.seal();
        const pickup = pickupSince(outbox.outbox(), consumer.state().ackedLsn);
        consumer.ingest(pickup.events);

        const batch = consumer.poll({ maxBatch: input.orders.length });
        const acked = consumer.ack(batch.map((m) => m.messageId));

        // Duplicate ingest — same LSN range arriving twice (retry storm).
        // The idempotent consumer must drop the duplicates without
        // re-processing them.
        const duplicateEvents = outbox.outbox().slice(-input.duplicateOrders.length);
        consumer.ingest(duplicateEvents);

        const redeliveries = consumer.redeliver({ retryAll: false }).length;

        metricsAgg.atLeastOnceDeliveries += acked;
        metricsAgg.duplicatesHandled += consumer.state().duplicates;

        const state = consumer.state();
        const observation: AtLeastOnceObservation = {
          deliveredMessages: acked,
          duplicateAttempts: state.duplicates,
          ackedLsn: state.ackedLsn,
          redeliveries,
        };
        record('driveAtLeastOnce', true, {
          detail: {
            delivered: observation.deliveredMessages,
            duplicates: observation.duplicateAttempts,
          },
        });
        return observation;
      });
    },

    async emitFidelity(): Promise<void> {
      return timed('emitFidelity', async () => {
        // The fidelity report itself is assembled in flows/fidelity.ts; the
        // adapter just records that the op ran so the trace diff can compare
        // mock-emitted vs real-skipped.
        record('emitFidelity', true, {
          detail: { opsUnderTest: OPS_UNDER_TEST.length },
        });
      });
    },

    // -------------------------------------------------------------------------
    // v2 ops — logical replication advanced + slot advance + pgvector +
    // testcontainers probe.
    // -------------------------------------------------------------------------

    async driveLogicalReplicationAdvanced(): Promise<LogicalReplicationAdvancedObservation> {
      return timed('driveLogicalReplicationAdvanced', async () => {
        const { observation, session } = driveLogicalReplicationFlow();
        metricsAgg.logicalReplicationSteps += session.history.length;
        const ok =
          observation.finalState === 'cascade-synced' &&
          observation.cascadedSubscribers >= 1 &&
          observation.confirmedFlushLsn >= observation.startLsn;
        record('driveLogicalReplicationAdvanced', ok, {
          detail: {
            startLsn: observation.startLsn,
            originId: observation.originId,
            confirmedFlushLsn: observation.confirmedFlushLsn,
            cascadedSubscribers: observation.cascadedSubscribers,
            finalState: observation.finalState,
          },
        });
        return observation;
      });
    },

    async driveSlotAdvance(): Promise<SlotAdvanceObservation> {
      return timed('driveSlotAdvance', async () => {
        const { observation } = driveSlotAdvanceFlow();
        metricsAgg.slotAdvanceOps += 1;
        const ok =
          observation.dropped &&
          observation.advancedLsn > observation.retainedLsn &&
          observation.recycledBytes > 0;
        record('driveSlotAdvance', ok, {
          detail: {
            slotName: observation.slotName,
            retainedLsn: observation.retainedLsn,
            advancedLsn: observation.advancedLsn,
            recycledBytes: observation.recycledBytes,
          },
        });
        return observation;
      });
    },

    async drivePgvector(): Promise<PgvectorObservation> {
      return timed('drivePgvector', async () => {
        const { observation } = drivePgvectorFlow();
        metricsAgg.pgvectorSearches += observation.searchCount;
        const ok =
          observation.searchCount >= 2 &&
          observation.bothSearchesRecorded &&
          Number.isFinite(observation.computedDistance);
        record('drivePgvector', ok, {
          detail: {
            indexKind: observation.indexKind,
            dimensions: observation.dimensions,
            searchCount: observation.searchCount,
            computedDistance: observation.computedDistance,
          },
        });
        return observation;
      });
    },

    async driveTestcontainersProbe(): Promise<TestcontainersProbeObservation> {
      return timed('driveTestcontainersProbe', async () => {
        metricsAgg.testcontainersProbes += 1;
        const observation: TestcontainersProbeObservation = {
          postgresUrl: MOCK_POSTGRES_URL,
          postgresImage: POSTGRES_IMAGE_DEFAULT,
          pgvectorImage: PGVECTOR_IMAGE_DEFAULT,
          reachable: true,
        };
        record('driveTestcontainersProbe', true, {
          detail: {
            postgresUrl: observation.postgresUrl,
            postgresImage: observation.postgresImage,
            pgvectorImage: observation.pgvectorImage,
            reachable: observation.reachable,
          },
        });
        return observation;
      });
    },

    metrics(): AdapterMetrics {
      return { ...metricsAgg, latencySamplesMs: [...metricsAgg.latencySamplesMs] };
    },

    async reset(): Promise<void> {
      trace.length = 0;
      metricsAgg.latencySamplesMs.length = 0;
      metricsAgg.outboxWrites = 0;
      metricsAgg.cdcDelivered = 0;
      metricsAgg.replicationBytes = 0;
      metricsAgg.atLeastOnceDeliveries = 0;
      metricsAgg.duplicatesHandled = 0;
      metricsAgg.logicalReplicationSteps = 0;
      metricsAgg.slotAdvanceOps = 0;
      metricsAgg.pgvectorSearches = 0;
      metricsAgg.testcontainersProbes = 0;
      outboxRun = null;
      publicationRun = null;
      consumerRun?.reset();
      consumerRun = null;
      replicationSession = null;
      heartbeatCounter = 0;
    },
  };
}
