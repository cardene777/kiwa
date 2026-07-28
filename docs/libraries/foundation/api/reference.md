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
| <code v-pre>setupApiServer(&#123; mode: "mock" &#124; "hybrid" &#125;) requires "msw" to be installed. Run &#96;pnpm add -D msw&#96;.</code> | [packages/api/src/msw-bridge.ts](https://github.com/cardene777/kiwa/blob/main/packages/api/src/msw-bridge.ts#L27) |
| <code v-pre>setupApiServer(&#123; mode: "mock" &#125;) requires mockHandlers</code> | [packages/api/src/setup-api-server.ts](https://github.com/cardene777/kiwa/blob/main/packages/api/src/setup-api-server.ts#L20) |
| <code v-pre>setupApiServer(&#123; mode: "live" &#125;) requires app</code> | [packages/api/src/setup-api-server.ts](https://github.com/cardene777/kiwa/blob/main/packages/api/src/setup-api-server.ts#L38) |
| <code v-pre>setupApiServer(&#123; mode: "hybrid" &#125;) requires app</code> | [packages/api/src/setup-api-server.ts](https://github.com/cardene777/kiwa/blob/main/packages/api/src/setup-api-server.ts#L53) |
| <code v-pre>setupApiServer(&#123; mode: "hybrid" &#125;) requires mockHandlers</code> | [packages/api/src/setup-api-server.ts](https://github.com/cardene777/kiwa/blob/main/packages/api/src/setup-api-server.ts#L56) |
| <code v-pre>setupApiServer: unknown mode "$&#123;String(opts.mode)&#125;"</code> | [packages/api/src/setup-api-server.ts](https://github.com/cardene777/kiwa/blob/main/packages/api/src/setup-api-server.ts#L74) |

## API 契約

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/api/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [live-server.ts](./api/live-server) | 1 | 1 |
| [msw-bridge.ts](./api/msw-bridge) | 1 | 2 |
| [request-client.ts](./api/request-client) | 1 | 1 |
| [setup-api-server.ts](./api/setup-api-server) | 1 | 0 |
| [types.ts](./api/types) | 0 | 10 |

<!-- kiwa-public-api:end -->
