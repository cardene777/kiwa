# Node.js HTTP ハンドラーをテストする

既存の Node.js HTTP ハンドラーをそのまま起動するには、`app` に関数を渡します。関数は `IncomingMessage` と `ServerResponse` を受け取り、同期でも非同期でも実装できます。

## 既存ハンドラーを渡す

次の例では、`/health` に 200 を返し、それ以外は 404 を返します。`initialPath` により、環境の準備時に `/health` を開きます。

```ts
import { afterEach, expect, it } from "vitest";
import { setupE2eEnv, type E2eTestEnv } from "@kiwa-lab/e2e";

const envs: E2eTestEnv[] = [];

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

it("Node.js ハンドラーのレスポンスを表示する", async () => {
  const env = await setupE2eEnv({
    app: (request, response) => {
      if (request.url === "/health") {
        response.statusCode = 200;
        response.setHeader("content-type", "text/html; charset=utf-8");
        response.end('<h1 data-testid="status">ok</h1>');
        return;
      }
      response.statusCode = 404;
      response.end("not found");
    },
    initialPath: "/health",
  });
  envs.push(env);

  expect(await env.page.getByTestId("status").textContent()).toBe("ok");
});
```

明示的に形式を表したい場合は、同じ関数を `app: { kind: "node", handler }` の形で渡すこともできます。

## 非同期ハンドラーを使う

ハンドラーは `Promise<void>` を返せます。非同期処理を終えてから `response.end()` を呼んでください。

```ts
const handler = async (_request: import("node:http").IncomingMessage,
  response: import("node:http").ServerResponse) => {
  await Promise.resolve();
  response.statusCode = 202;
  response.end("accepted");
};

const env = await setupE2eEnv({ app: handler });
```

## ハンドラーの失敗を確認する

Node.js ハンドラーが同期的に例外を送出した場合も、返した Promise が reject した場合も、サーバーは HTTP 500 と `internal error: <エラーメッセージ>` を返します。エラー処理をテストする際は、`env.baseUrl` に対する `fetch` でステータスと本文を検証できます。

```ts
const env = await setupE2eEnv({
  app: () => {
    throw new Error("database unavailable");
  },
});

const response = await fetch(env.baseUrl);
expect(response.status).toBe(500);
expect(await response.text()).toContain("internal error: database unavailable");
await env.stop();
```

通常のテストでは、クイックスタートと同様に `afterEach` で `env.stop()` を呼び、ブラウザとサーバーを必ず解放してください。

## 次に読む

- Fetch API 形式のアプリ: [Fetch ハンドラーをテストする](./fetch-handler)
- ロケーター、オプション、エクスポート一覧: [API リファレンス](../reference)
