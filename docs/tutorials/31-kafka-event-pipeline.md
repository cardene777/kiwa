# Kafka event pipeline — producer + consumer group + exactly-once + DLQ in 12 min

## What you'll build

A vitest suite for a Kafka-shaped event pipeline that exercises the four v1.20 primitives — `createKafkaMock` for the broker, a transactional producer for atomic multi-record writes, a consumer group that walks the round-robin partition assigner, and a dead-letter queue that quarantines poison messages after retries exhaust. The tests never boot a real Kafka broker; they drive the producer / consumer / admin surfaces through `@kiwa/streaming` v0.1's kafkajs-shaped stubs so the same suite runs in Node.js without Docker, Zookeeper, or a Redpanda binary.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn — the tutorial uses pnpm)
- An empty directory to work in

## Step-by-step build

```bash
mkdir kiwa-kafka-first && cd kiwa-kafka-first
pnpm init
pnpm add -D @kiwa/streaming@0.1 vitest typescript @types/node
```

Add the vitest script and TypeScript configuration in `package.json`.

```json
{
  "type": "module",
  "scripts": {
    "test": "vitest run"
  }
}
```

Ship a `tsconfig.json` that matches the ESM shape `@kiwa/streaming` exports.

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["node", "vitest/globals"]
  },
  "include": ["src/**/*", "tests/**/*"]
}
```

Add the pipeline test at `tests/pipeline.test.ts`. The four sections walk exactly the shape Kafka teams hit — a keyed producer that hashes to a stable partition, a consumer group where round-robin distributes partitions across two workers, a transactional producer that commits atomically, and a DLQ that quarantines a poison message after retries.

```ts
import { describe, expect, it } from 'vitest';
import {
  createKafkaMock,
  createTransactionalProducer,
  createDeadLetterQueue,
  isKafkaMock,
  isTransactionalProducer,
} from '@kiwa/streaming';

describe('producer + consumer roundtrip', () => {
  it('produces + consumes a message on the same topic', async () => {
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

  it('keyed messages hash to a stable partition (partition affinity)', async () => {
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

describe('consumer group + round-robin assignment', () => {
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

describe('exactly-once — transactional producer', () => {
  it('commit flushes pending records atomically; abort discards them', async () => {
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

describe('DLQ — poison message quarantine', () => {
  it('quarantines after maxAttempts retries exhaust', async () => {
    let calls = 0;
    const dlq = createDeadLetterQueue<{ id: number }>({
      topic: 'orders',
      handler: async () => {
        calls += 1;
        throw new Error('processing failed');
      },
      retryPolicy: { maxAttempts: 3 },
    });
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
```

## Run

```bash
pnpm test
```

Vitest picks up the file, runs the 5 tests in a single Node.js process, and exits green in under a second. No Docker, no Zookeeper, no Kafka JVM — `createKafkaMock` / `createTransactionalProducer` / `createDeadLetterQueue` deliver the observable contract a real Kafka broker enforces, without the boot cost.

## Why event pipelines need their own testing contract

Kafka diverges from HTTP request/response on four axes that show up in every non-trivial pipeline test — partition affinity, consumer group rebalance, exactly-once atomic commit, and DLQ quarantine. HTTP tests capture the request shape and the response body; Kafka tests capture the **flow of records across partitions over time**.

`@kiwa/streaming` records each of the four axes.

- **Partition affinity** — `producer.send({ messages: [{ key, value }] })` hashes the key to a partition. Two writes with the same key always land on the same partition. `result[0].partition` surfaces the choice for the assertion `expect(first.partition).toBe(second.partition)`.
- **Consumer group rebalance** — `kafka.consumer({ groupId, partitionAssigner })` supports `range` (single owner gets all partitions) and `round-robin` (partitions split across group members). `consumer.assignments()` returns the current owned partition set — the assertion becomes `expect(a1.length + a2.length).toBe(numPartitions)`.
- **Transactional atomicity** — `createTransactionalProducer({ kafka, transactionalId })` gates the broker view. Pre-commit, `kafka.getTopicMessages(topic)` returns `[]`. Post-commit, all records flip visible atomically. Pre-abort, the same broker view remains `[]` and stays that way after `abortTransaction()`.
- **DLQ quarantine** — `createDeadLetterQueue({ topic, handler, retryPolicy })` walks the retry loop, and on exhaustion appends the message to the quarantine array with `attempts` / `reason` / `original` metadata. The assertion becomes `expect(dlq.quarantined()).toHaveLength(1)`.

Three properties are load-bearing.

- **Partition ordering is per-partition, not global.** `kafka.getTopicMessages(topic)` returns partition-0 messages before partition-1 messages regardless of write order — the assertion asserts on partition ownership, not on cross-partition timeline.
- **Round-robin assignment is deterministic within a group.** Two consumers join, the assigner splits partitions 0+2 to c1 and 1+3 to c2 (4-partition topic). A test can assert on the exact split without waiting for a real coordinator to elect an assigner.
- **DLQ `onDeadLetter` callback fires with the quarantined entry.** For alerting integrations, the callback receives the whole quarantine record so a test can drive PagerDuty / Slack / Sentry mocks off the same `entry.original.value` shape.

## What the pipeline cuts down

Real Kafka boots a broker JVM (~2 GB RAM, ~15 s cold start), a Zookeeper coordinator (~500 MB), and each test seeds a `docker-compose up -d` cycle. Even Redpanda (single-binary Kafka API alternative) needs a 200 MB binary + a topic-create bootstrap. The mock cuts all four costs — 0 processes, 0 network, ~1 ms per test.

That matters because production bugs show up as "the consumer group did not rebalance when a worker joined" or "the transactional commit did not flush because `initTransactions()` was skipped". The mock records both transitions, so the assertion is `expect(consumer.assignments().get(topic).length).toBe(expectedCount)` or `expect(p.currentState()).toBe('committed')` — machine-checkable, no Docker.

For a full 5-op fidelity harness that compares mock traces against a real `docker compose up -d` cluster, see `examples/dogfood-kafka-event-pipeline` and its `quality-report/fidelity-latest.md`.

```ts
import { createKafkaMock, createIdempotentProducer } from '@kiwa/streaming';

const kafka = createKafkaMock();
const producer = createIdempotentProducer({ kafka });
await producer.connect();
// First send with sequence 42 lands on the broker.
await producer.send({ topic: 't', messages: [{ value: 'a' }] }, 42);
// Second send with the SAME sequence 42 dedups — no duplicate on the broker.
const dup = await producer.send({ topic: 't', messages: [{ value: 'a-dup' }] }, 42);
expect(dup).toEqual([]);
expect(kafka.getTopicMessages('t')).toHaveLength(1);
expect(producer.isDuplicate(42)).toBe(true);
```

`createIdempotentProducer` dedups on the sequence number so a retried publish never lands twice — the assertion becomes `expect(kafka.getTopicMessages(topic)).toHaveLength(1)` even after a second send with the same sequence.

## Related

- Concept doc — [Streaming testing (producer / consumer / exactly-once / DLQ / schema-registry SSOT)](../concepts/streaming-testing)
- v1.20-1 [#827](https://github.com/cardene777/kiwa/issues/827) — `@kiwa/streaming` v0.1 landing
- v1.20-2 [#828](https://github.com/cardene777/kiwa/issues/828) — `dogfood-kafka-event-pipeline` (the full 3-layer dogfood this tutorial cuts down)
