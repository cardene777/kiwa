# @kiwa-lab/ui 使い方

React の mode と browser helper を目的ごとに分けます。すべての environment は `stop()` を持ちますが、戻り値の形は mode ごとに異なります。

## snapshot を比較する

snapshot mode は component を JSDOM に render し、その時点の container markup を返します。interaction 後の DOM を取得する API ではありません。

```tsx
const env = await setupComponentEnv({
  mode: "snapshot",
  ui: <section><h1>Profile</h1></section>,
});

try {
  if (env.kind !== "snapshot") throw new Error("snapshot environment が必要です");
  expect(env.markup).toContain("<h1>Profile</h1>");
} finally {
  await env.stop();
}
```

`renderOptions` は Testing Library の `render` にそのまま渡されます。provider wrapper や container を指定する場合は、その option を使います。`userEventOptions` は interaction mode にだけ使われます。

## 実 browser を使う

`setupBrowserComponentEnv` は React component を `renderToStaticMarkup` で HTML にしてから Playwright page へ `setContent` します。React event handler を browser 内で動かすものではなく、静的 markup、role、表示、screenshot の確認に向きます。

```tsx
import { setupBrowserComponentEnv } from "@kiwa-lab/ui";

const env = await setupBrowserComponentEnv({
  ui: <button data-testid="save">save</button>,
  browser: "chromium",
  headless: true,
});

try {
  expect(await env.page.getByTestId("save").isVisible()).toBe(true);
  expect(env.markup).toContain("save");
} finally {
  await env.stop();
}
```

Playwright browser binary が必要です。`@playwright/test` または `playwright` がない場合、または選んだ engine が使えない場合は初期化に失敗します。必要に応じて `pnpm exec playwright install chromium` を実行してください。

## framework helper を使う

Vue、Svelte、Solid、Lit、Qwik、Angular の helper は framework 固有の test utility を動的に読み込みます。必要な framework と utility だけを peer dependency として導入します。

```ts
import { setupVueComponentEnv } from "@kiwa-lab/ui";

const env = await setupVueComponentEnv({ mode: "render", component: MyComponent });
try {
  expect(env.wrapper.exists()).toBe(true);
} finally {
  await env.stop();
}
```

各 helper の option と return value は React の `UiTestEnv` と同一ではありません。framework helper の型を参照し、React 専用の `screen` や `user` を前提にしないでください。

## 実行して mode を分ける

snapshot、browser、framework helper の example は、それぞれの environment を `finally` で停止する test file に保存します。browser mode を使う場合は使用する engine を導入してから、次を実行します。

```bash
pnpm exec playwright install chromium
pnpm exec vitest run tests/profile.snapshot.ui.test.tsx
```

成功すれば snapshot mode は render 時点の markup を返し、browser helper は静的 HTML の表示を確認し、framework helper は対応する utility を通して component を mount します。browser helper の example を別 file に保存した場合は、その file 名を指定して Playwright runner で実行してください。React event handler を実 browser で動かすことや実 browser の hydration は browser helper の対象外です。必要なら component E2E に分けて確認してください。
