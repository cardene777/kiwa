# orm-drizzle-mysql-poc — kiwa ORM query test PoC (Drizzle + MySQL via testcontainers)

`@kiwa-test/orm` v0.2.1 を **Drizzle ORM + MySQL (testcontainers)** で使う PoC。 同じ `UsersRepository` を Postgres / MySQL 経路で動かす dialect 横断 reference。

## 前提

- Docker daemon 起動 (`docker ps` 成功すること)
- testcontainers が `mysql:8.4` image を pull できるネットワーク

## 構造

```
orm-drizzle-mysql-poc/
├── src/
│   ├── schema.ts            # Drizzle MySQL schema (users + posts FK cascade)
│   ├── migration.sql.ts     # 初期 MySQL SQL (AUTO_INCREMENT / VARCHAR(255))
│   └── users-repo.ts        # production-shape Repository class
└── tests/
    └── users-repo.test.ts   # 8 test (create / duplicate / cascade / FK / case-insensitive collation / 並行 container 隔離)
```

## 実行

```bash
pnpm install
pnpm -F examples-orm-drizzle-mysql-poc test
# → 8 test 全 pass (Docker daemon 起動済の場合)、 数十秒〜2 分 (container 起動 overhead 含む)
# → Docker 不在環境では test 自体は skip されず空処理で pass する設計
```

## Postgres PoC との対比

`examples/orm-drizzle-postgres-poc/` (v0.2) と **同じ UsersRepository 形** を MySQL 経路で動かす reference。 dialect 固有の差異 ...

- `INT AUTO_INCREMENT` (MySQL) vs `SERIAL` (Postgres)
- `VARCHAR(255)` (MySQL 推奨) vs `TEXT` (Postgres)
- `Duplicate entry` (MySQL) vs `duplicate key value violates unique constraint` (Postgres) — error message
- `foreign key constraint fails` (MySQL) vs `violates foreign key constraint` (Postgres) — error message
- `utf8mb4_0900_ai_ci` (MySQL default) → 大文字小文字を区別しない比較 vs Postgres default は case-sensitive

production-shape repository は dialect 共有可能、 error pattern matcher と column type 定義のみ dialect 別調整。

## 観点 cover

| ID | 観点 |
|---|---|
| T-MY-001 | 正常系 — create + findByEmail round-trip |
| T-MY-002 | 異常系 — 重複 email → duplicate-email (Duplicate entry) |
| T-MY-003 | 境界値 — 存在しない email → null |
| T-MY-004 | 状態遷移 — user delete → posts cascade 削除 (InnoDB FK) |
| T-MY-005 | 隔離 — 別 user の posts は cascade で消えない |
| T-MY-006 | collation — case-insensitive email filter (utf8mb4_0900_ai_ci) |
| T-MY-007 | FK — orphan post insert で foreign key constraint reject |
| T-MY-008 | 並行隔離 — 別 container で connectionUri 一意 |

## 関連

- 上位 Issue ... CAR-298 (v1.2 ORM #527-2 follow-up MySQL via testcontainers)
- 親 Issue ... CAR-291 (#527)
- 親 PR ... 本 PR (`feature/527-2-orm-testcontainers-mysql`)
- runtime fixture ... [`@kiwa-test/orm`](../../packages/orm/README.md) v0.2.1
- 関連 PoC ... [`orm-drizzle-sqlite-poc`](../orm-drizzle-sqlite-poc/README.md) (mock) / [`orm-drizzle-postgres-poc`](../orm-drizzle-postgres-poc/README.md) (live Postgres)
