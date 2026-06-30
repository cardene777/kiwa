---
"@kiwa-test/orm": minor
---

🆕 feat(orm): `@kiwa-test/orm` v0.4.0 — Kysely adapter (SQLite + Postgres + MySQL)

`OrmBrand` に `'kysely'` を追加、 `mode: 'mock' + orm: 'kysely' + dialect: 'sqlite'` / `mode: 'live' + orm: 'kysely' + dialect: 'postgres'|'mysql'` の 3 dialect 一気に受入。 既存 Drizzle (v0.1-v0.2.1) / Prisma (v0.3) 経路は完全 backward compatible。

新 API ... `KyselyDatabase` 型 + `MockKyselySqliteOptions` / `LiveKyselyPostgresOptions` / `LiveKyselyMysqlOptions` + `OrmTestEnvMockKysely` / `OrmTestEnvLiveKyselyPostgres` / `OrmTestEnvLiveKyselyMysql`。 `setupOrmEnv` overload を 7 種に拡張、 `env.db: Kysely<Database>` で公開、 `env.raw` には better-sqlite3 / pg.Pool / mysql2 Pool を露出。 `expectQuery` / `expectRowCount` は `env.orm === 'kysely'` 分岐で pg.Pool.query / mysql2 query を dispatch。

caller は phantom-typed `Database` interface を `schema` として渡す形式 (kiwa-codegen 等で生成 or 手書き)。 既存 Drizzle / Prisma と同じ Pattern A (DI) でテストを書ける。

関連: Linear CAR-294 (#527-4 Kysely adapter)、 PoC `examples/orm-kysely-sqlite-poc/`、 残 follow-up = Prisma + testcontainers (CAR-293 残) / file migration (CAR-295)。
