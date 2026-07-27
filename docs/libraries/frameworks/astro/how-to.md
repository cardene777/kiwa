# astro の使い方

この adapter で確認する対象は三つあります。endpoint の HTTP 入出力、page function が返す redirect や not found の結果、View Transition listener の順序です。Astro の route 解決や browser の見た目を一つの test に混ぜず、それぞれの契約を独立して assertion します。

以下を `tests/navigation.astro.test.ts` として保存してください。redirect と not found は throw の実装詳細ではなく結果の response を確認し、navigation は listener が受け取る lifecycle だけを確認します。

```ts
import { describe, expect, it } from "vitest";
import {
  kiwaAstroNotFound,
  renderAstroPage,
  setupAstroViewTransitionEnv,
} from "@kiwa-lab/astro";

describe("page signals", () => {
  it("captures redirect and not found as observable results", async () => {
    const redirect = await renderAstroPage({
      page: ({ redirect }) => redirect("/login", 307),
      url: "http://localhost/private",
    });
    const notFound = await renderAstroPage({
      page: () => {
        throw kiwaAstroNotFound();
      },
      url: "http://localhost/missing",
    });

    expect(redirect.response.status).toBe(307);
    expect(redirect.redirect?.url).toBe("/login");
    expect(notFound.response.status).toBe(404);
    expect(notFound.notFound).not.toBeNull();
  });
});

describe("View Transition lifecycle", () => {
  it("dispatches each event once without a visual transition", async () => {
    const env = setupAstroViewTransitionEnv({
      fromPath: "/blog",
      toPath: "/blog/42",
      supportsViewTransitions: false,
    });
    const seen: string[] = [];

    env.on("astro:before-preparation", (event) => {
      seen.push(event.type);
    });
    env.on("astro:after-preparation", (event) => {
      seen.push(event.type);
    });
    env.on("astro:before-swap", (event) => {
      expect(event.viewTransition).toBeUndefined();
      seen.push(event.type);
    });
    env.on("astro:after-swap", (event) => {
      seen.push(event.type);
    });

    const result = await env.dispatchAll();

    expect(result.cancelled).toBe(false);
    expect(result.swapCallCount).toBe(1);
    expect(seen).toEqual([
      "astro:before-preparation",
      "astro:after-preparation",
      "astro:before-swap",
      "astro:after-swap",
    ]);
  });
});
```

```bash
pnpm exec vitest run tests/navigation.astro.test.ts
```

未処理の page exception は再 throw されず、`result.error` と 500 response になります。`rewrite` も signal として捕捉されますが、対象 page を再実行しません。`astro:before-preparation` で `preventDefault()` を呼ぶと navigation は中止され、後続 event は dispatch されません。

`before-swap` listener が `swap()` を呼ぶと、adapter の通常の swap と合計して `swapCallCount` は 2 になります。listener 側で早期 swap を行うか、通常の swap を使うかを application の方針として一つに決めてください。

この library は Astro dev server、実 `.astro` compiler、route registration、Islands hydration、実 document、visual transition を起動しません。route と middleware の接続は Astro を起動する integration test で、browser 上の画面遷移は E2E test で確認してください。
