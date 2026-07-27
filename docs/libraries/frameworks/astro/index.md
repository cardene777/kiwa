# astro

`@kiwa-lab/astro` は、Astro の route handler、ページ関数、View Transitions の分岐を dev server なしで検証する test adapter です。route を実際に build したり browser を起動したりせず、handler が受け取る context と navigation lifecycle だけを小さく組み立てます。HTTP の入力に対する response、ページの redirect、遷移 listener の順序を速く隔離して確認したいときに使います。

![Astro の endpoint とページと遷移を分けて実行する構造](/images/kiwa-docs/frameworks/astro-overview.png)

## route の契約を server なしで確認する

endpoint の test では `invokeEndpoint` を使います。URL、method、route parameter、header、JSON または form body、cookie、`locals` を入力として渡すと、adapter がそれらを持つ `APIContext` を作り、endpoint の返した `Response` を結果として返します。たとえば profile 作成 route なら、入力の JSON、返る status と JSON、redirect の有無を同じ test で確認できます。body を渡した場合の既定 method は `POST`、渡さない場合は `GET` です。

ページの server-side 分岐には `renderAstroPage` を使います。page function が HTML 文字列を返せば 200 の HTML response として、`Response` を返せばその status と body をそのまま結果として受け取れます。`redirect`、not found、rewrite は throw された signal を adapter が捕捉し、response と明示的な result field に変換します。したがって test は例外の実装詳細ではなく、利用者に見える status、location、HTML を assertion できます。

## navigation の順序を独立して検証する

`setupAstroViewTransitionEnv` は `astro:before-preparation` から `astro:after-swap` までの lifecycle event を決められた順に dispatch します。listener が入力値を受け取ること、`preventDefault` で navigation が中止されること、swap が意図しない二重実行にならないことを browser なしで確かめられます。View Transition が使えない環境でも preparation event は発火しますが、`before-swap` の `viewTransition` はありません。この違いも同じ test で明示します。

endpoint、ページ、navigation は一つの巨大な test に混ぜないでください。endpoint には HTTP 入出力、ページには server-side の分岐、navigation には listener の順序という別の契約があります。失敗したときにどの境界が壊れたかを直ちに分かるよう、helper ごとに test を分けます。

## 状態と実環境の境界

cookie jar は helper の呼び出し中だけにある memory state です。response の `Set-Cookie` を次の request へ自動で反映しません。同様に、この adapter は Astro dev server、adapter、Container API、実 `.astro` compiler、Islands hydration、client directive を起動しません。View Transition の視覚効果や実 document も再現せず、synthetic event と最小の HTML parser を使います。

そのため、route の変換ロジックや redirect 方針はこの library で速く確認し、route registration、middleware から page への接続、browser hydration、実 browser 上の transition は Astro の build と E2E test で確認します。この分担にすると unit test が本物の runtime を装った不安定な test になりません。

## 読み進める

[Quickstart](./quickstart) では endpoint とページを一つずつ実行します。[使い方](./how-to) では redirect、not found、View Transition の失敗分岐を扱います。context、signal、lifecycle result の詳細は [リファレンス](./reference) を参照してください。
