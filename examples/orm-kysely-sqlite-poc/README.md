# orm-kysely-sqlite-poc — kiwa ORM query test PoC (Kysely + in-memory SQLite)

`@kiwa/orm` v0.4 を **Kysely query builder + in-memory SQLite (better-sqlite3)** で使う PoC。 既存 Drizzle / Prisma 経路と同じ `setupOrmEnv` API で Kysely 経路を呼出す reference。

## 構造

```
orm-kysely-sqlite-poc/
├── src/
│   ├── schema.ts            # Kysely Database interface (UsersTable + PostsTable)
│   ├── migration.sql.ts     # 初期 SQLite SQL
│   └── users-repo.ts        # production-shape Repository class
└── tests/
    └── users-repo.test.ts   # 8 test (create / duplicate / cascade / FK / 並行 / cleanup)
```

## 実行

```bash
pnpm install
pnpm -F examples-orm-kysely-sqlite-poc test
# → 8 test 全 pass、 数百ms で完了 (in-memory SQLite、 Docker 不要)
```

## kiwa の動き

1. `setupOrmEnv({ mode: 'mock', orm: 'kysely', dialect: 'sqlite', schema, migrations })` 呼出
2. kiwa が `:memory:` で better-sqlite3 を起動、 `PRAGMA foreign_keys = ON` 有効化
3. `new Kysely<Database>({ dialect: new SqliteDialect({ database: raw }) })` で query builder 構築
4. migration SQL を sequential 適用、 seed callback 実行
5. test 中は `env.db.selectFrom('users').where(...).execute()` で型安全 query
6. `env.stop()` で Kysely `destroy()` → better-sqlite3 `close()`

## Drizzle / Prisma 経路との対比

| 観点 | Drizzle (mock SQLite) | Prisma (mock SQLite) | Kysely (mock SQLite) |
|---|---|---|---|
| schema 形式 | TS schema (`sqliteTable(...)`) | `schema.prisma` DSL | TypeScript interface (`Database`) |
| migration | SQL string で `migrations` 引数 | `prisma db push` を kiwa が spawn | SQL string で `migrations` 引数 (Drizzle と同形) |
| client | `env.db.select().from(users)` | `env.client.user.findMany()` | `env.db.selectFrom('users').selectAll().execute()` |
| client 型生成 | drizzle-kit (任意) | `prisma generate` 必須 | `kysely-codegen` (任意) or 手書き interface |
| 性質 | ORM (table 概念) | ORM (model + 関連 概念) | query builder (SQL 思考そのまま) |

## 観点 cover

| ID | 観点 |
|---|---|
| T-KY-001 | 正常系 — create + findByEmail round-trip |
| T-KY-002 | 異常系 — 重複 email → duplicate-email (UNIQUE constraint) |
| T-KY-003 | 境界値 — 存在しない email → null |
| T-KY-004 | 状態遷移 — user delete → posts cascade (SQLite ON DELETE CASCADE) |
| T-KY-005 | 入力 — Kysely 型安全 where filter |
| T-KY-006 | FK — orphan post insert で FOREIGN KEY reject |
| T-KY-007 | 並行隔離 — 別 :memory: で各 env 独立 |
| T-KY-008 | cleanup — stop() で raw connection close 確認 |

## 関連

- 上位 Issue ... CAR-294 (#527-4 Kysely adapter)
- 親 Issue ... CAR-291 (#527)
- 親 PR ... 本 PR (`feature/527-4-orm-kysely`)
- runtime fixture ... [`@kiwa/orm`](../../packages/orm/README.md) v0.4
- 関連 PoC ... [`orm-drizzle-sqlite-poc`](../orm-drizzle-sqlite-poc/README.md) (Drizzle mock) / [`orm-prisma-sqlite-poc`](../orm-prisma-sqlite-poc/README.md) (Prisma) / [`orm-drizzle-postgres-poc`](../orm-drizzle-postgres-poc/README.md) (Drizzle PG) / [`orm-drizzle-mysql-poc`](../orm-drizzle-mysql-poc/README.md) (Drizzle MySQL)
