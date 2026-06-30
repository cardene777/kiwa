---
"@kiwa-test/orm": minor
---

🆕 feat(orm): `@kiwa-test/orm` v0.6.0 — Prisma + testcontainers Postgres (v1.2 ORM milestone 完遂)

`setupOrmEnv({ mode: 'live', orm: 'prisma', dialect: 'postgres', prismaClient, schemaPath })` を受入、 testcontainers Postgres を起動し `DATABASE_URL` を `process.env` に inject + `prisma db push` を spawn して schema 適用、 caller の PrismaClient を `{ datasourceUrl }` で構築する。 既存 v0.1-v0.5 経路は完全 backward compatible。

新 API ... `LivePrismaPostgresOptions` 型 + `OrmTestEnvLivePrismaPostgres` (`client: TClient` + `connectionUri: string`)。 `expectQuery` / `expectRowCount` は `env.orm === 'prisma' && env.dialect === 'postgres'` 分岐で `client.$queryRawUnsafe` を経由。

v0.6 で v1.2 ORM milestone (CAR-291 / #527) の主要 sub-Issue 7 件が完遂、 受入 matrix は 9 組合せ (Drizzle 3 + Prisma 2 + Kysely 3 + file migration) に達した。 残 future follow-up = Prisma + MySQL testcontainers のみ。

関連: Linear CAR-305 (#527-3 follow-up Prisma + testcontainers Postgres)、 PoC `examples/orm-prisma-postgres-poc/`、 parent CAR-291 完遂。
