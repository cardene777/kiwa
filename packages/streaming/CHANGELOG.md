# @kiwa/streaming

## 0.3.0

### Minor Changes

- v1.31-1: advanced streaming semantics 8 axis (Kafka raw + consumer group + Redpanda schema + txn + NATS durable + KV/Object + exactly-once + consumer lag). Ships alongside the base 5-semantics mock (v0.2.0) without breaking the existing API surface.

  - `createKafkaRawProtocol({ replicationFactor, minInSyncReplicas })` — KIP-98 idempotent producer id + epoch fencing, transaction coordinator state machine (`Empty` → `Ongoing` → `PrepareCommit` → `CompleteCommit` → `Empty`), KIP-227 incremental fetch session id / epoch, ISR set + high-watermark advance gate.
  - `createKafkaConsumerGroup({ groupId, sessionTimeoutMs, protocol })` — JoinGroup / SyncGroup / Heartbeat / LeaveGroup lifecycle, static membership (KIP-345) that skips rebalance on reconnect, cooperative (KIP-429) protocol tag with per-generation `reassignedMembers` diff.
  - `createRedpandaSchemaEvolution({ defaultCompatibility, subjectNamingStrategy })` — Avro / Protobuf / JSON compatibility oracle with structural markers (`OPTIONAL_ADD` / `REQUIRED_ADD` / `REQUIRED_REMOVE` / `TYPE_CHANGE`), 7 compat modes, `topic-name` / `record-name` / `topic-record-name` subject strategies, subject reference graph.
  - `createRedpandaTransactions({ transactionTimeoutMs })` — TxnCoordinator with producer id + epoch fencing, per-transaction phase (`idle` / `ongoing` / `prepareCommit` / `prepareAbort` / `committed` / `aborted`), auto-abort on stale transactions, `guardEpoch()` for InvalidProducerEpoch enforcement.
  - `createNatsJetStreamDurable({ durableName, ackWaitMs, maxDeliver, ackPolicy, backoff })` — durable consumer with ack-pending window + max-deliver quarantine + backoff schedule + `ackPolicy: 'explicit' | 'all' | 'none'` cascade + `sweepExpired(now)` for ack-wait expiry.
  - `createNatsKvObject()` — KV bucket with revision history + delete tombstones + async watch, Object bucket with chunked writes + per-chunk FNV-1a digest + LZ4-tagged compression + reassembly.
  - `createExactlyOnceSemantics({ provider, transactionalId, isolationLevel })` — provider-agnostic (`'kafka' | 'redpanda' | 'nats'`) transactional batch + `read-committed` / `read-uncommitted` filter, records tagged with `x-kiwa-txn-id` header for downstream filtering.
  - `createConsumerLagTelemetry({ provider })` — per (group, topic, partition) `highWatermark` / `committedOffset` / `offsetLag` / `timeLagMs`, `snapshotAll()`, `aggregateGroupLag()` — the same shape SRE dashboards read off Kafka JMX.
  - `createFidelityHarness()` — 3 provider × 8 axis grid (24 cells) marking each cell `implemented` / `not-applicable` (e.g. NATS has no Kafka wire protocol) / `planned`. Tests iterate the grid to prove every axis is either covered or explicitly excluded.
  - `isRealDriverMode(env)` + `requiredKeyFor(axis)` — env-gate for `KIWA_MODE=real` + per-axis `KAFKA_KEY` / `REDPANDA_KEY` / `NATS_KEY` real-driver credentials.

  75 new behavior tests across `tests/semantics/` (10 kafka-raw-protocol + 7 kafka-consumer-group + 7 redpanda-schema-evolution + 9 redpanda-transactions + 7 nats-jetstream-durable + 8 nats-kv-object + 18 exactly-once cross-provider + 6 consumer-lag-telemetry + 9 fidelity-harness). All 179 pre-existing + new tests pass under `pnpm test`.

## 0.2.0

### Minor Changes

- 1fab5c4: Initial release of `@kiwa/streaming` v0.1.0 — unified Kafka + Redpanda + NATS testing mock covering the 5 streaming semantics (producer / consumer / exactly-once / DLQ / schema-registry) in one API surface.

  - `createKafkaMock({ defaultPartitionCount })` — kafkajs-shaped broker + producer + consumer + admin trio with deterministic djb2 key-hash partitioner, per-partition offset log, `partitionAssigner: 'range' | 'round-robin'` consumer groups, `sendBatch`, `commitOffsets`, `seek`, `getCommittedOffset`, rebalance.
  - `createRedpandaMock({ schemaRegistry: true })` — Kafka API 互換 broker with colocated `SchemaRegistry` covering `registerAvro` / `registerProtobuf` / `registerJson`, three compatibility modes (`BACKWARD` / `FORWARD` / `FULL`), schema evolution, fail-fast publish gating.
  - `createNatsMock()` — core pub/sub with `*` (single-token) and `>` (trailing multi-token) subject routing, `nats.jetstream()` persistent streams + consumers + ack tracking, `js.kv('bucket')` KV store, `js.objectStore('bucket')` Object store — all riding on the JetStream substrate.
  - `createTransactionalProducer` + `createIdempotentProducer` + `createReadCommittedFilter` — Kafka exactly-once semantics pillars (atomic multi-record commit + abort, per-partition sequence dedup, uncommitted transaction filter).
  - `createDeadLetterQueue({ maxRetries, backoffExponent })` — retry policy + poison message quarantine + inspect + reprocess flow.
  - 104 behavior tests across kafka / redpanda / nats / exactly-once / dlq / schema-registry / docs-tutorial-v1.20 suites.

  Requires `vitest ^2` as a peer dependency. Pure TypeScript — no Docker, Zookeeper, JVM, or `nats-server` binary needed at test time.
