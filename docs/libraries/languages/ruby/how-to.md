# ActiveRecord、ERB、route を検証する

`captureActiveRecord` は `env.recordAR` で記録した操作を実行順に集計します。実 database を観測するものではありません。ERB renderer も `<%= name %>` の置換だけを扱います。

次の内容全体を `tests/ruby-flows.test.ts` に保存します。

```ts
import { expect, test } from "vitest";
import {
  captureActiveRecord,
  createRubyAppEnv,
  dispatchGenericRequest,
  renderERB,
  withRetry,
} from "@kiwa-lab/ruby";

test("captures the database operations expected from a controller", () => {
  const env = createRubyAppEnv({ framework: "rails" });
  env.recordAR({ op: "create", model: "Post", args: { title: "kiwa" } });
  const snapshot = captureActiveRecord(env);

  expect(snapshot.queries[0]).toMatchObject({ op: "create", model: "Post" });
  expect(snapshot).toMatchObject({ total: 1, byOp: { create: 1 }, byModel: { Post: 1 } });
});

test("reports a missing ERB local without evaluating Ruby", () => {
  const rendered = renderERB(
    "<h1><%= title %></h1><p><%= author.name %></p>",
    { title: "kiwa" },
  );
  expect(rendered.html).toBe("<h1>kiwa</h1><p></p>");
  expect(rendered.missing).toEqual(["author.name"]);
});

test("returns a generic 404 when no route matches", async () => {
  const result = await dispatchGenericRequest(createRubyAppEnv(), {
    method: "GET", path: "/missing",
  });
  expect(result).toMatchObject({ matched: false, response: { status: 404, body: "Not Found" } });
});

test("retries a temporary failure before succeeding", async () => {
  let attempts = 0;
  const load = withRetry(async () => {
    attempts += 1;
    if (attempts < 3) throw new Error("temporary");
    return "loaded";
  }, { maxAttempts: 3, backoffMs: 1, retryOn: (error) => (error as Error).message === "temporary" });

  await expect(load()).resolves.toBe("loaded");
  expect(attempts).toBe(3);
});
```

## 実 framework に残す確認を分ける

snapshot の `queries` は配列のコピーです。snapshot 作成後に `recordAR` を呼んでも既存 `queries` は変わりませんが、各 query の `args` は深く複製されません。ERB の `author.name` は nested object をたどらず、一つの local 名です。`if`、`each`、method call、escape は実行しません。

generic route は追加順に検索され、最初に一致した handler だけを実行します。`/posts/:id` は `/posts/42` に一致しますが、`/posts` と `/posts/42/comments` には一致しません。`withRetry` の `maxAttempts` は最初の呼び出しを含み、retryOn が false を返す error と最後の error は throw されます。

Ruby VM、Rails callback、Rack、ActiveRecord、実 database、ERB engine は起動しません。release 前には Ruby application の integration test で同じ controller と query を確認します。

## 実行する

```bash
pnpm exec vitest run tests/ruby-flows.test.ts
```
