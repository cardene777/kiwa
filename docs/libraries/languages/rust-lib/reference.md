# rust-lib リファレンス

## 公開 API

`createRustAppEnv` はframeworkとroute一覧を持つ環境を作ります。`invokeAxumHandler` と `invokeActixHandler` はhandlerを実行します。`captureTowerMiddleware` はmiddlewareのtrace、`invokeRocketRoute` はRocket routeの結果を返します。

## 設定

frameworkは `axum`、`actix-web`、`tower-http`、`rocket` を選べ、未指定時は `axum` です。環境のrouteはmethodとpathが完全一致した最初のものを返します。`clear` はroute一覧を空にします。

axumにはbodyとheader、actixにはbodyと `extractors`、Rocketにはbodyとguard名配列を渡します。これらの値はhandlerへ自動で注入されません。handlerの引数はbodyだけで、headers、extractors、guardsは結果に記録するメタデータです。

## 結果の分岐

handler実行はstatus、body、method、path、durationを返します。axumは渡されたheader、actixはextractor、Rocketはguard名を結果に返します。成功は常に200、例外は500かつbody `null` です。例外はreasonで区別し、成功responseのbodyとして比較しないでください。

Tower traceはenteredとexitedを返します。handlerを省略した場合は `{ status: 200, body: null }` が終端responseです。middlewareの例外は捕捉しません。

## resilience補助

`withRetry`、`withTimeout`、`withRateLimit`、`withCircuitBreaker`、`withObservability`、`withIdempotencyKey` は環境と独立したasync wrapperです。rate limitとcircuit breakerの状態は、返されたwrapperごとに保持されます。`batchOperate` は全itemを並列実行し、失敗したitemだけを `{ ok: false, error }` に変換します。

## 後始末と制約

環境、middleware、resilience wrapperはテストごとに用意してください。Rust compiler、実server、実middleware crateは起動しません。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| <code v-pre>rate limit $&#123;options.maxRequests&#125;/$&#123;options.windowMs&#125;ms exceeded</code> | [packages/rust-lib/src/resilience.ts](https://github.com/cardene777/kiwa/blob/main/packages/rust-lib/src/resilience.ts#L57) |
| <code v-pre>circuit breaker open</code> | [packages/rust-lib/src/resilience.ts](https://github.com/cardene777/kiwa/blob/main/packages/rust-lib/src/resilience.ts#L72) |

## API 契約

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/rust-lib/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [actix.ts](./api/actix) | 1 | 3 |
| [axum.ts](./api/axum) | 1 | 3 |
| [env.ts](./api/env) | 1 | 4 |
| [resilience.ts](./api/resilience) | 7 | 7 |
| [rocket.ts](./api/rocket) | 1 | 3 |
| [tower.ts](./api/tower) | 1 | 3 |

<!-- kiwa-public-api:end -->
