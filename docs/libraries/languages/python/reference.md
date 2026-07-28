# python リファレンス

## 公開 API

`createPythonAppEnv` は framework、route、template、middleware、呼び出し履歴を持つ環境を作ります。`dispatchRequest` は route を実行し、`renderTemplate` は登録済みtemplateを展開し、`captureMiddlewareCall` は呼び出し履歴のコピーを返します。

## 設定

`framework` は `django`、`flask`、`fastapi`、`starlette` を選べます。未指定時は `flask` です。`mode` を省略すると Django と Flask は `wsgi`、FastAPI と Starlette は `asgi` になります。`mode` は明示指定で上書きできます。

route は `env.registerRoute(method, path, handler)`、middleware は `env.registerMiddleware(entry)`、template は `env.registerTemplate(name, template)` で設定します。同一の method と path、または同一template名を再登録すると、後の登録が前を置き換えます。middlewareだけは置き換えず末尾へ追加します。

## 結果の分岐

route dispatch は handler の `PythonResponse` を返します。handlerがない場合だけ定型の404を返し、handlerやmiddlewareの例外は捕捉しません。requestの `headers`、`body`、`query` は変換されずそのままhandlerへ渡ります。

template描画は `html`、検出した `variables`、不足した `missing` を返します。対応する記法は `&#123;&#123; identifier &#125;&#125;` と `&#123;&#123; dotted.name &#125;&#125;` だけです。filter、条件分岐、loop、HTML escapeは実装しません。未登録templateは `template not found: <name>` をthrowします。

## resilience補助

`withRetry`、`withTimeout`、`withRateLimit`、`withCircuitBreaker`、`withObservability`、`withIdempotencyKey` は、引数なしの非同期関数を包む独立した補助関数です。Python app env へ自動登録はしません。

`withTimeout` は時間切れ後も元の処理をcancelしません。`withIdempotencyKey` は成功した値だけをkeyごとにメモリへ保存します。`withRateLimit` と `withCircuitBreaker` の状態も、返されたwrapperの寿命に限られます。`batchOperate` は全itemを並列実行し、失敗したitemだけ `{ ok: false, error }` に変換します。

## 後始末と制約

環境はテストごとに作り、Python interpreter、WSGI、ASGI、実framework、実ネットワークは起動しません。フレームワーク固有のルーティング、template機能、例外変換を確認する用途には使わないでください。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| <code v-pre>rate limit $&#123;options.maxRequests&#125;/$&#123;options.windowMs&#125;ms exceeded</code> | [packages/python/src/resilience.ts](https://github.com/cardene777/kiwa/blob/main/packages/python/src/resilience.ts#L57) |
| <code v-pre>circuit breaker open</code> | [packages/python/src/resilience.ts](https://github.com/cardene777/kiwa/blob/main/packages/python/src/resilience.ts#L72) |
| <code v-pre>template not found: $&#123;name&#125;</code> | [packages/python/src/template.ts](https://github.com/cardene777/kiwa/blob/main/packages/python/src/template.ts#L18) |

## API 契約

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/python/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [dispatch.ts](./api/dispatch) | 1 | 3 |
| [env.ts](./api/env) | 1 | 5 |
| [middleware.ts](./api/middleware) | 1 | 1 |
| [resilience.ts](./api/resilience) | 7 | 7 |
| [template.ts](./api/template) | 1 | 2 |

<!-- kiwa-public-api:end -->
