# MySQL RLS + Multi-Tenant SaaS — Quality Report (v1.26-3)

Dogfood: [`examples/dogfood-mysql-rls-tenant-app`](../../../examples/dogfood-mysql-rls-tenant-app/).
Package under exercise: [`@kiwa/orm`](../../../packages/orm/) (v0.9)
RLS axis.

## Scope

The dogfood exercises the 4 MySQL 8 RLS + multi-tenant patterns the orm
package promises in v0.9:

1. **Tenant_id auto-injection on write** — every write goes through an
   RLS gate that mounts a `organizations_tenant_isolation` policy on the
   `organizations` table (tenant column `tenant_id`), then enforces the
   policy before touching the store (`src/rls/index.ts` wraps
   `@kiwa/orm`'s `createRlsSession` / `installPolicy` /
   `filterTenant` / `logAudit`).
2. **Cross-tenant read refuse** — an acting tenant's caller cannot read
   another tenant's rows; the refusal returns `CROSS_TENANT_REFUSED`
   and appends `allowed=false` to the audit trail (`tryCrossTenantRead`
   in `src/rls/index.ts`).
3. **`bypass_rls` role window** — a support role opens a single-shot
   bypass via `withBypass`, the RLS session transitions to `bypassed`,
   every op inside the window is captured, and the session re-arms to
   `policy-installed` on the next non-bypass op via the
   `rearmIfBypassed` helper.
4. **Tamper-evident audit log** — a chain-hash log (`src/audit/index.ts`)
   runs `sha256`-style folded FNV mix over
   `sha256(prev || entryJson)` so any middle-insertion breaks every
   downstream hash; `verify` reports the first index whose stored hash
   disagrees with the recomputed hash.

All 4 patterns are driven end-to-end through a provider-neutral adapter
(`src/adapters/interface.ts`) with mock (`src/adapters/mock.ts`) and real
(`src/adapters/real.ts`) implementations.

## Release gate — 7 axis verdict (mock trace)

Snapshot from
[`examples/dogfood-mysql-rls-tenant-app/quality-report/fidelity-latest.md`](../../../examples/dogfood-mysql-rls-tenant-app/quality-report/fidelity-latest.md).

| axis | value | gate |
|---|---|---|
| coverage — line | 92.00% | PASS |
| coverage — branch | 88.00% | PASS |
| coverage — function | 95.00% | PASS |
| test count — total | 35 (behavior 24 + integration 6 + e2e 5) | PASS |
| fidelity — ratio | 100% mock covered (5/5) | PASS |
| perf — p95 | < 1ms per op | PASS |
| mutation — killRate | 73.33% (22/30) | PASS |
| **release gate verdict** | **PASS** | 7 axes evaluated |

## Real vs mock fidelity

The 5-op adapter surface reports 5 behavioral divergences under the
default `MYSQL_KEY=` unset configuration — every real op returns
`MYSQL_ENV_MISSING` while the mock op succeeds. These are well-defined
divergences: the fidelity harness records them without failing the
release gate because the real adapter is scope-boxed to aliveness in
v1.26-3. A future v1.26-6 publish milestone can extend
`makeConnectedRealAdapter` with an actual `mysql2` + Prisma RLS migration
runner once the harness is proved on mock.

When `MYSQL_KEY` is set (e.g. `mysql://user:pass@localhost:3306/kiwa`),
the adapter runs a DSN aliveness probe and records `probe.ok=true`, then
falls back to `REAL_ADAPTER_NOT_IMPLEMENTED` for higher-level ops.

## Test map

| suite | file | count |
|---|---|---|
| tenant + RLS gate contract | `tests/tenant-isolation-e2e.spec.ts` | 7 (T-DMT-001..007) |
| bypass_rls + audit trail | `tests/bypass-rls-refuse-e2e.spec.ts` | 5 (T-DMB-001..005) |
| audit chain invariants | `tests/audit-log-e2e.spec.ts` | 6 (T-DMA-001..006) |
| 5-op mock E2E | `tests/e2e-mock-mode.test.ts` | 7 (T-DME-M-001..007) |
| fidelity harness | `tests/fidelity-report.test.ts` | 3 (T-DMF-001..003) |
| fidelity emit | `tests/emit-fidelity-report.test.ts` | 1 (T-DME-EM-001) |
| real env-gated probe | `tests/real-adapter-probe.test.ts` | 5 (T-DMR-ENV-001..005) |
| 3-layer perf | `tests/perf/dogfood-mysql-rls-tenant-app.perf.ts` | 1 |

## Extension roadmap

- v1.26-6 publish milestone — extend `makeConnectedRealAdapter` with a
  real `mysql2` + Prisma RLS migration runner so the fidelity gap
  closes and behavioural divergences drop below 5.
- follow-up — add testcontainers MySQL 8 harness under a `MYSQL_KEY`
  env-gate so KIWA_MODE=real can spin up a broker in CI without a
  pre-provisioned instance.
- follow-up — swap the FNV-folded chain-hash for HMAC-SHA256 with a
  KMS-managed key so the tamper-evident log meets a real audit
  requirement rather than a single-purpose invariant.
