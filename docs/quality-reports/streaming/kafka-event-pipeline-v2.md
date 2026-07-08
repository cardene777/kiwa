# Kafka Event Pipeline — Quality Report (v1.31-2)

Dogfood: [`examples/dogfood-kafka-event-pipeline`](../../../examples/dogfood-kafka-event-pipeline/).
Package under exercise: [`@kiwa/streaming`](../../../packages/streaming/) (v0.3.0).

v1.31-2 extends the v1.20-2 shape ([kafka-event-pipeline.md](./kafka-event-pipeline.md)) with 4 new axes drawn from the streaming v0.3 advanced semantics grid + a confluent-kafka + Schema Registry testcontainers real driver + a Playwright e2e layer.
The v1.20-2 axes (idempotent producer / consumer group / exactly-once txn / DLQ) stay in place — v2 adds the raw-protocol + Schema Registry + testcontainers surface on top so the 13-axis release gate can score the full journey.

## Scope

The v1.31-2 dogfood exercises 4 v1 patterns plus 4 v2 axes.

### v1 (still in place from v1.20-2)

1. Idempotent producer — partition-key hashing + batch send + duplicate sequence-number dedup (`src/producer/index.ts`).
2. Consumer group — 2 consumers join a group, round-robin partition assignment, per-consumer offset commit + rebalance callback (`src/consumer/index.ts`).
3. Exactly-once transactional producer — `initTransactions` + `beginTransaction` + `send` + `commit` / `abort`, aborted batches never reach the broker, read-committed consumers see only committed records (`src/transaction/index.ts`).
4. DLQ — retry policy (constant / linear / exponential backoff), poison message quarantine, DLQ topic republish + replay path (`src/dlq/index.ts`).

### v2 (new in v1.31-2)

5. KIP-98 raw protocol — `initProducerId` + `fenceProducer` (epoch bump) + txn coordinator state machine walk (`Empty` → `Ongoing` → `PrepareCommit` → `CompleteCommit` → `Empty`) + incremental fetch session (KIP-227). Exercised through the `driveRawProtocol` adapter op wired to `createKafkaRawProtocol` from `@kiwa/streaming` v0.3.
6. ISR + high-watermark — 3-broker ISR attach + HW advance past `min.insync.replicas` gate. Exercised through the `driveIsrHighWatermark` adapter op.
7. Redpanda Schema Registry evolution — subject registration + `BACKWARD` / `FORWARD` / `FULL` compatibility check. Exercised through the `driveSchemaRegistry` adapter op wired to `createRedpandaSchemaEvolution`.
8. confluent-kafka + Schema Registry testcontainers probe — env-gated (`KIWA_MODE=real` + `KAFKA_KEY`) real driver that boots a Kafka 3.7 + Schema Registry container pair through a duck-typed `testcontainers` module (soft peer dep, degrades to `KAFKA_ENV_MISSING` when Docker or the peer dep is missing).

All 8 axes drive through the provider-neutral 9-op adapter surface (5 v1 ops + 4 v2 ops).

## Release gate — 13-axis verdict (mock trace)

Snapshot from [`examples/dogfood-kafka-event-pipeline/quality-report/fidelity-latest.md`](../../../examples/dogfood-kafka-event-pipeline/quality-report/fidelity-latest.md).

| axis | value | gate |
|---|---|---|
| coverage — line | 93.00% | PASS |
| coverage — branch | 89.00% | PASS |
| coverage — function | 96.00% | PASS |
| test count — behavior | 52 | PASS (>= 10) |
| fidelity — ratio | 88.89% (8/9) | PASS (>= 70) |
| perf — p95 | 5.48ms | PASS (<= 100ms) |
| mutation — killRate | 80.00% (32/40) | PASS (>= 60) |
| mutation — tier (framework) | 80.00% | PASS (>= 70) |
| a11y — tier (framework) | 0 / 0 / 0 (critical / serious / moderate) | PASS |
| **release gate verdict** | **PASS** | **9 axes evaluated** on the 13-axis SSOT lane grid |

The verdict counts 9 evaluated axes because Kafka is a non-AI-LLM provider — the 4 AI-LLM-only axes (`cost` / `latency` / `token` / `accuracy`) do not activate. The full 13-axis SSOT lane grid is (a) the 7 common axes above (b) the 4 AI-LLM axes gated on the provider prefix (c) `mutation.tier` (d) `a11y.tier` — v1.31-2 activates all common + tier lanes, leaving the AI-LLM lanes intentionally inactive.

## Real vs mock fidelity — 9-op grid

The 9-op adapter surface reports 8 behavioral divergences under the default env-absent configuration — every real op returns `KAFKA_ENV_MISSING` while the mock op succeeds. These are well-defined divergences: the fidelity harness records them without failing the release gate because the real driver is scope-boxed to the testcontainers probe path in v1.31-2.

| op | mock | real (no env) | classification |
|---|---|---|---|
| driveProducer | OK | KAFKA_ENV_MISSING | BEHAVIORAL_DIVERGENCE |
| driveConsumerGroup | OK | KAFKA_ENV_MISSING | BEHAVIORAL_DIVERGENCE |
| driveTransaction | OK | KAFKA_ENV_MISSING | BEHAVIORAL_DIVERGENCE |
| driveDlq | OK | KAFKA_ENV_MISSING | BEHAVIORAL_DIVERGENCE |
| emitFidelity | OK | KAFKA_ENV_MISSING | BEHAVIORAL_DIVERGENCE (trace only) |
| driveRawProtocol | OK | KAFKA_ENV_MISSING | BEHAVIORAL_DIVERGENCE |
| driveIsrHighWatermark | OK | KAFKA_ENV_MISSING | BEHAVIORAL_DIVERGENCE |
| driveSchemaRegistry | OK | KAFKA_ENV_MISSING | BEHAVIORAL_DIVERGENCE |
| driveTestcontainersProbe | OK | KAFKA_ENV_MISSING | BEHAVIORAL_DIVERGENCE (probe records unreachable) |

To probe against a live Kafka broker + Schema Registry pair, opt into real mode by setting the two gate env vars.

```sh
KIWA_MODE=real \
  KAFKA_KEY=kiwa-real-1 \
  KAFKA_BOOTSTRAP=localhost:9092 \
  KAFKA_SCHEMA_REGISTRY_URL=http://localhost:8081 \
  pnpm --filter dogfood-kafka-event-pipeline test
```

When both `KIWA_MODE=real` + `KAFKA_KEY` are set, the real adapter probes broker aliveness via a TCP connect on the first bootstrap broker + reports the endpoints from `KAFKA_BOOTSTRAP` + `KAFKA_SCHEMA_REGISTRY_URL`. Higher-level ops (`driveProducer` / `driveConsumerGroup` / `driveTransaction` / `driveDlq` / `driveRawProtocol` / `driveIsrHighWatermark` / `driveSchemaRegistry`) still report `REAL_ADAPTER_NOT_IMPLEMENTED` at the v1.31-2 scope; the fidelity harness treats this as a follow-up implementation milestone (the full confluent-kafka client binding is out of scope for this Issue).

Callers who want to bring their own container pair can invoke `startKafkaTestcontainers()` from `src/adapters/real.ts`. The helper boots a Kafka 3.7 KRaft-mode container + a cp-schema-registry container through a duck-typed `testcontainers` module (soft peer dep), returns the mapped host:port pair, and exposes a `stop()` boundary the caller invokes in an `afterAll` block. A missing `testcontainers` peer dep degrades to `SkippedError('startKafkaTestcontainers')` with `KAFKA_ENV_MISSING`.

## Playwright e2e — 3 spec pack

`tests/e2e/` boots a Node HTTP server that mounts the mock adapter's 9-op surface behind JSON endpoints and drives 2 BrowserContext tabs against it. The specs skip cleanly when the Playwright browser cache is absent so `pnpm test:e2e` still passes on fresh clones.

- `producer-flow.spec.ts` — idempotent producer duplicate-drop, raw-protocol producer id / epoch fencing + txn coordinator walk, ISR / HW advance past the target offset.
- `consumer-txn-flow.spec.ts` — 2 tabs against 1 consumer group observe 2 consumers with 8 records consumed, transactional producer commits 2 / aborts 1 + read-committed filter drops the aborted batch.
- `idempotent-dlq-schema-flow.spec.ts` — idempotent duplicate retry, DLQ quarantine + replay, Schema Registry BACKWARD-compat check, testcontainers probe mock endpoints.

## Notes

- `KAFKA_KEY` (not `KAFKA_BOOTSTRAP` alone) is the opt-in gate — this keeps CI-side accidental container boots impossible.
- `startKafkaTestcontainers()` is a soft-dep bring-up: the `testcontainers` npm package is not a hard dependency; callers who never boot containers do not pay the install cost.
- v1.31-2 does not change the v1.20-2 behavior of the 5-op v1 surface — every v1 test still runs identical to v1.20-2. v2 is strictly additive.
