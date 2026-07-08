// Barrel export for the 8 advanced-semantics axes shipped in v0.3.0.
// Individual axes cover Kafka raw protocol, Kafka consumer group, Redpanda
// schema evolution, Redpanda transactions, NATS JetStream durable consumer,
// NATS KV / Object store, cross-provider exactly-once, and consumer lag
// telemetry. The fidelity harness ties the 3 provider × 8 axis grid together.

export {
  createKafkaRawProtocol,
  isKafkaRawProtocol,
  KAFKA_RAW_PROTOCOL_SYMBOL,
  type FetchSession,
  type KafkaRawProtocol,
  type KafkaRawProtocolConfig,
  type ProducerIdentity,
  type TransactionCoordinatorState,
} from './kafka-raw-protocol.js';

export {
  createKafkaConsumerGroup,
  isKafkaConsumerGroup,
  KAFKA_CONSUMER_GROUP_SYMBOL,
  type GroupMember,
  type KafkaConsumerGroup,
  type KafkaConsumerGroupConfig,
  type RebalanceProtocol,
  type RebalanceResult,
} from './kafka-consumer-group.js';

export {
  createRedpandaSchemaEvolution,
  isRedpandaSchemaEvolution,
  REDPANDA_SCHEMA_EVOLUTION_SYMBOL,
  type EvolutionCheckResult,
  type EvolutionSchema,
  type RedpandaSchemaEvolution,
  type RedpandaSchemaEvolutionConfig,
  type SchemaReference,
} from './redpanda-schema-evolution.js';

export {
  createRedpandaTransactions,
  isRedpandaTransactions,
  REDPANDA_TRANSACTIONS_SYMBOL,
  type ProducerEpoch,
  type RedpandaTransactions,
  type RedpandaTransactionsConfig,
  type TxnPhase,
  type TxnRecord,
} from './redpanda-transactions.js';

export {
  createNatsJetStreamDurable,
  isNatsJetStreamDurable,
  NATS_JETSTREAM_DURABLE_SYMBOL,
  type AckPendingEntry,
  type AckPolicy,
  type DeliveryAttempt,
  type DurableConsumerConfig,
  type NatsJetStreamDurable,
  type QuarantinedMessage,
} from './nats-jetstream-durable.js';

export {
  createNatsKvObject,
  isNatsKvObject,
  NATS_KV_OBJECT_SYMBOL,
  type CompressionKind,
  type KvBucketConfig,
  type KvRevision,
  type KvWatchEvent,
  type NatsKvObject,
  type ObjectBucketConfig,
  type ObjectChunk,
  type ObjectRecord,
} from './nats-kv-object.js';

export {
  createExactlyOnceSemantics,
  EXACTLY_ONCE_SEMANTICS_SYMBOL,
  isExactlyOnceSemantics,
  type ExactlyOnceConfig,
  type ExactlyOnceSemantics,
  type IsolationLevel as ExactlyOnceIsolationLevel,
  type PendingRecord,
  type TxnState as ExactlyOnceTxnState,
} from './exactly-once.js';

export {
  createConsumerLagTelemetry,
  CONSUMER_LAG_TELEMETRY_SYMBOL,
  isConsumerLagTelemetry,
  type ConsumerLagTelemetry,
  type ConsumerLagTelemetryConfig,
  type OffsetSnapshot,
} from './consumer-lag-telemetry.js';

export {
  createFidelityHarness,
  FIDELITY_HARNESS_SYMBOL,
  isFidelityHarness,
  isRealDriverMode,
  requiredKeyFor,
  type CellStatus,
  type FidelityCell,
  type FidelityHarness,
  type SemanticsAxis,
} from './fidelity-harness.js';

// v2.1 pipeline-orchestrator = producer + consumer group + exactly-once + DLQ + schema registry の 継続合成 layer
export type {
  PipelineState,
  PipelineEvent,
  PipelineSession,
  PipelineSummary,
} from './pipeline-orchestrator.js';
export {
  startPipeline,
  dispatchEvent as dispatchPipelineEvent,
  summarizePipeline,
} from './pipeline-orchestrator.js';
