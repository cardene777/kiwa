# @kiwa-lab/orm はじめる

このチュートリアルでは、Drizzle と in-memory SQLite の mock environment を作り、migration、seed、raw SQL の結果を検証します。

## インストール

```bash
pnpm add -D @kiwa-lab/orm drizzle-orm better-sqlite3 vitest
```

## 最初のテスト

```ts
import { afterEach, expect, it } from "vitest";
import { expectQuery, expectRowCount, setupOrmEnv, type OrmTestEnv } from "@kiwa-lab/orm";

const envs: OrmTestEnv[] = [];

afterEach(async () => {
  while (envs.length > 0) await envs.pop()?.stop();
});

it("users を migration と seed で用意する", async () => {
  const env = await setupOrmEnv({
    mode: "mock",
    orm: "drizzle",
    dialect: "sqlite",
    schema: {},
    migrations: [
      "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL)",
      "INSERT INTO users (name) VALUES ('kiwa')",
    ],
  });
  envs.push(env);

  await expectQuery(env, "SELECT id, name FROM users", [{ id: 1, name: "kiwa" }], expect);
  await expectRowCount(env, "users", 1, expect);
});
```

`expectQuery` と `expectRowCount` は Vitest の `expect` を最後の引数に取ります。helper は assertion library を package 内で固定しないため、`expect` を省略すると動きません。

mock Drizzle environment の `raw` は `better-sqlite3` connection、`db` は Drizzle SQLite client です。`stop()` は raw SQLite connection を閉じます。

## 次に読む

migration source と live mode の境界は [使い方](./how-to) を確認してください。
この例を `tests/kiwa/orm.test.ts` に保存し、`pnpm exec vitest run tests/kiwa/orm.test.ts` を実行します。成功時は、このページで示した戻り値と副作用の assertion がすべて通ります。

<!-- skill-guide -->
## skill で仕様から test を作る

この library の companion skill は、先に作成した仕様を input にします。初回だけ kiwa plugin を導入し、Quickstart の最小 test で API と期待結果を理解してから実行してください。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

次の順序では、最初の command が `tests/spec/` に仕様を作り、二つ目の command がその module の test を作ります。

```text
/kiwa:kiwa-design --layer orm-query --module find-users
/kiwa:kiwa-orm --module find-users
```

`kiwa-orm` は `tests/find-users.test.ts` を作る規約です。生成後は migration、seed、query の期待行、`afterEach` での `env.stop()` が含まれることを確認してから実行します。

```bash
pnpm exec vitest run tests/find-users.test.ts
```

この Quickstart と同じ mock mode は in-memory SQLite を使います。実 database との接続、migration tool、transaction、dialect 差は保証しません。live mode を使う test は Docker を使える integration job に分けます。layer の選択肢と出力先は [skill の仕様](https://github.com/cardene777/kiwa/blob/main/.claude/skills/kiwa-orm/SKILL.md) を参照してください。
