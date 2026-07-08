# orm-prisma-sqlite-poc — kiwa ORM query test PoC (Prisma + tempdir SQLite)

`@kiwa/orm` v0.3 を **Prisma + SQLite (file-based in isolated tempdir)** で使う PoC。 既存 Drizzle 経路 (SQLite mock / Postgres / MySQL live) と同じ `setupOrmEnv` API で Prisma adapter を呼出す reference。

## 構造

```
orm-prisma-sqlite-poc/
├── prisma/
│   ├── schema.prisma        # Prisma schema (User + Post FK cascade)
│   └── generated/           # prisma generate 出力 (.gitignore 対象)
├── src/
│   └── users-repo.ts        # production-shape Repository
└── tests/
    └── users-repo.test.ts   # 8 test (create / duplicate / cascade / 並行 / seed / cleanup)
```

## 実行

```bash
pnpm install
pnpm -F examples-orm-prisma-sqlite-poc test
# → 1) @kiwa/orm build  2) prisma generate  3) vitest run
# → 8 test 全 pass、 数秒で完了 (file-based SQLite、 Docker 不要)
```

## kiwa の動き

1. `setupOrmEnv({ mode: 'mock', orm: 'prisma', dialect: 'sqlite', prismaClient: PrismaClient, schemaPath })` 呼出
2. kiwa が tempdir `.db` file を作成、 `DATABASE_URL=file:/tmp/.../test.db` を `process.env` に set
3. `pnpm exec prisma db push --schema=<schemaPath>` を spawn、 schema を tempdir DB に適用
4. caller が渡した `PrismaClient` ctor に `{ datasourceUrl }` を inject して instance 生成
5. test 中は `env.client.user.create({...})` 等で通常通り Prisma 操作
6. `env.stop()` で PrismaClient `$disconnect` → tempdir 削除 → `DATABASE_URL` 復元

## Drizzle 経路との対比

| 観点 | Drizzle (mock SQLite) | Prisma (mock SQLite) |
|---|---|---|
| schema 形式 | TS schema (`sqliteTable(...)`) | `schema.prisma` DSL |
| migration | SQL string で `setupOrmEnv({ migrations })` | `prisma db push` を kiwa が spawn |
| client | `env.db.select().from(users)` | `env.client.user.findMany()` |
| in-memory | `:memory:` (高速、 prepare 0ms) | file-based 必須、 tempdir (~100ms 初期化) |
| FK / unique error | message 文字列で判定 | Prisma error code (`P2002` 等) で判定 |

## 観点 cover

| ID | 観点 |
|---|---|
| T-PR-001 | 正常系 — create + findByEmail round-trip |
| T-PR-002 | 異常系 — 重複 email → duplicate-email (P2002) |
| T-PR-003 | 境界値 — 存在しない email → null |
| T-PR-004 | 状態遷移 — user delete → posts cascade (onDelete: Cascade) |
| T-PR-005 | 並行隔離 — 別 tempdir で datasourceUrl 一意 |
| T-PR-006 | cleanup — stop() で dbPath 削除確認 |
| T-PR-007 | seed callback — 起動時に client 経由初期化 |
| T-PR-008 | 公開 API — datasourceUrl が `file:` URL |

## 関連

- 上位 Issue ... CAR-293 (#527-3 Prisma adapter)
- 親 Issue ... CAR-291 (#527)
- 親 PR ... 本 PR (`feature/527-3-orm-prisma-sqlite`)
- runtime fixture ... [`@kiwa/orm`](../../packages/orm/README.md) v0.3
- 関連 PoC ... [`orm-drizzle-sqlite-poc`](../orm-drizzle-sqlite-poc/README.md) (mock) / [`orm-drizzle-postgres-poc`](../orm-drizzle-postgres-poc/README.md) (live PG) / [`orm-drizzle-mysql-poc`](../orm-drizzle-mysql-poc/README.md) (live MySQL)
