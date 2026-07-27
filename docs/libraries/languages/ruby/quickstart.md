# ruby を始める

Rails action の前処理、ActiveRecord 操作記録、response、generic route を一つの test file で確認します。Ruby VM、Rails callback、ActiveRecord、実 database は起動しません。

## 準備する

```bash
pnpm add -D @kiwa-lab/ruby vitest
```

## Rails action と route を検証する

次の内容全体を `tests/posts.ruby.test.ts` に保存します。

```ts
import { expect, test } from "vitest";
import {
  captureActiveRecord,
  createRubyAppEnv,
  dispatchGenericRequest,
  dispatchRailsRequest,
} from "@kiwa-lab/ruby";

test("records a Rails action and its expected ActiveRecord operations", async () => {
  const env = createRubyAppEnv({ framework: "rails" });
  const result = await dispatchRailsRequest(
    env,
    { method: "POST", path: "/posts", body: { title: "kiwa" } },
    {
      beforeActions: [
        () => env.recordAR({ op: "find", model: "CurrentUser", args: {} }),
      ],
      action: async (request) => {
        env.recordAR({ op: "create", model: "Post", args: request.body });
        return { status: 201, body: '{"ok":true}', headers: {}, cookies: {}, session: {} };
      },
    },
  );

  expect(result.response.status).toBe(201);
  expect(result.beforeActionCount).toBe(1);
  expect(captureActiveRecord(env).byOp).toMatchObject({ find: 1, create: 1 });
});

test("matches a generic parameter route without extracting the parameter", async () => {
  const env = createRubyAppEnv({ framework: "sinatra" });
  env.addRoute({
    method: "GET",
    path: "/posts/:id",
    handler: (request) => ({
      status: 200, body: request.path, headers: {}, cookies: {}, session: {},
    }),
  });

  const result = await dispatchGenericRequest(env, { method: "GET", path: "/posts/42" });
  expect(result.matched).toBe(true);
  expect(result.response.body).toBe("/posts/42");
});
```

`:id` は一つの path segment に一致する wildcard です。値を params へ抽出しないため、必要なら `request.path` を handler または test 側で扱います。`captureActiveRecord` が空の場合は実 database の問題ではなく、handler または test が `env.recordAR` を呼んでいないことを意味します。

## 実行する

```bash
pnpm exec vitest run tests/posts.ruby.test.ts
```

route、session、cookie、ActiveRecord 操作は env に蓄積します。test ごとに新しい環境を作るか、`env.clear()` で全て初期化してください。`clear` は route も消します。

<!-- skill-guide -->
## skill で test を作る

初回だけ plugin を導入してから companion skill を実行します。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins

/kiwa:kiwa-ruby --module posts --output tests/integration/posts.ruby.test.ts
```

生成後は対象だけを実行します。

```bash
pnpm exec vitest run tests/integration/posts.ruby.test.ts
```
