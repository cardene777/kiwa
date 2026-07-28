# go-lib リファレンス

## 公開 API

`createGoAppEnv` はframeworkとroute定義を保持します。`invokeGinHandler`、`invokeEchoHandler`、`invokeFiberHandler` は個別handlerを実行し、`captureChiRoute` はchi appのmatchとmiddleware traceを返します。`composeMiddleware` と `createRouteGroup` はroute構成を補助します。

## 設定

環境の `framework` は `gin`、`echo`、`fiber`、`chi` です。`createGoAppEnv` の `initialRoutes` と `addRoute` はメタデータを保存するだけで、handler関数は保存せずdispatchもしません。`reset` はこの一覧だけを空にします。

handler実行ではhandlerと `req` を渡します。ginの `Param` と `Query` は存在しなければ `undefined`、echoとfiberの `Param` と `Query` は空文字です。header keyを設定する場合は小文字で結果へ保存されます。echoとfiberが返す `Error` は `handlerError`、ginのabortは `aborted` として結果に反映されます。

chiではapp、method、pathを渡します。一致したpatternの `{name}` を `params.name` に入れ、middlewareは登録順に実行記録へ追加します。middlewareが `next` を呼ばなくても、現実装ではmiddleware chainの後にhandlerを実行します。`ChiApp` のfactoryは公開entry pointに含まれない点に注意してください。

## 結果の分岐

route実行はstatus、body、header、matchedを返します。chiの未一致はhandler errorではなく `matched: false` と404であり、ginなどのcontext値と分けて確認します。chiでhandlerがthrowした場合は捕捉しません。

## 補助関数

`retryWithBackoff` は指数backoff後に失敗結果を返します。`withTimeout` は時間切れ後も元の処理をcancelしません。`createRateLimiter` はメモリ上のtoken bucketで、`tryAcquire` の真偽を返します。`createCircuitBreaker` は失敗回数でopenとなり、reset時間の後にhalf-openになります。

`createCancelToken` は複数回cancelしてもlistenerを一度だけ呼びます。`composeMiddleware` は同じ `next` を二度呼ぶとrejectします。`createRouteGroup` のsubgroupで追加したrouteは親の一覧にも追加されます。

## 後始末と制約

環境、router fixture、rate limiter、circuit breakerはテストごとに作ります。Goのバイナリ、実framework、networkは起動しません。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| <code v-pre>circuit-open</code> | [packages/go-lib/src/extensions.ts](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L219) |
| <code v-pre>next() called multiple times</code> | [packages/go-lib/src/extensions.ts](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/extensions.ts#L276) |

## API 契約

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [chi.ts](./api/chi) | 1 | 5 |
| [echo.ts](./api/echo) | 1 | 4 |
| [env.ts](./api/env) | 1 | 6 |
| [extensions.ts](./api/extensions) | 9 | 16 |
| [fiber.ts](./api/fiber) | 1 | 4 |
| [gin.ts](./api/gin) | 1 | 4 |

<!-- kiwa-public-api:end -->
