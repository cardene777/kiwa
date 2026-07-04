/**
 * v1.20-5 docs 補強 (Issue #831) — tutorial 31-33 code snippet 検証。
 *
 * `docs/tutorials/31-kafka-event-pipeline.md` /
 * `docs/tutorials/32-redpanda-schema-registry.md` /
 * `docs/tutorials/33-nats-jetstream.md` に載っている
 * code snippet が実際に動作することを behavior test で担保する。
 *
 * tutorial の code snippet が drift すると読者が「動かない」 体験をする
 * ため、 snippet と実 API の乖離を CI で検知する。
 */
import { describe, expect, it } from 'vitest';
import {
  createKafkaMock,
  createTransactionalProducer,
  createIdempotentProducer,
  createDeadLetterQueue,
  createRedpandaMock,
  createNatsMock,
  isKafkaMock,
  isRedpandaMock,
  isNatsMock,
  isSchemaRegistry,
  isTransactionalProducer,
  isDeadLetterQueue,
  type StreamingMessage,
} from '../src/index.js';

describe('tutorial 31 — Kafka producer + consumer roundtrip', () => {
  it('produces + consumes a message on the same topic (tutorial: 1st snippet)', async () => {
    const kafka = createKafkaMock();
    expect(isKafkaMock(kafka)).toBe(true);

    const producer = kafka.producer();
    await producer.connect();
    await producer.send({ topic: 'orders', messages: [{ value: 'hello' }] });

    const consumer = kafka.consumer({ groupId: 'g1' });
    await consumer.connect();
    await consumer.subscribe({ topics: ['orders'], fromBeginning: true });
    const seen: unknown[] = [];
    await consumer.run({ eachMessage: async (m) => { seen.push(m.value); } });
    expect(seen).toEqual(['hello']);
  });

  it('keyed messages hash to a stable partition (tutorial: partition affinity)', async () => {
    const kafka = createKafkaMock({ defaultPartitionCount: 4 });
    const producer = kafka.producer();
    await producer.connect();
    const first = await producer.send({
      topic: 'orders',
      messages: [{ key: 'user-42', value: 1 }],
    });
    const second = await producer.send({
      topic: 'orders',
      messages: [{ key: 'user-42', value: 2 }],
    });
    expect(first[0]?.partition).toBe(second[0]?.partition);
  });
});

describe('tutorial 31 — consumer group + round-robin assignment', () => {
  it('two consumers in the same group split 4 partitions 2 + 2', async () => {
    const kafka = createKafkaMock({ defaultPartitionCount: 4 });
    const producer = kafka.producer();
    await producer.connect();
    await producer.send({ topic: 'orders', messages: [{ value: 'seed' }] });

    const c1 = kafka.consumer({ groupId: 'workers', partitionAssigner: 'round-robin' });
    const c2 = kafka.consumer({ groupId: 'workers', partitionAssigner: 'round-robin' });
    await c1.connect();
    await c2.connect();
    await c1.subscribe({ topics: ['orders'] });
    await c2.subscribe({ topics: ['orders'] });

    const a1 = c1.assignments().get('orders') ?? [];
    const a2 = c2.assignments().get('orders') ?? [];
    expect(a1.length + a2.length).toBe(4);
    expect(a1.length).toBe(2);
  });
});

describe('tutorial 31 — transactional producer commit / abort', () => {
  it('commit flushes pending records atomically (tutorial: 4th snippet)', async () => {
    const kafka = createKafkaMock();
    const p = createTransactionalProducer({ kafka, transactionalId: 'tx-1' });
    expect(isTransactionalProducer(p)).toBe(true);
    await p.connect();
    await p.initTransactions();
    await p.beginTransaction();
    await p.send({ topic: 'orders', messages: [{ value: 'a' }] });
    await p.send({ topic: 'orders', messages: [{ value: 'b' }] });
    // Pre-commit: no messages are visible on the broker.
    expect(kafka.getTopicMessages('orders')).toHaveLength(0);
    await p.commitTransaction();
    expect(kafka.getTopicMessages('orders').map((m) => m.value)).toEqual(['a', 'b']);
    expect(p.currentState()).toBe('committed');
  });
});

describe('tutorial 31 — DLQ quarantine after maxAttempts', () => {
  it('quarantines after 3 attempts exhaust with the correct reason (tutorial: 5th snippet)', async () => {
    let calls = 0;
    const dlq = createDeadLetterQueue<{ id: number }>({
      topic: 'orders',
      handler: async () => {
        calls += 1;
        throw new Error('processing failed');
      },
      retryPolicy: { maxAttempts: 3 },
    });
    expect(isDeadLetterQueue(dlq)).toBe(true);
    const result = await dlq.handle({
      topic: 'orders',
      partition: 0,
      offset: 0,
      timestamp: 0,
      key: null,
      value: { id: 42 },
      headers: {},
    });
    expect(result).toBe('quarantined');
    expect(calls).toBe(3);
    const entries = dlq.quarantined();
    expect(entries).toHaveLength(1);
    expect(entries[0]?.reason).toBe('processing failed');
    expect(dlq.deadLetterTopic).toBe('orders.dlq');
  });
});

describe('tutorial 31 — idempotent producer dedup on sequence', () => {
  it('duplicate sequence number returns empty result and does not duplicate on broker', async () => {
    const kafka = createKafkaMock();
    const producer = createIdempotentProducer({ kafka });
    await producer.connect();
    await producer.send({ topic: 't', messages: [{ value: 'a' }] }, 42);
    const dup = await producer.send({ topic: 't', messages: [{ value: 'a-dup' }] }, 42);
    expect(dup).toEqual([]);
    expect(kafka.getTopicMessages('t')).toHaveLength(1);
    expect(producer.isDuplicate(42)).toBe(true);
  });
});

describe('tutorial 32 — Redpanda is a Kafka mock (API compat)', () => {
  it('exposes producer / consumer / admin via the Kafka surface (tutorial: 1st snippet)', async () => {
    const rp = createRedpandaMock();
    expect(isRedpandaMock(rp)).toBe(true);
    expect(isKafkaMock(rp)).toBe(true);

    const producer = rp.producer();
    await producer.connect();
    await producer.send({ topic: 'events', messages: [{ value: 'ping' }] });

    const consumer = rp.consumer({ groupId: 'g1' });
    await consumer.connect();
    await consumer.subscribe({ topics: ['events'], fromBeginning: true });
    const seen: unknown[] = [];
    await consumer.run({ eachMessage: async (m) => { seen.push(m.value); } });
    expect(seen).toEqual(['ping']);
  });
});

describe('tutorial 32 — schema registry Avro registration', () => {
  it('accepts the first Avro schema and returns id 1 / version 1', async () => {
    const rp = createRedpandaMock();
    expect(isSchemaRegistry(rp.schemaRegistry)).toBe(true);
    const entry = await rp.schemaRegistry.register({
      subject: 'events-value',
      kind: 'avro',
      schema: '{"type":"record","name":"E","fields":[{"name":"id","default":0}]}',
    });
    expect(entry.id).toBe(1);
    expect(entry.version).toBe(1);
  });

  it('registers a duplicate schema without incrementing the version', async () => {
    const rp = createRedpandaMock();
    const first = await rp.schemaRegistry.register({
      subject: 's',
      kind: 'json',
      schema: '{"type":"object"}',
    });
    const second = await rp.schemaRegistry.register({
      subject: 's',
      kind: 'json',
      schema: '{"type":"object"}',
    });
    expect(second.id).toBe(first.id);
    expect(second.version).toBe(first.version);
  });
});

describe('tutorial 32 — BACKWARD compatibility on optional field addition', () => {
  it('adding optional field with default is BACKWARD-compatible (tutorial: 3rd snippet)', async () => {
    const rp = createRedpandaMock();
    await rp.schemaRegistry.register({
      subject: 'events-value',
      kind: 'avro',
      schema: '{"type":"record","name":"E","fields":[{"name":"id","default":0}]}',
    });
    const evolved = await rp.schemaRegistry.register({
      subject: 'events-value',
      kind: 'avro',
      schema:
        '{"type":"record","name":"E","fields":[{"name":"id","default":0},{"name":"name","default":""}]}',
    });
    expect(evolved.version).toBe(2);
    const versions = await rp.schemaRegistry.listVersions('events-value');
    expect(versions.map((v) => v.version)).toEqual([1, 2]);
  });
});

describe('tutorial 32 — configurable compatibility mode', () => {
  it('defaults to the configured mode and setCompatibility overrides per-subject', async () => {
    const rp = createRedpandaMock({
      schemaRegistry: { defaultCompatibility: 'FULL' },
    });
    expect(rp.schemaRegistry.getCompatibility('any-subject')).toBe('FULL');
    await rp.schemaRegistry.setCompatibility('events-value', 'FORWARD');
    expect(rp.schemaRegistry.getCompatibility('events-value')).toBe('FORWARD');
  });

  it('fail-fast publish via checkCompatibility catches BACKWARD violation', async () => {
    const rp = createRedpandaMock();
    await rp.schemaRegistry.register({
      subject: 'orders-value',
      kind: 'avro',
      schema: '{"type":"record","name":"Order","fields":[{"name":"id","default":0}]}',
    });
    const check = rp.schemaRegistry.checkCompatibility({
      subject: 'orders-value',
      kind: 'avro',
      schema:
        '{"type":"record","name":"Order","fields":[{"name":"id","default":0},{"name":"amount"}]}',
    });
    // `amount` has no default → BACKWARD compat fails.
    expect(check.compatible).toBe(false);
    expect(check.reasons.length).toBeGreaterThan(0);
  });
});

describe('tutorial 33 — NATS core pub/sub with subject wildcards', () => {
  it('literal subject reaches the matching subscriber (tutorial: 1st snippet)', async () => {
    const nats = createNatsMock();
    expect(isNatsMock(nats)).toBe(true);
    const seen: unknown[] = [];
    nats.subscribe('orders.created', (m) => { seen.push(m.value); });
    await nats.publish('orders.created', { id: 1 });
    expect(seen).toEqual([{ id: 1 }]);
  });

  it('single-token wildcard `*` matches one segment only', async () => {
    const nats = createNatsMock();
    const seen: string[] = [];
    nats.subscribe('orders.*.created', (m) => { seen.push(m.topic); });
    await nats.publish('orders.user-1.created', {});
    await nats.publish('orders.user-2.created', {});
    await nats.publish('orders.user-1.deep.created', {});
    expect(seen).toEqual(['orders.user-1.created', 'orders.user-2.created']);
  });

  it('trailing wildcard `>` catches all remaining tokens', async () => {
    const nats = createNatsMock();
    const seen: string[] = [];
    nats.subscribe('orders.>', (m) => { seen.push(m.topic); });
    await nats.publish('orders.a', {});
    await nats.publish('orders.a.b.c', {});
    expect(seen).toEqual(['orders.a', 'orders.a.b.c']);
  });
});

describe('tutorial 33 — JetStream persistent stream + consumer + ack', () => {
  it('addStream + publish + consumer.fetch delivers persistent messages (tutorial: 4th snippet)', async () => {
    const nats = createNatsMock();
    const js = nats.jetstream();
    await js.addStream({ name: 'ORDERS', subjects: ['orders.>'] });
    await js.publish('orders.created', { id: 1 });
    await js.publish('orders.updated', { id: 2 });
    const consumer = await js.consumer('ORDERS', { durable: 'processor' });
    const batch = await consumer.fetch(10);
    expect(batch).toHaveLength(2);
    expect(batch[0]?.value).toEqual({ id: 1 });
  });

  it('ack advances the consumer ackFloor', async () => {
    const nats = createNatsMock();
    const js = nats.jetstream();
    await js.addStream({ name: 'S', subjects: ['s.>'] });
    await js.publish('s.a', 1);
    const consumer = await js.consumer('S', { durable: 'c1' });
    const batch = await consumer.fetch(1);
    for (const m of batch) consumer.ack(m);
    expect(consumer.info().ackFloor).toBe(1);
  });

  it('filterSubject scopes consumer.fetch to matching subject', async () => {
    const nats = createNatsMock();
    const js = nats.jetstream();
    await js.addStream({ name: 'S', subjects: ['s.>'] });
    await js.publish('s.a', 1);
    await js.publish('s.b', 2);
    const consumer = await js.consumer('S', { durable: 'c1', filterSubject: 's.a' });
    const batch = await consumer.fetch(10);
    expect(batch.map((m) => m.value)).toEqual([1]);
  });
});

describe('tutorial 33 — KV store put / get / delete', () => {
  it('put + get returns the stored value with revision 1', async () => {
    const nats = createNatsMock();
    const kv = nats.kv('sessions');
    const rev = await kv.put('user-1', { name: 'alice' });
    expect(rev).toBe(1);
    const entry = await kv.get<{ name: string }>('user-1');
    expect(entry?.value.name).toBe('alice');
    expect(entry?.revision).toBe(1);
  });

  it('delete removes the key from the store', async () => {
    const nats = createNatsMock();
    const kv = nats.kv('sessions');
    await kv.put('user-1', 'x');
    await kv.delete('user-1');
    expect(await kv.get('user-1')).toBeNull();
  });
});

describe('tutorial 33 — Object store byte roundtrip', () => {
  it('put + get preserves bytes and reports size', async () => {
    const nats = createNatsMock();
    const store = nats.objectStore('files');
    await store.put('greeting.txt', 'hello');
    const entry = await store.get('greeting.txt');
    expect(new TextDecoder().decode(entry?.data ?? new Uint8Array())).toBe('hello');
    expect(entry?.info.size).toBe(5);
  });
});

describe('tutorial 33 — request/reply via _INBOX', () => {
  it('request resolves via a temporary inbox subject', async () => {
    const nats = createNatsMock();
    nats.subscribe('rpc.echo', async (m: StreamingMessage) => {
      const replyTo = m.headers['reply-to'];
      if (replyTo) await nats.publish(replyTo, m.value);
    });
    const reply = await nats.request('rpc.echo', 42);
    expect(reply.value).toBe(42);
  });
});
