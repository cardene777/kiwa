---
"@kiwa-test/orm": minor
---

🆕 feat(orm): `@kiwa-test/orm` v0.1.0 — ORM query test adapter MVP

Drizzle ORM + in-memory SQLite を対象に `setupOrmEnv({ mode: 'mock', orm: 'drizzle', dialect: 'sqlite', schema, migrations?, seed? })` + `expectQuery(env, sql, expected, expect)` + `expectRowCount(env, table, n, expect)` を提供する Layer 2 fixture。 Docker 不要、 type-safe、 並行 env 隔離を保証する。

Pattern A (Dependency Injection) で production-shape repository を `setupOrmEnv` で取得した `env.db` に対してそのまま test できる流儀を採用、 follow-up Issue #527-2 .. #527-5 で testcontainers (Postgres / MySQL) + Prisma + Kysely + 追加 PoC を順次拡張予定。

関連: Issue #527 (v1.2 milestone)、 PoC `examples/orm-drizzle-sqlite-poc/`、 skill `/kiwa-orm`、 design layer `--layer orm-query`。
