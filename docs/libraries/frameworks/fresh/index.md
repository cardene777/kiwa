# fresh

`@kiwa-lab/fresh` は、Deno Fresh の route、Island、Head が持つアプリケーション側の契約を、virtual tree と synthetic context で検証する test adapter です。Deno runtime や file-system router を起動しなくても、request を受けた handler がどの response と page data を返すか、Island の placeholder がどの component に対応するか、複数の Head fragment がどのように一つになるかを確認できます。

![Fresh の route と Island と Head を観測する構造](/images/kiwa-docs/frameworks/fresh-overview.png)

## route の HTTP と page data を同時に確認する

`invokeFreshHandler` は request、route parameter、state を持つ Fresh 風の context で handler を実行します。handler が `Response` を返すならその response を、`ctx.render(data)` を呼ぶなら page へ渡す data と HTML を結果に含めます。profile route を test する場合、GET が 200 を返すことだけでなく、parameter が page に届き、page が data から期待する HTML を出すことまでを一つの契約として確認できます。

method に対応する handler がなければ、結果は 405 と `Allow` header になります。redirect と not found は signal として throw されても、adapter が response と result field に変換します。通常の例外は `error` と 500 response になるので、失敗を `catch` して消すのではなく、どの分岐が発生したかを assertion できます。`defineRoute` を使う route body も同じように実行でき、HTTP dispatch の test と page body の test を必要に応じて分けられます。

## Island の境界を browser なしで検証する

Island は SSR tree 上の placeholder と、名前付き component definition の対応で決まります。`hydrateIslands` は placeholder を見つけ、登録した Island を mount し、hydrated、missing、unregistered を返します。これにより、ある Island が page に現れなかったのか、page に placeholder はあるのに definition を登録し忘れたのかを区別できます。`simulateInteraction` は mount された tree の handler を呼び出すため、クリックで送る command や callback の実行を確認できます。

ここで扱う event は browser の DOM event ではありません。bubbling、state の再描画、実 hydration は再現せず、synthetic event が同名の handler を呼ぶだけです。Island の入出力と callback の契約はこの library で確認し、hydration の timing や実 browser の DOM 更新は Fresh の build を通した E2E test で確認します。

## Head の出力を決定的にする

`mergeHead` は複数の Head fragment を一つにまとめ、同じ description や icon のような重複を後から渡した fragment で解決します。`renderHead` を使うと、title、base、meta、link、script の順序で HTML を assertion できます。route 固有の title が layout の title を上書きする、といった規則を page 全体を render せずに test できます。

Head の client-side reactive update、`html` と `body` attributes の統合、production renderer の HTML escaping は対象外です。特に virtual tree の `stringify` は HTML を escape しないため、出力を安全性の証明に使わないでください。エスケープ、CSP、実 browser の Head 更新は、実 renderer を使う test で扱います。

## 読み進める

[Quickstart](./quickstart) では handler が page data を返す最小の route test を作ります。[使い方](./how-to) では Island の hydration と Head の重複解決を実行します。signal、virtual tree、Head の統合規則は [リファレンス](./reference) にあります。
