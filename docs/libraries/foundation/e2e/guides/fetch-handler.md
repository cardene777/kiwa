# Fetch ハンドラーをテストする

Fetch API の `Request` を受け取り `Response` を返すアプリは、`app.kind` を `"fetch"` にして `setupE2eEnv` へ渡します。ライブラリが Node.js の HTTP リクエストを Web 標準の `Request` に変換し、ハンドラーの `Response` を HTTP 応答として返します。

## ハンドラーを渡す

次の例は `/` に画面を返し、それ以外には 404 を返します。`initialPath` を省略すると、最初に開くパスは `/` です。

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

it("Fetch アプリの画面を開く", async () => {
  const env = await setupE2eEnv({
    app: {
      kind: "fetch",
      handler: async (request) => {
        const url = new URL(request.url);
        if (url.pathname === "/") {
          return new Response('<h1 data-testid="title">Fetch app</h1>', {
            status: 200,
            headers: { "content-type": "text/html; charset=utf-8" },
          });
        }
        return new Response("not found", { status: 404 });
      },
    },
  });
  envs.push(env);

  expect(await env.page.getByTestId("title").textContent()).toBe("Fetch app");
});
```

## リクエストを扱う

Fetch ハンドラーでは URL、メソッド、ヘッダー、本文を Web 標準 API で取得できます。POST、PUT などの本文を伴うリクエストでは、アダプターが本文を読み取って `Request` に渡します。GET と HEAD では本文を渡しません。

```ts
const app = {
  kind: "fetch" as const,
  handler: async (request: Request) => {
    if (request.method === "POST") {
      const payload = await request.text();
      return new Response(`received: ${payload}`, { status: 200 });
    }
    return new Response("method not allowed", { status: 405 });
  },
};
```

このハンドラーを `app` として渡した環境では、`fetch(env.baseUrl, { method: "POST", body: "..." })` のように HTTP 応答を直接確認できます。ブラウザの画面操作が必要な場合は、同じ環境の `env.page` を使います。

## エラー時の挙動

Fetch ハンドラーが例外を送出した場合、サーバーは HTTP 500 と `internal error: <エラーメッセージ>` を返します。テスト対象の例外を意図的に発生させる場合は、ブラウザがその 500 応答をどう扱うか、または `fetch(env.baseUrl)` の応答を確認してください。

パスを指定して最初に開くには、`initialPath: "/settings"` を使います。先頭の `/` がない `"settings"` も `/settings` として扱われます。完全な `http` URL を渡した場合は、その URL へ直接移動します。

## 次に読む

- ページを操作する最小例: [クイックスタート](../quickstart)
- `IncomingMessage` / `ServerResponse` を使うアプリ: [Node.js HTTP ハンドラーをテストする](./node-handler)
- 型とオプションの完全な一覧: [API リファレンス](../reference)
