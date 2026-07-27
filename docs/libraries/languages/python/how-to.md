# template、middleware、retry を検証する

`renderTemplate` は完成 HTML ではなく template に渡す値の契約を確認します。middleware は登録順に `next` を囲み、`withRetry` は framework と独立した async wrapper として失敗の再試行を扱います。

次の内容全体を `tests/python-flows.test.ts` に保存します。

```ts
import { expect, test } from "vitest";
import {
  createPythonAppEnv,
  dispatchRequest,
  renderTemplate,
  withRetry,
} from "@kiwa-lab/python";

test("reports a template value that the view did not provide", () => {
  const env = createPythonAppEnv({ framework: "django" });
  env.registerTemplate("welcome", "<b>\{\{ a \}\} - \{\{ b \}\}</b>");

  expect(renderTemplate(env, "welcome", { a: "1" })).toEqual({
    html: "<b>1 - </b>",
    variables: ["a", "b"],
    missing: ["b"],
  });
});

test("runs middleware before and after a route", async () => {
  const env = createPythonAppEnv();
  const order: string[] = [];
  env.registerMiddleware({
    name: "logging",
    handler: async (_request, next) => {
      order.push("before");
      const response = await next();
      order.push("after");
      return response;
    },
  });
  env.registerRoute("GET", "/users", async () => ({ status: 200, headers: {}, body: "ok" }));

  await dispatchRequest(env, { method: "GET", path: "/users" });
  expect(order).toEqual(["before", "after"]);
});

test("returns the default 404 for an unregistered method and path", async () => {
  const response = await dispatchRequest(createPythonAppEnv(), {
    method: "GET", path: "/missing",
  });
  expect(response).toEqual({
    status: 404,
    headers: { "content-type": "text/plain" },
    body: "Not Found",
  });
});

test("retries a temporary failure before succeeding", async () => {
  let attempts = 0;
  const load = withRetry(async () => {
    attempts += 1;
    if (attempts < 3) throw new Error("temporary");
    return "loaded";
  }, {
    maxAttempts: 3,
    backoffMs: 1,
    retryOn: (error) => (error as Error).message === "temporary",
  });

  await expect(load()).resolves.toBe("loaded");
  expect(attempts).toBe(3);
});
```

## 実 framework に残す確認を分ける

同じ変数を template に複数回書くと `variables` と `missing` にもその回数だけ入ります。`&#123;&#123; user.name &#125;&#125;` は一つの key として扱うため、nested object はたどりません。`{ "user.name": "kiwa" }` のように平坦化するか、Jinja2 を使う Python integration test で確認してください。

middleware が `next()` を呼ばず response を返すと、後続 middleware と route は実行されません。middleware が throw した error は response へ変換されず、`dispatchRequest` が reject します。`withRetry` の `maxAttempts` は最初の呼び出しを含み、`retryOn` が false を返す error と最後の error はそのまま throw されます。

Python interpreter、Django、Flask、FastAPI、Starlette の router、JSON parser、dependency injection、Jinja2、実 network は起動しません。release 前には対象 framework の integration test で同じ request と response を確認します。

## 実行する

```bash
pnpm exec vitest run tests/python-flows.test.ts
```
