# dogfood-redpanda-schema-registry

Dogfood app for v1.20-3 — a Redpanda + Confluent-shaped Schema Registry
pipeline that exercises the 4 patterns `@kiwa-test/streaming` promises for
schema-registry-backed streaming:

1. **Register 3 Avro schemas** across 2 subjects (`users-value`,
   `orders-value`) with a `topic-name` subject naming strategy, deduping the
   second `User v1` register into the first entry's id.
2. **Schema evolution** — register `User v1` then `User v2` (adds an
   optional `email` field with default `null`) on the same subject.
   BACKWARD-compatible, the registry accepts and bumps version. A BREAK
   variant that adds a required `email` field with no default is rejected.
3. **Compatibility modes** — flip the same subject through BACKWARD,
   FORWARD, and FULL and observe every mode rejects the BREAK variant.
   NONE accepts every change (exercised separately in
   `tests/compatibility-modes.test.ts`).
4. **Fail-fast publish** — the schema-aware producer registers the value
   schema on every publish and rejects the send when the schema is
   incompatible with the subject's compat mode.

The dogfood is driven end-to-end through a provider-neutral adapter
(`src/adapters/interface.ts`) with two implementations:

- `makeMockAdapter()` — backed by `@kiwa-test/streaming`'s RedpandaMock +
  colocated SchemaRegistry mock. Default for CI + local.
- `makeRealAdapter()` — probes a live Redpanda broker via
  `REDPANDA_BOOTSTRAP` (TCP aliveness) + a live Confluent-shaped Schema
  Registry via `SCHEMA_REGISTRY_URL` (GET /subjects). Env-skip when either
  var is missing. Higher-level ops report
  `REAL_ADAPTER_NOT_IMPLEMENTED` in the v1.20-3 scope so the fidelity
  harness records a well-defined divergence.

## Layout

```
src/
  schemas/
    user-v1.ts         # baseline Avro schema (id / displayName / region)
    user-v2.ts         # v2 (adds optional email with default null) + BREAK
    order-v1.ts        # third schema on a different subject
    index.ts           # re-export barrel
  registry/index.ts    # subject naming + register + compat helpers
  producer/index.ts    # schema-aware publish + fail-fast on incompatible
  consumer/index.ts    # schema fetch by header + evolution handling
  adapters/
    interface.ts       # 5-op driver contract shared by mock/real
    mock.ts            # in-process RedpandaMock-backed adapter
    real.ts            # env-driven adapter (skip mode default)
  flows/
    redpanda-flows.ts  # higher-level flows over the adapter
    fidelity.ts        # trace diff + quality-metrics release-gate report
tests/
  registry.test.ts               # T-DRR-* — subject naming + evolution
  producer.test.ts               # T-DRP-* — publish + fail-fast
  consumer.test.ts               # T-DRC-* — schema fetch + evolution
  compatibility-modes.test.ts    # T-DRM-* — 3 mode + NONE probes
  e2e-mock-mode.test.ts          # T-DRE-M-* — 5-op adapter surface
  fidelity-report.test.ts        # T-DRF-* — harness output
  emit-fidelity-report.test.ts   # T-DRE-EM-* — quality-report/ writeback
  perf/
    dogfood-redpanda-schema-registry.perf.ts # 3-layer perf harness
```

## Running

```sh
# Mock-mode tests (default).
pnpm --filter dogfood-redpanda-schema-registry test

# Perf sweep (3-layer harness — serial + parallel + live).
pnpm --filter dogfood-redpanda-schema-registry test:perf

# Real-mode (requires a running Redpanda broker + Schema Registry).
REDPANDA_BOOTSTRAP=localhost:9092 \
SCHEMA_REGISTRY_URL=http://localhost:8081 \
pnpm --filter dogfood-redpanda-schema-registry test
```

## Fidelity report

`tests/emit-fidelity-report.test.ts` writes the release-gate report to
`quality-report/fidelity-latest.md` + `.json` after every run — the parent
Issue's `docs/quality-reports/streaming/redpanda-schema-registry.md` is
derived from this snapshot.
