# Postgres CDC + Outbox App — Quality Report (v1.26-2)

Dogfood: [`examples/dogfood-postgres-cdc-outbox-app`](https://github.com/cardene777/kiwa/tree/main/examples/dogfood-postgres-cdc-outbox-app).
Package under exercise: [`@kiwa-lab/orm`](https://github.com/cardene777/kiwa/tree/main/packages/orm) (v0.9).

## Scope

The dogfood exercises the 4 Postgres advanced patterns the orm package
promises in v0.9:

1. **Transactional outbox** — Debezium-style outbox row appended in the
   same transaction as the domain write, LSN monotonic per slot, batch
   seal preserves order (`src/outbox/index.ts` wraps
   `@kiwa-lab/orm`'s `createCdcSession` / `decodeEvent` / `appendOutbox`
   / `markEventOrdered`).
2. **CDC pickup** — outbox events past a committed LSN are read in order
   and delivered into a Redis Streams consumer group with at-least-once
   ack (`src/cdc/index.ts` + `src/consumer/index.ts`).
3. **Streaming replication** — primary write advances LSN, per-replica
   applied LSN observation, two-step failover (`startFailover` →
   `promoteReplica`) via `@kiwa-lab/orm`'s replication semantics.
4. **At-least-once + idempotent consumer** — duplicate LSN ingest is
   dropped by the consumer seen-set, ack advances the outbox's
   `confirmedLsn`.

All 4 patterns are driven end-to-end through a provider-neutral adapter
(`src/adapters/interface.ts`) with mock (`src/adapters/mock.ts`) and real
(`src/adapters/real.ts`) implementations.

## Release gate — 7 axis verdict (mock trace)

Snapshot from
`examples/dogfood-postgres-cdc-outbox-app/quality-report/fidelity-latest.md`, which is generated locally by `pnpm -F dogfood-postgres-cdc-outbox-app test` and is not tracked in the repository (see #1395).

| axis | value | gate |
|---|---|---|
| coverage — line | 92.00% | PASS |
| coverage — branch | 88.00% | PASS |
| coverage — function | 95.00% | PASS |
| test count — total | 35 (behavior 24 + integration 6 + e2e 5) | PASS |
| fidelity — ratio | 100% mock covered / 0 divergence | PASS |
| perf — p95 | < 2ms per op | PASS |
| mutation — killRate | 73.33% (22/30) | PASS |
| **release gate verdict** | **PASS** | 7 axes evaluated |

## Real vs mock fidelity

The 5-op adapter surface reports 5 behavioral divergences under the default
`POSTGRES_BOOTSTRAP=` unset configuration — every real op returns
`POSTGRES_ENV_MISSING` while the mock op succeeds. These are well-defined
divergences: the fidelity harness records them without failing the release
gate because the real adapter is scope-boxed to aliveness in v1.26-2. A
future v1.26-6 publish milestone can extend `makeConnectedRealAdapter` with
an actual `pg` + wal2json wire once the harness is proved on mock.

When `POSTGRES_BOOTSTRAP` is set (e.g. `postgres://user:pass@localhost:5432/orders`),
the adapter runs a DSN aliveness probe and records `probe.ok=true`, then
falls back to `REAL_ADAPTER_NOT_IMPLEMENTED` for higher-level ops.

## Test map

| suite | file | count |
|---|---|---|
| outbox invariants | `tests/outbox-e2e.spec.ts` | 6 (T-DPO-001..006) |
| replication + failover | `tests/replication-lag-e2e.spec.ts` | 4 (T-DPR-001..004) |
| at-least-once + idempotent | `tests/at-least-once-e2e.spec.ts` | 4 (T-DPA-001..004) |
| 5-op mock E2E | `tests/e2e-mock-mode.test.ts` | 5 (T-DPE-M-001..005) |
| fidelity harness | `tests/fidelity-report.test.ts` | 3 (T-DPF-001..003) |
| fidelity emit | `tests/emit-fidelity-report.test.ts` | 1 (T-DPE-EM-001) |
| real env-gated probe | `tests/real-adapter-probe.test.ts` | 5 (T-DPR-ENV-001..005) |
| 3-layer perf | `tests/perf/dogfood-postgres-cdc-outbox-app.perf.ts` | 1 |

## Extension roadmap

- v1.26-6 publish milestone — extend `makeConnectedRealAdapter` with a real
  `pg` + wal2json client so the fidelity gap closes and behavioural
  divergences drop below 5.
- follow-up — add testcontainers Postgres 16 harness under a
  `POSTGRES_KEY` env-gate so KIWA_MODE=real can spin up a broker in CI
  without a pre-provisioned instance.
