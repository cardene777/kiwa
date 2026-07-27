# API リファレンス

このページは `@kiwa-lab/e2e` の公開エクスポートを対象にしています。型はすべて TypeScript の型エクスポートです。

## `setupE2eEnv`

```ts
function setupE2eEnv(options?: SetupE2eEnvOptions): Promise<E2eTestEnv>
```

ローカル HTTP サーバー、Playwright ブラウザ、context、page を作成し、最初の URL を開いてから環境を返します。アプリも `staticHtml` も指定されていないときは、`setupE2eEnv: provide either { app } or { staticHtml }` を送出します。

### `SetupE2eEnvOptions`

| プロパティ | 型 | 既定値 | 説明 |
| --- | --- | --- | --- |
| `app` | `ApiHandlerSource \| NodeRequestHandler` | なし | テスト対象のサーバーアプリ。関数は Node.js ハンドラーとして扱われます。 |
| `staticHtml` | `string` | なし | `app` がないときに HTML を返す簡易アプリを作ります。空文字列も有効です。 |
| `browser` | `"chromium" \| "firefox" \| "webkit"` | `"chromium"` | 起動する Playwright エンジン。 |
| `headless` | `boolean` | `true` | Playwright の `launch` に渡す headless フラグ。 |
| `initialPath` | `string` | `"/"` | 起動後に開くパスまたは `http` URL。相対パスは先頭に `/` が補われます。 |

### `E2eTestEnv`

`E2eTestEnv` は `@kiwa-lab/core` の `TestEnvBase<"live">` を拡張します。`E2eMode` 型には `static` も含まれますが、現在の `setupE2eEnv` が返す `mode` は static HTML を渡した場合も常に `"live"` です。

| プロパティ | 型 | 説明 |
| --- | --- | --- |
| `baseUrl` | `string` | `http://127.0.0.1:<port>` 形式のローカル URL。 |
| `page` | `BrowserPageHandle` | 起動済みのブラウザページ。 |
| `browser` | `"chromium" \| "firefox" \| "webkit"` | 実際に起動したエンジン名。 |
| `stop` | `() => Promise<void>` | page、context、browser、server を閉じます。 |

## `startServer`

```ts
function startServer(source: ApiHandlerSource | NodeRequestHandler): Promise<ServerHandle>
```

HTTP サーバーだけを起動したい場合に使います。サーバーは `127.0.0.1` の自動割り当てポートで待ち受けます。

### `ApiHandlerSource`

```ts
type ApiHandlerSource =
  | { kind: "fetch"; handler: (request: Request) => Promise<Response> | Response }
  | { kind: "node"; handler: NodeRequestHandler };
```

Fetch ハンドラーのレスポンスでは、ステータスとヘッダーが HTTP 応答に引き継がれます。ハンドラーの例外は HTTP 500 になります。Node.js ハンドラーも、同期例外・非同期 reject のどちらも HTTP 500 に変換されます。

### `NodeRequestHandler`

```ts
type NodeRequestHandler = (
  request: import("node:http").IncomingMessage,
  response: import("node:http").ServerResponse,
) => void | Promise<void>;
```

### `ServerHandle`

| プロパティ | 型 | 説明 |
| --- | --- | --- |
| `baseUrl` | `string` | 起動済みサーバーの URL。 |
| `port` | `number` | 自動割り当てされたポート番号。 |
| `close` | `() => Promise<void>` | サーバーを停止します。 |

## ブラウザハンドル

`E2eTestEnv.page` は Playwright のページ全体を公開するのではなく、次の操作に絞った `BrowserPageHandle` です。

| メソッド | 結果 | 用途 |
| --- | --- | --- |
| `goto(url, options?)` | `Promise<unknown>` | URL に移動する。`waitUntil` は `load`、`domcontentloaded`、`networkidle`。 |
| `setContent(html, options?)` | `Promise<void>` | ページ内容を HTML へ置き換える。 |
| `getByTestId(id)` | `BrowserLocator` | `data-testid` で要素を取得する。 |
| `getByRole(role, options?)` | `BrowserLocator` | role と任意の name で要素を取得する。 |
| `getByText(text)` | `BrowserLocator` | テキストで要素を取得する。 |
| `fill(selector, value)` | `Promise<void>` | CSS セレクターで入力する。 |
| `click(selector)` | `Promise<void>` | CSS セレクターの要素をクリックする。 |
| `evaluate(fn)` | `Promise<T>` | ページで関数を評価する。 |
| `screenshot(options?)` | `Promise<Buffer>` | スクリーンショットを取得する。`path` を指定できる。 |
| `content()` | `Promise<string>` | 現在の HTML を取得する。 |
| `url()` | `string` | 現在の URL を取得する。 |
| `close()` | `Promise<void>` | ページを閉じる。 |

`getByTestId`、`getByRole`、`getByText` が返す `BrowserLocator` には、`textContent()`、`click()`、`fill(value)`、`isVisible()`、`count()` があります。

## 関連ページ

- 実行可能な最小例は [はじめる](./quickstart) を参照してください
- app と browser の選び方は [使い方](./how-to) を参照してください

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| 'setupE2eEnv requires "@playwright/test" or "playwright". Run `pnpm add -D @playwright/test`.' | [packages/e2e/src/browser-bridge.ts](https://github.com/cardene777/kiwa/blob/main/packages/e2e/src/browser-bridge.ts#L50) |
| `setupE2eEnv: playwright engine "${name}" not available` | [packages/e2e/src/browser-bridge.ts](https://github.com/cardene777/kiwa/blob/main/packages/e2e/src/browser-bridge.ts#L64) |
| 'setupE2eEnv: provide either { app } or { staticHtml }' | [packages/e2e/src/setup-e2e-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/e2e/src/setup-e2e-env.ts#L19) |

## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/e2e/src/index.ts) から同期しています。各項目は公開名、実際の TypeScript 宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### `setupE2eEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/e2e/src/setup-e2e-env.ts#L5) `packages/e2e/src/setup-e2e-env.ts`

```ts
export async function setupE2eEnv(opts: SetupE2eEnvOptions = {}): Promise<E2eTestEnv>;
```

#### `startServer`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/e2e/src/http-server.ts#L55) `packages/e2e/src/http-server.ts`

```ts
export async function startServer(source: ApiHandlerSource | NodeRequestHandler): Promise<ServerHandle>;
```

### 型

#### `ApiHandlerSource`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/e2e/src/http-server.ts#L3) `packages/e2e/src/http-server.ts`

```ts
export type ApiHandlerSource =
  | { kind: 'fetch'; handler: (req: Request) => Promise<Response> | Response }
  | { kind: 'node'; handler: NodeRequestHandler };
```

#### `BrowserContextHandle`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/e2e/src/browser-bridge.ts#L14) `packages/e2e/src/browser-bridge.ts`

```ts
export interface BrowserContextHandle {
  newPage: () => Promise<BrowserPageHandle>;
  close: () => Promise<void>;
}
```

#### `BrowserHandle`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/e2e/src/browser-bridge.ts#L9) `packages/e2e/src/browser-bridge.ts`

```ts
export interface BrowserHandle {
  close: () => Promise<void>;
  newContext: () => Promise<BrowserContextHandle>;
}
```

#### `BrowserLocator`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/e2e/src/browser-bridge.ts#L34) `packages/e2e/src/browser-bridge.ts`

```ts
export interface BrowserLocator {
  textContent: () => Promise<string | null>;
  click: () => Promise<void>;
  fill: (value: string) => Promise<void>;
  isVisible: () => Promise<boolean>;
  count: () => Promise<number>;
}
```

#### `BrowserPageHandle`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/e2e/src/browser-bridge.ts#L19) `packages/e2e/src/browser-bridge.ts`

```ts
export interface BrowserPageHandle {
  goto: (url: string, opts?: { waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' }) => Promise<unknown>;
  setContent: (html: string, opts?: { waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' }) => Promise<void>;
  getByTestId: (id: string) => BrowserLocator;
  getByRole: (role: string, opts?: { name?: string }) => BrowserLocator;
  getByText: (text: string) => BrowserLocator;
  fill: (selector: string, value: string) => Promise<void>;
  click: (selector: string) => Promise<void>;
  evaluate: <T>(fn: () => T | Promise<T>) => Promise<T>;
  screenshot: (opts?: { path?: string }) => Promise<Buffer>;
  content: () => Promise<string>;
  url: () => string;
  close: () => Promise<void>;
}
```

#### `E2eMode`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/e2e/src/types.ts#L4) `packages/e2e/src/types.ts`

```ts
export type E2eMode = 'live' | 'static';
```

#### `E2eTestEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/e2e/src/types.ts#L19) `packages/e2e/src/types.ts`

```ts
export interface E2eTestEnv extends TestEnvBase<'live'> {
  baseUrl: string;
  page: import('./browser-bridge.js').BrowserPageHandle;
  browser: 'chromium' | 'firefox' | 'webkit';
}
```

#### `NodeRequestHandler`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/e2e/src/http-server.ts#L7) `packages/e2e/src/http-server.ts`

```ts
export type NodeRequestHandler = (
  req: import('node:http').IncomingMessage,
  res: import('node:http').ServerResponse,
) => void | Promise<void>;
```

#### `ServerHandle`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/e2e/src/http-server.ts#L49) `packages/e2e/src/http-server.ts`

```ts
export interface ServerHandle {
  baseUrl: string;
  port: number;
  close: () => Promise<void>;
}
```

#### `SetupE2eEnvOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/e2e/src/types.ts#L6) `packages/e2e/src/types.ts`

```ts
export interface SetupE2eEnvOptions {
  /** Mount the app under the given baseUrl (default http://127.0.0.1:auto) */
  app?: ApiHandlerSource | NodeRequestHandler;
  /** Static HTML to serve at "/" when no app is given */
  staticHtml?: string;
  /** Playwright browser (default chromium) */
  browser?: 'chromium' | 'firefox' | 'webkit';
  /** headless launch flag (default true) */
  headless?: boolean;
  /** initial route to navigate after launch */
  initialPath?: string;
}
```
<!-- kiwa-public-api:end -->
