# middleware と RSC の分岐を検証する

ここでは middleware、React Server Component、Parallel Routes の制御分岐を test します。実 Next.js server や React renderer を起動するものではありません。request と response action、signal、軽量 tree をそれぞれ assertion します。

次の内容全体を `tests/auth.nextjs.how-to.test.ts` に保存します。

```ts
import { expect, it } from "vitest";
import {
  invokeMiddleware,
  invokeParallelRoutes,
  middlewareActions,
  NOT_FOUND_SYMBOL,
  renderServerComponent,
} from "@kiwa-lab/nextjs";

it("redirects an unauthenticated dashboard request to login", async () => {
  const middleware = async (request: { cookies: ReadonlyMap<string, string> }) => {
    if (!request.cookies.get("session")) return middlewareActions.redirect("/login");
    return middlewareActions.next();
  };

  const { env } = await invokeMiddleware({
    middleware,
    url: "https://example.com/dashboard",
  });

  expect(env.action).toMatchObject({ kind: "redirect", url: "/login", status: 307 });
});

it("returns a not-found signal instead of a normal RSC error", async () => {
  const ProductPage = async () => {
    throw { [NOT_FOUND_SYMBOL]: true };
  };
  const result = await renderServerComponent({ component: ProductPage });

  expect(result.tree).toBeNull();
  expect(result.error).toBeUndefined();
  expect((result.signal as { [NOT_FOUND_SYMBOL]?: true })?.[NOT_FOUND_SYMBOL]).toBe(true);
});

it("uses a default fallback for a missing hard-navigation slot", async () => {
  const result = await invokeParallelRoutes({
    layout: ({ slots }) => ({ tag: "layout", modal: slots.modal }),
    children: () => ({ tag: "page" }),
    slots: [{
      slot: "modal",
      component: null,
      defaultFallback: () => ({ tag: "default-modal" }),
    }],
  });

  expect(result.slotResults[0]).toMatchObject({ usedDefault: true });
  expect(result.slotResults[0]?.tree).toEqual({ tag: "default-modal" });
});
```

## runtime に残す確認を分ける

`invokeMiddleware` は request と response action を記録します。Next.js runtime の matcher、edge deployment、実際の redirect response は Next.js integration test に残します。RSC の not-found signal は caller が error UI または HTTP status に変換する前の seam です。database request、React Flight payload、client hydration は実行しません。

Parallel Route の slot は並列に解決され、ある slot の error で他を止めません。`component: null` の hard navigation では `defaultFallback` が必要です。intercepted route、browser back、画面に表示される modal は App Router を起動した end-to-end test で確認してください。

Server Action の cookie、header、RSC data source は test case ごとに作ります。result や stream を別 test で再利用すると、前の副作用と chunk 順序が assertion に混ざります。

## 実行する

```bash
pnpm exec vitest run tests/auth.nextjs.how-to.test.ts
```
