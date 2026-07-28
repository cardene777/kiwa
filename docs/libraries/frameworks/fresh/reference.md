# fresh リファレンス

## route

`invokeFreshHandler` は handler object または単一 handler function を実行します。context には params、URL、route、mutable state、`render`、`renderNotFound`、`redirect`、`next` があります。`next` は middleware を進めず、404 Response を返します。

| handler の結果 | 実行結果 |
| --- | --- |
| Response | response としてそのまま返す |
| `ctx.render(data)` | renderData を捕捉し、page があれば HTML を作る |
| Response 以外の値 | render data として扱う |
| redirect signal | redirect と location を持つ Response |
| not found signal | notFound と 404 Response |
| その他の例外 | error と 500 Response |

`defineRoute` は route function をブランド化し、`invokeDefineRoute` が synthetic `FreshPageProps` で実行します。`redirect` と `notFound` は signal object を返すだけなので、`throw` して停止させます。

`h` は `FreshVNode` を作り、`stringify` は virtual tree を HTML に変換します。`findNodes` は depth-first に一致する node を返します。

## Islands

`defineIsland` は空でない name を要求します。`islandPlaceholder` は `data-island` と JSON の `data-props` を持つ空の div を作ります。`mountIsland` は component を同期で呼び、HTML と event handler map を作ります。

`hydrateIslands` は placeholder の name を定義と照合し、hydrated、missing、unregistered、HTML を返します。壊れた props JSON と object 以外の props は空 object として扱われます。

`simulateInteraction` は `click`、`input`、`submit` など任意の event 名を小文字化して dispatch します。返り値には呼び出した handler 数と `preventDefault` の有無が入ります。

## Head

`defineHead` は typed fragment を作ります。`mergeHead` は fragment を順に統合し、`renderHead` は title、base、meta、link、script の順で HTML を出力します。

| 要素 | 重複規則 |
| --- | --- |
| title | 空でない最後の値 |
| meta | name、property、httpEquiv の順で key を選び、後の値 |
| charset | 最後の1件 |
| link | `rel + href` が同じものは後の値 |
| script src | 同じ src は後の値 |
| inline script | すべて保持する |
| base | 最後の値 |

`extractHead` は virtual tree 内の `Head` と `head` node から tag を集め、同じ規則で統合します。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| <code v-pre>defineIsland: name is required</code> | [packages/fresh/src/islands.ts](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/islands.ts#L53) |

## API 契約

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/fresh/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [head.ts](./api/head) | 6 | 5 |
| [islands.ts](./api/islands) | 9 | 11 |
| [route.ts](./api/route) | 15 | 16 |

<!-- kiwa-public-api:end -->
