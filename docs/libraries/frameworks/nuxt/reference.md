# nuxt リファレンス

## 公開 API

`invokeEventHandler` は H3 event を作り `result`、`redirect`、`error`、`env` を返します。`invokeRouteMiddleware` と `setupNuxtMiddlewareEnv` は route guard を扱います。`invokeNitroPlugin` は Nitro hook の登録と実行を扱います。

## 設定

event handler は URL、method、body、headers、cookies、query override を受け取ります。URL の同名 query は配列になり、明示した query override が優先されます。

## 結果の分岐

event handler は result、redirect、error を分離して返します。cookie と header は env で確認するため、redirect response のみを見て副作用の有無を判断しません。

route middleware の結果は `result`、`redirect`、`abort`、`error` です。`navigateTo` の options は external、replace、redirectCode を記録します。

Nitro plugin は request、beforeResponse、afterResponse、error、render:html、render:response、close の hook を登録できます。hook callback の例外は call driver が収集するため、plugin setup error と別に確認します。

## 後始末と制約

cookie と response header は env に残るため環境を共有しません。redirect 以外の例外は error で確認します。Nitro server、Nuxt composable、実 network は起動しません。

<!-- kiwa-public-api:start -->

## API 契約

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/nuxt/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [invoke-event-handler.ts](./api/invoke-event-handler) | 2 | 6 |
| [invoke-nitro-plugin.ts](./api/invoke-nitro-plugin) | 1 | 7 |
| [invoke-route-middleware.ts](./api/invoke-route-middleware) | 3 | 8 |
| [setup-route-middleware-env.ts](./api/setup-route-middleware-env) | 1 | 5 |

<!-- kiwa-public-api:end -->
