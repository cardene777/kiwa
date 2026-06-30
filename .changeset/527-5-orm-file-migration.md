---
"@kiwa-test/orm": minor
---

🆕 feat(orm): `@kiwa-test/orm` v0.5.0 — file-based migration (drizzle-orm/migrator)

`MigrationSource` を `string | string[] | { folder: string }` の union に拡張、 `{ folder }` 形式を渡すと kiwa が dialect 別に drizzle-orm/migrator (`drizzle-orm/better-sqlite3/migrator` / `drizzle-orm/postgres-js/migrator` / `drizzle-orm/mysql2/migrator`) を import + `migrate(db, { migrationsFolder })` を実行する。 既存 `string` / `string[]` 形式は完全 backward compatible。

drizzle-kit generate で出力した production migration file (`drizzle/0000_init.sql` + `meta/_journal.json`) をそのまま test 経路で適用可能、 production と test で migration を共有できる流儀を確立。 Kysely / Prisma 経路は対象外で、 folder を渡すと説明的 Error を throw (Kysely callers should use their own Migrator class)。

関連: Linear CAR-295 (#527-5 file-based migration)、 PoC `examples/orm-drizzle-file-migration-poc/`、 残 follow-up = Prisma + testcontainers (CAR-293 残)。
