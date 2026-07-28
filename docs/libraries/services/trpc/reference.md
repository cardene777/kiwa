# @kiwa-lab/trpc リファレンス

tRPC router の公開 API です。

## 主要 API

- `createRouter` は procedure map と middleware から router を作ります
- `defineProcedure` は `type`、`handler`、任意の middleware 配列を順に渡して query、mutation、subscription を定義します
- `invokeProcedure` は path と input で server 側を実行します
- `createClient` は client proxy を作ります
- `middleware`、`TRPCError`、`createContext` は middleware と context を扱います

## 設定

procedure の `type` と handler を指定します。router の global middleware は procedure middleware より先に実行されます。未知の path は `NOT_FOUND` の `TRPCError` になります。

## 後始末

外部接続は作りません。router はテストごとに作成してください。

## client とprocedure type

`defineProcedure` のtypeは `query`、`mutation`、`subscription` の識別子です。`invokeProcedure` と `createClient` はtypeに応じた実行分岐をせず、いずれもhandlerを直接呼びます。

`createClient(router)` のpath propertyはProxyで動的に作られます。存在しないpathのerrorはproperty取得時ではなく、query、mutate、subscribeを呼んだときに返ります。

## resilience helper

すべてのresilience helperはhandler wrapperです。router middlewareではありません。`withRetry` はretryOnがtrueのerrorだけをretryします。`withTimeout` は元handlerをcancelしません。`withRateLimit` はwrapper内のwall clock timestampを使います。`withCircuitBreaker` はfailure threshold到達時にopenし、reset時間後の一callをhalf-openで許可します。

`batchInvoke` は全itemをPromise.allで実行し、個別errorを `BatchInvokeResult` に正規化します。`withIdempotencyKey` は成功したresultだけをinputのidempotency keyでcacheします。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| <code v-pre>circuit breaker open</code> | [packages/trpc/src/resilience.ts](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/resilience.ts#L111) |
| <code v-pre>rate limit $&#123;options.maxRequests&#125;/$&#123;options.windowMs&#125;ms exceeded</code> | [packages/trpc/src/resilience.ts](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/resilience.ts#L92) |

## API 契約

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [client.ts](./api/client) | 1 | 1 |
| [context.ts](./api/context) | 1 | 2 |
| [middleware.ts](./api/middleware) | 2 | 4 |
| [procedure.ts](./api/procedure) | 1 | 3 |
| [resilience.ts](./api/resilience) | 7 | 7 |
| [router.ts](./api/router) | 2 | 2 |

<!-- kiwa-public-api:end -->
