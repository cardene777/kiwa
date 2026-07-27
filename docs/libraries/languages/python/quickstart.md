# python を始める

Flask を想定した POST route、認可 middleware、template を一つの environment に登録します。dispatch の結果と middleware の記録を確認します。Python interpreter、WSGI server、実 Flask は起動しません。

## 準備する

```bash
pnpm add -D @kiwa-lab/python vitest
```

## route と middleware を検証する

次の内容全体を `tests/items.python.test.ts` に保存します。

```ts
import { expect, test } from "vitest";
import {
  captureMiddlewareCall,
  createPythonAppEnv,
  dispatchRequest,
} from "@kiwa-lab/python";

test("dispatches an authorized POST request and records middleware", async () => {
  const env = createPythonAppEnv({ framework: "flask" });
  env.registerMiddleware({
    name: "auth",
    handler: async (request, next) => {
      if (request.headers?.authorization !== "Bearer test-token") {
        return { status: 401, headers: {}, body: "unauthorized" };
      }
      return next();
    },
  });
  env.registerRoute("POST", "/items", async (request) => ({
    status: 201,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ received: request.body }),
  }));

  const result = await dispatchRequest(env, {
    method: "POST",
    path: "/items",
    headers: { authorization: "Bearer test-token" },
    body: '{"n":1}',
  });

  expect(result).toEqual({
    status: 201,
    headers: { "content-type": "application/json" },
    body: '{"received":"{\\"n\\":1}"}',
  });
  expect(captureMiddlewareCall(env)).toEqual([
    { name: "auth", path: "/items", at: 0 },
  ]);
});
```

body は文字列のまま handler に渡ります。JSON として扱う場合は handler 内で `JSON.parse` してください。`404` が返る場合は method と path が登録値に完全一致しているかを確認します。`GET /items` と `POST /items`、`/items` と `/items/` は別 route です。

## 実行する

```bash
pnpm exec vitest run tests/items.python.test.ts
```

route、template、middleware、履歴の登録は environment に残ります。test ごと、または framework ごとに `createPythonAppEnv` を作って隔離してください。

<!-- skill-guide -->
## skill で test を作る

初回だけ plugin を導入してから companion skill を実行します。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins

/kiwa:kiwa-python --module user-api --output tests/integration/user-api.python.test.ts
```

生成後は出力ファイルを読み、成功条件と失敗条件を確認してから対象だけを実行します。

```bash
pnpm exec vitest run tests/integration/user-api.python.test.ts
```
