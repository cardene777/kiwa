// Redpanda test adapter — Redpanda is Kafka API-wire-compatible + adds a
// bundled schema registry (Kafka-only ships a separate Confluent SR). The mock
// reuses `createKafkaMock` for the wire layer and adds a schema-registry
// client attached to the same broker instance so tests can validate the
// end-to-end Redpanda producer / consumer / schema-check flow.

import { createKafkaMock, type KafkaMock, type KafkaMockConfig, KAFKA_MOCK_SYMBOL } from './kafka.js';
import {
  createSchemaRegistry,
  type SchemaRegistry,
  type SchemaRegistryConfig,
} from './schema-registry.js';

export const REDPANDA_MOCK_SYMBOL = Symbol.for('kiwa.streaming.redpanda');

export interface RedpandaMockConfig extends KafkaMockConfig {
  readonly schemaRegistry?: SchemaRegistryConfig;
}

/**
 * RedpandaMock exposes the same producer/consumer/admin surface as KafkaMock
 * (structural compatibility) + a colocated `schemaRegistry` field so tests
 * can register schemas + assert compatibility without a second setup call.
 */
export interface RedpandaMock extends KafkaMock {
  readonly [REDPANDA_MOCK_SYMBOL]: true;
  readonly schemaRegistry: SchemaRegistry;
}

/**
 * Create a Redpanda-shaped mock. Under the hood it's the same broker mock as
 * Kafka + a schema registry — the split exists so tests targeting Redpanda
 * can pick the exact symbol / surface they want to assert against.
 */
export function createRedpandaMock(config?: RedpandaMockConfig): RedpandaMock {
  const kafkaCfg: KafkaMockConfig = config ?? {};
  const kafka = createKafkaMock(kafkaCfg);
  const registryCfg = config?.schemaRegistry ?? {};
  const registry = createSchemaRegistry(registryCfg);

  const mock: RedpandaMock = {
    // Copy every field from the underlying kafka mock — a hand-picked spread
    // is more type-safe than `Object.assign` here because RedpandaMock is a
    // structural superset with two extra fields.
    [KAFKA_MOCK_SYMBOL]: kafka[KAFKA_MOCK_SYMBOL],
    [REDPANDA_MOCK_SYMBOL]: true,
    config: kafka.config,
    schemaRegistry: registry,
    producer: kafka.producer.bind(kafka),
    consumer: kafka.consumer.bind(kafka),
    admin: kafka.admin.bind(kafka),
    reset() {
      kafka.reset();
      registry.reset();
    },
    getTopicMessages: kafka.getTopicMessages.bind(kafka),
    getCommittedOffset: kafka.getCommittedOffset.bind(kafka),
  };
  return mock;
}

/** Type guard: recognize a RedpandaMock. */
export function isRedpandaMock(value: unknown): value is RedpandaMock {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { [REDPANDA_MOCK_SYMBOL]?: true })[REDPANDA_MOCK_SYMBOL] === true
  );
}
