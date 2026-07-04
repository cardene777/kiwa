---
"@kiwa-test/streaming": minor
---

Initial release of `@kiwa-test/streaming` v0.1.0 — unified Kafka + Redpanda + NATS testing mock covering the 5 streaming semantics (producer / consumer / exactly-once / DLQ / schema-registry) in one API surface.

- `createKafkaMock({ defaultPartitionCount })` — kafkajs-shaped broker + producer + consumer + admin trio with deterministic djb2 key-hash partitioner, per-partition offset log, `partitionAssigner: 'range' | 'round-robin'` consumer groups, `sendBatch`, `commitOffsets`, `seek`, `getCommittedOffset`, rebalance.
- `createRedpandaMock({ schemaRegistry: true })` — Kafka API 互換 broker with colocated `SchemaRegistry` covering `registerAvro` / `registerProtobuf` / `registerJson`, three compatibility modes (`BACKWARD` / `FORWARD` / `FULL`), schema evolution, fail-fast publish gating.
- `createNatsMock()` — core pub/sub with `*` (single-token) and `>` (trailing multi-token) subject routing, `nats.jetstream()` persistent streams + consumers + ack tracking, `js.kv('bucket')` KV store, `js.objectStore('bucket')` Object store — all riding on the JetStream substrate.
- `createTransactionalProducer` + `createIdempotentProducer` + `createReadCommittedFilter` — Kafka exactly-once semantics pillars (atomic multi-record commit + abort, per-partition sequence dedup, uncommitted transaction filter).
- `createDeadLetterQueue({ maxRetries, backoffExponent })` — retry policy + poison message quarantine + inspect + reprocess flow.
- 104 behavior tests across kafka / redpanda / nats / exactly-once / dlq / schema-registry / docs-tutorial-v1.20 suites.

Requires `vitest ^2` as a peer dependency. Pure TypeScript — no Docker, Zookeeper, JVM, or `nats-server` binary needed at test time.
