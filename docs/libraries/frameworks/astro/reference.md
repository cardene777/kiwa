# astro リファレンス

## endpoint

`invokeEndpoint(options)` は `endpoint` に simulated `APIContext` を渡し、`InvokeEndpointResult` を返します。context には Request、params、cookies、url、site、locals、`redirect` があります。

| option | 内容 |
| --- | --- |
| `url` | 必須の absolute URL |
| `method` | Request method。body がなければ既定は GET |
| `params` | endpoint に渡す route params |
| `headers` | Request headers |
| `cookies` | memory cookie jar の初期値 |
| `formData` | form body。jsonBody より優先される |
| `jsonBody` | JSON 化する body。既定 method は POST |
| `locals` | endpoint に渡す local values |
| `site` | context の site URL |

3xx の Response は `redirect` として location と status が返ります。location header がない場合は空文字列です。

## ページ

`renderAstroPage(options)` は simulated `Astro` context をページ関数へ渡します。context は Request、URL、params、props、site、generator、locals、cookies、`redirect`、`rewrite` を持ちます。

| ページの結果 | `RenderAstroPageResult` |
| --- | --- |
| string | html と 200 Response |
| Response | response と cloned body の html |
| `redirect` signal | redirect と指定 status の Response |
| `kiwaAstroNotFound` signal | notFound と指定 Response または 404 |
| `rewrite` signal | rewrite と 200 Response |
| その他の例外 | error と 500 Response |

`ASTRO_REDIRECT_SYMBOL`、`ASTRO_NOT_FOUND_SYMBOL`、`ASTRO_REWRITE_SYMBOL` は signal の識別に使われます。通常は `redirect`、`rewrite`、`kiwaAstroNotFound` を使い、symbol を直接操作しません。

## View Transitions

`setupAstroViewTransitionEnv(options)` は from と to の URL、listener registry、minimal document、dispatch API を返します。

`dispatchAll()` の順序は `astro:before-preparation`、`astro:after-preparation`、`astro:before-swap`、`astro:after-swap` です。before preparation で cancel されると残りは null で返ります。before swap は listener の後に必ず1回 `swap()` を呼びます。

`dispatch(type)` は1つの event だけを dispatch します。`diffDom()` は from と to の body の最上位 tag を `added`、`removed`、`kept` に分けます。属性、text、深い子要素の差分は比較しません。`reset()` は document、listener、form data を初期状態へ戻します。

`supportsViewTransitions` は `before-swap` の `viewTransition` の有無を制御します。visual transition の再現や browser の `document.startViewTransition()` 呼び出しは行いません。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| <code v-pre>unknown event type: $&#123;String(type)&#125;</code> | [packages/astro/src/setup-view-transition-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/setup-view-transition-env.ts#L381) |

## API 契約

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/astro/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [invoke-endpoint.ts](./api/invoke-endpoint) | 1 | 4 |
| [render-astro-page.ts](./api/render-astro-page) | 5 | 8 |
| [setup-view-transition-env.ts](./api/setup-view-transition-env) | 1 | 12 |

<!-- kiwa-public-api:end -->
