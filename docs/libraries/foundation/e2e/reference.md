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
| <code v-pre>setupE2eEnv requires "@playwright/test" or "playwright". Run &#96;pnpm add -D @playwright/test&#96;.</code> | [packages/e2e/src/browser-bridge.ts](https://github.com/cardene777/kiwa/blob/main/packages/e2e/src/browser-bridge.ts#L50) |
| <code v-pre>setupE2eEnv: playwright engine "$&#123;name&#125;" not available</code> | [packages/e2e/src/browser-bridge.ts](https://github.com/cardene777/kiwa/blob/main/packages/e2e/src/browser-bridge.ts#L64) |
| <code v-pre>setupE2eEnv: provide either &#123; app &#125; or &#123; staticHtml &#125;</code> | [packages/e2e/src/setup-e2e-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/e2e/src/setup-e2e-env.ts#L19) |

## API 契約

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/e2e/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [browser-bridge.ts](./api/browser-bridge) | 0 | 4 |
| [http-server.ts](./api/http-server) | 1 | 3 |
| [setup-e2e-env.ts](./api/setup-e2e-env) | 1 | 0 |
| [types.ts](./api/types) | 0 | 3 |

<!-- kiwa-public-api:end -->
