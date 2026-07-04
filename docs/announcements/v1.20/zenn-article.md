---
title: "kiwa v1.20 released — Streaming 深化 (Kafka + Redpanda + NATS JetStream の 5 semantics 統一 mock)"
emoji: "🌊"
type: "tech"
topics: ["oss", "typescript", "kafka", "nats", "kiwa"]
published: true
---

# kiwa v1.20 released

v1.20 は kiwa の 10 milestone 目です。 v1.19 (Framework 深化 横軸、 3 modern web framework (SolidJS Signal-based fine-grained reactivity + Deno Fresh Islands architecture + HonoJS Cloudflare Workers + hc RPC type-safe client + middleware chain) を統一 test adapter として同時 land) の後、 v1.20 は 2026 の SaaS + data team が実運用で必要な **event-driven backbone testing 基盤 (Kafka (kafkajs-shaped producer / consumer / admin) + Redpanda (Kafka API 互換 broker + colocated schema registry) + NATS (core pub/sub + JetStream + KV / Object store)) を 1 統一 mock として同時 land** しました。 v1.13 realtime (時間軸 mock) の下層に位置する message-driven system の testing 基盤を SSOT 化、 producer / consumer / exactly-once / DLQ / schema-registry の 5 semantics を統一 API surface で扱えます。

v1.11 以降の連続完遂 9 milestone (release gate → 非決定性 → 時間軸 → 横軸拡張 → AI-LLM 深化 → component 縦軸 → Observability v2 → Blockchain 深化 → Framework 深化) を受けて、 v1.20 は event-driven system の縦軸 milestone、 kiwa runtime fixture は 33 → 34 に拡張します。

## 主な追加

### `@kiwa-test/streaming` v0.1.0 (new package)

3 provider (Kafka + Redpanda + NATS) を統一 mock 化した streaming test adapter。 broker binary + Docker + Zookeeper 不要 + 5 semantics 完全対応 + kafkajs / nats.js API 互換の 3 特徴。

```ts
import {
  createKafkaMock,
  createRedpandaMock,
  createNatsMock,
  createTransactionalProducer,
  createIdempotentProducer,
  createReadCommittedFilter,
  createDeadLetterQueue,
  createSchemaRegistry,
} from '@kiwa-test/streaming';

// 1. Kafka producer + consumer group (kafkajs-shaped)
const kafka = createKafkaMock({ defaultPartitionCount: 4 });
const producer = kafka.producer();
await producer.connect();
const result = await producer.send({
  topic: 'events',
  messages: [
    { key: 'user-1', value: 'clicked' },
    { key: 'user-2', value: 'purchased' },
  ],
});
// result[0].partition は hash('user-1') mod 4 で決まる deterministic 値
expect(result[0]).toHaveProperty('partition');
expect(result[0]).toHaveProperty('offset');

const consumer = kafka.consumer({ groupId: 'my-group', partitionAssigner: 'round-robin' });
await consumer.connect();
await consumer.subscribe({ topic: 'events' });
const messages: string[] = [];
await consumer.run({
  eachMessage: async ({ message }) => {
    messages.push(message.value.toString());
  },
  autoCommit: true,
});
expect(messages).toEqual(['clicked', 'purchased']);

// 2. Exactly-once (transactional + idempotent + read-committed)
const txProducer = createTransactionalProducer(kafka, { transactionalId: 'tx-1' });
await txProducer.initTransactions();
await txProducer.beginTransaction();
await txProducer.send({ topic: 'orders', messages: [{ key: 'o-1', value: 'created' }] });
await txProducer.send({ topic: 'inventory', messages: [{ key: 'i-1', value: 'decremented' }] });
await txProducer.commitTransaction();
// 2 record は atomic に commit、 abort なら両方 uncommitted

const rcConsumer = createReadCommittedFilter(kafka.consumer({ groupId: 'rc' }));
// rcConsumer は commit 済 transaction の record のみ返す

// 3. DLQ + retry policy
const dlq = createDeadLetterQueue(kafka, {
  sourceTopic: 'events',
  dlqTopic: 'events-dlq',
  maxRetries: 3,
  backoffExponent: 2, // 1s → 2s → 4s の exponential backoff
});
await dlq.processWithRetry(async (message) => {
  if (message.value === 'poison') throw new Error('poison');
  // normal processing
});
// poison message は 3 retry 失敗後 events-dlq topic に quarantine
const quarantined = await dlq.getQuarantined();
expect(quarantined).toHaveLength(1);
expect(quarantined[0].reason).toContain('poison');
```

`createKafkaMock({ defaultPartitionCount })` は kafkajs-shaped の broker + producer + consumer + admin trio を返し、 全 producer write は `{ topic, partition, offset }` を record (deterministic djb2 key-hash partitioner)、 `producer.send({ topic, messages })` の返す配列は message ごとの partition + offset を持つ (test 側で `expect(result[0].partition).toBe(0)` の直接 assert が可能)。 `consumer.run({ eachMessage, autoCommit })` は assign された partition を walk、 `commitOffsets(offsets[])` で explicit commit、 `getCommittedOffset(groupId, topic, partition)` で durable marker 参照。 `partitionAssigner: 'range'` は member 1 に全 partition を assign (最も単純)、 `'round-robin'` は 4 partition を 2 member に 2 + 2 で分散 (実運用 default)。 rebalance は member join/leave 時に deterministic に再計算。

`createTransactionalProducer(kafka, { transactionalId })` は multi-record atomic commit + abort semantics を提供、 `initTransactions()` + `beginTransaction()` + `send(...)` + `commitTransaction()` / `abortTransaction()` の kafkajs-shaped lifecycle 完全対応 (`beginTransaction()` 中の write は commit されるまで uncommitted、 abort なら全 write が捨てられる)。 `createIdempotentProducer(kafka, { producerId })` は per-partition sequence dedup を提供 (retry-safe な at-least-once producer)。 `createReadCommittedFilter(consumer)` は downstream の read から uncommitted / aborted transaction を filter — Kafka の isolation level READ_COMMITTED semantics を pure JS で再現。

`createDeadLetterQueue({ sourceTopic, dlqTopic, maxRetries, backoffExponent })` は retry policy + poison message quarantine + inspect + reprocess flow を任意 consumer に重ねる。 `processWithRetry(handler)` は handler が throw した際に `maxRetries` 回 exponential backoff で retry、 全 retry 失敗で DLQ topic に quarantine + `reason` + `attemptCount` metadata 付与、 `getQuarantined()` で inspect、 `reprocess(entryId)` で main topic 戻し。

### `@kiwa-test/streaming` v0.1.0 の Redpanda + schema registry

```ts
import { createRedpandaMock, createSchemaRegistry } from '@kiwa-test/streaming';

// 1. Redpanda broker (Kafka API 互換)
const redpanda = createRedpandaMock({ schemaRegistry: true });
const producer = redpanda.producer();
const consumer = redpanda.consumer({ groupId: 'g' });
// producer + consumer は Kafka の場合と同じ API surface

// 2. Colocated Schema Registry
const registry = redpanda.schemaRegistry;
const v1 = await registry.registerAvro('user-value', {
  type: 'record',
  name: 'User',
  fields: [{ name: 'id', type: 'int' }, { name: 'name', type: 'string' }],
});
expect(v1.version).toBe(1);

// 3. Schema evolution + compatibility check (BACKWARD)
const v2 = await registry.registerAvro('user-value', {
  type: 'record',
  name: 'User',
  fields: [
    { name: 'id', type: 'int' },
    { name: 'name', type: 'string' },
    { name: 'email', type: 'string', default: '' }, // 追加 field with default = BACKWARD compatible
  ],
});
expect(v2.version).toBe(2);
const check = await registry.checkCompatibility('user-value', v2.schema, { mode: 'BACKWARD' });
expect(check.compatible).toBe(true);

// 4. Fail-fast publish (schema id 不存在で throw)
await expect(
  producer.send({ topic: 'events', messages: [{ value: { id: 1 }, schemaId: 999 }] }),
).rejects.toThrow(/schema.*not.*found/i);
```

Redpanda mock は Kafka API 互換 broker + colocated `SchemaRegistry` の 2 layer を 1 constructor に統合 — Kafka 用 test をそのまま Redpanda に移せる + schema registry の下流 test を追加できる。 `registerAvro` / `registerProtobuf` / `registerJson` の 3 schema kind、 `checkCompatibility(subject, newSchema, { mode })` の 3 mode (`BACKWARD` (新 schema で古い data を read できるか、 追加 field with default は OK、 field 削除は fail) + `FORWARD` (古い schema で新 data を read できるか、 field 削除は OK、 追加 field は fail) + `FULL` (両方向 check、 最も厳しい))。 schema evolution version は 1 → 2 → 3 と自動 increment、 fail-fast publish は schema id が register 済でない状態で send を試みると即 throw (production の Confluent Schema Registry と同一 semantics)。

### `@kiwa-test/streaming` v0.1.0 の NATS + JetStream + KV + Object store

```ts
import { createNatsMock, compileSubject, matchSubject } from '@kiwa-test/streaming';

// 1. Core pub/sub + subject routing (* + >)
const nats = createNatsMock();
await nats.connect();
const received: string[] = [];
const sub = await nats.subscribe('events.*.user', (msg) => {
  received.push(msg.data);
});
await nats.publish('events.click.user', 'clicked');
await nats.publish('events.purchase.user', 'purchased');
await nats.publish('events.click.admin', 'ignored'); // subject mismatch = 受信しない
expect(received).toEqual(['clicked', 'purchased']);

// 2. Trailing multi-token wildcard (>)
const multi = await nats.subscribe('events.>', (msg) => { /* ... */ });
// 'events.click.user' + 'events.click.admin' + 'events.deep.nested.subject' 全部 match

// 3. compileSubject / matchSubject helper
expect(matchSubject('events.*.user', 'events.click.user')).toBe(true);
expect(() => compileSubject('events.>.user')).toThrow(/> must be last token/i);

// 4. JetStream persistent stream + consumer + ack
const js = nats.jetstream();
const stream = await js.addStream({ name: 'ORDERS', subjects: ['orders.>'] });
await js.publish('orders.new', 'order-1');
await js.publish('orders.paid', 'order-1');

const jsConsumer = await js.consume({ stream: 'ORDERS', durableName: 'billing' });
const msgs = await jsConsumer.fetch({ batch: 10 });
for (const msg of msgs) {
  await msg.ack();
}
expect(msgs).toHaveLength(2);

// 5. KV store + Object store (JetStream 上に構築)
const kv = await js.kv('session');
await kv.put('user-1', 'active');
const entry = await kv.get('user-1');
expect(entry.value).toBe('active');

const obj = await js.objectStore('avatars');
await obj.put('user-1.png', new Uint8Array([1, 2, 3]));
const info = await obj.info('user-1.png');
expect(info.size).toBe(3);
```

`createNatsMock()` は NATS の client-side API を再現 — `connect()` + `subscribe(subject, handler)` + `publish(subject, data, options?)` + `unsubscribe(subId)`。 subject routing は `*` (single-token wildcard、 `events.*.user` は `events.click.user` に match するが `events.click.admin.user` には match しない) + `>` (trailing multi-token wildcard、 `events.>` は `events.click.user` + `events.deep.nested.subject` 全部 match)。 `compileSubject(pattern)` は `>` が末尾以外にあると即 throw (production nats-server と同一 semantics)。 `matchSubject(pattern, actual)` は pure predicate。

`nats.jetstream()` は JetStream (persistent stream + at-least-once delivery + KV store + Object store の 4 primitive) の complete client を返す。 `addStream({ name, subjects })` は subject filter を持つ persistent stream 作成、 `js.publish(subject, data)` は stream に append (`{ sequence, stream }` を返す)、 `js.consume({ stream, durableName })` は durable consumer 作成、 `consumer.fetch({ batch })` で bulk read、 `msg.ack()` で ack (未 ack は redeliver 対象)。 `js.kv('bucket')` は JetStream 上の KV store (`put` / `get` / `delete` / `watch` / `history` + revision tracking)、 `js.objectStore('bucket')` は Object store (`put` / `get` / `info` / `delete` + chunk-based store + Uint8Array streaming)。 全 substrate は同 JetStream の persistence layer を共有。

## dogfood 3 app

- **`examples/dogfood-kafka-event-pipeline`** — Kafka producer + consumer group + exactly-once transactional producer + DLQ。 `makeMockAdapter` は `@kiwa-test/streaming` の `createKafkaMock` + `createTransactionalProducer` + `createDeadLetterQueue`、 `makeRealAdapter` は Kafka-like harness。 `KafkaFidelityReport` は 5 scenario (partitioner determinism (同 key は同 partition) / consumer group rebalance (member 1 → 2 join で partition 再配布) / offset commit + seek / transactional producer atomic commit (abort 時に全 write 破棄) / DLQ retry exhaustion + quarantine (poison message が 3 retry 後 dlq topic 移動)) の mock vs real 差分を出力。 7 軸 release gate PASS。
- **`examples/dogfood-redpanda-schema-registry`** — Redpanda + 3 Avro schema (v1 → v2 additive field / v2 → v3 breaking field type change / v3 → v4 default value drop) + BACKWARD / FORWARD / FULL compatibility check + fail-fast publish。 `RedpandaFidelityReport` は 5 op (schema register + fetch / evolution + version bump / compatibility gate pass (BACKWARD 通過) + fail (FORWARD 拒否) / fail-fast publish rejection / Kafka API round-trip on the same broker) を比較。 7 軸 release gate PASS。
- **`examples/dogfood-nats-jetstream`** — NATS core pub/sub + `*` / `>` wildcard routing + JetStream persistent stream + KV store + Object store。 `makeMockAdapter` は `@kiwa-test/streaming` の `createNatsMock` + `js.kv` + `js.objectStore`、 `makeRealAdapter` は minimal NATS-shaped runtime。 `NatsFidelityReport` は 5 scenario (core pub/sub / wildcard routing (`*` single-token + `>` trailing multi-token) / JetStream persistent stream + consumer ack / KV round-trip + revision tracking / Object store round-trip + chunk-based store) を比較。 7 軸 release gate PASS。

## docs

- tutorial 3 本 (31 Kafka event pipeline + producer + consumer group + exactly-once + DLQ / 32 Redpanda + schema registry + Avro schemas + evolution + compatibility / 33 NATS JetStream + persistent stream + KV + Object store + subject routing)
- additive migration v1.19 → v1.20 (v1.19 の Framework 深化 module に触れず、 新 streaming package の adapter 追加のみ)
- concept doc `streaming-testing.md` (producer / consumer / exactly-once / DLQ / schema-registry の 5 semantics 軸 × 6 semantic axis SSOT、 v1.13 realtime (時間軸 mock) との棲み分け表付き)

VitePress sidebar には `Streaming 深化 (v1.20)` セクションを追加、 gh-pages 反映済 (https://cardene777.github.io/kiwa/)。

## 数値サマリ

- **6 sub-Issues resolved** (#827-#832)
- **6 PRs merged** (v1.20-1 + v1.20-2/3/4/5 + 本 publish PR)
- **1 new npm package** (`@kiwa-test/streaming` v0.1.0)
- **3 new dogfood app** (kafka-event-pipeline + redpanda-schema-registry + nats-jetstream、 全 7 軸 release gate PASS)
- **5 semantics** (producer / consumer / exactly-once / DLQ / schema-registry) 統一 mock
- **kiwa runtime fixture 33 → 34** (streaming が新規 land)

## 10 milestone streak

v1.11 (release gate) → v1.12 (非決定性) → v1.13 (時間軸) → v1.14 (横軸拡張) → v1.15 (AI-LLM 深化) → v1.16 (component 縦軸) → v1.17 (Observability v2) → v1.18 (Blockchain 深化) → v1.19 (Framework 深化) → **v1.20 (Streaming 深化)**。 v1.11 以降の 10 milestone は全て 6 sub-Issue land 完遂。

## v2.0 candidates

- multi-version Vitest matrix (Vitest 1.x vs 2.x vs 3.x parity)
- desktop (Electron / Tauri) + mobile (React Native / Expo) adapter
- coverage 100% milestone
- cache / data depth (Dragonfly / Materialize / Neon)
- L2 depth (Base / Arbitrum / Optimism / Scroll block-space fidelity)
- ZK depth (Noir / Circom / RISC Zero test harness)
- Auth depth (WebAuthn / Passkey / OAuth 2.1 / OIDC)
- IoT depth (MQTT / CoAP / LWM2M)

feedback 歓迎です。 どれを次に land すべきか issue で議論しましょう。
