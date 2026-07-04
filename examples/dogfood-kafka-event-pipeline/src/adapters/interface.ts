/**
 * Provider-neutral Kafka event pipeline adapter contract for the
 * dogfood-kafka-event-pipeline dogfood.
 *
 * The dogfood talks to Kafka only through this interface. Two
 * implementations exist: {@link makeMockAdapter} (backed by
 * `@kiwa-test/streaming`'s Kafka + exactly-once + DLQ mocks) and
 * {@link makeRealAdapter} (drives `kafkajs` against a live broker when
 * `KAFKA_BOOTSTRAP` is set, else returns a `skipped` variant whose every
 * method records a `KAFKA_ENV_MISSING` trace).
 *
 * Both satisfy the same 5-op surface so behavioural fidelity between real
 * vs mock can be measured side-by-side and fed to `@kiwa-test/quality-metrics`
 * 7-axis release gate.
 */

export interface OrderEvent {
  readonly orderId: string;
  readonly region: 'us' | 'eu' | 'apac';
  readonly total: number;
}

/** Producer step observation — partition + offset per record. */
export interface ProducerObservation {
  readonly recordsSent: number;
  readonly duplicateRetries: number;
  readonly partitions: readonly number[];
  readonly baseOffset: number;
}

/** Consumer step observation — the consumers grouped by memberId. */
export interface ConsumerObservation {
  readonly consumers: readonly {
    readonly consumerId: string;
    readonly assignedPartitions: readonly number[];
    readonly consumedCount: number;
    readonly committedOffset: number;
  }[];
  readonly rebalanceCount: number;
}

/** Transaction step observation — committed vs aborted messages. */
export interface TransactionObservation {
  readonly commitState: 'committed' | 'aborted' | 'active' | 'idle';
  readonly committedCount: number;
  readonly abortedCount: number;
  readonly readCommittedCount: number;
}

/** DLQ step observation — attempts + quarantined + replayed. */
export interface DlqObservation {
  readonly outcome: 'handled' | 'quarantined';
  readonly attempts: number;
  readonly quarantinedCount: number;
  readonly replayedCount: number;
  readonly dlqTopic: string;
}

/** Trace event — every adapter method appends 1 entry. */
export interface TraceEvent {
  op: string;
  ok: boolean;
  errorKind?: string | undefined;
  detail?: Record<string, unknown> | undefined;
}

/**
 * Provider-neutral Kafka event pipeline driver. 5 ops map to the AC in
 * Issue #828 (producer + consumer group + exactly-once transactional + DLQ
 * + fidelity report generation).
 *
 * 1. `driveProducer`     — idempotent produce with partition key, retry with
 *                          same sequence number → observe dedup
 * 2. `driveConsumerGroup` — 2 consumers join a group, both subscribe, both
 *                          observe their rebalanced assignments, both
 *                          consume + commit offsets
 * 3. `driveTransaction`  — begin/send/commit vs begin/send/abort → observe
 *                          the read-committed view drops aborted batch
 * 4. `driveDlq`          — poison message exhausts retry budget, quarantined
 *                          + republished to DLQ topic + replayed after fix
 * 5. `emitFidelity`      — meta-op that records the current adapter mode
 *                          into the trace list (used by fidelity harness)
 */
export interface KafkaEventPipelineAdapter {
  readonly mode: 'real' | 'mock';
  readonly traces: () => TraceEvent[];

  driveProducer(events: readonly OrderEvent[]): Promise<ProducerObservation>;

  driveConsumerGroup(topic: string): Promise<ConsumerObservation>;

  driveTransaction(topic: string, opts: {
    readonly commit: readonly string[];
    readonly abort: readonly string[];
  }): Promise<TransactionObservation>;

  driveDlq(payloads: readonly { readonly orderId: string; readonly valid: boolean }[]): Promise<DlqObservation>;

  emitFidelity(): Promise<void>;

  metrics(): {
    latencySamplesMs: number[];
    producerRecordsSent: number;
    consumerRecordsConsumed: number;
    transactionsCommitted: number;
    transactionsAborted: number;
    dlqQuarantined: number;
  };

  reset(): Promise<void>;
}

export const OPS_UNDER_TEST: readonly string[] = [
  'driveProducer',
  'driveConsumerGroup',
  'driveTransaction',
  'driveDlq',
  'emitFidelity',
];
