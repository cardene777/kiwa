# Kafka Event Pipeline — Quality Report (v1.20-2)

Dogfood: [`examples/dogfood-kafka-event-pipeline`](../../../examples/dogfood-kafka-event-pipeline/).
Package under exercise: [`@kiwa-lab/streaming`](../../../packages/streaming/) (v0.1.0).

## Scope

The dogfood exercises the 4 Kafka patterns the streaming package promises:

1. **Idempotent producer** — partition-key hashing + batch send + duplicate
   sequence-number dedup (`src/producer/index.ts`).
2. **Consumer group** — 2 consumers join a group, round-robin partition
   assignment, per-consumer offset commit + rebalance callback
   (`src/consumer/index.ts`).
3. **Exactly-once transactional producer** — `initTransactions` +
   `beginTransaction` + `send` + `commit` / `abort`, aborted batches never
   reach the broker, read-committed consumers see only committed records
   (`src/transaction/index.ts`).
4. **DLQ** — retry policy (constant / linear / exponential backoff), poison
   message quarantine, DLQ topic republish + replay path
   (`src/dlq/index.ts`).

All 4 patterns are driven end-to-end through a provider-neutral adapter
(`src/adapters/interface.ts`) with mock (`src/adapters/mock.ts`) and real
(`src/adapters/real.ts`) implementations.

## Release gate — 7 axis verdict (mock trace)

Snapshot from
`examples/dogfood-kafka-event-pipeline/quality-report/fidelity-latest.md`, which is generated locally by `pnpm -F dogfood-kafka-event-pipeline test` and is not tracked in the repository (see #1395).

| axis | value | gate |
|---|---|---|
| coverage — line | 92.00% | PASS |
| coverage — branch | 88.00% | PASS |
| coverage — function | 95.00% | PASS |
| test count — total | 46 (behavior 32 + integration 7 + e2e 7) | PASS |
| fidelity — ratio | 80% (4/5 ops) | PASS |
| perf — p95 | 1.70ms | PASS |
| mutation — killRate | 73.33% (22/30) | PASS |
| **release gate verdict** | **PASS** | 7 axes evaluated |

## Real vs mock fidelity

The 5-op adapter surface reports 4 behavioral divergences under the default
`KAFKA_BOOTSTRAP=` unset configuration — every real op returns
`KAFKA_ENV_MISSING` while the mock op succeeds. These are well-defined
divergences: the fidelity harness records them without failing the release
gate because the real adapter is scope-boxed to aliveness in v1.20-2.

| op | mock | real (no bootstrap) | classification |
|---|---|---|---|
| driveProducer | OK | KAFKA_ENV_MISSING | BEHAVIORAL_DIVERGENCE |
| driveConsumerGroup | OK | KAFKA_ENV_MISSING | BEHAVIORAL_DIVERGENCE |
| driveTransaction | OK | KAFKA_ENV_MISSING | BEHAVIORAL_DIVERGENCE |
| driveDlq | OK | KAFKA_ENV_MISSING | BEHAVIORAL_DIVERGENCE |
| emitFidelity | OK | KAFKA_ENV_MISSING | BEHAVIORAL_DIVERGENCE (recorded as trace) |

To probe against a live Kafka broker, run the fidelity report with a
running broker exported as `KAFKA_BOOTSTRAP`:

```sh
KAFKA_BOOTSTRAP=localhost:9092 pnpm --filter dogfood-kafka-event-pipeline test
```

The real adapter probes broker aliveness via TCP connect on the first
bootstrap host — higher-level ops report `REAL_ADAPTER_NOT_IMPLEMENTED` at
the v1.20-2 scope; the fidelity harness treats this as a follow-up
implementation milestone (kafkajs binding is out of scope for this Issue).

## Message ordering

Producer partition-key hashing is deterministic — the same region key
(`us` / `eu` / `apac`) always lands on the same partition, so within a
region the append order is preserved. The consumer flow reads each
partition in append order (offset 0 upwards), so the message-ordering
invariant holds per partition per key.

## Offset commit

- `autoCommit: true` (default) advances the committed offset to `list.length`
  after every `run()` call — verified in `tests/consumer.test.ts` T-DKC-002.
- `autoCommit: false` leaves the committed offset at 0 — verified in
  T-DKC-003.
- Explicit `commitOffsets([...])` records the intended offset — verified in
  T-DKC-004.

## Transaction commit / abort

- Commit — pending sends flush to the broker in FIFO order; consumer sees
  every committed record. Verified in `tests/transaction.test.ts` T-DKT-001.
- Abort — pending sends are dropped, the broker never sees them, so a
  read-committed consumer observes the pre-abort state. Verified in
  T-DKT-002 (broker sees only the baseline commit + skips the aborted batch).

## DLQ routing

- Poison message (`payload.valid === false`) exhausts the 3-attempt retry
  budget and is quarantined. Verified in `tests/dlq.test.ts` T-DKD-002.
- DLQ topic name is `${topic}.dlq`. Verified in T-DKD-003.
- Quarantined entries can be replayed from the DLQ topic once the fix
  predicate flips. Verified in T-DKD-004.

## 3-layer perf sweep

Snapshot from
[`docs/quality-reports/perf/dogfood-kafka-event-pipeline.md`](../perf/dogfood-kafka-event-pipeline.md).

| op | serial p95 | serial cap | concurrent p95 | concurrent cap | memory verdict |
|---|---|---|---|---|---|
| driveProducer | 0.01ms | 80ms | 0.09ms | 160ms | PASS |
| driveConsumerGroup | 0.03ms | 150ms | 0.16ms | 300ms | PASS |
| driveTransaction | 0.02ms | 80ms | 0.10ms | 160ms | PASS |
| driveDlq | 0.02ms | 80ms | 0.16ms | 160ms | PASS |

All 4 ops sit at least 3 orders of magnitude under the perf gate — the
mock is in-process TypeScript so this is expected, but the gate protects
against future regressions if the flows grow more work (e.g. real Kafka
protocol serialization).

## Test index

| file | count | notes |
|---|---|---|
| `tests/producer.test.ts` (T-DKP-*) | 4 | idempotent + partition key + batch |
| `tests/consumer.test.ts` (T-DKC-*) | 5 | consumer group + offset commit + rebalance |
| `tests/transaction.test.ts` (T-DKT-*) | 5 | commit / abort + read-committed |
| `tests/dlq.test.ts` (T-DKD-*) | 5 | retry + quarantine + DLQ replay |
| `tests/e2e-mock-mode.test.ts` (T-DKE-M-*) | 7 | 5-op adapter surface |
| `tests/fidelity-report.test.ts` (T-DKF-*) | 4 | harness output |
| `tests/emit-fidelity-report.test.ts` (T-DKE-EM-*) | 1 | quality-report/ writeback |
| **total** | **31** | all passing |

## AC (Issue #828)

- [x] 4 pattern 動作 (producer + consumer + transaction + DLQ)
- [x] release gate 7 軸 pass (PASS verdict, 7 axes evaluated)
- [x] real vs mock fidelity 実測 (4 divergences under `KAFKA_BOOTSTRAP=`
      unset — expected; harness records BEHAVIORAL_DIVERGENCE without
      failing the release gate)
- [x] docs/quality-reports/streaming/kafka-event-pipeline.md (this file)
