---
"@kiwa-test/orm": minor
---

🆕 feat(orm): `@kiwa-test/orm` v0.2.0 — live mode with testcontainers Postgres

Drizzle ORM + Postgres (`mode: 'live' + dialect: 'postgres'`) を `setupOrmEnv` で受け入れ、 testcontainers (`@testcontainers/postgresql`) で Postgres 16 container を per-env で起動する。 既存 v0.1 (mock SQLite) は完全 backward compatible。

新 API ... `LivePostgresOptions` 型 + `containerImage` option (default `postgres:16-alpine`) + `OrmTestEnvLive` (`db: DrizzlePostgresDb` + `raw: postgres.Sql` + `connectionUri: string`)。 `setupOrmEnv` の overload を mock / live で narrow し、 seed callback の引数型が dialect 別に正しく推論される。 `expectQuery` / `expectRowCount` は両 mode async 化、 SQLite (sync prepare) / Postgres (postgres.js unsafe) を内部で dispatch。

Docker daemon 不在検知は明示的 Error message + PoC test では `dockerode` ping で early return する流儀 (test 自体は skip せず空 pass、 mock 経路のみで pnpm test を回せる)。

関連: Linear CAR-291 (parent) / CAR-292 (#527-2 testcontainers)、 PoC `examples/orm-drizzle-postgres-poc/`、 残 follow-up = MySQL (CAR-292 残) / Prisma (CAR-293) / Kysely (CAR-294) / file migration (CAR-295)。
