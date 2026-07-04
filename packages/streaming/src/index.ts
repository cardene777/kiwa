// @kiwa-test/streaming — public API surface.
// v0.1.0 covers Kafka + Redpanda + NATS unified mock with 5 semantics
// (producer / consumer / exactly-once / DLQ / schema-registry).

// Shared types.
export type {
  CompatibilityMode,
  DeadLetterEntry,
  MessageHandler,
  PublishResult,
  SchemaKind,
  StreamingMessage,
  StreamingProvider,
  SubjectNamingStrategy,
} from './types.js';

// Kafka adapter surface.
export {
  createKafkaMock,
  isKafkaMock,
  KAFKA_ADMIN_SYMBOL,
  KAFKA_CONSUMER_SYMBOL,
  KAFKA_MOCK_SYMBOL,
  KAFKA_PRODUCER_SYMBOL,
  type CommittedOffset,
  type ConsumerConfig,
  type KafkaAdmin,
  type KafkaConsumer,
  type KafkaMock,
  type KafkaMockConfig,
  type KafkaProducer,
  type KafkaTopicSpec,
  type PartitionAssigner,
  type ProducerMessage,
  type ProducerRecord,
} from './kafka.js';

// Redpanda adapter surface.
export {
  createRedpandaMock,
  isRedpandaMock,
  REDPANDA_MOCK_SYMBOL,
  type RedpandaMock,
  type RedpandaMockConfig,
} from './redpanda.js';

// NATS adapter surface.
export {
  compileSubject,
  createNatsMock,
  isNatsMock,
  matchSubject,
  NATS_JETSTREAM_SYMBOL,
  NATS_KV_SYMBOL,
  NATS_MOCK_SYMBOL,
  NATS_OBJECT_SYMBOL,
  type JetStreamConfig,
  type JetStreamConsumer,
  type JetStreamConsumerConfig,
  type JetStreamPublishAck,
  type JetStreamStore,
  type KVEntry,
  type KVStore,
  type NatsMock,
  type NatsMockConfig,
  type NatsPublishOptions,
  type NatsSubscription,
  type ObjectEntry,
  type ObjectInfo,
  type ObjectStore,
} from './nats.js';

// Exactly-once semantics.
export {
  createIdempotentProducer,
  createReadCommittedFilter,
  createTransactionalProducer,
  IDEMPOTENT_PRODUCER_SYMBOL,
  isIdempotentProducer,
  isTransactionalProducer,
  READ_COMMITTED_SYMBOL,
  TRANSACTIONAL_PRODUCER_SYMBOL,
  type IdempotentProducer,
  type IdempotentProducerConfig,
  type IsolationLevel,
  type ReadCommittedFilter,
  type TransactionalProducer,
  type TransactionalProducerConfig,
  type TransactionState,
} from './exactly-once.js';

// DLQ.
export {
  createDeadLetterQueue,
  DLQ_SYMBOL,
  isDeadLetterQueue,
  type BackoffKind,
  type DeadLetterQueue,
  type DeadLetterQueueConfig,
  type RetryPolicy,
} from './dlq.js';

// Schema registry.
export {
  createSchemaRegistry,
  isSchemaRegistry,
  SCHEMA_REGISTRY_SYMBOL,
  type CompatibilityCheckResult,
  type RegisteredSchema,
  type SchemaRegistry,
  type SchemaRegistryConfig,
} from './schema-registry.js';
