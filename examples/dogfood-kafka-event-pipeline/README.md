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
    interface.ts         # 9-op driver contract shared by mock/real (5 v1 + 4 v2)
    mock.ts              # in-process KafkaMock + raw-protocol + Schema Registry
    real.ts              # confluent-kafka + Schema Registry testcontainers
                         # duck-typed real driver (env-gated on
                         # KIWA_MODE=real + KAFKA_KEY)
  flows/
    kafka-flows.ts       # higher-level flows over the adapter (9 ops)
    fidelity.ts          # trace diff + 13-axis release-gate report
tests/
  producer.test.ts       # T-DKP-* — producer semantics (v1)
  consumer.test.ts       # T-DKC-* — consumer group semantics (v1)
  transaction.test.ts    # T-DKT-* — exactly-once semantics (v1)
  dlq.test.ts            # T-DKD-* — DLQ semantics (v1)
  raw-protocol.test.ts   # T-DKR-* / T-DKI-* — KIP-98 + ISR/HW (v2)
  schema-registry.test.ts # T-DKS-* — Schema Registry evolution (v2)
  testcontainers-probe.test.ts # T-DKT-* — real driver env gate (v2)
  e2e-mock-mode.test.ts  # T-DKE-M-* — 9-op adapter surface E2E
  fidelity-report.test.ts # T-DKF-* — fidelity harness output
  emit-fidelity-report.test.ts # T-DKE-EM-* — quality-report/ writeback
  e2e/                   # Playwright e2e (v2)
    producer-flow.spec.ts       # producer + raw-protocol + ISR/HW
    consumer-txn-flow.spec.ts   # consumer group + transactional
    idempotent-dlq-schema-flow.spec.ts # idempotent + DLQ + Schema + probe
  perf/
    dogfood-kafka-event-pipeline.perf.ts # 3-layer perf harness
```

## Running

```sh
# Mock-mode tests (default, v1 + v2 combined).
pnpm --filter dogfood-kafka-event-pipeline test

# Playwright e2e (v2, skips cleanly if browsers not installed).
pnpm --filter dogfood-kafka-event-pipeline test:e2e

# Perf sweep (3-layer harness — serial + parallel + live).
pnpm --filter dogfood-kafka-event-pipeline test:perf

# Real-mode — requires KIWA_MODE=real + KAFKA_KEY + a running Kafka broker.
KIWA_MODE=real \
  KAFKA_KEY=kiwa-real-1 \
  KAFKA_BOOTSTRAP=localhost:9092 \
  KAFKA_SCHEMA_REGISTRY_URL=http://localhost:8081 \
  pnpm --filter dogfood-kafka-event-pipeline test
```

## Fidelity report

`tests/emit-fidelity-report.test.ts` writes the release-gate report to `quality-report/fidelity-latest.md` + `.json` after every run — the v2 quality report doc `docs/quality-reports/streaming/kafka-event-pipeline-v2.md` is derived from this snapshot and lists the 13-axis release gate verdict (7 common + mutation.tier + a11y.tier on the SSOT lane grid).
