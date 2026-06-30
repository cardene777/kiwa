---
"@kiwa-test/orm": minor
---

🆕 feat(orm): `@kiwa-test/orm` v0.3.0 — Prisma adapter (SQLite + tempdir)

`OrmBrand` に `'prisma'` を追加し、 `mode: 'mock' + orm: 'prisma' + dialect: 'sqlite'` を `setupOrmEnv` で受け入れる。 既存 Drizzle 経路 (v0.1 mock SQLite / v0.2 live Postgres / v0.2.1 live MySQL) は完全 backward compatible。

新 API ... `MockPrismaSqliteOptions` (caller の `PrismaClient` 構造体 + `schemaPath` + 任意の `datasourceUrlEnv` を受ける) + `OrmTestEnvMockPrisma` (`client: TClient` + `dbPath` + `datasourceUrl`)。 kiwa は per-env tempdir に `.db` を作成し、 `DATABASE_URL` 環境変数を一時 inject + `pnpm exec prisma db push --schema=<path>` を spawn して schema 適用、 caller の PrismaClient を `{ datasourceUrl }` で構築する。 `stop()` で `$disconnect` + tempdir 削除 + env var 復元まで一気通貫。

`expectQuery` / `expectRowCount` も Prisma 経路を内部 dispatch、 `client.$queryRawUnsafe` 経由で raw SQL assertion をサポート。 `OrmTestEnv` discriminated union は `env.mode === 'mock' && env.orm === 'prisma'` で narrow 可能。

関連: Linear CAR-293 (#527-3 Prisma adapter)、 PoC `examples/orm-prisma-sqlite-poc/`、 残 follow-up = Prisma + testcontainers (CAR-293 残) / Kysely (CAR-294) / file migration (CAR-295)。
