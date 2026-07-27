# sveltekit の使い方

SvelteKit の form action は通常 data、validation failure、redirect を異なる signal として返します。hooks は `locals` と cookie を mutate してから `resolve` に渡します。`@kiwa-lab/sveltekit` は component を描画せず、server-side の入力と副作用だけを同じ test file で検証できます。

次の内容を `tests/sveltekit-server.test.ts` に保存してください。form action の validation failure、認証 hook が resolve へ渡す state、server-side fetch の URL rewrite を一続きで確認します。

```ts
import { expect, test } from "vitest";
import {
  fail,
  invokeAction,
  invokeHandle,
  invokeHandleFetch,
} from "@kiwa-lab/sveltekit";

test("email がない form を validation failure として返す", async () => {
  const result = await invokeAction({
    action: async ({ request }) => {
      const form = await request.formData();
      if (typeof form.get("email") !== "string") {
        return fail(400, { error: "email required" });
      }
      return { ok: true };
    },
    url: "http://localhost/signup",
  });

  expect(result.result).toBeUndefined();
  expect(result.fail).toMatchObject({ status: 400, data: { error: "email required" } });
  expect(result.redirect).toBeNull();
});

test("handle が user と telemetry cookie を resolve へ渡す", async () => {
  const result = await invokeHandle<{ user?: { id: number } }>({
    handle: async ({ event, resolve }) => {
      event.locals.user = { id: 42 };
      event.cookies.set("telemetry", "tid_1");
      return resolve(event);
    },
    url: "http://localhost/dashboard",
  });

  expect(result.resolveCalled).toBe(true);
  expect(result.localsAtResolve?.user).toEqual({ id: 42 });
  expect(result.env.cookies.get("telemetry")).toBe("tid_1");
});

test("handleFetch が upstream URL を internal endpoint に置き換える", async () => {
  const result = await invokeHandleFetch({
    handleFetch: ({ fetch }) => fetch(new Request("https://internal.example.test/users/42")),
    eventUrl: "http://localhost/dashboard",
    fetchUrl: "https://api.example.test/users/42",
    downstreamFetch: async (request) => new Response(JSON.stringify({ url: request.url }), {
      headers: { "content-type": "application/json" },
    }),
  });

  expect(result.error).toBeUndefined();
  expect(result.downstreamCalled).toBe(true);
  expect(result.downstreamRequest?.url).toBe("https://internal.example.test/users/42");
});
```

実行します。

```bash
pnpm exec vitest run tests/sveltekit-server.test.ts
```

`fail` は throw ではありません。`invokeAction` は `fail` field に保存するので、通常 result が `undefined` であること、status、data を一緒に確認します。redirect は action が throw して `result.redirect` に保存されます。failure、redirect、例外を通常 data として処理しないよう、各 signal を区別してください。

`invokeHandle` の `localsAtResolve` は、`resolve` が呼ばれた瞬間の浅い snapshot です。認証情報を `locals` に書く handler では、後段が読む値をこの field で確認します。`invokeHandleFetch` の `downstreamFetch` は network を開かない fake です。`downstreamRequest` を assertion すれば、変更後の URL、method、header が実際に下流へ渡ったことを確認できます。

## 共有する hook state を扱う

同じ request flow で複数 hook を順に試す場合は `setupSvelteKitHooksEnv` を使います。この環境では `locals` と cookie が hook 間で共有されます。`reset()` は作成時の浅い snapshot に戻すため、別ケースへ state を持ち越さないための暗黙の cleanup ではありません。共有状態が期待どおり初期化されることを明示的に検証する test で使ってください。

この adapter は Svelte component の hydration、browser form submit、route manifest、adapter 固有の cookie serialization を再現しません。server-side contract をこの adapter で速く固定し、画面表示と本番 adapter の互換性は SvelteKit application を起動する E2E test で確認します。
