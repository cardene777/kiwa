# kiwa v1.20 released — Streaming 深化 (Kafka + Redpanda + NATS の 5 semantics 統一 mock)

v1.20 is out. After v1.19's Framework 深化 horizontal (three modern web framework testing adapters — SolidJS Signal reactivity + Deno Fresh Islands + HonoJS Cloudflare Workers), v1.20 turns to the **event-driven backbone** — Kafka (kafkajs-shaped producer / consumer / admin), Redpanda (Kafka API 互換 broker + colocated schema registry), and NATS (core pub/sub + JetStream + KV / Object store) — one new package that lifts kiwa runtime fixture count from **33 to 34** while covering **five broker semantics** in a single mock surface.

## What shipped

- **`@kiwa/streaming` v0.1.0** (new package). Unified Kafka + Redpanda + NATS testing mock covering the five streaming semantics production teams hit — producer, consumer, exactly-once, DLQ, schema registry — in one API surface. `createKafkaMock({ defaultPartitionCount })` returns a broker + producer + consumer + admin trio that mirrors `kafkajs` shape; deterministic djb2-style key-hash partitioner, per-partition offset log, and `partitionAssigner: 'range' | 'round-robin'` consumer groups. `createRedpandaMock({ schemaRegistry: true })` layers a colocated `SchemaRegistry` on top of a Kafka-shaped broker — `registerAvro` / `registerProtobuf` / `registerJson`, three compatibility modes (`BACKWARD` / `FORWARD` / `FULL`), schema evolution, and fail-fast publish gating. `createNatsMock()` gives core pub/sub with `*` (single-token) + `>` (trailing multi-token) subject routing, `nats.jetstream()` persistent streams + consumers + ack tracking, and `js.kv('bucket')` / `js.objectStore('bucket')` that ride on the JetStream substrate. `createTransactionalProducer` + `createIdempotentProducer` + `createReadCommittedFilter` cover the Kafka exactly-once pillars (per-partition sequence dedup, multi-record atomic commit + abort, uncommitted-transaction filter). `createDeadLetterQueue` covers retry policy (max retries + backoff exponent) + poison message quarantine + inspect + reprocess flow. 104 behavior tests pass across `kafka.test.ts` + `redpanda.test.ts` + `nats.test.ts` + `exactly-once.test.ts` + `dlq.test.ts` + `schema-registry.test.ts` + `docs-tutorial-v1.20.test.ts`. Pure TypeScript — no Docker, Zookeeper, JVM, or a `nats-server` binary needed at test time.
- **`examples/dogfood-kafka-event-pipeline`** — Kafka producer + consumer group + exactly-once transactional producer + DLQ. `makeMockAdapter` uses `@kiwa/streaming` `createKafkaMock` + `createTransactionalProducer` + `createDeadLetterQueue`; `makeRealAdapter` wraps a Kafka-like harness. `KafkaFidelityReport` compares mock vs real behavior across 5 scenarios (partitioner determinism / consumer group rebalance / offset commit + seek / transactional producer atomic commit / DLQ retry exhaustion + quarantine). 7-axis release gate verdict PASS.
- **`examples/dogfood-redpanda-schema-registry`** — Redpanda + Avro schema registry + evolution + BACKWARD / FORWARD / FULL compatibility check. Ships 3 Avro schemas that stress each compatibility mode (v1 → v2 additive field / v2 → v3 breaking field type change / v3 → v4 default-value drop). `RedpandaFidelityReport` compares mock vs real behavior across 5 scenarios (schema register + fetch / evolution + version bump / compatibility gate pass + fail / fail-fast publish rejection / Kafka API round-trip on the same broker). 7-axis release gate verdict PASS.
- **`examples/dogfood-nats-jetstream`** — NATS core pub/sub + `*` / `>` subject routing + JetStream persistent stream + KV Store + Object Store. `makeMockAdapter` uses `@kiwa/streaming` `createNatsMock` + `nats.jetstream()` + `js.kv` + `js.objectStore`; `makeRealAdapter` boots a minimal NATS-shaped runtime. `NatsFidelityReport` compares mock vs real behavior across 5 scenarios (core pub/sub / wildcard routing (`*` single-token + `>` trailing multi-token) / JetStream persistent stream + consumer ack / KV round-trip / Object store round-trip). 7-axis release gate verdict PASS.
- **docs** — 3 new tutorials (31 Kafka event pipeline + producer + consumer group + exactly-once + DLQ / 32 Redpanda + schema registry + Avro schemas + evolution + compatibility / 33 NATS JetStream + persistent stream + KV + Object store + subject routing) + additive migration guide v1.19 → v1.20 + concept doc `streaming-testing.md` documenting the **five semantics × six semantic axes** (producer (partition + serialization + batch) / consumer (group + offset + rebalance) / exactly-once (transactional + idempotent + read-committed) / DLQ (retry policy + poison quarantine) / schema registry (Avro / Protobuf / JSON + compatibility gate + evolution)) as the SSOT. VitePress sidebar refreshed with a new `Streaming 深化 (v1.20)` tutorial section; gh-pages published via `/docs-publish-kiwa`.

## Numbers

- **6 sub-Issues resolved** (#827-#832)
- **6 PRs merged** (v1.20-1 + v1.20-2/3/4/5 + this publish PR)
- **1 new npm package** (`@kiwa/streaming` v0.1.0) — kiwa runtime fixture count now **34**
- **3 new dogfood apps** with fidelity reports feeding the 7-axis release gate
- **104 new tests** across the streaming package all pass

## 10-milestone streak

v1.11 (release gate) → v1.12 (non-determinism) → v1.13 (time-axis) → v1.14 (horizontal expansion) → v1.15 (AI-LLM depth) → v1.16 (component depth) → v1.17 (Observability v2) → v1.18 (Blockchain depth) → v1.19 (Framework 深化) → **v1.20 (Streaming 深化)**. Every milestone since v1.11 has landed 6 sub-Issues in full.

## v2.0 candidates

- Multi-version Vitest matrix (Vitest 1.x vs 2.x vs 3.x parity)
- Desktop (Electron / Tauri) + mobile (React Native / Expo) adapters
- Coverage 100% milestone
- Cache / Data depth (Dragonfly / Materialize / Neon)
- L2 depth (Base / Arbitrum / Optimism / Scroll block-space fidelity)
- ZK depth (Noir / Circom / RISC Zero test harness)
- Auth depth (WebAuthn / Passkey / OAuth 2.1 / OIDC)
- IoT depth (MQTT / CoAP / LWM2M)

Feedback welcome on which of these should land next.
