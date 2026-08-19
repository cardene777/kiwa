# orm-drizzle-sqlite-poc — kiwa ORM query test PoC (Drizzle + SQLite)

`@kiwa-lab/orm` v0.1 を **Drizzle ORM + in-memory SQLite** で使う最小 PoC。 `UsersRepository` クラスを `setupOrmEnv` 経由で 8 test cover し、 Pattern A (Dependency Injection) の流儀で production-shape repository をそのまま test できることを示す。

## 構造

```
orm-drizzle-sqlite-poc/
├── src/
│   ├── schema.ts            # Drizzle schema (users + posts、 FK 関連)
│   ├── migration.sql.ts     # 初期 schema SQL (setupOrmEnv の migrations に渡す)
│   └── users-repo.ts        # production-shape Repository class
└── tests/
    └── users-repo.orm.test.ts   # 8 test (create / find / cascade / FK / 隔離)
```

## 実行

```bash
pnpm install
pnpm -F examples-orm-drizzle-sqlite-poc test
# → 8 test 全 pass、 数百ms で完了
```

## 観点 cover

| ID | 観点 |
|---|---|
| T-POC-001 | 正常系 — create + findByEmail round-trip |
| T-POC-002 | 異常系 — 重複 email → duplicate-email (UNIQUE 制約) |
| T-POC-003 | 境界値 — 存在しない email → null |
| T-POC-004 | 状態遷移 — user delete → posts cascade 削除 |
| T-POC-005 | 隔離 — 別 user の posts は cascade で消えない |
| T-POC-006 | 入力 — case-sensitive email filter |
| T-POC-007 | FK — orphan post insert で FOREIGN KEY constraint reject |
| T-POC-008 | 並行隔離 — 別 env で同 id を保持可能 |

## 関連

- 上位 Issue ... [#527](https://github.com/cardene777/kiwa/issues/527) (v1.2 ORM query test adapter、 MVP 完遂、 follow-up #527-2..N で testcontainers / Prisma / Kysely 追加)
- 親 PR ... 本 PR (`feature/527-1-orm-drizzle-sqlite-mvp`)
- runtime fixture ... [`@kiwa-lab/orm`](../../packages/orm/README.md) v0.1
- 関連 skill ... `/kiwa-design --layer orm-query` / `/kiwa-orm`
