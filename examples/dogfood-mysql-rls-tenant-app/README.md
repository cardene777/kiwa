# dogfood-mysql-rls-tenant-app

Dogfood app for v1.26-3 — a Nuxt 3 + Prisma + MySQL 8 multi-tenant SaaS
with row-level security policies + automatic `tenant_id` injection +
cross-tenant refuse + tamper-evident audit log, exercising the 4 patterns
`@kiwa-test/orm` (v0.9) promises for MySQL 8 RLS:

1. **Tenant_id auto-injection** — every write goes through an RLS gate
   that enforces `tenant_id` before touching the store, matching what a
   Nuxt 3 `server/api/organization.post.ts` handler does when it copies
   the authenticated session's tenant into the payload.
2. **Cross-tenant read refuse** — an acting tenant's caller cannot read
   another tenant's rows; the refusal returns `CROSS_TENANT_REFUSED` and
   is captured in the RLS audit trail.
3. **`bypass_rls` role window** — a support role can temporarily skip the
   tenant filter (single-shot bypass) and the trail records the
   open+close pair plus every op inside the window.
4. **Tamper-evident audit log** — a running chain-hash over each audit
   entry so post-hoc replay can detect insertions or deletions; the
   `verify` op reports the first index whose stored hash disagrees with
   the recomputed hash.

All 4 patterns are driven end-to-end through a provider-neutral adapter
(`src/adapters/interface.ts`) with mock (`src/adapters/mock.ts`) and real
(`src/adapters/real.ts`) implementations. The real adapter is
`MYSQL_KEY`-gated so `KIWA_MODE=real` can hand off to a testcontainers
MySQL 8 broker without breaking CI mock runs.

## Layout

```
src/
  tenant/index.ts        # organization store + tenant_id column contract
  rls/index.ts           # RLS gate + cross-tenant refusal + bypass window
  audit/index.ts         # tamper-evident audit chain + session drain
  adapters/
    interface.ts         # 5-op driver contract shared by mock/real
    mock.ts              # orm-semantics-backed adapter
    real.ts              # MYSQL_KEY-driven adapter (skip mode default)
  flows/
    mysql-flows.ts       # higher-level flows over the adapter
    fidelity.ts          # trace diff + quality-metrics release-gate report
tests/
  tenant-isolation-e2e.spec.ts       # T-DMT-* — tenant_id contract
  bypass-rls-refuse-e2e.spec.ts      # T-DMB-* — bypass window + audit
  audit-log-e2e.spec.ts              # T-DMA-* — audit chain invariants
  e2e-mock-mode.test.ts              # T-DME-M-* — 5-op adapter surface E2E
  fidelity-report.test.ts            # T-DMF-* — fidelity harness output
  emit-fidelity-report.test.ts       # T-DME-EM-* — quality-report/ writeback
  real-adapter-probe.test.ts         # T-DMR-ENV-* — env-gated probe
  perf/dogfood-mysql-rls-tenant-app.perf.ts # 3-layer perf report
```

## Running

```sh
pnpm --filter dogfood-mysql-rls-tenant-app test
pnpm --filter dogfood-mysql-rls-tenant-app test:perf
pnpm --filter dogfood-mysql-rls-tenant-app typecheck
```

To exercise the connected real adapter probe (aliveness only in v1.26-3):

```sh
MYSQL_KEY=mysql://user:pass@localhost:3306/kiwa \
  pnpm --filter dogfood-mysql-rls-tenant-app test
```

## Quality report

Latest fidelity snapshot lands at `quality-report/fidelity-latest.md`
after `emit-fidelity-report.test.ts` runs. The rendered docs-site version
lives at
[`docs/quality-reports/db/mysql-rls-tenant-app.md`](../../docs/quality-reports/db/mysql-rls-tenant-app.md).
