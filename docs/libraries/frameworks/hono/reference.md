# hono リファレンス

## app と route

`createHonoApp` は `get`、`post`、`put`、`delete`、`patch`、`all`、`use`、`route` を持つ builder を返します。`invokeRoute` は app、method、path、headers、body、env、execution context を受け取り、`matched`、buffered response、middleware trace、error を返します。

`compileRoute` と `matchRoute` は `/users/:id` と `/files/*` を扱います。パラメータは URL decode されます。正規表現や任意の Hono router 拡張は扱いません。

`createContext` は `c.req`、`c.env`、`c.status`、`c.header`、`c.json`、`c.text`、`c.set`、`c.get` を単体 handler テスト用に提供します。`c.json` の既定 content type は JSON、`c.text` の既定 content type は UTF-8 text です。

## RPC

`createRpcClient` は Proxy による in-process client を返します。各 response には `ok`、status、headers、trace、matched、error、`json`、`text` があります。text response の `json()` は `JSON.parse` を行うため、JSON でない text は失敗します。

`defineRpcApp` は configure callback から app と client をまとめて作ります。`isHcResponse` は response shape の判定だけを行います。

## Workers mock

`createWorkersEnv` は KV、D1、R2、vars、secrets を binding 名のまま一つの env object にまとめます。`createExecutionContext` は `waitUntil`、`waitUntilAll`、`passThroughOnException`、`didPassThrough`、`pendingCount` を提供します。background work を登録した test は、assertion の前に `waitUntilAll` を await します。

KV は get、put、delete、metadata、expiration、prefix list を in-memory で扱います。D1 は query ごとにあらかじめ登録した response と bindings log を返し、SQL や transaction を実行しません。R2 は object と metadata を保持しますが、checksum や content type を推論しません。D1 batch も transaction を保証せず、各 statement を独立して `run()` します。Workers の Durable Objects、Queue、WebSocket、実 binding lifecycle は対象外です。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| <code v-pre>missing param "$&#123;key&#125;" for path segment "$&#123;seg&#125;"</code> | [packages/hono/src/rpc.ts](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/rpc.ts#L85) |

## API 契約

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/hono/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [app.ts](./api/app) | 11 | 13 |
| [rpc.ts](./api/rpc) | 5 | 4 |
| [workers.ts](./api/workers) | 15 | 14 |

<!-- kiwa-public-api:end -->
