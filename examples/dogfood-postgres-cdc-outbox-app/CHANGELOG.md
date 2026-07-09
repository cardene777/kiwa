# dogfood-postgres-cdc-outbox-app

## 0.0.2

### Patch Changes

- v1.32-2 real driver extension. Adds 4 v2 axes on top of the v1
  (v1.26-2) 5-op surface: Postgres 16 logical replication advanced
  (pgoutput start + origin tracking + two-safe commit + cascade sync),
  replication slot advance (create + advance past retained WAL + drop),
  pgvector IVFFlat + cosine k-NN + hybrid search + raw distance, and
  Postgres 16 + pgvector testcontainers duck-typing probe. Adapter
  surface expands from 5 → 9 ops; both mock (backed by
  `@kiwa-lab/orm` v0.10 semantics) and real (env-gated on
  `POSTGRES_BOOTSTRAP`, connected variant echoes the container-mapped
  host:port + image tags) implement the full surface. Playwright e2e
  covers v1 legacy + logical-replication + slot-advance + pgvector +
  testcontainers-probe flows.

## 0.0.1

### Patch Changes

- Initial release (v1.26-2) — Next.js 15 + Drizzle + Postgres 16 logical
  replication + Debezium-style outbox + Redis Streams consumer dogfood on top
  of `@kiwa-lab/orm` v0.9 advanced db semantics (CDC + logical-replication +
  replication + connection-pool + partitioning + RLS + MVCC + vector-store
  axes).
