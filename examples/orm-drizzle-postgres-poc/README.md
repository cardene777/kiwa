# orm-drizzle-postgres-poc — kiwa ORM query test PoC (Drizzle + Postgres via testcontainers)

`@kiwa/orm` v0.2 を **Drizzle ORM + Postgres (testcontainers)** で使う PoC。 v0.1 の SQLite mock 経路と同じ Pattern A (DI) で `UsersRepository` を 8 test cover。

## 前提

- Docker daemon 起動 (`docker ps` 成功すること)
- testcontainers が `postgres:16-alpine` image を pull できるネットワーク

## 構造

```
orm-drizzle-postgres-poc/
├── src/
│   ├── schema.ts            # Drizzle Postgres schema (users + posts FK cascade)
│   ├── migration.sql.ts     # 初期 Postgres SQL
│   └── users-repo.ts        # production-shape Repository class
└── tests/
    └── users-repo.test.ts   # 8 test (create / duplicate / cascade / FK / case-sensitive / 並行 container 隔離)
```

## 実行

```bash
pnpm install
pnpm -F examples-orm-drizzle-postgres-poc test
# → 8 test 全 pass (Docker daemon 起動済の場合)、 数十秒で完了 (container 起動 overhead 含む)
# → Docker 不在環境では test 自体は skip されず空処理で pass する設計
```

## 観点 cover

| ID | 観点 |
|---|---|
| T-PG-001 | 正常系 — create + findByEmail round-trip |
| T-PG-002 | 異常系 — 重複 email → duplicate-email (Postgres UNIQUE) |
| T-PG-003 | 境界値 — 存在しない email → null |
| T-PG-004 | 状態遷移 — user delete → posts cascade 削除 (Postgres FK) |
| T-PG-005 | 隔離 — 別 user の posts は cascade で消えない |
| T-PG-006 | 入力 — case-sensitive email filter (Postgres collation) |
| T-PG-007 | FK — orphan post insert で foreign key constraint reject |
| T-PG-008 | 並行隔離 — 別 container で connectionUri 一意 |

## v0.1 PoC との対比

`examples/orm-drizzle-sqlite-poc/` (v0.1) と **同じ UsersRepository 形** を Postgres 経路で動かす reference。 ただし以下は dialect 固有の差異あり。

- `serial PRIMARY KEY` (Postgres) vs `INTEGER PRIMARY KEY` (SQLite)
- `BOOLEAN` (Postgres native) vs `INTEGER mode:'boolean'` (SQLite cast)
- error message が異なる (`duplicate key value violates unique constraint` / `violates foreign key constraint`)

production-shape repository は dialect 共有可能。 test の error pattern matcher だけ dialect 別調整。

## 関連

- 上位 Issue ... CAR-292 / [#527-2](https://github.com/cardene777/kiwa/issues/527) (v1.2 ORM testcontainers)
- 親 PR ... 本 PR (`feature/527-2-orm-testcontainers-postgres`)
- runtime fixture ... [`@kiwa/orm`](../../packages/orm/README.md) v0.2
- 関連 PoC (mock 経路) ... [`orm-drizzle-sqlite-poc`](../orm-drizzle-sqlite-poc/README.md)
