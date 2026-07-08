import { createRedpandaMock } from '@kiwa/streaming';
import { afterEach, describe, expect, it } from 'vitest';
import { createConsumerRun } from '../src/consumer/index.js';
import { createProducerRun } from '../src/producer/index.js';
import { USER_V1_SCHEMA_STRING, USER_V2_SCHEMA_STRING } from '../src/schemas/index.js';

let rp: ReturnType<typeof createRedpandaMock> | null = null;

afterEach(() => {
  rp?.reset();
  rp = null;
});

function makeMock() {
  rp = createRedpandaMock({
    schemaRegistry: { defaultCompatibility: 'BACKWARD', subjectNamingStrategy: 'topic-name' },
  });
  return rp;
}

describe('consumer — schema fetch by id + evolution handling', () => {
  it('T-DRC-001 consumer fetches message schema by id and delivers payload', async () => {
    const mock = makeMock();
    const admin = mock.admin();
    await admin.connect();
    await admin.createTopics({ topics: [{ topic: 'users', numPartitions: 1 }] });
    await admin.disconnect();
    const producer = createProducerRun({ kafka: mock, registry: mock.schemaRegistry });
    await producer.connect();
    await producer.publish({
      topic: 'users',
      payload: { id: 'u-1', displayName: 'A', region: 'us' },
      schema: USER_V1_SCHEMA_STRING,
      kind: 'avro',
    });
    await producer.disconnect();
    const readerSchema = await mock.schemaRegistry.getLatestVersion('users-value');
    expect(readerSchema).toBeDefined();
    const consumer = createConsumerRun({
      kafka: mock,
      registry: mock.schemaRegistry,
      readerTopic: 'users',
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      readerSchema: readerSchema!,
    });
    await consumer.connect();
    await consumer.subscribe(['users']);
    const messages = await consumer.consume();
    await consumer.disconnect();
    expect(messages).toHaveLength(1);
    expect(messages[0]?.messageSchemaId).toBe(1);
    expect(messages[0]?.readerSchemaId).toBe(1);
    expect(messages[0]?.messageSchemaKind).toBe('avro');
  });

  it('T-DRC-002 v1 reader consuming v2 message records both schema ids', async () => {
    const mock = makeMock();
    const admin = mock.admin();
    await admin.connect();
    await admin.createTopics({ topics: [{ topic: 'users-evo', numPartitions: 1 }] });
    await admin.disconnect();
    const producer = createProducerRun({ kafka: mock, registry: mock.schemaRegistry });
    await producer.connect();
    // Publish 1 record against v1.
    await producer.publish({
      topic: 'users-evo',
      payload: { id: 'u-1', displayName: 'A', region: 'us' },
      schema: USER_V1_SCHEMA_STRING,
      kind: 'avro',
    });
    const v1 = await mock.schemaRegistry.getLatestVersion('users-evo-value');
    expect(v1).toBeDefined();
    // Publish 1 record against v2 (BACKWARD-compatible evolution).
    await producer.publish({
      topic: 'users-evo',
      payload: { id: 'u-2', displayName: 'B', region: 'eu', email: 'b@example.com' },
      schema: USER_V2_SCHEMA_STRING,
      kind: 'avro',
    });
    await producer.disconnect();
    const consumer = createConsumerRun({
      kafka: mock,
      registry: mock.schemaRegistry,
      readerTopic: 'users-evo',
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      readerSchema: v1!,
    });
    await consumer.connect();
    await consumer.subscribe(['users-evo']);
    const messages = await consumer.consume();
    await consumer.disconnect();
    expect(messages).toHaveLength(2);
    // First message = v1 = messageSchemaId matches reader.
    expect(messages[0]?.messageSchemaId).toBe(v1?.id);
    // Second message = v2 = different id from reader.
    expect(messages[1]?.messageSchemaId).not.toBe(v1?.id);
    expect(messages[1]?.readerSchemaId).toBe(v1?.id);
  });

  it('T-DRC-003 messages without schema id land in unknownSchemaMessages', async () => {
    const mock = makeMock();
    const admin = mock.admin();
    await admin.connect();
    await admin.createTopics({ topics: [{ topic: 'raw', numPartitions: 1 }] });
    await admin.disconnect();
    // Send a raw message directly, bypassing the schema-aware producer.
    const rawProducer = mock.producer();
    await rawProducer.connect();
    await rawProducer.send({
      topic: 'raw',
      messages: [{ value: { anything: true }, headers: {} }],
    });
    await rawProducer.disconnect();
    // Register a reader schema on a *different* subject so the consumer has
    // something to compare against.
    const readerSchema = await mock.schemaRegistry.register({
      subject: 'raw-value',
      kind: 'avro',
      schema: USER_V1_SCHEMA_STRING,
    });
    const consumer = createConsumerRun({
      kafka: mock,
      registry: mock.schemaRegistry,
      readerTopic: 'raw',
      readerSchema,
    });
    await consumer.connect();
    await consumer.subscribe(['raw']);
    const messages = await consumer.consume();
    await consumer.disconnect();
    expect(messages).toHaveLength(0);
    expect(consumer.unknownSchemaMessages()).toHaveLength(1);
  });
});
