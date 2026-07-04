/**
 * Redpanda consumer flow — schema-aware consume + deserialize.
 *
 * The consumer reads the `x-schema-id` header off every message, fetches the
 * schema via `registry.getById`, and hands the parsed payload + the schema
 * kind to the handler. When the id is missing, the message is delivered to
 * an out-of-band handler (`onUnknownSchema`) so tests can assert on the
 * failure path without silently dropping records.
 *
 * "Evolution handling" is the deserialize path — a v1 consumer reading a v2
 * record ignores the extra field because Avro semantic evolution says the
 * reader schema is authoritative; the mock does not enforce that at parse
 * time, but the handler records both the message schema id and the reader
 * schema id so tests can assert on the pair.
 */

import type {
  KafkaMock,
  RegisteredSchema,
  SchemaKind,
  SchemaRegistry,
  StreamingMessage,
} from '@kiwa-test/streaming';

export interface DeserializedRecord<TValue = unknown> {
  readonly topic: string;
  readonly partition: number;
  readonly offset: number;
  readonly readerSchemaId: number;
  readonly messageSchemaId: number | null;
  readonly messageSchemaKind: SchemaKind | null;
  readonly value: TValue;
}

export interface ConsumerRun {
  readonly connect: () => Promise<void>;
  readonly disconnect: () => Promise<void>;
  readonly subscribe: (topics: readonly string[]) => Promise<void>;
  readonly consume: <TValue = unknown>() => Promise<readonly DeserializedRecord<TValue>[]>;
  readonly unknownSchemaMessages: () => readonly StreamingMessage[];
}

/** Build a consumer run bound to a specific reader schema + subject. */
export function createConsumerRun(input: {
  readonly kafka: KafkaMock;
  readonly registry: SchemaRegistry;
  readonly readerTopic: string;
  readonly readerSchema: RegisteredSchema;
  readonly groupId?: string;
}): ConsumerRun {
  const groupId = input.groupId ?? `consumer-${input.readerTopic}`;
  const consumer = input.kafka.consumer({ groupId });
  const unknown: StreamingMessage[] = [];

  async function subscribe(topics: readonly string[]): Promise<void> {
    await consumer.subscribe({ topics, fromBeginning: true });
  }

  async function consume<TValue = unknown>(): Promise<readonly DeserializedRecord<TValue>[]> {
    const collected: DeserializedRecord<TValue>[] = [];
    await consumer.run({
      autoCommit: true,
      eachMessage: async (message: StreamingMessage) => {
        const headers = message.headers ?? {};
        const rawId = headers['x-schema-id'];
        const rawKind = headers['x-schema-kind'];
        const messageSchemaId = rawId ? Number(rawId) : null;
        const messageSchemaKind: SchemaKind | null =
          rawKind === 'avro' || rawKind === 'protobuf' || rawKind === 'json' ? rawKind : null;
        if (messageSchemaId === null || !Number.isFinite(messageSchemaId)) {
          unknown.push(message);
          return;
        }
        const found = await input.registry.getById(messageSchemaId);
        if (!found) {
          unknown.push(message);
          return;
        }
        collected.push({
          topic: message.topic,
          partition: message.partition,
          offset: message.offset,
          readerSchemaId: input.readerSchema.id,
          messageSchemaId,
          messageSchemaKind,
          value: message.value as TValue,
        });
      },
    });
    return collected;
  }

  return {
    connect: () => consumer.connect(),
    disconnect: () => consumer.disconnect(),
    subscribe,
    consume,
    unknownSchemaMessages: () => [...unknown],
  };
}
