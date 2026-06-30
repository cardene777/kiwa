---
"@kiwa-test/orm": patch
---

🆕 feat(orm): `@kiwa-test/orm` v0.2.1 — MySQL dialect via testcontainers

Drizzle ORM + MySQL (`mode: 'live' + dialect: 'mysql'`) を `setupOrmEnv` で受け入れ、 testcontainers (`@testcontainers/mysql`) で MySQL 8.x container を per-env で起動する。 既存 v0.1 (mock SQLite) / v0.2 (live Postgres) は完全 backward compatible。

新 API ... `LiveMysqlOptions` 型 + `OrmTestEnvLiveMysql` (`db: DrizzleMysqlDb` + `raw: mysql2 Pool` + `connectionUri`)、 `setupOrmEnv` overload 3 (mock SQLite / live Postgres / live MySQL) で seed callback の引数型が dialect 別に narrow。 `expectQuery` / `expectRowCount` は MySQL の `pool.query` 経路を内部 dispatch、 識別子 quoting も backtick で MySQL 規約準拠。

Docker daemon 不在検知は Postgres と同流儀、 PoC test は `dockerode` ping で early return。

関連: Linear CAR-298 (#527-2 MySQL follow-up)、 PoC `examples/orm-drizzle-mysql-poc/`、 残 follow-up = Prisma (CAR-293) / Kysely (CAR-294) / file migration (CAR-295)。
