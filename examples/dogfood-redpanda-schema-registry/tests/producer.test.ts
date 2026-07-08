import { createRedpandaMock } from '@kiwa/streaming';
import { afterEach, describe, expect, it } from 'vitest';
import { createProducerRun } from '../src/producer/index.js';
import {
  USER_V1_SCHEMA_STRING,
  USER_V2_BREAK_SCHEMA_STRING,
} from '../src/schemas/index.js';

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

describe('producer — schema register + fail-fast on incompatible', () => {
  it('T-DRP-001 publish registers the schema and stamps schema id in headers', async () => {
    const mock = makeMock();
    const admin = mock.admin();
    await admin.connect();
    await admin.createTopics({ topics: [{ topic: 'users', numPartitions: 1 }] });
    await admin.disconnect();
    const producer = createProducerRun({ kafka: mock, registry: mock.schemaRegistry });
    await producer.connect();
    const result = await producer.publish({
      topic: 'users',
      payload: { id: 'u-1', displayName: 'A', region: 'us' },
      schema: USER_V1_SCHEMA_STRING,
      kind: 'avro',
    });
    await producer.disconnect();
    expect(result.topic).toBe('users');
    const messages = mock.getTopicMessages('users');
    expect(messages).toHaveLength(1);
    expect(messages[0]?.headers['x-schema-id']).toBe('1');
    expect(messages[0]?.headers['x-schema-kind']).toBe('avro');
  });

  it('T-DRP-002 fail-fast rejects publish when schema is incompatible with subject', async () => {
    const mock = makeMock();
    const admin = mock.admin();
    await admin.connect();
    await admin.createTopics({ topics: [{ topic: 'users', numPartitions: 1 }] });
    await admin.disconnect();
    const producer = createProducerRun({ kafka: mock, registry: mock.schemaRegistry });
    await producer.connect();
    // Prime the subject with v1.
    await producer.publish({
      topic: 'users',
      payload: { id: 'u-1', displayName: 'A', region: 'us' },
      schema: USER_V1_SCHEMA_STRING,
      kind: 'avro',
    });
    // Try to publish with the BREAK variant — BACKWARD rejects.
    await expect(
      producer.publish({
        topic: 'users',
        payload: { id: 'u-2', displayName: 'B', region: 'eu' },
        schema: USER_V2_BREAK_SCHEMA_STRING,
        kind: 'avro',
      }),
    ).rejects.toThrow(/compatibility/);
    await producer.disconnect();
    const rejections = producer.compatibilityRejections();
    expect(rejections).toHaveLength(1);
    expect(rejections[0]?.topic).toBe('users');
  });

  it('T-DRP-003 publish reuses the schema id when the same schema is registered twice', async () => {
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
    await producer.publish({
      topic: 'users',
      payload: { id: 'u-2', displayName: 'B', region: 'us' },
      schema: USER_V1_SCHEMA_STRING,
      kind: 'avro',
    });
    await producer.disconnect();
    const messages = mock.getTopicMessages('users');
    expect(messages).toHaveLength(2);
    expect(messages[0]?.headers['x-schema-id']).toBe('1');
    expect(messages[1]?.headers['x-schema-id']).toBe('1');
  });
});
