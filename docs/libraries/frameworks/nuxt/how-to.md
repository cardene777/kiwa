# route、middleware、Nitro hook を検証する

Nuxt の server route、route middleware、Nitro plugin は同じ request 処理の周辺に見えても、結果の形が異なります。route は通常値と H3 response の副作用、middleware は navigation の redirect または abort、plugin は hook 登録と実行結果を返します。

次の内容全体を `tests/nuxt-routing.test.ts` に保存します。認証 redirect、route guard、one-shot close hook を同じ file で確認できます。

```ts
import { expect, test } from "vitest";
import {
  invokeEventHandler,
  invokeNitroPlugin,
  invokeRouteMiddleware,
} from "@kiwa-lab/nuxt";

test("redirects an unauthenticated server route", async () => {
  const result = await invokeEventHandler({
    handler: (event) => {
      if (!event.cookies.get("session")) event.sendRedirect("/login", 302);
      return { ok: true };
    },
    url: "http://localhost/api/secure",
  });

  expect(result.result).toBeUndefined();
  expect(result.redirect).toMatchObject({ url: "/login", status: 302 });
});

test("redirects a dashboard navigation through route middleware", async () => {
  const result = await invokeRouteMiddleware({
    middleware: (_to, _from, { navigateTo }) => navigateTo("/login"),
    to: { path: "/dashboard" },
  });

  expect(result.redirect).toMatchObject({ to: "/login", status: 302, external: false });
  expect(result.abort).toBeNull();
});

test("runs a Nitro close hook only once", async () => {
  let calls = 0;
  const result = await invokeNitroPlugin({
    plugin: (nitro) => nitro.hooks.hookOnce("close", () => { calls += 1; }),
  });

  await result.callHook("close", undefined);
  await result.callHook("close", undefined);
  expect(calls).toBe(1);
  expect(result.callHookErrors).toEqual([]);
});
```

## adapter と実 runtime の境界を理解する

`sendRedirect` が発生した時点で通常 result はありません。redirect の URL と status は `result.redirect` に記録されます。この adapter の `env.status` は redirect signal で書き換えないため、実 HTTP response status と同一視しません。header と cookie は必要に応じて `env` から assertion します。`navigateTo` は Response ではなく Nuxt 固有 signal として捕捉されます。通常 return、silent abort、redirect を一つの assertion に混ぜず、アプリが必要とする遷移ごとに確認してください。

Nitro の hook callback が throw した場合は `callHookErrors` に記録され、ほかの hook は継続します。plugin setup error とは別に扱います。cookie と response header は env に残るため、route ごとに新しい invocation を作って共有しません。

この adapter は route manifest、Nuxt composable、actual browser navigation、Nitro deployment adapter、real network を起動しません。route の入力と副作用の contract はここで固定し、production server と browser 上の遷移は Nuxt application を起動する integration test または E2E test で確認します。

## 実行する

```bash
pnpm exec vitest run tests/nuxt-routing.test.ts
```
