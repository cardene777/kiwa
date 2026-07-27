# @kiwa-lab/api リファレンス

HTTP API test environment、local live server、MSW bridge、request client の公開 API です。

## setupApiServer

`setupApiServer(options)` は `mode` に対応する `ApiTestEnv` を非同期で作ります。

| mode | 必須 option | 戻り値 |
| --- | --- | --- |
| `mock` | `mockHandlers` | `MockTestEnvApi` |
| `live` | `app` | `LiveTestEnvApi` |
| `hybrid` | `app` と `mockHandlers` | `HybridTestEnvApi` |

`mockHandlers` がない mock mode、`app` がない live mode、どちらかがない hybrid mode は reject します。未知の mode も reject します。

すべての env は `mode`、`baseUrl`、`request`、非同期の `stop()` を持ちます。mock と hybrid の env はさらに `mocks.reset()` を持ちます。mock mode の既定 base URL は `http://kiwa.mock` です。live と hybrid は起動した server の URL を既定として使います。

## handler の形

`app` は次のいずれかです。

```ts
type ApiHandlerSource =
  | { kind: "fetch"; handler: (request: Request) => Response | Promise<Response> }
  | { kind: "node"; handler: NodeRequestHandler };

type NodeRequestHandler =
  (req: import("node:http").IncomingMessage, res: import("node:http").ServerResponse) => void | Promise<void>;
```

Node handler は object でも直接の関数でも渡せます。直接の関数は Node handler として扱われます。Fetch handler の request body は GET と HEAD を除いて UTF-8 text に変換されます。

## request client

`env.request` と `createRequestClient` は次の method を持ち、すべて `Promise<ApiResponseSnapshot>` を返します。

| method | body の扱い |
| --- | --- |
| `get(path, init)` | body なし |
| `post(path, body, init)` | body を送信 |
| `put(path, body, init)` | body を送信 |
| `patch(path, body, init)` | body を送信 |
| `delete(path, init)` | body なし |

object body は JSON に変換されます。string、`ArrayBuffer`、`Uint8Array` はそのままです。`null` と `undefined` は body を送信しません。header の優先順は default headers、JSON body の content type、request の `init.headers` です。

`ApiResponseSnapshot` は `status`、小文字化された header の record、`bodyText`、`json<T>()` を持ちます。`json()` は JSON でない本文や空本文では throw します。

## server と mock bridge

`startLiveServer(source)` は `{ baseUrl, port, close }` を返します。server は 127.0.0.1 の空き port を使います。

`startMockServer({ handlers, onUnhandledRequest })` は MSW server を起動し、`reset()` と `close()` を返します。`onUnhandledRequest` は `error`、`warn`、`bypass` を指定できます。既定は `bypass` です。MSW が未導入なら初期化時に reject します。

## 関連する型

`SetupApiServerOptions` は `mode`、`mockHandlers`、`app`、`baseUrl`、`defaultHeaders` を持ちます。`RequestClientOptions` は `baseUrl`、任意の `defaultHeaders` と `fetcher` を持ちます。`fetcher` は request client を実 network なしで unit test したい場合に指定します。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| 'setupApiServer({ mode: "mock" \| "hybrid" }) requires "msw" to be installed. Run `pnpm add -D msw`.' | [packages/api/src/msw-bridge.ts](https://github.com/cardene777/kiwa/blob/main/packages/api/src/msw-bridge.ts#L27) |
| 'setupApiServer({ mode: "mock" }) requires mockHandlers' | [packages/api/src/setup-api-server.ts](https://github.com/cardene777/kiwa/blob/main/packages/api/src/setup-api-server.ts#L20) |
| 'setupApiServer({ mode: "live" }) requires app' | [packages/api/src/setup-api-server.ts](https://github.com/cardene777/kiwa/blob/main/packages/api/src/setup-api-server.ts#L38) |
| 'setupApiServer({ mode: "hybrid" }) requires app' | [packages/api/src/setup-api-server.ts](https://github.com/cardene777/kiwa/blob/main/packages/api/src/setup-api-server.ts#L53) |
| 'setupApiServer({ mode: "hybrid" }) requires mockHandlers' | [packages/api/src/setup-api-server.ts](https://github.com/cardene777/kiwa/blob/main/packages/api/src/setup-api-server.ts#L56) |
| `setupApiServer: unknown mode "${String(opts.mode)}"` | [packages/api/src/setup-api-server.ts](https://github.com/cardene777/kiwa/blob/main/packages/api/src/setup-api-server.ts#L74) |

## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/api/src/index.ts) から同期しています。各項目は公開名、実際の TypeScript 宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### `createRequestClient`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/api/src/request-client.ts#L30) `packages/api/src/request-client.ts`

```ts
export function createRequestClient(opts: RequestClientOptions): ApiRequestClient;
```

#### `setupApiServer`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/api/src/setup-api-server.ts#L15) `packages/api/src/setup-api-server.ts`

```ts
export async function setupApiServer<TMode extends TestMode>(
  opts: SetupApiServerOptions<TMode>,
): Promise<ApiTestEnv>;
```

#### `startLiveServer`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/api/src/live-server.ts#L64) `packages/api/src/live-server.ts`

```ts
export async function startLiveServer(
  source: ApiHandlerSource | NodeRequestHandler,
): Promise<LiveServerHandle>;
```

#### `startMockServer`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/api/src/msw-bridge.ts#L33) `packages/api/src/msw-bridge.ts`

```ts
export async function startMockServer(opts: StartMockServerOptions): Promise<MockServerHandle>;
```

### 型

#### `ApiHandlerSource`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/api/src/types.ts#L3) `packages/api/src/types.ts`

```ts
export type ApiHandlerSource =
  | { kind: 'fetch'; handler: (req: Request) => Promise<Response> | Response }
  | { kind: 'node'; handler: NodeRequestHandler };
```

#### `ApiRequestClient`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/api/src/types.ts#L45) `packages/api/src/types.ts`

```ts
export interface ApiRequestClient {
  get: (path: string, init?: RequestInit) => Promise<ApiResponseSnapshot>;
  post: (path: string, body?: unknown, init?: RequestInit) => Promise<ApiResponseSnapshot>;
  put: (path: string, body?: unknown, init?: RequestInit) => Promise<ApiResponseSnapshot>;
  patch: (path: string, body?: unknown, init?: RequestInit) => Promise<ApiResponseSnapshot>;
  delete: (path: string, init?: RequestInit) => Promise<ApiResponseSnapshot>;
}
```

#### `ApiResponseSnapshot`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/api/src/types.ts#L53) `packages/api/src/types.ts`

```ts
export interface ApiResponseSnapshot {
  status: number;
  headers: Record<string, string>;
  bodyText: string;
  json: <T = unknown>() => T;
}
```

#### `ApiTestEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/api/src/types.ts#L43) `packages/api/src/types.ts`

```ts
export type ApiTestEnv = MockTestEnvApi | LiveTestEnvApi | HybridTestEnvApi;
```

#### `HybridTestEnvApi`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/api/src/types.ts#L37) `packages/api/src/types.ts`

```ts
export interface HybridTestEnvApi extends TestEnvBase<'hybrid'> {
  baseUrl: string;
  request: ApiRequestClient;
  mocks: { reset: () => void };
}
```

#### `LiveServerHandle`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/api/src/live-server.ts#L58) `packages/api/src/live-server.ts`

```ts
export interface LiveServerHandle {
  baseUrl: string;
  port: number;
  close: () => Promise<void>;
}
```

#### `LiveTestEnvApi`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/api/src/types.ts#L32) `packages/api/src/types.ts`

```ts
export interface LiveTestEnvApi extends TestEnvBase<'live'> {
  baseUrl: string;
  request: ApiRequestClient;
}
```

#### `MockHandler`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/api/src/types.ts#L12) `packages/api/src/types.ts`

```ts
export type MockHandler = unknown;
```

#### `MockServerHandle`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/api/src/msw-bridge.ts#L15) `packages/api/src/msw-bridge.ts`

```ts
export interface MockServerHandle {
  reset: () => void;
  close: () => void;
}
```

#### `MockTestEnvApi`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/api/src/types.ts#L26) `packages/api/src/types.ts`

```ts
export interface MockTestEnvApi extends TestEnvBase<'mock'> {
  baseUrl: string;
  request: ApiRequestClient;
  mocks: { reset: () => void };
}
```

#### `NodeRequestHandler`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/api/src/types.ts#L7) `packages/api/src/types.ts`

```ts
export type NodeRequestHandler = (
  req: import('node:http').IncomingMessage,
  res: import('node:http').ServerResponse,
) => void | Promise<void>;
```

#### `RequestClientOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/api/src/request-client.ts#L24) `packages/api/src/request-client.ts`

```ts
export interface RequestClientOptions {
  baseUrl: string;
  defaultHeaders?: Record<string, string>;
  fetcher?: typeof fetch;
}
```

#### `SetupApiServerOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/api/src/types.ts#L14) `packages/api/src/types.ts`

```ts
export interface SetupApiServerOptions<TMode extends TestMode = TestMode> {
  mode: TMode;
  /** msw v2 RequestHandler[] (mode = "mock" / "hybrid") */
  mockHandlers?: MockHandler[];
  /** Live HTTP handler (mode = "live" / "hybrid") */
  app?: ApiHandlerSource | NodeRequestHandler;
  /** Optional base URL applied to issued requests */
  baseUrl?: string;
  /** Optional headers applied to every request */
  defaultHeaders?: Record<string, string>;
}
```

#### `StartMockServerOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/api/src/msw-bridge.ts#L10) `packages/api/src/msw-bridge.ts`

```ts
export interface StartMockServerOptions {
  handlers: MockHandler[];
  onUnhandledRequest?: 'error' | 'warn' | 'bypass';
}
```
<!-- kiwa-public-api:end -->
