# qwikcity

`@kiwa-lab/qwikcity` は、Qwik City の route action、route loader、endpoint が application code と交わす契約を synthetic `RequestEvent` で検証する test adapter です。form の validation、session を持つ画面への redirect、endpoint の response のように、route ごとに必要な入力と結果を route manifest や Qwik optimizer を起動せず確かめます。

![Qwik City の実行結果を分けて扱う構造](/images/kiwa-docs/frameworks/qwikcity-overview.png)

## form action の成功と失敗を分ける

`invokeRouteAction` は form values、cookie、header、URL を持つ action event を作り、action の戻り値を result に記録します。validation error は例外ではなく `event.fail` の戻り値として扱われます。そのため test では、必須 email がない入力が `fail` と 400 を返すことと、正しい入力が成功 data と cookie 更新を返すことを別々に書けます。`throw event.fail` は validation result ではなく通常の error になるため、失敗の表現を取り違えるテストも見つけられます。

action が `event.redirect` を呼ぶと signal が throw されますが、helper はそれを `redirect` field に捕捉します。呼び出し側は redirect の status と location を assertion し、成功 data と混同しません。cookie は各呼び出しの memory map なので、test の初期値を `cookies` に渡し、終了後の `env.cookies` を読んで action がどの値を変更したかを確認します。

## loader と endpoint を用途別に確認する

`invokeRouteLoader` は読み取り専用の cookie、query、parameter、header、platform を loader に渡します。session がなければ login へ redirect し、あれば query の page を data に入れるような表示前の分岐を test できます。loader の cookie は更新できないため、画面を出す前の読み取りと、action による書き込みを同じ helper に混ぜません。

`invokeEndpoint` は request body と parameter を endpoint handler へ渡し、handler が呼んだ `json`、`text`、`status`、`setHeader` を記録用 response にします。HTTP server を起動せずに、POST body から作った JSON response、cache header、redirect を検証できます。handler が body を書かなければ result は `noop` のままなので、status だけをセットして response を返したつもりになる分岐も検出できます。

## 実行しないものを分けておく

この adapter は action、loader、handler を直接呼びます。route matching、実 form parsing、Qwik の reactivity、browser resume、streaming、Response header と browser cookie jar の同期は行いません。endpoint result も Fetch `Response` ではなく、kind、status、body、headers を持つ test 用の記録です。

ここでは application code が event をどう読んでどんな結果を返すかを決定的に確認します。route registration、実 browser の form submit、cookie が次の navigation に反映されること、Qwik の resume は Qwik City を実際に起動する integration test と E2E test で確認します。

## 読み進める

[Quickstart](./quickstart) では validation と cookie 更新を含む action test を作ります。[使い方](./how-to) では loader の redirect と endpoint response を検証します。event と result の正確な shape は [リファレンス](./reference) にあります。
