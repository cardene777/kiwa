# dogfood-kafka-event-pipeline

Dogfood app for v1.20-2 — a Kafka event pipeline that exercises the 4 patterns
`@kiwa-test/streaming` promises for Kafka:

1. **Idempotent producer** — partition-key hashing + batch send + duplicate
   sequence-number dedup.
2. **Consumer group** — 2 consumers join one group, share the partition
   topology (round-robin assigner), commit offsets independently.
3. **Exactly-once transactional producer** — `initTransactions` +
   `beginTransaction` + `send` + `commit` / `abort`; aborted batches never
   reach the underlying broker, read-committed consumers only see committed
   records.
4. **DLQ** — retry policy with configurable backoff, poison-message
   quarantine after retry budget exhausted, DLQ topic subscribe + replay path
   for once-the-fix-has-landed recovery.

The dogfood is driven end-to-end through a provider-neutral adapter
(`src/adapters/interface.ts`) with two implementations:

- `makeMockAdapter()` — backed by `@kiwa-test/streaming`'s KafkaMock +
  idempotent / transactional producer + DLQ helpers. Default for CI + local.
- `makeRealAdapter()` — probes a live Kafka broker via `KAFKA_BOOTSTRAP`
  (env-skip when the var is missing; TCP aliveness probe when it is set).
  Higher-level ops report `REAL_ADAPTER_NOT_IMPLEMENTED` in the v1.20-2 scope
  so the fidelity harness records a well-defined divergence.

## Layout

```
src/
  producer/index.ts      # idempotent producer + partition key + batch
  consumer/index.ts      # consumer group + offset commit + rebalance
  transaction/index.ts   # transactional producer + read-committed filter
  dlq/index.ts           # retry + quarantine + DLQ topic replay
  adapters/
    interface.ts         # 5-op driver contract shared by mock/real
    mock.ts              # in-process KafkaMock-backed adapter
    real.ts              # KAFKA_BOOTSTRAP-driven adapter (skip mode default)
  flows/
    kafka-flows.ts       # higher-level flows over the adapter
    fidelity.ts          # trace diff + quality-metrics release-gate report
tests/
  producer.test.ts       # T-DKP-* — producer semantics
  consumer.test.ts       # T-DKC-* — consumer group semantics
  transaction.test.ts    # T-DKT-* — exactly-once semantics
  dlq.test.ts            # T-DKD-* — DLQ semantics
  e2e-mock-mode.test.ts  # T-DKE-M-* — 5-op adapter surface E2E
  fidelity-report.test.ts # T-DKF-* — fidelity harness output
  emit-fidelity-report.test.ts # T-DKE-EM-* — quality-report/ writeback
  perf/
    dogfood-kafka-event-pipeline.perf.ts # 3-layer perf harness
```

## Running

```sh
# Mock-mode tests (default).
pnpm --filter dogfood-kafka-event-pipeline test

# Perf sweep (3-layer harness — serial + parallel + live).
pnpm --filter dogfood-kafka-event-pipeline test:perf

# Real-mode (requires a running Kafka broker on KAFKA_BOOTSTRAP).
KAFKA_BOOTSTRAP=localhost:9092 pnpm --filter dogfood-kafka-event-pipeline test
```

## Fidelity report

`tests/emit-fidelity-report.test.ts` writes the release-gate report to
`quality-report/fidelity-latest.md` + `.json` after every run — the parent
Issue's `docs/quality-reports/streaming/kafka-event-pipeline.md` is derived
from this snapshot.
