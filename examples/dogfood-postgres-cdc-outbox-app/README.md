# dogfood-postgres-cdc-outbox-app

Dogfood app for v1.26-2 — a Postgres 16 logical replication + Debezium-style
outbox + Redis Streams consumer pipeline that exercises the 4 patterns
`@kiwa-test/orm` (v0.9) promises for Postgres:

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

The dogfood is driven end-to-end through a provider-neutral adapter
(`src/adapters/interface.ts`) with two implementations:

- `makeMockAdapter()` — backed by `@kiwa-test/orm`'s CDC + logical-replication
  + replication + connection-pool semantics. Default for CI + local.
- `makeRealAdapter()` — probes a Postgres 16 broker via `POSTGRES_BOOTSTRAP`
  (env-skip when the var is missing; DSN aliveness probe when it is set).
  Higher-level ops report `REAL_ADAPTER_NOT_IMPLEMENTED` in the v1.26-2 scope
  so the fidelity harness records a well-defined divergence.

## Layout

```
src/
  outbox/index.ts        # Debezium-style outbox + LSN monotonic seal
  cdc/index.ts           # pickup + logical-replication publication run
  consumer/index.ts      # Redis Streams consumer group + idempotent set
  adapters/
    interface.ts         # 5-op driver contract shared by mock/real
    mock.ts              # orm-semantics-backed adapter
    real.ts              # POSTGRES_BOOTSTRAP-driven adapter (skip mode default)
  flows/
    postgres-flows.ts    # higher-level flows over the adapter
    fidelity.ts          # trace diff + quality-metrics release-gate report
tests/
  outbox-e2e.spec.ts     # T-DPO-* — outbox invariants
  replication-lag-e2e.spec.ts # T-DPR-* — replication + failover
  at-least-once-e2e.spec.ts   # T-DPA-* — idempotent consumer
  e2e-mock-mode.test.ts       # T-DPE-M-* — 5-op adapter surface E2E
  fidelity-report.test.ts     # T-DPF-* — fidelity harness output
  emit-fidelity-report.test.ts # T-DPE-EM-* — quality-report/ writeback
  real-adapter-probe.test.ts  # T-DPR-ENV-* — env-gated probe
  perf/dogfood-postgres-cdc-outbox-app.perf.ts # 3-layer perf report
```

## Running

```sh
pnpm --filter dogfood-postgres-cdc-outbox-app test
pnpm --filter dogfood-postgres-cdc-outbox-app test:perf
pnpm --filter dogfood-postgres-cdc-outbox-app typecheck
```

To exercise the connected real adapter probe (aliveness only in v1.26-2):

```sh
POSTGRES_BOOTSTRAP=postgres://user:pass@localhost:5432/orders \
  pnpm --filter dogfood-postgres-cdc-outbox-app test
```

## Quality report

Latest fidelity snapshot lands at `quality-report/fidelity-latest.md` after
`emit-fidelity-report.test.ts` runs. The rendered docs-site version lives at
[`docs/quality-reports/db/postgres-cdc-outbox-app.md`](../../docs/quality-reports/db/postgres-cdc-outbox-app.md).
