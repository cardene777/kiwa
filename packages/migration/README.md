# @kiwa-lab/migration

DB migration mock harness for kiwa — Prisma / Drizzle / Kysely / Knex を統一 interface で invoke する in-process mock。

## API

- `createMigrationClient(options)` = provider mock client (runUp / runDown / applyPendingMigrations / listAppliedMigrations)
- `diffSchema(prev, next)` = schema diff (added / removed / changed columns/tables)
- `runUp(client, migration)` = 1 migration の up 実行
- `runDown(client, migration)` = 1 migration の down 実行
- `applyPendingMigrations(client, migrations)` = pending 全て順次適用
- `listAppliedMigrations(client)` = 適用済 migration history 取得
