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
| <code v-pre>setupComponentEnv: unknown mode "$&#123;String(opts.mode)&#125;"</code> | [packages/ui/src/setup-component-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/setup-component-env.ts#L115) |
| <code v-pre>setupComponentEnv requires "@testing-library/react" to be installed. Run &#96;pnpm add -D @testing-library/react&#96;.</code> | [packages/ui/src/setup-component-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/setup-component-env.ts#L30) |
| <code v-pre>setupComponentEnv(&#123; mode: "interaction" &#125;) requires "@testing-library/user-event". Run &#96;pnpm add -D @testing-library/user-event&#96;.</code> | [packages/ui/src/setup-component-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/setup-component-env.ts#L40) |
| <code v-pre>setupSolidComponentEnv requires "@solidjs/testing-library". Run &#96;pnpm add -D @solidjs/testing-library solid-js&#96;.</code> | [packages/ui/src/solid.ts](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/solid.ts#L39) |
| <code v-pre>setupSvelteComponentEnv requires "@testing-library/svelte". Run &#96;pnpm add -D @testing-library/svelte svelte&#96;.</code> | [packages/ui/src/svelte.ts](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/svelte.ts#L36) |
| <code v-pre>setupVueComponentEnv requires "@vue/test-utils". Run &#96;pnpm add -D @vue/test-utils vue&#96;.</code> | [packages/ui/src/vue.ts](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/vue.ts#L47) |

## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### <code v-pre>setupAngularComponentEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/angular.ts#L62) <code v-pre>packages/ui/src/angular.ts</code>

```ts
export declare function setupAngularComponentEnv(opts: SetupAngularComponentEnvOptions): Promise<AngularTestEnvUi>;
```

#### <code v-pre>setupBrowserComponentEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/browser.ts#L95) <code v-pre>packages/ui/src/browser.ts</code>

```ts
export declare function setupBrowserComponentEnv(opts: SetupBrowserComponentEnvOptions): Promise<BrowserTestEnvUi>;
```

#### <code v-pre>setupComponentEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/setup-component-env.ts#L46) <code v-pre>packages/ui/src/setup-component-env.ts</code>

```ts
export declare function setupComponentEnv(opts: SetupComponentEnvOptions): Promise<UiTestEnv>;
```

#### <code v-pre>setupLitComponentEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/lit.ts#L44) <code v-pre>packages/ui/src/lit.ts</code>

```ts
export declare function setupLitComponentEnv(opts: SetupLitComponentEnvOptions): Promise<LitTestEnvUi>;
```

#### <code v-pre>setupQwikComponentEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/qwik.ts#L52) <code v-pre>packages/ui/src/qwik.ts</code>

```ts
export declare function setupQwikComponentEnv(opts: SetupQwikComponentEnvOptions): Promise<QwikTestEnvUi>;
```

#### <code v-pre>setupSolidComponentEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/solid.ts#L45) <code v-pre>packages/ui/src/solid.ts</code>

```ts
export declare function setupSolidComponentEnv(opts: SetupSolidComponentEnvOptions): Promise<SolidTestEnvUi>;
```

#### <code v-pre>setupSvelteComponentEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/svelte.ts#L42) <code v-pre>packages/ui/src/svelte.ts</code>

```ts
export declare function setupSvelteComponentEnv(opts: SetupSvelteComponentEnvOptions): Promise<SvelteTestEnvUi>;
```

#### <code v-pre>setupVueComponentEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/vue.ts#L53) <code v-pre>packages/ui/src/vue.ts</code>

```ts
export declare function setupVueComponentEnv(opts: SetupVueComponentEnvOptions): Promise<VueTestEnvUi>;
```

### 型

#### <code v-pre>AngularContainerLike</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/angular.ts#L27) <code v-pre>packages/ui/src/angular.ts</code>

```ts
export interface AngularContainerLike {
    container: HTMLElement;
    getByTestId: (id: string) => HTMLElement;
    getByText: (text: string | RegExp) => HTMLElement;
}
```

#### <code v-pre>AngularTestEnvUi</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/angular.ts#L33) <code v-pre>packages/ui/src/angular.ts</code>

```ts
export interface AngularTestEnvUi extends TestEnvBase<'mock' | 'live'> {
    kind: 'angular';
    result: AngularContainerLike;
    markup: string;
}
```

#### <code v-pre>BrowserLocator</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/browser.ts#L33) <code v-pre>packages/ui/src/browser.ts</code>

```ts
export interface BrowserLocator {
    textContent: () => Promise<string | null>;
    click: () => Promise<void>;
    isVisible: () => Promise<boolean>;
    count: () => Promise<number>;
}
```

#### <code v-pre>BrowserPageHandle</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/browser.ts#L21) <code v-pre>packages/ui/src/browser.ts</code>

```ts
export interface BrowserPageHandle {
    setContent: (html: string, opts?: {
        waitUntil?: 'load' | 'domcontentloaded' | 'networkidle';
    }) => Promise<void>;
    getByTestId: (id: string) => BrowserLocator;
    getByRole: (role: string, opts?: {
        name?: string;
    }) => BrowserLocator;
    getByText: (text: string) => BrowserLocator;
    evaluate: <T>(fn: () => T | Promise<T>) => Promise<T>;
    click: (selector: string) => Promise<void>;
    screenshot: (opts?: {
        path?: string;
    }) => Promise<Buffer>;
    close: () => Promise<void>;
    content: () => Promise<string>;
}
```

#### <code v-pre>BrowserTestEnvUi</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/browser.ts#L50) <code v-pre>packages/ui/src/browser.ts</code>

```ts
export interface BrowserTestEnvUi {
    mode: 'live';
    kind: 'browser';
    browser: BrowserName;
    page: BrowserPageHandle;
    markup: string;
    stop: () => Promise<void>;
}
```

#### <code v-pre>InteractionTestEnvUi</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/types.ts#L25) <code v-pre>packages/ui/src/types.ts</code>

```ts
export interface InteractionTestEnvUi extends TestEnvBase<'live'> {
    kind: 'interaction';
    result: RenderResult;
    screen: typeof ScreenApi;
    user: UserEvent;
}
```

#### <code v-pre>LitElementHandle</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/lit.ts#L15) <code v-pre>packages/ui/src/lit.ts</code>

```ts
export interface LitElementHandle {
    element: HTMLElement;
    shadowRoot: ShadowRoot | null;
    /** Query inside light DOM. */
    querySelector: <T extends Element = Element>(selector: string) => T | null;
    /** Query inside shadow DOM if present, otherwise light DOM. */
    shadowQuerySelector: <T extends Element = Element>(selector: string) => T | null;
}
```

#### <code v-pre>LitTestEnvUi</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/lit.ts#L24) <code v-pre>packages/ui/src/lit.ts</code>

```ts
export interface LitTestEnvUi extends TestEnvBase<'mock' | 'live'> {
    kind: 'lit';
    handle: LitElementHandle;
    markup: string;
}
```

#### <code v-pre>QwikContainerLike</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/qwik.ts#L19) <code v-pre>packages/ui/src/qwik.ts</code>

```ts
export interface QwikContainerLike {
    container: HTMLElement;
    getByTestId: (id: string) => HTMLElement;
    getByText: (text: string | RegExp) => HTMLElement;
}
```

#### <code v-pre>QwikTestEnvUi</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/qwik.ts#L25) <code v-pre>packages/ui/src/qwik.ts</code>

```ts
export interface QwikTestEnvUi extends TestEnvBase<'mock' | 'live'> {
    kind: 'qwik';
    result: QwikContainerLike;
    markup: string;
}
```

#### <code v-pre>RenderTestEnvUi</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/types.ts#L19) <code v-pre>packages/ui/src/types.ts</code>

```ts
export interface RenderTestEnvUi extends TestEnvBase<'mock'> {
    kind: 'render';
    result: RenderResult;
    screen: typeof ScreenApi;
}
```

#### <code v-pre>SetupAngularComponentEnvOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/angular.ts#L21) <code v-pre>packages/ui/src/angular.ts</code>

```ts
export interface SetupAngularComponentEnvOptions {
    mode: 'render' | 'interaction' | 'snapshot';
    component: AngularComponentLike;
    inputs?: Record<string, unknown>;
}
```

#### <code v-pre>SetupBrowserComponentEnvOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/browser.ts#L40) <code v-pre>packages/ui/src/browser.ts</code>

```ts
export interface SetupBrowserComponentEnvOptions {
    ui: ReactElement;
    /** which browser engine to launch (default chromium) */
    browser?: BrowserName;
    /** headless flag forwarded to playwright launch (default true) */
    headless?: boolean;
    /** optional HTML wrapper template (`{{children}}` is replaced with the rendered React markup) */
    template?: string;
}
```

#### <code v-pre>SetupComponentEnvOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/types.ts#L8) <code v-pre>packages/ui/src/types.ts</code>

```ts
export interface SetupComponentEnvOptions<TMode extends UiTestMode = UiTestMode> {
    mode: TMode;
    ui: ReactElement;
    /** Options forwarded to @testing-library/react render() */
    renderOptions?: RenderOptions;
    /** Initial userEvent setup (interaction mode only) */
    userEventOptions?: Parameters<UserEvent['setup']> extends [infer Opts] ? Opts : Record<string, unknown>;
}
```

#### <code v-pre>SetupLitComponentEnvOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/lit.ts#L10) <code v-pre>packages/ui/src/lit.ts</code>

```ts
export interface SetupLitComponentEnvOptions {
    mode: 'render' | 'interaction' | 'snapshot';
    template: LitTemplateLike;
}
```

#### <code v-pre>SetupQwikComponentEnvOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/qwik.ts#L14) <code v-pre>packages/ui/src/qwik.ts</code>

```ts
export interface SetupQwikComponentEnvOptions {
    mode: 'render' | 'interaction' | 'snapshot';
    component: QwikComponentLike;
}
```

#### <code v-pre>SetupSolidComponentEnvOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/solid.ts#L9) <code v-pre>packages/ui/src/solid.ts</code>

```ts
export interface SetupSolidComponentEnvOptions {
    mode: 'render' | 'interaction' | 'snapshot';
    component: () => unknown;
    props?: Record<string, unknown>;
}
```

#### <code v-pre>SetupSvelteComponentEnvOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/svelte.ts#L9) <code v-pre>packages/ui/src/svelte.ts</code>

```ts
export interface SetupSvelteComponentEnvOptions {
    mode: 'render' | 'interaction' | 'snapshot';
    component: SvelteComponentLike;
    props?: Record<string, unknown>;
}
```

#### <code v-pre>SetupVueComponentEnvOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/vue.ts#L9) <code v-pre>packages/ui/src/vue.ts</code>

```ts
export interface SetupVueComponentEnvOptions {
    mode: 'render' | 'interaction' | 'snapshot';
    component: VueComponentLike;
    props?: Record<string, unknown>;
    slots?: Record<string, unknown>;
}
```

#### <code v-pre>SnapshotTestEnvUi</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/types.ts#L32) <code v-pre>packages/ui/src/types.ts</code>

```ts
export interface SnapshotTestEnvUi extends TestEnvBase<'mock'> {
    kind: 'snapshot';
    result: RenderResult;
    /** Serialized DOM markup of the rendered tree, ready for inline / file snapshot */
    markup: string;
}
```

#### <code v-pre>SolidContainerLike</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/solid.ts#L15) <code v-pre>packages/ui/src/solid.ts</code>

```ts
export interface SolidContainerLike {
    container: HTMLElement;
    getByTestId: (id: string) => HTMLElement;
    getByText: (text: string | RegExp) => HTMLElement;
}
```

#### <code v-pre>SolidTestEnvUi</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/solid.ts#L21) <code v-pre>packages/ui/src/solid.ts</code>

```ts
export interface SolidTestEnvUi extends TestEnvBase<'mock' | 'live'> {
    kind: 'solid';
    result: SolidContainerLike;
    markup: string;
}
```

#### <code v-pre>SvelteContainerLike</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/svelte.ts#L15) <code v-pre>packages/ui/src/svelte.ts</code>

```ts
export interface SvelteContainerLike {
    container: HTMLElement;
    getByTestId: (id: string) => HTMLElement;
    getByText: (text: string | RegExp) => HTMLElement;
}
```

#### <code v-pre>SvelteTestEnvUi</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/svelte.ts#L21) <code v-pre>packages/ui/src/svelte.ts</code>

```ts
export interface SvelteTestEnvUi extends TestEnvBase<'mock' | 'live'> {
    kind: 'svelte';
    result: SvelteContainerLike;
    markup: string;
}
```

#### <code v-pre>UiTestEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/types.ts#L39) <code v-pre>packages/ui/src/types.ts</code>

```ts
export type UiTestEnv = RenderTestEnvUi | InteractionTestEnvUi | SnapshotTestEnvUi;
```

#### <code v-pre>UiTestMode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/types.ts#L6) <code v-pre>packages/ui/src/types.ts</code>

```ts
export type UiTestMode = 'render' | 'interaction' | 'snapshot' | 'browser';
```

#### <code v-pre>VueTestEnvUi</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/vue.ts#L33) <code v-pre>packages/ui/src/vue.ts</code>

```ts
export interface VueTestEnvUi extends TestEnvBase<'mock' | 'live'> {
    kind: 'vue';
    wrapper: VueWrapperLike;
    markup: string;
}
```

#### <code v-pre>VueWrapperLike</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/vue.ts#L24) <code v-pre>packages/ui/src/vue.ts</code>

```ts
export interface VueWrapperLike {
    html: () => string;
    find: (selector: string) => VueDomWrapperLike;
    findAll: (selector: string) => VueDomWrapperLike[];
    trigger: (eventName: string) => Promise<void>;
    setValue?: (value: unknown) => Promise<void>;
    unmount: () => void;
}
```
<!-- kiwa-public-api:end -->
