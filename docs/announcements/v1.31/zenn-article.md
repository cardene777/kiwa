# kiwa v1.31 released — Streaming 深化 II (@kiwa-test/streaming v0.3.0 + 8 axis advanced + real driver + 縦深化 pair 第 3 pair 完成)

## TL;DR

- **kiwa v1.31 released** — Streaming 深化 II milestone (Kafka raw + Redpanda schema + NATS JetStream durable + real driver + 縦深化 pair 第 3 pair 完成)
- **`@kiwa-test/streaming` v0.2.0 → v0.3.0 minor bump** — 8 axis advanced streaming production semantics + real driver env-gate + 3 provider (Kafka / Redpanda / NATS) neutral state machine 追加
- **8 axis semantics** = Kafka raw protocol + Kafka consumer group + Redpanda schema evolution + Redpanda transactions + NATS JetStream durable + NATS KV/Object Store + Streaming exactly-once + Consumer lag telemetry
- **3 dogfood app v2** — kafka-event-pipeline v2 + redpanda-schema-registry v2 + nats-jetstream v2、 全 7 軸 release gate PASS + testcontainers
- **縦深化 pair pattern 第 3 pair 完成** — Auth pair (v1.21→v1.22) + Realtime pair (v1.13→v1.28) + **Streaming pair (v1.20→v1.31)**、 縦深化戦略 SSOT 確立
- **9 milestone 連続 snippet validation streak** (v1.23-v1.31)
- **kiwa runtime fixture 35 packages 維持** (streaming 既存 package の minor 拡張)
- v1.11 以降 21 milestone 連続完遂

## v1.31 が解決したい問題 — Streaming production semantics の testing gap

v1.20 で `@kiwa-test/streaming` v0.1 を land した時点で、 kiwa は 3 provider (Kafka / Redpanda / NATS) 上に **5 base semantics** (producer / consumer / exactly-once / DLQ / schema-registry) を統一 mock として提供していた。 broker binary + Docker + Zookeeper 不要で mock only mode で走る、 実 test 環境の生産性を確保する目的の layer。

しかし v1.20 の実行観測で判明したのは、 real production streaming setup で頻繁に遭遇する **8 axis の advanced semantics** — Kafka raw protocol (KIP-98 idempotent + transaction coordinator) / consumer group rebalance / Redpanda schema evolution / Redpanda transactions / NATS JetStream durable / KV/Object Store / exactly-once transactional producer + read-committed isolation / consumer lag telemetry — が 5 base semantics だけでは cover できないこと。

v1.31 はこの gap を埋める深化 II milestone。 8 axis advanced streaming semantics + real driver env-gate + 3 dogfood app v2 で **production streaming testing SSOT** を確立、 kiwa の縦深化 pair pattern (basic mock → advanced real driver) を 3 pair 目として完成。

## v1.31 で追加した 8 axis advanced streaming semantics

### 1. Kafka raw protocol (`kafka-raw-protocol.ts`)

KIP-98 idempotent producer + transaction coordinator + fetch session + ISR (In-Sync Replica) の state machine を pure logic として実装。 idempotent producer の PID + epoch + sequence number tracking、 transaction coordinator の begin/commit/abort、 fetch session incremental fetch、 ISR shrink/expand を統一実装。 real driver env-gate で confluent-kafka testcontainers 経由の real Kafka 3.7 走査。

### 2. Kafka consumer group (`kafka-consumer-group.ts`)

Consumer group の rebalance protocol (range / round-robin / sticky / cooperative-sticky) + static membership (group.instance.id) + cooperative rebalance (incremental) + heartbeat lease renewal を pure state machine として実装。 rebalance storm 検出 + stuck group detection + partition assignment invariant check。

### 3. Redpanda schema evolution (`redpanda-schema-evolution.ts`)

Redpanda Console API + Schema Registry の Avro / Protobuf / JSON schema compatibility check (BACKWARD / FORWARD / FULL / NONE) + subject naming strategy (TopicNameStrategy / RecordNameStrategy / TopicRecordNameStrategy) + reference (schema import) を統一実装。 downgrade violation を fail-fast 検出、 schema evolution history tracking。

### 4. Redpanda transactions (`redpanda-transactions.ts`)

Redpanda の TxnCoordinator + producer id + epoch fencing の state machine。 initTransactions → beginTransaction → send → sendOffsetsToTransaction → commitTransaction / abortTransaction の transition guard + zombie producer fencing detection。

### 5. NATS JetStream durable (`nats-jetstream-durable.ts`)

NATS JetStream durable consumer + ack pending window + max deliver policy + exponential backoff。 pull consumer + push consumer 両方の behavior、 explicit ack + none ack + all ack + terminate/nak + in-progress の 5 ack type 統一処理、 max_ack_pending 到達時の consumer stall detection。

### 6. NATS KV / Object Store (`nats-kv-object.ts`)

NATS KV bucket + revision-based optimistic concurrency + watcher + Object Store chunking + LZ4 圧縮を pure state machine として実装。 KV put/get/update/delete/watch + revision conflict + Object Store multipart upload + chunk digest verify + LZ4 decompression。

### 7. Streaming exactly-once (`streaming-exactly-once.ts`)

Cross-provider exactly-once semantics — transactional producer + read committed isolation + read uncommitted の 3 mode を統一 API で実装。 Kafka transactional producer + Redpanda transactions + NATS JetStream ack policy を neutral state machine で routing。

### 8. Consumer lag telemetry (`consumer-lag-telemetry.ts`)

Offset lag + time lag + partition-level lag + high watermark + log-end-offset の 5 metric を統一 collector として実装。 lag alert threshold + partition rebalance impact + consumer restart lag catch-up の観測。

## 3 dogfood streaming app v2

### `dogfood-kafka-event-pipeline` v2

- Next.js 15 + Kafka raw protocol + KIP-98 idempotent + transactional producer
- confluent-kafka-python testcontainers + Playwright e2e + real Kafka 3.7
- Schema Registry mock 統合、 mock only + `KIWA_MODE=real` opt-in の 2 layer 走査

### `dogfood-redpanda-schema-registry` v2

- Nuxt 3 + Redpanda v23+ testcontainers + Redpanda Console API
- BACKWARD/FORWARD/FULL compatibility check、 schema evolution strict transition guard
- downgrade violation を fail-fast 検出

### `dogfood-nats-jetstream` v2

- SvelteKit + NATS 2.10+ testcontainers + JetStream durable consumer
- KV bucket revision-based optimistic concurrency + Object Store chunking + LZ4 圧縮
- durable consumer max deliver policy + backoff の e2e

## 縦深化 pair pattern 第 3 pair 完成

v1.31 で kiwa の縦深化 pair pattern (basic mock milestone → 深化 II milestone で real driver + advanced semantics) が 3 pair 連続完成:

1. **Auth pair** (v1.21 → v1.22)
   - v1.21 = `@kiwa-test/auth` v0.4 4 protocol adapter (WebAuthn L3 / Passkey / OAuth 2.1 / OIDC) mock only
   - v1.22 = Keycloak testcontainers + oauth2-mock-server + Chrome caBLE hybrid transport (real driver) + a11y axe-core gate
2. **Realtime pair** (v1.13 → v1.28)
   - v1.13 = `@kiwa-test/realtime` v0.1 4 provider (Supabase / Ably / Pusher / Socket.io) × 5 base semantics mock only
   - v1.28 = WebRTC + WebTransport + HTTP/3 + QUIC multiplexing + 8 axis advanced (real driver env-gate)
3. **Streaming pair** (v1.20 → v1.31、 this)
   - v1.20 = `@kiwa-test/streaming` v0.1 3 provider (Kafka / Redpanda / NATS) × 5 semantics mock only
   - v1.31 = Kafka raw + Redpanda schema + NATS JetStream + 8 axis advanced (real driver env-gate + testcontainers)

basic mock → advanced real driver の 2 phase pair を追加 provider に横展開する pattern が SSOT 化された。 v1.25 perf + v1.27 mutation + v1.30 a11y の横串 triple pair と合わせて **kiwa quality gate 縦横 grid 完成**。

## v1.11 以降 21 milestone 連続完遂

v1.11 (release gate) → v1.12 (非決定性) → v1.13 (時間軸) → v1.14 (横軸拡張) → v1.15 (AI-LLM 深化) → v1.16 (component 縦軸) → v1.17 (Observability v2) → v1.18 (Blockchain 深化) → v1.19 (Framework 深化) → v1.20 (Streaming 深化) → v1.21 (Auth 深化) → v1.22 (Auth 深化 II) → v1.23 (Payment 深化) → v1.24 (Edge / Serverless 深化) → v1.25 (Perf-harness sweep) → v1.26 (Database 深化) → v1.27 (Mutation testing sweep) → v1.28 (Realtime 深化 II) → v1.29 (release script filter SSOT) → v1.30 (a11y 横串 sweep) → **v1.31 (Streaming 深化 II)**。

21 milestone 連続完遂、 全 sub-Issue land 維持、 kiwa quality gate SSOT を縦深化 pair + 横串 sweep の 2 pattern で拡張し続けている。

## 9 milestone 連続 snippet validation streak

v1.23 (payment) → v1.24 (edge) → v1.25 (perf-harness) → v1.26 (orm) → v1.27 (quality-metrics) → v1.28 (realtime) → v1.29 (release-invariants) → v1.30 (a11y) → **v1.31 (streaming)** の 9 milestone 連続 snippet validation。

すべての tutorial code snippet が `packages/{name}/tests/docs-tutorial-v1.XX.test.ts` で automated validation されている。 tutorial が古くなって動かなくなる regression を構造的に遮断する pattern。

## 使い方

```bash
pnpm add -D @kiwa-test/streaming @kiwa-test/core
```

Kafka raw protocol の pure state machine helper:

```typescript
import { createKafkaRawEnv } from '@kiwa-test/streaming/semantics/kafka-raw-protocol';

const env = createKafkaRawEnv({
  brokers: ['localhost:9092'],
  transactional: true,
  idempotent: true,
});

// KIP-98 idempotent producer send
await env.producer.send({
  topic: 'test.events',
  messages: [{ value: JSON.stringify({ id: 1 }) }],
});

// transaction coordinator
await env.producer.beginTransaction();
await env.producer.send({ topic: 'test.events', messages: [/* ... */] });
await env.producer.commitTransaction();

// fidelity check
const coverage = env.collectFidelityCoverage();
expect(coverage.kafkaRawProtocol.axesCovered).toBe(8);
```

real driver env-gate:

```bash
# mock only mode (default)
pnpm test

# real driver mode with testcontainers
KIWA_MODE=real KIWA_KAFKA_TESTCONTAINERS=1 pnpm test
```

Migration guide は https://cardene777.github.io/kiwa/migrations/v1.30-to-v1.31 (additive-only、 breaking change 0)。

## v2.0 candidates

- Multi-version Vitest matrix (Vitest 1.x vs 2.x vs 3.x parity)
- Desktop (Electron / Tauri) + mobile (React Native / Expo) adapters
- Coverage 100 % milestone
- Cache / Data depth (Dragonfly / Materialize / Neon)
- L2 depth (Base / Arbitrum / Optimism / Scroll block-space fidelity)
- ZK depth (Noir / Circom / RISC Zero test harness)
- IoT depth (MQTT / CoAP / LWM2M)
- DB depth II (SurrealDB / EdgeDB / Turso / CockroachDB / TimescaleDB / QuestDB)
- Streaming depth III (Pulsar + KsqlDB + Faust + Flink + Beam pipeline fidelity)
- Auth depth III (WebAuthn L3 + Passkey caBLE + Federation + Verifiable Credentials)
- Perf-harness sweep II (real-machine baseline、 macOS ARM64 + Linux x86_64 + Windows x86_64)
- Mutation sweep II (property-based mutation、 Stryker + fast-check integration + shrink parser)
- Realtime depth III (WebCodecs / WebGPU compute + AV1/VP9 hardware encoding + WHIP/WHEP ingest fidelity)
- A11y sweep II (WCAG 2.2 AAA gate + screen-reader emulator + keyboard-only harness)

Feedback welcome — どの候補が優先されるべきか、 Discussions で議論しませんか。

## リンク

- GitHub: https://github.com/cardene777/kiwa
- Docs: https://cardene777.github.io/kiwa
- Migration guide: https://cardene777.github.io/kiwa/migrations/v1.30-to-v1.31
- Concept doc: https://cardene777.github.io/kiwa/concepts/streaming-real-driver-testing
- npm: `@kiwa-test/streaming` v0.3.0

Thanks for testing kiwa v1.31 pre-releases and shaping the 縦深化 pair pattern SSOT.
