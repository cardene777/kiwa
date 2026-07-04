# @kiwa-test/streaming

Kafka + Redpanda + NATS unified streaming test adapter for [kiwa](https://github.com/cardene777/kiwa) — model event streaming systems (kafkajs / Redpanda schema-registry / nats.js JetStream) in Vitest without a real broker.

```bash
pnpm add -D @kiwa-test/streaming
```

## Why

Event streaming testing has been fragmented across providers — Kafka uses `kafkajs` producer / consumer / admin, Redpanda ships a bundled schema registry, and NATS uses subject-based routing + JetStream + KV / Object Store. `@kiwa-test/streaming` gives you a single mock surface that covers all three provider shapes + the 5 core semantics (producer / consumer / exactly-once / DLQ / schema-registry) so tests can validate the event pipeline end-to-end without spinning up a real broker.

## 3 providers

- **Kafka** — kafkajs API shape (producer / consumer / admin + partition assigners + offset commit)
- **Redpanda** — Kafka API compat + bundled schema-registry
- **NATS** — subject-based routing + JetStream + KV + Object Store

## 5 semantics

- **producer** — publish + partition key + batch send
- **consumer** — subscribe + consumer group + offset commit + rebalance
- **exactly-once** — idempotent producer (dedup by sequence) + transactional producer (begin / commit / abort)
- **DLQ** — retry policy + poison message quarantine
- **schema-registry** — Avro / Protobuf / JSON schema + compatibility check + subject naming

## Quick start

### Kafka producer + consumer

```ts
import { describe, expect, it } from 'vitest';
import { createKafkaMock } from '@kiwa-test/streaming';

it('kafka producer + consumer roundtrip', async () => {
  const kafka = createKafkaMock({ defaultPartitionCount: 3 });
  const producer = kafka.producer();
  await producer.connect();
  await producer.send({
    topic: 'orders',
    messages: [{ key: 'user-1', value: { total: 42 } }],
  });

  const consumer = kafka.consumer({ groupId: 'processor' });
  await consumer.connect();
  await consumer.subscribe({ topics: ['orders'], fromBeginning: true });
  const seen: unknown[] = [];
  await consumer.run({
    eachMessage: async (m) => {
      seen.push(m.value);
    },
  });
  expect(seen).toEqual([{ total: 42 }]);
  expect(kafka.getCommittedOffset('processor', 'orders', consumer.assignments().get('orders')?.[0] ?? 0)).toBeDefined();
});
```

### Redpanda + schema registry

```ts
import { expect, it } from 'vitest';
import { createRedpandaMock } from '@kiwa-test/streaming';

it('redpanda + schema-registry evolution', async () => {
  const rp = createRedpandaMock({ schemaRegistry: { defaultCompatibility: 'BACKWARD' } });
  await rp.schemaRegistry.register({
    subject: 'orders-value',
    kind: 'avro',
    schema: '{"type":"record","fields":[{"name":"id","default":0}]}',
  });
  const check = rp.schemaRegistry.checkCompatibility({
    subject: 'orders-value',
    kind: 'avro',
    schema: '{"type":"record","fields":[{"name":"id","default":0},{"name":"name","default":""}]}',
  });
  expect(check.compatible).toBe(true);
});
```

### NATS JetStream + KV

```ts
import { expect, it } from 'vitest';
import { createNatsMock } from '@kiwa-test/streaming';

it('nats jetstream + kv', async () => {
  const nats = createNatsMock();
  const js = nats.jetstream();
  await js.addStream({ name: 'ORDERS', subjects: ['orders.>'] });
  await js.publish('orders.created', { id: 1 });
  const consumer = await js.consumer('ORDERS', { durable: 'processor' });
  const batch = await consumer.fetch(10);
  expect(batch).toHaveLength(1);

  const kv = nats.kv('sessions');
  await kv.put('user-1', { name: 'alice' });
  const entry = await kv.get<{ name: string }>('user-1');
  expect(entry?.value.name).toBe('alice');
});
```

### Exactly-once (transactional producer)

```ts
import { expect, it } from 'vitest';
import {
  createKafkaMock,
  createTransactionalProducer,
} from '@kiwa-test/streaming';

it('transactional producer commit flushes atomically', async () => {
  const kafka = createKafkaMock();
  const p = createTransactionalProducer({ kafka, transactionalId: 'tx-1' });
  await p.connect();
  await p.initTransactions();
  await p.beginTransaction();
  await p.send({ topic: 'orders', messages: [{ value: 'a' }, { value: 'b' }] });
  // Pre-commit — nothing is visible yet.
  expect(kafka.getTopicMessages('orders')).toHaveLength(0);
  await p.commitTransaction();
  expect(kafka.getTopicMessages('orders')).toHaveLength(2);
});
```

### DLQ (poison message quarantine)

```ts
import { expect, it } from 'vitest';
import { createDeadLetterQueue } from '@kiwa-test/streaming';

it('poison message hits DLQ after budget exhausted', async () => {
  const dlq = createDeadLetterQueue<{ id: number }>({
    topic: 'orders',
    handler: async () => { throw new Error('unprocessable'); },
    retryPolicy: { maxAttempts: 3 },
  });
  const result = await dlq.handle({
    topic: 'orders', partition: 0, offset: 0, timestamp: 0,
    key: null, value: { id: 42 }, headers: {},
  });
  expect(result).toBe('quarantined');
  expect(dlq.quarantined()).toHaveLength(1);
  expect(dlq.deadLetterTopic).toBe('orders.dlq');
});
```

## API

Public API surface exported from `@kiwa-test/streaming`:

- `createKafkaMock(config?)` — Kafka producer / consumer / admin
- `createRedpandaMock(config?)` — Redpanda (Kafka API compat + `.schemaRegistry`)
- `createNatsMock(config?)` — NATS pub/sub + `.jetstream()` + `.kv(bucket)` + `.objectStore(bucket)`
- `createIdempotentProducer({ kafka })` — dedup by sequence number
- `createTransactionalProducer({ kafka, transactionalId })` — begin / commit / abort
- `createReadCommittedFilter(level?)` — read-committed isolation filter
- `createDeadLetterQueue({ topic, handler, retryPolicy })` — retry + quarantine
- `createSchemaRegistry(config?)` — Avro / Protobuf / JSON registration + compat check
- Type guards: `isKafkaMock` / `isRedpandaMock` / `isNatsMock` / `isDeadLetterQueue` / `isSchemaRegistry` / `isIdempotentProducer` / `isTransactionalProducer`

## Scope (v0.1)

In scope:
- Kafka producer / consumer / admin surface (kafkajs shape)
- Consumer groups + partition assignment (range + round-robin)
- Offset commit + seek + auto-commit
- Redpanda = Kafka + colocated schema registry
- NATS pub/sub + `*` / `>` wildcard subject routing
- NATS JetStream persistent streams + consumers + filter subjects
- NATS KV / Object Store
- Idempotent + transactional producers (Kafka-side)
- Retry policy + DLQ quarantine
- Schema registry with Avro / Protobuf / JSON + BACKWARD / FULL / NONE compat modes

Out of scope on purpose:
- Real TCP wire protocol / SSL / SASL
- Real Kafka coordinator election (single-broker semantics)
- Kafka Streams / KSQL
- Full Avro / Protobuf semantic parsing (compat is structural)
- Real NATS clustering / gateway routing
