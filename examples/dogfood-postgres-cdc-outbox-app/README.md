# dogfood-postgres-cdc-outbox-app

Dogfood app for v1.32-2 — a Postgres 16 logical replication + Debezium-style
outbox + Redis Streams consumer pipeline + orm v0.10 advanced Postgres
semantics that exercises 4 v1 patterns and 4 v2 axes.

## v1 patterns (v1.26-2)

1. **Transactional outbox** — write a domain row and an event row in the
   same transaction, LSN monotonic per slot, batch seal preserves order.
2. **CDC pickup** — read outbox events past a committed LSN, deliver into a
   Redis Streams consumer group, at-least-once acknowledgement, backpressure
   cap on in-flight messages.
3. **Streaming replication** — primary write bumps LSN, per-replica applied
   LSN + lag observation, two-step failover (`startFailover` →
   `promoteReplica`).
4. **At-least-once + idempotent consumer** — duplicate LSN ingest is dropped
   by the consumer's seen-set, ack advances the outbox's `confirmedLsn`.

## v2 axes (v1.32-2)

5. **Postgres 16 logical replication advanced** — pgoutput streaming
   protocol start → replication origin tracking → two-safe synchronous
   commit → cascaded subscription sync. Backed by orm v0.10
   `createLogicalReplicationAdvancedSession` + 4 state-transition
   primitives.
6. **Replication slot advance** — logical slot create → `pg_replication_slot_advance`
   past retained WAL → drop. Reports the retained → advanced LSN pair +
   recycled byte count.
7. **pgvector real driver** — IVFFlat index build (3 lists × 8 dims) →
   k-NN cosine search → hybrid vector + full-text search → raw cosine
   distance computation. Backed by orm v0.10 `createVectorStoreSession`
   + 4 neutral vector primitives.
8. **Postgres 16 + pgvector testcontainers duck-typing** — probe the
   container-mapped host:port pair + `postgres:16-alpine` +
   `pgvector/pgvector:pg16` image tags without pulling in a full pg
   client.

The dogfood is driven end-to-end through a provider-neutral adapter
(`src/adapters/interface.ts`) with two implementations:

- `makeMockAdapter()` — backed by `@kiwa-lab/orm` v0.10 CDC +
  logical-replication + replication + connection-pool + advanced-8-axis
  semantics. Default for CI + local.
- `makeRealAdapter()` — probes a Postgres 16 broker via `POSTGRES_BOOTSTRAP`
  (env-skip when the var is missing; DSN aliveness probe when it is set).
  Higher-level ops report `REAL_ADAPTER_NOT_IMPLEMENTED` in the v1.32-2 scope
  so the fidelity harness records a well-defined divergence.
  `driveTestcontainersProbe` is the exception — it returns the container-
  mapped host:port pair + image tags so v1.32-6 can wire the higher-level
  clients against the same boot path without changing the observation shape.

## Layout

```
src/
  outbox/index.ts        # Debezium-style outbox + LSN monotonic seal
  cdc/index.ts           # pickup + logical-replication publication run
  consumer/index.ts      # Redis Streams consumer group + idempotent set
  logical-replication/index.ts  # v2 axis 1 — pgoutput protocol walk
  slot-advance/index.ts         # v2 axis 2 — slot create → advance → drop
  pgvector/index.ts             # v2 axis 3 — IVFFlat + knn + hybrid + distance
  adapters/
    interface.ts         # 9-op driver contract shared by mock/real
    mock.ts              # orm v0.10 semantics-backed adapter
    real.ts              # POSTGRES_BOOTSTRAP-driven adapter (skip mode default)
  flows/
    postgres-flows.ts    # higher-level flows over the adapter
    fidelity.ts          # trace diff + quality-metrics release-gate report
tests/
  outbox-e2e.spec.ts               # T-DPO-* — outbox invariants
  replication-lag-e2e.spec.ts      # T-DPR-* — replication + failover
  at-least-once-e2e.spec.ts        # T-DPA-* — idempotent consumer
  e2e-mock-mode.test.ts            # T-DPE-M-* — 5-op adapter surface E2E
  fidelity-report.test.ts          # T-DPF-* — fidelity harness output
  emit-fidelity-report.test.ts     # T-DPE-EM-* — quality-report/ writeback
  real-adapter-probe.test.ts       # T-DPR-ENV-* — env-gated probe
  logical-replication-advanced.test.ts # T-DPE-LR-* — v2 axis 1
  slot-advance.test.ts             # T-DPE-SA-* — v2 axis 2
  pgvector.test.ts                 # T-DPE-PV-* — v2 axis 3
  testcontainers-probe.test.ts     # T-DPE-TC-* — v2 axis 4
  e2e/                             # Playwright specs (v1.32-2 axis 4 gate)
    v1-legacy-flow.spec.ts
    logical-replication-slot-flow.spec.ts
    testcontainers-probe-flow.spec.ts
    fixture.ts
  perf/dogfood-postgres-cdc-outbox-app.perf.ts # 3-layer perf report
```

## Running

```sh
pnpm --filter dogfood-postgres-cdc-outbox-app test
pnpm --filter dogfood-postgres-cdc-outbox-app test:perf
pnpm --filter dogfood-postgres-cdc-outbox-app test:e2e
pnpm --filter dogfood-postgres-cdc-outbox-app typecheck
```

To exercise the connected real adapter probe (aliveness + testcontainers
probe only in v1.32-2, higher-level ops land in v1.32-6):

```sh
POSTGRES_BOOTSTRAP=postgres://user:pass@localhost:5432/orders \
POSTGRES_IMAGE=postgres:16-bookworm \
PGVECTOR_IMAGE=pgvector/pgvector:pg16 \
  pnpm --filter dogfood-postgres-cdc-outbox-app test
```

## Quality report

Latest fidelity snapshot lands at `quality-report/fidelity-latest.md` after
`emit-fidelity-report.test.ts` runs. The rendered docs-site version lives at
[`docs/quality-reports/db/postgres-cdc-outbox-app.md`](../../docs/quality-reports/db/postgres-cdc-outbox-app.md).
