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
| 'setupAngularComponentEnv requires "@testing-library/angular". Run `pnpm add -D @testing-library/angular @angular/core @angular/platform-browser-dynamic zone.js`.' | [packages/ui/src/angular.ts](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/angular.ts#L56) |
| `setupComponentEnv: playwright engine "${browserName}" not available` | [packages/ui/src/browser.ts](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/browser.ts#L102) |
| 'setupComponentEnv({ mode: "browser" }) requires "@playwright/test" or "playwright". Run `pnpm add -D @playwright/test`.' | [packages/ui/src/browser.ts](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/browser.ts#L75) |
| 'setupComponentEnv({ mode: "browser" }) requires "react-dom" to be installed.' | [packages/ui/src/browser.ts](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/browser.ts#L89) |
| 'setupLitComponentEnv requires "@open-wc/testing-helpers". Run `pnpm add -D @open-wc/testing-helpers lit`.' | [packages/ui/src/lit.ts](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/lit.ts#L38) |
| 'setupQwikComponentEnv requires "@noma.to/qwik-testing-library". Run `pnpm add -D @noma.to/qwik-testing-library @builder.io/qwik`.' | [packages/ui/src/qwik.ts](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/qwik.ts#L46) |
| 'setupComponentEnv requires "@testing-library/react" to be installed. Run `pnpm add -D @testing-library/react`.' | [packages/ui/src/setup-component-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/setup-component-env.ts#L30) |
| 'setupComponentEnv({ mode: "interaction" }) requires "@testing-library/user-event". Run `pnpm add -D @testing-library/user-event`.' | [packages/ui/src/setup-component-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/setup-component-env.ts#L40) |
| `setupComponentEnv: unknown mode "${String(opts.mode)}"` | [packages/ui/src/setup-component-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/setup-component-env.ts#L95) |
| 'setupSolidComponentEnv requires "@solidjs/testing-library". Run `pnpm add -D @solidjs/testing-library solid-js`.' | [packages/ui/src/solid.ts](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/solid.ts#L39) |
| 'setupSvelteComponentEnv requires "@testing-library/svelte". Run `pnpm add -D @testing-library/svelte svelte`.' | [packages/ui/src/svelte.ts](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/svelte.ts#L36) |
| 'setupVueComponentEnv requires "@vue/test-utils". Run `pnpm add -D @vue/test-utils vue`.' | [packages/ui/src/vue.ts](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/vue.ts#L47) |

## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/index.ts) から同期しています。各項目は公開名、実際の TypeScript 宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### `setupAngularComponentEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/angular.ts#L62) `packages/ui/src/angular.ts`

```ts
export async function setupAngularComponentEnv(
  opts: SetupAngularComponentEnvOptions,
): Promise<AngularTestEnvUi>;
```

#### `setupBrowserComponentEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/browser.ts#L95) `packages/ui/src/browser.ts`

```ts
export async function setupBrowserComponentEnv(
  opts: SetupBrowserComponentEnvOptions,
): Promise<BrowserTestEnvUi>;
```

#### `setupComponentEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/setup-component-env.ts#L46) `packages/ui/src/setup-component-env.ts`

```ts
export async function setupComponentEnv(opts: SetupComponentEnvOptions): Promise<UiTestEnv>;
```

#### `setupLitComponentEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/lit.ts#L44) `packages/ui/src/lit.ts`

```ts
export async function setupLitComponentEnv(
  opts: SetupLitComponentEnvOptions,
): Promise<LitTestEnvUi>;
```

#### `setupQwikComponentEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/qwik.ts#L52) `packages/ui/src/qwik.ts`

```ts
export async function setupQwikComponentEnv(
  opts: SetupQwikComponentEnvOptions,
): Promise<QwikTestEnvUi>;
```

#### `setupSolidComponentEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/solid.ts#L45) `packages/ui/src/solid.ts`

```ts
export async function setupSolidComponentEnv(
  opts: SetupSolidComponentEnvOptions,
): Promise<SolidTestEnvUi>;
```

#### `setupSvelteComponentEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/svelte.ts#L42) `packages/ui/src/svelte.ts`

```ts
export async function setupSvelteComponentEnv(
  opts: SetupSvelteComponentEnvOptions,
): Promise<SvelteTestEnvUi>;
```

#### `setupVueComponentEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/vue.ts#L53) `packages/ui/src/vue.ts`

```ts
export async function setupVueComponentEnv(
  opts: SetupVueComponentEnvOptions,
): Promise<VueTestEnvUi>;
```

### 型

#### `AngularContainerLike`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/angular.ts#L27) `packages/ui/src/angular.ts`

```ts
export interface AngularContainerLike {
  container: HTMLElement;
  getByTestId: (id: string) => HTMLElement;
  getByText: (text: string | RegExp) => HTMLElement;
}
```

#### `AngularTestEnvUi`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/angular.ts#L33) `packages/ui/src/angular.ts`

```ts
export interface AngularTestEnvUi extends TestEnvBase<'mock' | 'live'> {
  kind: 'angular';
  result: AngularContainerLike;
  markup: string;
}
```

#### `BrowserLocator`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/browser.ts#L33) `packages/ui/src/browser.ts`

```ts
export interface BrowserLocator {
  textContent: () => Promise<string | null>;
  click: () => Promise<void>;
  isVisible: () => Promise<boolean>;
  count: () => Promise<number>;
}
```

#### `BrowserPageHandle`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/browser.ts#L21) `packages/ui/src/browser.ts`

```ts
export interface BrowserPageHandle {
  setContent: (html: string, opts?: { waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' }) => Promise<void>;
  getByTestId: (id: string) => BrowserLocator;
  getByRole: (role: string, opts?: { name?: string }) => BrowserLocator;
  getByText: (text: string) => BrowserLocator;
  evaluate: <T>(fn: () => T | Promise<T>) => Promise<T>;
  click: (selector: string) => Promise<void>;
  screenshot: (opts?: { path?: string }) => Promise<Buffer>;
  close: () => Promise<void>;
  content: () => Promise<string>;
}
```

#### `BrowserTestEnvUi`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/browser.ts#L50) `packages/ui/src/browser.ts`

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

#### `InteractionTestEnvUi`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/types.ts#L25) `packages/ui/src/types.ts`

```ts
export interface InteractionTestEnvUi extends TestEnvBase<'live'> {
  kind: 'interaction';
  result: RenderResult;
  screen: typeof ScreenApi;
  user: UserEvent;
}
```

#### `LitElementHandle`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/lit.ts#L15) `packages/ui/src/lit.ts`

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

#### `LitTestEnvUi`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/lit.ts#L24) `packages/ui/src/lit.ts`

```ts
export interface LitTestEnvUi extends TestEnvBase<'mock' | 'live'> {
  kind: 'lit';
  handle: LitElementHandle;
  markup: string;
}
```

#### `QwikContainerLike`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/qwik.ts#L19) `packages/ui/src/qwik.ts`

```ts
export interface QwikContainerLike {
  container: HTMLElement;
  getByTestId: (id: string) => HTMLElement;
  getByText: (text: string | RegExp) => HTMLElement;
}
```

#### `QwikTestEnvUi`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/qwik.ts#L25) `packages/ui/src/qwik.ts`

```ts
export interface QwikTestEnvUi extends TestEnvBase<'mock' | 'live'> {
  kind: 'qwik';
  result: QwikContainerLike;
  markup: string;
}
```

#### `RenderTestEnvUi`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/types.ts#L19) `packages/ui/src/types.ts`

```ts
export interface RenderTestEnvUi extends TestEnvBase<'mock'> {
  kind: 'render';
  result: RenderResult;
  screen: typeof ScreenApi;
}
```

#### `SetupAngularComponentEnvOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/angular.ts#L21) `packages/ui/src/angular.ts`

```ts
export interface SetupAngularComponentEnvOptions {
  mode: 'render' | 'interaction' | 'snapshot';
  component: AngularComponentLike;
  inputs?: Record<string, unknown>;
}
```

#### `SetupBrowserComponentEnvOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/browser.ts#L40) `packages/ui/src/browser.ts`

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

#### `SetupComponentEnvOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/types.ts#L8) `packages/ui/src/types.ts`

```ts
export interface SetupComponentEnvOptions<TMode extends UiTestMode = UiTestMode> {
  mode: TMode;
  ui: ReactElement;
  /** Options forwarded to @testing-library/react render() */
  renderOptions?: RenderOptions;
  /** Initial userEvent setup (interaction mode only) */
  userEventOptions?: Parameters<UserEvent['setup']> extends [infer Opts]
    ? Opts
    : Record<string, unknown>;
}
```

#### `SetupLitComponentEnvOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/lit.ts#L10) `packages/ui/src/lit.ts`

```ts
export interface SetupLitComponentEnvOptions {
  mode: 'render' | 'interaction' | 'snapshot';
  template: LitTemplateLike;
}
```

#### `SetupQwikComponentEnvOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/qwik.ts#L14) `packages/ui/src/qwik.ts`

```ts
export interface SetupQwikComponentEnvOptions {
  mode: 'render' | 'interaction' | 'snapshot';
  component: QwikComponentLike;
}
```

#### `SetupSolidComponentEnvOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/solid.ts#L9) `packages/ui/src/solid.ts`

```ts
export interface SetupSolidComponentEnvOptions {
  mode: 'render' | 'interaction' | 'snapshot';
  component: () => unknown;
  props?: Record<string, unknown>;
}
```

#### `SetupSvelteComponentEnvOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/svelte.ts#L9) `packages/ui/src/svelte.ts`

```ts
export interface SetupSvelteComponentEnvOptions {
  mode: 'render' | 'interaction' | 'snapshot';
  component: SvelteComponentLike;
  props?: Record<string, unknown>;
}
```

#### `SetupVueComponentEnvOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/vue.ts#L9) `packages/ui/src/vue.ts`

```ts
export interface SetupVueComponentEnvOptions {
  mode: 'render' | 'interaction' | 'snapshot';
  component: VueComponentLike;
  props?: Record<string, unknown>;
  slots?: Record<string, unknown>;
}
```

#### `SnapshotTestEnvUi`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/types.ts#L32) `packages/ui/src/types.ts`

```ts
export interface SnapshotTestEnvUi extends TestEnvBase<'mock'> {
  kind: 'snapshot';
  result: RenderResult;
  /** Serialized DOM markup of the rendered tree, ready for inline / file snapshot */
  markup: string;
}
```

#### `SolidContainerLike`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/solid.ts#L15) `packages/ui/src/solid.ts`

```ts
export interface SolidContainerLike {
  container: HTMLElement;
  getByTestId: (id: string) => HTMLElement;
  getByText: (text: string | RegExp) => HTMLElement;
}
```

#### `SolidTestEnvUi`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/solid.ts#L21) `packages/ui/src/solid.ts`

```ts
export interface SolidTestEnvUi extends TestEnvBase<'mock' | 'live'> {
  kind: 'solid';
  result: SolidContainerLike;
  markup: string;
}
```

#### `SvelteContainerLike`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/svelte.ts#L15) `packages/ui/src/svelte.ts`

```ts
export interface SvelteContainerLike {
  container: HTMLElement;
  getByTestId: (id: string) => HTMLElement;
  getByText: (text: string | RegExp) => HTMLElement;
}
```

#### `SvelteTestEnvUi`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/svelte.ts#L21) `packages/ui/src/svelte.ts`

```ts
export interface SvelteTestEnvUi extends TestEnvBase<'mock' | 'live'> {
  kind: 'svelte';
  result: SvelteContainerLike;
  markup: string;
}
```

#### `UiTestEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/types.ts#L39) `packages/ui/src/types.ts`

```ts
export type UiTestEnv = RenderTestEnvUi | InteractionTestEnvUi | SnapshotTestEnvUi;
```

#### `UiTestMode`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/types.ts#L6) `packages/ui/src/types.ts`

```ts
export type UiTestMode = 'render' | 'interaction' | 'snapshot' | 'browser';
```

#### `VueTestEnvUi`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/vue.ts#L33) `packages/ui/src/vue.ts`

```ts
export interface VueTestEnvUi extends TestEnvBase<'mock' | 'live'> {
  kind: 'vue';
  wrapper: VueWrapperLike;
  markup: string;
}
```

#### `VueWrapperLike`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/vue.ts#L24) `packages/ui/src/vue.ts`

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
