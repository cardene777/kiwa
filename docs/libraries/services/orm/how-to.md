# @kiwa-lab/orm の使い方

Quickstart は Drizzle と in-memory SQLite の最小 migration を扱います。このページでは migration の渡し方、query の検証、live database の後始末を扱います。例は `packages/orm/tests/integration/orm-baseline.integration.test.ts` と `setup-orm-env.test.ts` に対応します。

## migration と query を一つの test で確認する

SQL string array を使うと、statement の区切りを曖昧にせず table と index を作れます。環境を作ったら insert と query helper で migration が実際に使えることまで確認します。

```ts
import { expect, it } from "vitest";
import { expectQuery, expectRowCount, setupOrmEnv } from "@kiwa-lab/orm";

it("users migration を適用して seed を query する", async () => {
  const env = await setupOrmEnv({
    mode: "mock",
    orm: "drizzle",
    dialect: "sqlite",
    schema: {},
    migrations: [
      "CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT NOT NULL UNIQUE)",
      "INSERT INTO users (id, email) VALUES (1, 'ada@example.test')",
    ],
  });

  try {
    await expectRowCount(env, "users", 1, expect);
    await expectQuery(env, "SELECT id, email FROM users", [{ id: 1, email: "ada@example.test" }], expect);
  } finally {
    await env.stop();
  }
});
```

一つの SQL string も使えますが、complex SQL 内の semicolon を parser は理解しません。procedure や複雑な migration は statement array または provider の folder migration を使います。

## constraint の失敗を database の contract として確認する

unique constraint のような境界は、アプリケーションの重複チェックだけでなく database でも test します。二件目の insert が例外になることを確認し、environment は `finally` で必ず閉じます。

```ts
import { expect, it } from "vitest";
import { setupOrmEnv } from "@kiwa-lab/orm";

it("同じ email を二度保存できない", async () => {
  const env = await setupOrmEnv({
    mode: "mock", orm: "drizzle", dialect: "sqlite", schema: {},
    migrations: "CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT NOT NULL UNIQUE)",
  });

  try {
    env.raw.prepare("INSERT INTO users (id, email) VALUES (?, ?)").run(1, "ada@example.test");
    expect(() => {
      env.raw.prepare("INSERT INTO users (id, email) VALUES (?, ?)").run(2, "ada@example.test");
    }).toThrow(/UNIQUE constraint/);
  } finally {
    await env.stop();
  }
});
```

`expectQuery` に untrusted SQL を渡さないでください。helper は SQL を安全化せず、table identifier を扱う `expectRowCount` も任意 query の sanitizer ではありません。

## live database を終了する

Drizzle の live Postgres は Docker、`@testcontainers/postgresql`、`postgres`、`drizzle-orm` を必要とします。container と raw driver を残さないよう、`stop()` を `finally` で呼びます。

```ts
import { expect, it } from "vitest";
import { expectRowCount, setupOrmEnv } from "@kiwa-lab/orm";

it("live Postgres の空の users table を確認して停止する", async () => {
  const env = await setupOrmEnv({
    mode: "live",
    orm: "drizzle",
    dialect: "postgres",
    schema: {},
    migrations: "CREATE TABLE users (id SERIAL PRIMARY KEY, email TEXT NOT NULL)",
  });

  try {
    await expectRowCount(env, "users", 0, expect);
  } finally {
    await env.stop();
  }
});
```

Docker がない、image を取得できない、peer dependency が不足する場合は setup が reject します。query の failure として扱わず、環境の前提を満たす integration job で実行してください。

## 実行する

mock の二例を `tests/users.orm.how-to.test.ts` に保存して実行します。

```bash
pnpm exec vitest run tests/users.orm.how-to.test.ts
```

Prisma mock は generated Prisma Client と schema path を必要とし、Kysely は migration file の `up(db)` を使います。どちらも `stop()` と datasource environment の復元を同じ test で確認してください。
