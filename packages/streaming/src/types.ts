// Shared types across the 3 provider mocks (Kafka / Redpanda / NATS) and 5
// semantics (producer / consumer / exactly-once / DLQ / schema-registry).
// The 5-semantic contract is intentionally broken up per provider so tests can
// import only the piece under test.

export type StreamingProvider = 'kafka' | 'redpanda' | 'nats';

/** Result of a single message publish. */
export interface PublishResult {
  readonly topic: string;
  readonly partition: number;
  readonly offset: number;
  readonly timestamp: number;
}

/** Single received message shared across all provider mocks. */
export interface StreamingMessage<TValue = unknown, TKey = string> {
  readonly topic: string;
  readonly partition: number;
  readonly offset: number;
  readonly timestamp: number;
  readonly key: TKey | null;
  readonly value: TValue;
  readonly headers: Record<string, string>;
}

/** Handler shape shared by consumer / group / subject subscribers. */
export type MessageHandler<TValue = unknown, TKey = string> = (
  message: StreamingMessage<TValue, TKey>,
) => void | Promise<void>;

/** DLQ (dead-letter queue) entry — a message that exceeded retry budget. */
export interface DeadLetterEntry<TValue = unknown, TKey = string> {
  readonly original: StreamingMessage<TValue, TKey>;
  readonly attempts: number;
  readonly reason: string;
  readonly quarantinedAt: number;
}

/** Schema kind supported by the schema-registry mock. */
export type SchemaKind = 'avro' | 'protobuf' | 'json';

/** Subject naming strategy — how subjects derive from topic. */
export type SubjectNamingStrategy = 'topic-name' | 'record-name' | 'topic-record-name';

/**
 * Compatibility mode — controls whether a new schema version can be registered
 * against an existing subject. See Confluent Schema Registry docs for the
 * canonical semantics; the mock enforces the intent, not every corner case.
 */
export type CompatibilityMode =
  | 'BACKWARD'
  | 'FORWARD'
  | 'FULL'
  | 'BACKWARD_TRANSITIVE'
  | 'FORWARD_TRANSITIVE'
  | 'FULL_TRANSITIVE'
  | 'NONE';
