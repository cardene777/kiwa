/**
 * Mock adapter — spins up 1 KafkaMock and wires the 4 flow modules
 * (producer / consumer / transaction / dlq) against it. Every op appends
 * 1 latency sample and 1 trace event so the fidelity harness never reads
 * as 0-sample.
 */

import {
  createKafkaMock,
  createKafkaRawProtocol,
  createRedpandaSchemaEvolution,
  type KafkaMock,
  type KafkaRawProtocol,
  type RedpandaSchemaEvolution,
  type StreamingMessage,
} from '@kiwa/streaming';
import type {
  ConsumerObservation,
  DlqObservation,
  IsrHighWatermarkObservation,
  KafkaEventPipelineAdapter,
  OrderEvent,
  ProducerObservation,
  RawProtocolObservation,
  SchemaRegistryObservation,
  TestcontainersProbeObservation,
  TraceEvent,
  TransactionObservation,
} from './interface.js';
import { createProducerRun } from '../producer/index.js';
import { createConsumerRun } from '../consumer/index.js';
import { createTransactionRun } from '../transaction/index.js';
import { createDlqRun, type WorkPayload } from '../dlq/index.js';

/** Deterministic mock endpoints exposed by `driveTestcontainersProbe`. */
export const MOCK_KAFKA_BOOTSTRAP = 'kafka-mock:9092';
export const MOCK_SCHEMA_REGISTRY_URL = 'http://schema-registry-mock:8081';
export const KAFKA_IMAGE_DEFAULT = 'confluentinc/cp-kafka:7.5.0';
export const SCHEMA_REGISTRY_IMAGE_DEFAULT = 'confluentinc/cp-schema-registry:7.5.0';

export interface MockAdapterOptions {
  readonly defaultPartitionCount?: number;
  readonly clientId?: string;
}

/**
 * Build the mock adapter. `defaultPartitionCount` defaults to 4 — enough
 * partitions to observe consumer-group rebalance across 2 consumers, and
 * enough headroom that partition-key hashing shows up as non-trivial in
 * the fidelity report.
 */
export function makeMockAdapter(opts: MockAdapterOptions = {}): KafkaEventPipelineAdapter {
  const config: { readonly defaultPartitionCount: number; readonly clientId: string } = {
    defaultPartitionCount: opts.defaultPartitionCount ?? 4,
    clientId: opts.clientId ?? 'dogfood-kafka-event-pipeline',
  };

  const trace: TraceEvent[] = [];
  const metricsAgg = {
    latencySamplesMs: [] as number[],
    producerRecordsSent: 0,
    consumerRecordsConsumed: 0,
    transactionsCommitted: 0,
    transactionsAborted: 0,
    dlqQuarantined: 0,
    // v2 counters — surfaced next to the v1 counters in the fidelity report.
    rawProtocolFences: 0,
    isrAdvances: 0,
    schemaRegistryChecks: 0,
    testcontainersProbes: 0,
  };

  let kafka: KafkaMock | null = null;
  let rawProtocol: KafkaRawProtocol | null = null;
  let schemaRegistry: RedpandaSchemaEvolution | null = null;

  function ensure(): KafkaMock {
    if (kafka) return kafka;
    kafka = createKafkaMock(config);
    return kafka;
  }

  function ensureRawProtocol(): KafkaRawProtocol {
    if (rawProtocol) return rawProtocol;
    rawProtocol = createKafkaRawProtocol({
      replicationFactor: 3,
      minInSyncReplicas: 2,
    });
    return rawProtocol;
  }

  function ensureSchemaRegistry(): RedpandaSchemaEvolution {
    if (schemaRegistry) return schemaRegistry;
    schemaRegistry = createRedpandaSchemaEvolution({
      defaultCompatibility: 'BACKWARD',
      subjectNamingStrategy: 'topic-name',
    });
    return schemaRegistry;
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
        errorKind: 'KAFKA_MOCK_ERROR',
        detail: { message: err instanceof Error ? err.message : String(err) },
      });
      throw err;
    }
  }

  return {
    mode: 'mock',
    traces: () => [...trace],

    async driveProducer(events): Promise<ProducerObservation> {
      return timed('driveProducer', async () => {
        const k = ensure();
        const topic = 'orders';
        // Pre-create the topic with the configured partition count so
        // partition-key hashing has room to distribute across partitions.
        const admin = k.admin();
        await admin.connect();
        await admin.createTopics({
          topics: [{ topic, numPartitions: config.defaultPartitionCount }],
        });
        await admin.disconnect();

        const run = createProducerRun(k, topic);
        await run.connect();

        // Send every event once, then retry event index 0 with the same
        // sequence to observe idempotent dedup.
        const first = await run.publishBatch(topic, events, 100);
        // Retry the first event with the same sequence number 100 — the
        // idempotent producer must return an empty result set for it.
        const retry = events.length > 0 && events[0] !== undefined
          ? await run.publishOrder(events[0], 100)
          : [];
        await run.disconnect();

        metricsAgg.producerRecordsSent += first.length;
        const partitions = Array.from(new Set(first.map((r) => r.partition))).sort((a, b) => a - b);
        const observation: ProducerObservation = {
          recordsSent: first.length,
          duplicateRetries: run.duplicates(),
          partitions,
          baseOffset: first[0]?.offset ?? -1,
        };
        record('driveProducer', first.length === events.length && retry.length === 0, {
          detail: {
            eventCount: events.length,
            distinctPartitions: partitions.length,
            duplicateRetries: run.duplicates(),
          },
        });
        return observation;
      });
    },

    async driveConsumerGroup(topic): Promise<ConsumerObservation> {
      return timed('driveConsumerGroup', async () => {
        const k = ensure();
        // Ensure topic exists with the configured partition count.
        const admin = k.admin();
        await admin.connect();
        await admin.createTopics({
          topics: [{ topic, numPartitions: config.defaultPartitionCount }],
        });
        await admin.disconnect();

        // Seed 8 records across the partitions so both consumers observe work.
        const producer = k.producer();
        await producer.connect();
        for (let i = 0; i < 8; i += 1) {
          // eslint-disable-next-line no-await-in-loop
          await producer.send({
            topic,
            messages: [{ key: `key-${i}`, value: { seq: i } }],
          });
        }
        await producer.disconnect();

        const c1 = createConsumerRun(
          k,
          { groupId: 'group-orders', partitionAssigner: 'round-robin' },
          { consumerId: 'consumer-1' },
        );
        const c2 = createConsumerRun(
          k,
          { groupId: 'group-orders', partitionAssigner: 'round-robin' },
          { consumerId: 'consumer-2' },
        );
        await c1.connect();
        await c2.connect();
        await c1.subscribe([topic], { fromBeginning: true });
        await c2.subscribe([topic], { fromBeginning: true });
        // Snapshot the *final* assignments after both consumers have joined —
        // the RebalanceEvent from subscribe() is stale for the first
        // consumer because the second consumer triggers a re-partition.
        const finalAssign1 = c1.consumer.assignments().get(topic) ?? [];
        const finalAssign2 = c2.consumer.assignments().get(topic) ?? [];
        const consumed1 = await c1.consume({ autoCommit: true });
        const consumed2 = await c2.consume({ autoCommit: true });
        await c1.disconnect();
        await c2.disconnect();

        // Snapshot committed offsets — end-of-partition offset per consumer's
        // assigned partitions.
        function offsetFor(assignments: readonly number[]): number {
          let total = 0;
          for (const p of assignments) {
            const committed = k.getCommittedOffset('group-orders', topic, p) ?? 0;
            total += committed;
          }
          return total;
        }

        metricsAgg.consumerRecordsConsumed += consumed1.length + consumed2.length;
        const observation: ConsumerObservation = {
          consumers: [
            {
              consumerId: c1.consumerId,
              assignedPartitions: [...finalAssign1],
              consumedCount: consumed1.length,
              committedOffset: offsetFor(finalAssign1),
            },
            {
              consumerId: c2.consumerId,
              assignedPartitions: [...finalAssign2],
              consumedCount: consumed2.length,
              committedOffset: offsetFor(finalAssign2),
            },
          ],
          rebalanceCount: c1.rebalances().length + c2.rebalances().length,
        };
        record(
          'driveConsumerGroup',
          consumed1.length + consumed2.length === 8,
          {
            detail: {
              consumers: 2,
              rebalances: observation.rebalanceCount,
              totalConsumed: consumed1.length + consumed2.length,
            },
          },
        );
        return observation;
      });
    },

    async driveTransaction(topic, opts): Promise<TransactionObservation> {
      return timed('driveTransaction', async () => {
        const k = ensure();
        const admin = k.admin();
        await admin.connect();
        await admin.createTopics({
          topics: [{ topic, numPartitions: 1 }],
        });
        await admin.disconnect();

        const run = createTransactionRun(k, 'txn-orders');
        await run.connect();
        const commitResult = await run.runCommit(topic, opts.commit);
        const abortResult = await run.runAbort(topic, opts.abort);
        await run.disconnect();

        // Consume everything from the topic with an isolation-level filter —
        // aborted batches never reached the broker so the filter is identity.
        const consumer = k.consumer({ groupId: 'txn-reader' });
        await consumer.connect();
        await consumer.subscribe({ topics: [topic], fromBeginning: true });
        const observed: StreamingMessage[] = [];
        await consumer.run({
          autoCommit: true,
          eachMessage: (message) => {
            observed.push(message);
          },
        });
        await consumer.disconnect();
        const readCommitted = run.filterCommitted(observed);

        metricsAgg.transactionsCommitted += opts.commit.length;
        metricsAgg.transactionsAborted += opts.abort.length;
        const observation: TransactionObservation = {
          commitState: (abortResult.state === 'aborted' ? 'aborted' : commitResult.state) as
            | 'committed'
            | 'aborted'
            | 'active'
            | 'idle',
          committedCount: opts.commit.length,
          abortedCount: opts.abort.length,
          readCommittedCount: readCommitted.length,
        };
        record(
          'driveTransaction',
          readCommitted.length === opts.commit.length,
          {
            detail: {
              commit: opts.commit.length,
              abort: opts.abort.length,
              observed: observed.length,
              readCommitted: readCommitted.length,
            },
          },
        );
        return observation;
      });
    },

    async driveDlq(payloads): Promise<DlqObservation> {
      return timed('driveDlq', async () => {
        const k = ensure();
        const topic = 'work';
        const run = createDlqRun({
          topic,
          maxAttempts: 3,
          backoff: 'constant',
          baseDelayMs: 0,
        });

        let quarantined = 0;
        let totalAttempts = 0;
        let finalOutcome: 'handled' | 'quarantined' = 'handled';
        for (let i = 0; i < payloads.length; i += 1) {
          const payload = payloads[i];
          if (payload === undefined) continue;
          const msg: StreamingMessage<WorkPayload> = {
            topic,
            partition: 0,
            offset: i,
            timestamp: Date.now(),
            key: null,
            value: payload,
            headers: {},
          };
          // eslint-disable-next-line no-await-in-loop
          const result = await run.handle(msg);
          totalAttempts += result.attempts;
          if (result.outcome === 'quarantined') {
            quarantined += 1;
            finalOutcome = 'quarantined';
          }
        }

        // Publish quarantined messages to the DLQ topic and replay them
        // after the "fix" — the ok predicate is `valid === true`.
        const replay = await run.publishAndReplayDlq(k, (payload) => payload.valid === true);
        run.reset();

        metricsAgg.dlqQuarantined += quarantined;
        const observation: DlqObservation = {
          outcome: finalOutcome,
          attempts: totalAttempts,
          quarantinedCount: quarantined,
          replayedCount: replay.replayed,
          dlqTopic: `${topic}.dlq`,
        };
        record('driveDlq', payloads.length > 0, {
          detail: {
            payloadCount: payloads.length,
            quarantined,
            replayPublished: replay.published,
          },
        });
        return observation;
      });
    },

    async emitFidelity(): Promise<void> {
      return timed('emitFidelity', async () => {
        record('emitFidelity', true, { detail: { mode: 'mock' } });
      });
    },

    async driveRawProtocol(): Promise<RawProtocolObservation> {
      return timed('driveRawProtocol', async () => {
        const p = ensureRawProtocol();
        // KIP-98 producer id + epoch fencing — a coordinator re-init bumps
        // epoch so the previous identity is fenced with INVALID_PRODUCER_EPOCH.
        const initial = p.initProducerId();
        const fenced = p.fenceProducer(initial.producerId);
        metricsAgg.rawProtocolFences += 1;
        // Walk the txn coordinator state machine one full commit cycle so the
        // observation carries a validated trajectory.
        const states: string[] = [p.transactionState()];
        p.transitionTransaction('Empty', 'Ongoing');
        states.push(p.transactionState());
        p.transitionTransaction('Ongoing', 'PrepareCommit');
        states.push(p.transactionState());
        p.transitionTransaction('PrepareCommit', 'CompleteCommit');
        states.push(p.transactionState());
        p.transitionTransaction('CompleteCommit', 'Empty');
        states.push(p.transactionState());
        // Incremental fetch session (KIP-227) — open then bump one epoch so the
        // caller can assert the epoch monotonicity.
        const session = p.openFetchSession();
        const epoch = p.bumpFetchSession(session.sessionId);
        const observation: RawProtocolObservation = {
          producerId: initial.producerId,
          initialEpoch: initial.epoch,
          fencedEpoch: fenced.epoch,
          txnStates: states,
          fetchSessionId: session.sessionId,
          fetchSessionEpoch: epoch,
        };
        record(
          'driveRawProtocol',
          fenced.epoch === initial.epoch + 1 && states[states.length - 1] === 'Empty',
          {
            detail: {
              producerId: initial.producerId,
              fencedEpoch: fenced.epoch,
              txnStateCount: states.length,
              fetchSessionEpoch: epoch,
            },
          },
        );
        return observation;
      });
    },

    async driveIsrHighWatermark(
      topic: string,
      partition: number,
      targetOffset: number,
    ): Promise<IsrHighWatermarkObservation> {
      return timed('driveIsrHighWatermark', async () => {
        const p = ensureRawProtocol();
        // Attach 3 brokers so ISR size == replicationFactor and the HW can
        // advance past minInSyncReplicas=2. Idempotent add across repeated
        // drives — check membership first because the underlying axis rejects
        // any addition that would exceed replicationFactor.
        const currentIsr = new Set(p.getIsr(topic, partition));
        for (const brokerId of [1, 2, 3]) {
          if (!currentIsr.has(brokerId)) p.addToIsr(topic, partition, brokerId);
        }
        const previous = p.getHighWatermark(topic, partition);
        const advancedTo = p.advanceHighWatermark(topic, partition, targetOffset);
        const advanced = advancedTo > previous;
        if (advanced) metricsAgg.isrAdvances += 1;
        const observation: IsrHighWatermarkObservation = {
          topic,
          partition,
          isrSize: p.getIsr(topic, partition).length,
          highWatermark: advancedTo,
          advanced,
        };
        record(
          'driveIsrHighWatermark',
          advanced && observation.isrSize >= 2,
          {
            detail: { topic, partition, targetOffset, advancedTo, previous },
          },
        );
        return observation;
      });
    },

    async driveSchemaRegistry(input): Promise<SchemaRegistryObservation> {
      return timed('driveSchemaRegistry', async () => {
        const r = ensureSchemaRegistry();
        // Register a v1 schema then attempt a compatible follow-up (optional
        // add is always safe under BACKWARD / FORWARD / FULL). The compat mode
        // is dictated by the caller so tests can exercise both compatible +
        // incompatible axes.
        r.setCompatibility(input.subject, input.compatibility);
        const v1 = r.register({
          subject: input.subject,
          kind: 'avro',
          schema: 'OrderSchema{OPTIONAL_ADD:field_v1}',
        });
        const check = r.check({
          subject: input.subject,
          kind: 'avro',
          schema: 'OrderSchema{OPTIONAL_ADD:field_v1,OPTIONAL_ADD:field_v2}',
        });
        metricsAgg.schemaRegistryChecks += 1;
        const observation: SchemaRegistryObservation = {
          subject: input.subject,
          compatibility: input.compatibility,
          compatible: check.compatible,
          registeredSchemaId: v1.id,
        };
        record('driveSchemaRegistry', check.compatible, {
          detail: {
            subject: input.subject,
            compatibility: input.compatibility,
            registeredSchemaId: v1.id,
            reasons: check.reasons.length,
          },
        });
        return observation;
      });
    },

    async driveTestcontainersProbe(): Promise<TestcontainersProbeObservation> {
      return timed('driveTestcontainersProbe', async () => {
        // Mock mode always reports deterministic endpoints — the real adapter
        // path is the only one that boots a container. This keeps the
        // fidelity diff meaningful (mock ok, real ok-when-env-present).
        metricsAgg.testcontainersProbes += 1;
        const observation: TestcontainersProbeObservation = {
          bootstrap: MOCK_KAFKA_BOOTSTRAP,
          schemaRegistryUrl: MOCK_SCHEMA_REGISTRY_URL,
          kafkaImage: KAFKA_IMAGE_DEFAULT,
          schemaRegistryImage: SCHEMA_REGISTRY_IMAGE_DEFAULT,
          reachable: true,
        };
        record('driveTestcontainersProbe', true, {
          detail: {
            bootstrap: observation.bootstrap,
            schemaRegistryUrl: observation.schemaRegistryUrl,
            kafkaImage: observation.kafkaImage,
          },
        });
        return observation;
      });
    },

    metrics() {
      return {
        latencySamplesMs: [...metricsAgg.latencySamplesMs],
        producerRecordsSent: metricsAgg.producerRecordsSent,
        consumerRecordsConsumed: metricsAgg.consumerRecordsConsumed,
        transactionsCommitted: metricsAgg.transactionsCommitted,
        transactionsAborted: metricsAgg.transactionsAborted,
        dlqQuarantined: metricsAgg.dlqQuarantined,
        rawProtocolFences: metricsAgg.rawProtocolFences,
        isrAdvances: metricsAgg.isrAdvances,
        schemaRegistryChecks: metricsAgg.schemaRegistryChecks,
        testcontainersProbes: metricsAgg.testcontainersProbes,
      };
    },

    async reset(): Promise<void> {
      trace.length = 0;
      metricsAgg.latencySamplesMs.length = 0;
      metricsAgg.producerRecordsSent = 0;
      metricsAgg.consumerRecordsConsumed = 0;
      metricsAgg.transactionsCommitted = 0;
      metricsAgg.transactionsAborted = 0;
      metricsAgg.dlqQuarantined = 0;
      metricsAgg.rawProtocolFences = 0;
      metricsAgg.isrAdvances = 0;
      metricsAgg.schemaRegistryChecks = 0;
      metricsAgg.testcontainersProbes = 0;
      if (kafka) kafka.reset();
      if (rawProtocol) rawProtocol.reset();
      if (schemaRegistry) schemaRegistry.reset();
      kafka = null;
      rawProtocol = null;
      schemaRegistry = null;
    },
  };
}

export function sampleOrderEvent(overrides: Partial<OrderEvent> = {}): OrderEvent {
  return {
    orderId: 'ord-1',
    region: 'us',
    total: 1250,
    ...overrides,
  };
}
