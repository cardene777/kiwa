# @kiwa-lab/ui リファレンス

React component environment と framework 別 helper の公開 API です。

## setupComponentEnv

`setupComponentEnv({ mode, ui, renderOptions, userEventOptions })` は React component を Testing Library で render します。`mode` は `render`、`interaction`、`snapshot` のいずれかです。`browser` はこの API では使えず unknown mode error になります。

| kind | env の mode | 主要な項目 |
| --- | --- | --- |
| `render` | `mock` | `result`、`screen` |
| `interaction` | `live` | `result`、`screen`、`user` |
| `snapshot` | `mock` | `result`、描画直後の `markup` |

すべての `UiTestEnv` は非同期の `stop()` を持ちます。stop は render tree を unmount して Testing Library cleanup を呼びます。

`renderOptions` は `@testing-library/react` の `render` に渡されます。`userEventOptions` は interaction mode で `userEvent.setup` に渡され、他の mode では使われません。

## setupBrowserComponentEnv

`setupBrowserComponentEnv({ ui, browser, headless, template })` は `{ mode: "live", kind: "browser", browser, page, markup, stop }` を返します。

| option | 既定 | 内容 |
| --- | --- | --- |
| `browser` | `chromium` | `chromium`、`firefox`、`webkit` のいずれか |
| `headless` | `true` | Playwright launch に渡す値 |
| `template` | 内部 HTML template | 最初の `&#123;&#123;children&#125;&#125;` を静的 React markup と置き換える HTML |

`page` は `setContent`、locator 取得、`evaluate`、`click`、`screenshot`、`content`、`close` を持つ限定された handle です。browser helper は static markup を扱うため、React hydration や event handler の動作確認は行いません。

## framework helper

| helper | 必要な主な peer dependency |
| --- | --- |
| `setupVueComponentEnv` | Vue と `@vue/test-utils` |
| `setupSvelteComponentEnv` | Svelte と `@testing-library/svelte` |
| `setupSolidComponentEnv` | Solid と `@solidjs/testing-library` |
| `setupLitComponentEnv` | Lit と `@open-wc/testing-helpers` |
| `setupQwikComponentEnv` | Qwik と `@noma.to/qwik-testing-library` |
| `setupAngularComponentEnv` | Angular と `@testing-library/angular` |

helper ごとに container、wrapper、element の型と操作が異なります。対応 framework が見つからない場合は、それぞれの setup helper が導入方法を示す error で reject します。

## 共有する型

`UiTestMode` は `render`、`interaction`、`snapshot`、`browser` を含みます。`UiTestEnv` は React の最初の三つだけの union です。browser は `BrowserTestEnvUi` として別 API から返されます。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| <code v-pre>setupAngularComponentEnv requires "@testing-library/angular". Run &#96;pnpm add -D @testing-library/angular @angular/core @angular/platform-browser-dynamic zone.js&#96;.</code> | [packages/ui/src/angular.ts](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/angular.ts#L56) |
| <code v-pre>setupComponentEnv: playwright engine "$&#123;browserName&#125;" not available</code> | [packages/ui/src/browser.ts](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/browser.ts#L102) |
| <code v-pre>setupComponentEnv(&#123; mode: "browser" &#125;) requires "@playwright/test" or "playwright". Run &#96;pnpm add -D @playwright/test&#96;.</code> | [packages/ui/src/browser.ts](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/browser.ts#L75) |
| <code v-pre>setupComponentEnv(&#123; mode: "browser" &#125;) requires "react-dom" to be installed.</code> | [packages/ui/src/browser.ts](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/browser.ts#L89) |
| <code v-pre>setupLitComponentEnv requires "@open-wc/testing-helpers". Run &#96;pnpm add -D @open-wc/testing-helpers lit&#96;.</code> | [packages/ui/src/lit.ts](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/lit.ts#L38) |
| <code v-pre>setupQwikComponentEnv requires "@noma.to/qwik-testing-library". Run &#96;pnpm add -D @noma.to/qwik-testing-library @builder.io/qwik&#96;.</code> | [packages/ui/src/qwik.ts](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/qwik.ts#L46) |
| <code v-pre>setupComponentEnv: unknown mode "$&#123;String(opts.mode)&#125;"</code> | [packages/ui/src/setup-component-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/setup-component-env.ts#L123) |
| <code v-pre>setupComponentEnv requires "@testing-library/react" to be installed. Run &#96;pnpm add -D @testing-library/react&#96;.</code> | [packages/ui/src/setup-component-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/setup-component-env.ts#L30) |
| <code v-pre>setupComponentEnv(&#123; mode: "interaction" &#125;) requires "@testing-library/user-event". Run &#96;pnpm add -D @testing-library/user-event&#96;.</code> | [packages/ui/src/setup-component-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/setup-component-env.ts#L40) |
| <code v-pre>setupSolidComponentEnv requires "@solidjs/testing-library". Run &#96;pnpm add -D @solidjs/testing-library solid-js&#96;.</code> | [packages/ui/src/solid.ts](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/solid.ts#L39) |
| <code v-pre>setupSvelteComponentEnv requires "@testing-library/svelte". Run &#96;pnpm add -D @testing-library/svelte svelte&#96;.</code> | [packages/ui/src/svelte.ts](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/svelte.ts#L36) |
| <code v-pre>setupVueComponentEnv requires "@vue/test-utils". Run &#96;pnpm add -D @vue/test-utils vue&#96;.</code> | [packages/ui/src/vue.ts](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/vue.ts#L47) |

## API 契約

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [angular.ts](./api/angular) | 1 | 3 |
| [browser.ts](./api/browser) | 1 | 4 |
| [lit.ts](./api/lit) | 1 | 3 |
| [qwik.ts](./api/qwik) | 1 | 3 |
| [setup-component-env.ts](./api/setup-component-env) | 1 | 0 |
| [solid.ts](./api/solid) | 1 | 3 |
| [svelte.ts](./api/svelte) | 1 | 3 |
| [types.ts](./api/types) | 0 | 6 |
| [vue.ts](./api/vue) | 1 | 3 |

<!-- kiwa-public-api:end -->
