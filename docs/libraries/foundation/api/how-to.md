# @kiwa-lab/api の使い方

ここでは mock、hybrid、Node handler、default header を同じ test file で扱います。test ごとに作った environment を `afterEach` で停止するため、local listener や MSW interceptor が次の case に残りません。事前に `@kiwa-lab/api`、Vitest、MSW を導入してください。

## mode ごとの境界を test する

次を `tests/api-modes.api.test.ts` に保存します。mock mode は local app を実行しません。hybrid mode の `/profile` は local handler が応答し、その handler 内の `https://profiles.example` への fetch だけを MSW が置き換えます。

```ts
import { afterEach, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { setupApiServer, type ApiTestEnv } from "@kiwa-lab/api";

const envs: ApiTestEnv[] = [];

afterEach(async () => {
  while (envs.length > 0) {
    await envs.pop()?.stop();
  }
});

it("mock mode で固定 response を検証する", async () => {
  const env = await setupApiServer({
    mode: "mock",
    mockHandlers: [
      http.get("http://kiwa.mock/api/items", () =>
        HttpResponse.json([{ id: 99, name: "mocked" }]),
      ),
    ],
  });
  envs.push(env);

  expect((await env.request.get("/api/items")).json()).toEqual([
    { id: 99, name: "mocked" },
  ]);
  env.mocks.reset();
});

it("hybrid mode で local handler の外部 fetch だけを置き換える", async () => {
  const env = await setupApiServer({
    mode: "hybrid",
    app: {
      kind: "fetch",
      handler: async request => {
        if (new URL(request.url).pathname !== "/profile") {
          return new Response("not found", { status: 404 });
        }
        const upstream = await fetch("https://profiles.example/me");
        return Response.json({ source: "local handler", profile: await upstream.json() });
      },
    },
    mockHandlers: [
      http.get("https://profiles.example/me", () => HttpResponse.json({ id: "u-1" })),
    ],
  });
  envs.push(env);

  expect((await env.request.get("/profile")).json()).toEqual({
    source: "local handler",
    profile: { id: "u-1" },
  });
});

it("Node handler と request header を検証する", async () => {
  const env = await setupApiServer({
    mode: "live",
    defaultHeaders: { authorization: "Bearer test", "x-tenant": "first" },
    app: (req, res) => {
      if (req.url !== "/health") {
        res.statusCode = 404;
        res.end("not found");
        return;
      }
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ authorization: req.headers.authorization, tenant: req.headers["x-tenant"] }));
    },
  });
  envs.push(env);

  const response = await env.request.get("/health", { headers: { "x-tenant": "second" } });
  expect(response.status).toBe(200);
  expect(response.json()).toEqual({ authorization: "Bearer test", tenant: "second" });
});
```

`mock` で `mockHandlers` を省略すると setup は reject します。`live` で `app` を省略しても同様です。`hybrid` は両方が必要です。`env.mocks.reset()` は起動時に渡した handler へ戻すため、test 内で追加した MSW handler を次の case に持ち越しません。

## error response と停止を解釈する

`env.request` は 400 や 500 で throw しません。status と `bodyText` を assertion します。JSON でない error body に `json()` を呼ぶと `JSON.parse` が失敗するため、text response は `bodyText` を使います。Node handler が throw または reject した場合、adapter は 500 と `internal error` を返します。application 固有の error mapping を求める場合は handler 自身で response を返し、その response を test してください。

`stop()` 後に request client を再利用すると listener が閉じているため失敗します。test の scope をまたいで env を共有せず、`afterEach` または `try` と `finally` のどちらかで必ず停止します。

## 実行する

```bash
pnpm exec vitest run tests/api-modes.api.test.ts
```

成功すると、mock は固定 response を返し、hybrid は local handler と mock した外部 call を組み合わせ、Node handler は header override を受け取ります。実在する外部 URL、実認証、database を含める場合は、対象と認証情報を明示した integration test に分けてください。
