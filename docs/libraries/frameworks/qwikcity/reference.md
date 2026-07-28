# qwikcity リファレンス

## route action

`invokeRouteAction` は action、formValues、URL、cookies、headers を受け取ります。結果は `result`、`fail`、`redirect`、`error`、更新後の `env` を持ちます。

| action の結果 | helper の結果 |
| --- | --- |
| 通常の値 | `result` |
| `event.fail` の戻り値 | `fail` |
| `event.redirect` | `redirect` |
| その他の例外 | `error` |

## route loader

`invokeRouteLoader` は absolute URL が必要です。event には URL、params、URLSearchParams、read-only cookie、headers、platform、redirect があります。結果は data、redirect、error です。

## endpoint

`invokeEndpoint` は handler と URL を受け取ります。event の `json` と `text` は response kind と body を記録します。`status` と `setHeader` は後から response に反映されます。

| body の指定 | 既定 method |
| --- | --- |
| なし | GET |
| formData | POST |
| jsonBody | POST |

response headers は小文字の Map です。Endpoint の redirect signal と通常の exception は response の status に変換されず、各々 `redirect` と `error` に入ります。

<!-- kiwa-public-api:start -->

## API 契約

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/qwikcity/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [invoke-endpoint.ts](./api/invoke-endpoint) | 2 | 6 |
| [invoke-route-action.ts](./api/invoke-route-action) | 3 | 6 |
| [invoke-route-loader.ts](./api/invoke-route-loader) | 1 | 4 |

<!-- kiwa-public-api:end -->
