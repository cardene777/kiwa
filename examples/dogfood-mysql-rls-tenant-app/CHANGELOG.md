# dogfood-mysql-rls-tenant-app

## 0.0.2

### Patch Changes

- v1.32-3 real driver extension. Adds 4 v2 axes on top of the v1
  (v1.26-3) 5-op surface: MySQL 8 group replication + performance_schema
  4-state walk (empty → joined → primary-elected → conflict-detected →
  member-left), binlog advance + GTID set update + ROW format negotiate
  + GTID gap detect, MySQL Router-modeled pool advanced R/W split
  (cold → healthy → warmed-up → draining → metrics-exported) with
  read + write route hit accounting, and MySQL 8 + MySQL Router
  testcontainers duck-typing probe. Adapter surface expands from
  5 → 9 ops; both mock (backed by `@kiwa-test/orm` v0.10 semantics)
  and real (env-gated on `MYSQL_KEY`, connected variant echoes the
  container-mapped host:port + image tags) implement the full surface.
  Playwright e2e covers v1 legacy + group-replication + binlog-advance
  + router-split + testcontainers-probe flows.

## 0.0.1

### Patch Changes

- Initial release (v1.26-3) — Nuxt 3 + Prisma + MySQL 8 multi-tenant
  SaaS dogfood on top of `@kiwa-test/orm` v0.9 RLS semantics
  (tenant_id auto-injection + cross-tenant read refuse + bypass_rls
  audit trail + tamper-evident audit log chain).
