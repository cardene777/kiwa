# dogfood-redpanda-schema-registry

Dogfood app for v1.31-3 — a Redpanda + Confluent-shaped Schema Registry
pipeline that exercises **4 v1 patterns + 4 v2 axes** from
`@kiwa/streaming`'s schema-registry surface. v1 covers register /
evolution / compat / publish; v2 adds transitive evolution + subject
strategy probe + Redpanda Console admin + testcontainers probe.

## v1 patterns

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

## v2 axes

5. **Transitive evolution** — walk a v1 → v2 → v3 chain under
   BACKWARD_TRANSITIVE + attempt a `TRANSITIVE_BREAK` variant (adds a
   required `metadata` field). Immediate BACKWARD would accept it against
   v3, but the transitive walker rechecks against v1 + v2 too and flags the
   added-required-field breakage. Records the per-prior-version chain
   verdicts alongside the transitive-only reject.
6. **Subject strategy probe** — spin up 3 registries (topic-name /
   record-name / topic-record-name) and roundtrip a fresh register per
   strategy against the same topic + record. Reports 3 distinct derived
   subjects.
7. **Redpanda Console admin API** — a small HTTP client walks
   `/api/subjects` + `/api/config/{subject}` + `/api/schemas/ids/{id}` +
   `/api/health`. Mock mode replays deterministic fixtures via
   `createFixtureFetch`; real mode hits the container-mapped URL.
8. **Testcontainers probe** — Redpanda v23+
   (`redpandadata/redpanda:v23.3.5`) + Console v2.x
   (`redpandadata/console:v2.4.5`) as a duck-typed testcontainers pair
   (peer-dep free, degrades to `REDPANDA_ENV_MISSING` when the module is
   missing). Mirrors the sibling Kafka dogfood shape.

## Adapters

The dogfood is driven end-to-end through a provider-neutral adapter
(`src/adapters/interface.ts`) with two implementations:

- `makeMockAdapter()` — backed by `@kiwa/streaming`'s RedpandaMock +
  colocated SchemaRegistry mock + a fixture Console fetch. Default for CI
  + local.
- `makeRealAdapter()` — requires `KIWA_MODE=real` + `REDPANDA_KEY` (or a
  pre-provisioned `container` handle) to opt in. Reports
  `REDPANDA_ENV_MISSING` otherwise. Semantic ops (register / evolution
  etc.) still report `REAL_ADAPTER_NOT_IMPLEMENTED` in the v1.31-3 scope;
  `driveConsoleAdmin` + `driveTestcontainersProbe` fully wire against the
  live env.

## Layout

```
src/
  schemas/
    user-v1.ts         # baseline Avro schema (id / displayName / region)
    user-v2.ts         # v2 (adds optional email with default null) + BREAK
    user-v3.ts         # v3 (adds optional metadata) + TRANSITIVE_BREAK
    order-v1.ts        # third schema on a different subject
    index.ts           # re-export barrel
  registry/index.ts    # subject naming + register + compat helpers
  producer/index.ts    # schema-aware publish + fail-fast on incompatible
  consumer/index.ts    # schema fetch by header + evolution handling
  console/index.ts     # Redpanda Console v2.x admin API client + fixture
  adapters/
    interface.ts       # 9-op driver contract shared by mock/real (5 v1 + 4 v2)
    mock.ts            # in-process RedpandaMock + Console fixture adapter
    real.ts            # env-driven adapter + Redpanda v23+ + Console v2.x
                       # duck-typed testcontainers pair
  flows/
    redpanda-flows.ts  # higher-level flows over the adapter (9 ops)
    fidelity.ts        # trace diff + quality-metrics 13-axis release-gate
tests/
  registry.test.ts               # T-DRR-* — subject naming + evolution (v1)
  producer.test.ts               # T-DRP-* — publish + fail-fast (v1)
  consumer.test.ts               # T-DRC-* — schema fetch + evolution (v1)
  compatibility-modes.test.ts    # T-DRM-* — BACKWARD / FORWARD / FULL / NONE
  transitive-evolution.test.ts   # T-DRT-* — BACKWARD_TRANSITIVE walker (v2)
  subject-strategies.test.ts     # T-DRS-* — 3 naming strategies (v2)
  console-admin.test.ts          # T-DRC-CL/AD-* — Console admin client (v2)
  testcontainers-probe.test.ts   # T-DRP-TC-* — probe + tc module inject (v2)
  e2e-mock-mode.test.ts          # T-DRE-M-* — 9-op adapter surface
  fidelity-report.test.ts        # T-DRF-* — harness output + 13-axis gate
  emit-fidelity-report.test.ts   # T-DRE-EM-* — quality-report/ writeback
  e2e/                           # Playwright e2e (v2)
    fixture.ts                   # ad-hoc HTTP server binding 9 ops to routes
    register-evolve-flow.spec.ts # register + evolution + compat + publish
    transitive-strategy-flow.spec.ts # transitive + subject strategy
    console-testcontainers-flow.spec.ts # Console admin + testcontainers
  perf/
    dogfood-redpanda-schema-registry.perf.ts # 3-layer perf harness
```

## Running

```sh
# Mock-mode tests (default, v1 + v2 combined).
pnpm --filter dogfood-redpanda-schema-registry test

# Playwright e2e (v2, skips cleanly if browsers not installed).
pnpm --filter dogfood-redpanda-schema-registry test:e2e

# Perf sweep (3-layer harness — serial + parallel + live).
pnpm --filter dogfood-redpanda-schema-registry test:perf

# Real-mode — requires KIWA_MODE=real + REDPANDA_KEY + a running Redpanda
# broker + Console.
KIWA_MODE=real \
  REDPANDA_KEY=kiwa-real-1 \
  REDPANDA_BOOTSTRAP=localhost:9092 \
  REDPANDA_CONSOLE_URL=http://localhost:8080 \
  SCHEMA_REGISTRY_URL=http://localhost:8081 \
  pnpm --filter dogfood-redpanda-schema-registry test
```

## Fidelity report

`tests/emit-fidelity-report.test.ts` writes the release-gate report to
`quality-report/fidelity-latest.md` + `.json` after every run — the v2
quality report doc `docs/quality-reports/streaming/redpanda-schema-registry-v2.md`
is derived from this snapshot and lists the 13-axis release gate verdict
(7 common + mutation.tier + a11y.tier on the SSOT lane grid).
