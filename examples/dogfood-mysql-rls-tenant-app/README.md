# dogfood-mysql-rls-tenant-app

Dogfood app for v1.32-3 — a Nuxt 3 + Prisma + MySQL 8 multi-tenant SaaS
with row-level security policies + automatic `tenant_id` injection +
cross-tenant refuse + tamper-evident audit log + v2 advanced db semantics
(MySQL 8 group replication + binlog / GTID / ROW / gap + MySQL Router
R/W split via pool advanced + MySQL 8 + Router testcontainers probe),
exercising the 4 v1 patterns `@kiwa-lab/orm` (v0.9) promises for MySQL 8
RLS + 4 v2 axes `@kiwa-lab/orm` v0.10 promises for MySQL advanced db
semantics:

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

v2 axes (v1.32-3):

5. **Group replication** — MySQL 8 group_replication + performance_schema
   walk (empty → joined → primary-elected → conflict-detected →
   member-left) driven through `@kiwa-lab/orm` v0.10's
   `createMysqlClusterSession` + `joinClusterMember` +
   `electClusterPrimary` + `detectClusterConflict` + `leaveClusterMember`.
6. **Binlog advance** — MySQL 8 binlog position advance + GTID set update
   + ROW format negotiate + GTID gap detect driven through orm v0.10's
   `createBinlogSession` + `advanceBinlogPosition` + `updateGtidSet` +
   `negotiateBinlogFormat` + `detectGtidGap`.
7. **Router R/W split** — MySQL Router-modeled pool advanced walk
   (cold → healthy → warmed-up → draining → metrics-exported) with
   read + write route hit accounting driven through orm v0.10's
   `createPoolAdvancedSession` + `runPoolHealthCheck` +
   `warmPoolConnections` + `drainPoolGracefully` + `exportPoolMetrics`.
8. **Testcontainers duck-type probe** — MySQL 8 + MySQL Router container
   image lookup + `host:port` echo, `MYSQL_KEY`-gated + `MYSQL_IMAGE` /
   `MYSQL_ROUTER_IMAGE` overrides for v1.32-6 wiring.

All 8 axes are driven end-to-end through a provider-neutral adapter
(`src/adapters/interface.ts`) with mock (`src/adapters/mock.ts`) and real
(`src/adapters/real.ts`) implementations. The real adapter is
`MYSQL_KEY`-gated so `KIWA_MODE=real` can hand off to a testcontainers
MySQL 8 broker without breaking CI mock runs.

## Layout

```
src/
  tenant/index.ts             # organization store + tenant_id column contract
  rls/index.ts                # RLS gate + cross-tenant refusal + bypass window
  audit/index.ts              # tamper-evident audit chain + session drain
  group-replication/index.ts  # v2 axis 1 — group_replication + performance_schema
  binlog-advance/index.ts     # v2 axis 2 — binlog + GTID + ROW + gap
  router-split/index.ts       # v2 axis 3 — Router-modeled pool advanced R/W split
  adapters/
    interface.ts              # 9-op driver contract shared by mock/real
    mock.ts                   # orm-semantics-backed adapter
    real.ts                   # MYSQL_KEY-driven adapter (skip mode default)
  flows/
    mysql-flows.ts            # higher-level flows over the adapter
    fidelity.ts               # trace diff + quality-metrics release-gate report
tests/
  tenant-isolation-e2e.spec.ts       # T-DMT-* — tenant_id contract (v1)
  bypass-rls-refuse-e2e.spec.ts      # T-DMB-* — bypass window + audit (v1)
  audit-log-e2e.spec.ts              # T-DMA-* — audit chain invariants (v1)
  e2e-mock-mode.test.ts              # T-DME-M-* — 5-op adapter surface E2E (v1)
  group-replication.test.ts          # T-DMG-* — group replication 4-state walk (v2)
  binlog-advance.test.ts             # T-DMB-* — binlog position + gtid + format + gap (v2)
  router-split.test.ts               # T-DMR-* — Router R/W split + pool advanced (v2)
  testcontainers-probe.test.ts       # T-DMTC-* — mysql + router image echo (v2)
  fidelity-report.test.ts            # T-DMF-* — fidelity harness output (9-op)
  emit-fidelity-report.test.ts       # T-DME-EM-* — quality-report/ writeback (9-op)
  real-adapter-probe.test.ts         # T-DMR-ENV-* — env-gated probe
  e2e/
    fixture.ts                       # ad-hoc HTTP server + browser-cache detect
    v1-legacy-flow.spec.ts           # v1 tenant / bypass / audit journey
    group-replication-router-flow.spec.ts  # v2 group + binlog + router journey
    testcontainers-probe-flow.spec.ts      # v2 mysql + router image echo
  perf/dogfood-mysql-rls-tenant-app.perf.ts # 3-layer perf report
```

## Running

```sh
pnpm --filter dogfood-mysql-rls-tenant-app test
pnpm --filter dogfood-mysql-rls-tenant-app test:e2e
pnpm --filter dogfood-mysql-rls-tenant-app test:perf
pnpm --filter dogfood-mysql-rls-tenant-app typecheck
```

To exercise the connected real adapter probe (aliveness only in v1.32-3):

```sh
MYSQL_KEY=mysql://user:pass@localhost:3306/kiwa \
  pnpm --filter dogfood-mysql-rls-tenant-app test
```

## Quality report

Latest fidelity snapshot lands at `quality-report/fidelity-latest.md`
after `emit-fidelity-report.test.ts` runs. The rendered docs-site version
lives at
[`docs/quality-reports/db/mysql-rls-tenant-app.md`](../../docs/quality-reports/db/mysql-rls-tenant-app.md).
