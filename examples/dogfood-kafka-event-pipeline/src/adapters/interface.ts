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

// -----------------------------------------------------------------------------
// v2 (v1.31-2) — raw protocol + Schema Registry + testcontainers observations.
//
// The v1.20-2 shape (5 ops above) covered producer / consumer group /
// transactional / DLQ / emitFidelity from the streaming v0.1 mock surface.
// v1.31-2 extends the adapter with 4 additional ops that exercise the
// streaming v0.3 advanced semantics (`kafka-raw-protocol`, `redpanda-schema-*`
// axes) end-to-end + a real driver probe path for confluent-kafka-python
// testcontainers. The 4 new ops preserve the "op → observation → trace" shape
// so the fidelity harness treats them uniformly.
// -----------------------------------------------------------------------------

/**
 * Raw-protocol step observation — KIP-98 producer id / epoch fencing +
 * transaction coordinator state machine transitions + fetch session epoch.
 */
export interface RawProtocolObservation {
  readonly producerId: number;
  readonly initialEpoch: number;
  /** Epoch observed after 1 fence — must be initialEpoch + 1 for KIP-98 fencing. */
  readonly fencedEpoch: number;
  /** Sequence of transaction coordinator states walked during the drive. */
  readonly txnStates: readonly string[];
  /** Fetch session id + final epoch after `bumpFetchSession`. */
  readonly fetchSessionId: number;
  readonly fetchSessionEpoch: number;
}

/**
 * ISR + high-watermark observation — the raw-protocol axis records
 * `min.insync.replicas` gating + HW advance rules that KIP-98 relies on for
 * the read-committed isolation guarantee.
 */
export interface IsrHighWatermarkObservation {
  readonly topic: string;
  readonly partition: number;
  readonly isrSize: number;
  readonly highWatermark: number;
  /** True when the HW advanced past the previous value on the last try. */
  readonly advanced: boolean;
}

/**
 * Schema Registry step observation — mock evolution check across an
 * Avro / Protobuf / JSON schema chain. Reports whether the check
 * (`BACKWARD` / `FORWARD` / `FULL`) succeeds and the resolved subject-strategy
 * identifier.
 */
export interface SchemaRegistryObservation {
  readonly subject: string;
  readonly compatibility: 'BACKWARD' | 'FORWARD' | 'FULL';
  readonly compatible: boolean;
  readonly registeredSchemaId: number;
}

/**
 * Testcontainers probe observation — records the confluent-kafka /
 * Schema Registry container endpoints that a caller would target in
 * `KIWA_MODE=real`. Under mock mode the endpoints are the deterministic
 * placeholders below; under real mode the probe reports the container-mapped
 * host:port pair when both `KIWA_MODE=real` + `KAFKA_KEY` are set, else a
 * well-defined `KAFKA_ENV_MISSING` divergence.
 */
export interface TestcontainersProbeObservation {
  readonly bootstrap: string;
  readonly schemaRegistryUrl: string;
  readonly kafkaImage: string;
  readonly schemaRegistryImage: string;
  readonly reachable: boolean;
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

  // ---------------------------------------------------------------------------
  // v2 ops — advanced streaming semantics (raw protocol + Schema Registry) +
  // testcontainers probe. Each op is scope-boxed so the real driver can report
  // a well-defined divergence when the env is absent.
  // ---------------------------------------------------------------------------

  /**
   * v2 — walk the KIP-98 raw-protocol state machine (initProducerId +
   * fenceProducer + txn Empty→Ongoing→PrepareCommit→CompleteCommit→Empty +
   * open + bump fetch session).
   */
  driveRawProtocol(): Promise<RawProtocolObservation>;

  /**
   * v2 — attach 3 brokers to the ISR, advance the HW past a produced offset,
   * report the resulting ISR size + HW value.
   */
  driveIsrHighWatermark(topic: string, partition: number, targetOffset: number): Promise<IsrHighWatermarkObservation>;

  /**
   * v2 — register a mock schema then check evolution compatibility for a
   * follow-up write. Uses the streaming v0.3 `redpanda-schema-evolution` axis.
   */
  driveSchemaRegistry(input: {
    readonly subject: string;
    readonly compatibility: 'BACKWARD' | 'FORWARD' | 'FULL';
  }): Promise<SchemaRegistryObservation>;

  /**
   * v2 — probe the confluent-kafka + Schema Registry testcontainers pair.
   * Under mock mode returns deterministic placeholders; under real mode
   * (KIWA_MODE=real + KAFKA_KEY) returns the container-mapped host:port pair
   * or a well-defined divergence when the env is absent.
   */
  driveTestcontainersProbe(): Promise<TestcontainersProbeObservation>;

  metrics(): {
    latencySamplesMs: number[];
    producerRecordsSent: number;
    consumerRecordsConsumed: number;
    transactionsCommitted: number;
    transactionsAborted: number;
    dlqQuarantined: number;
    // v2 counters — the fidelity report surfaces these next to the v1 counters.
    rawProtocolFences: number;
    isrAdvances: number;
    schemaRegistryChecks: number;
    testcontainersProbes: number;
  };

  reset(): Promise<void>;
}

export const OPS_UNDER_TEST: readonly string[] = [
  'driveProducer',
  'driveConsumerGroup',
  'driveTransaction',
  'driveDlq',
  'emitFidelity',
  // v2 ops — advance the surface from 5 → 9 while keeping the v1 ops in place.
  'driveRawProtocol',
  'driveIsrHighWatermark',
  'driveSchemaRegistry',
  'driveTestcontainersProbe',
];
