# solidstart リファレンス

## server function

`invokeServerFunction` は `fn` と `args` を直接実行します。結果は `result`、`redirect`、`error`、小文字化された request headers と cookie Map を持つ `env` です。

`redirect(url, status)` は `SOLIDSTART_REDIRECT_SYMBOL` を持つ signal を返します。function がこれを throw した場合だけ `redirect` になります。

## API route

`invokeApiRoute` は handler、absolute URL、method、params、headers、formData、jsonBody、locals を受け取ります。event は Request、params、locals、空 object の nativeEvent を持ちます。

| body | 既定 method |
| --- | --- |
| なし | GET |
| formData | POST |
| jsonBody | POST |

`json` は JSON content type を補い、`redirectResponse` は location header を持つ Response を作ります。3xx Response は `redirect` に記録されますが、API handler の例外は捕捉されません。

<!-- kiwa-public-api:start -->

## API 契約

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/solidstart/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [invoke-api-route.ts](./api/invoke-api-route) | 3 | 4 |
| [invoke-server-function.ts](./api/invoke-server-function) | 3 | 4 |

<!-- kiwa-public-api:end -->
