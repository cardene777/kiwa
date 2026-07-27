# loader と endpoint を検証する

loader は画面を表示する前の読み取りと redirect を、endpoint は request body と記録用 response を扱います。route matching、実 form parsing、browser cookie jar、Qwik の reactivity は実行しません。

次の内容全体を `tests/profile.qwikcity.test.ts` に保存します。

```ts
import { expect, test } from "vitest";
import { invokeEndpoint, invokeRouteLoader } from "@kiwa-lab/qwikcity";

test("redirects an anonymous loader request", async () => {
  const result = await invokeRouteLoader({
    loader: (event) => {
      if (event.cookie.get("session") === null) event.redirect(302, "/login");
      return { page: event.query.get("page") };
    },
    url: "http://localhost/profile?page=2",
    platform: { region: "local" },
  });

  expect(result.data).toBeUndefined();
  expect(result.redirect).toMatchObject({ status: 302, location: "/login" });
  expect(result.error).toBeUndefined();
});

test("writes a JSON endpoint response", async () => {
  const result = await invokeEndpoint({
    handler: (event) => {
      event.setHeader("cache-control", "no-store");
      event.json(201, { id: event.params.id });
    },
    url: "http://localhost/api/users/42",
    params: { id: "42" },
    jsonBody: { name: "Ada" },
  });

  expect(result.response).toMatchObject({ kind: "json", status: 201, body: { id: "42" } });
  expect(result.response.headers.get("cache-control")).toBe("no-store");
  expect(result.redirect).toBeNull();
});
```

## event の境界を理解する

loader は URL から query を作り、params、headers、platform を event に渡します。cookie は get だけで set と delete はありません。redirect 以外の throw は `error` に入り、helper は再 throw しません。session がある場合に表示 data を返す test は、`cookies: { session: "..." }` を与えた別 case として書きます。

endpoint で formData があれば jsonBody より優先し、body があれば既定 method は POST です。handler が status だけを設定して body を書かなければ response kind は `noop` のままです。redirect と通常の exception は Fetch `Response` に変換されず、それぞれ `result.redirect` と `result.error` に返ります。

実 browser の form submit、route registration、cookie が次の navigation に反映されること、Qwik resume は Qwik City を起動する integration test と E2E test で確認します。

## 実行する

```bash
pnpm exec vitest run tests/profile.qwikcity.test.ts
```
