# solidstart

`@kiwa-lab/solidstart` は、SolidStart の server function と API route を process を起動せず直接呼ぶ test adapter です。route handler に渡す Request、params、locals を組み立て、返された Response と redirect を assertion できるため、route の入力検証や response contract を短い unit test として固定できます。

![SolidStartのserver functionとAPI routeを直接実行する流れ](/images/kiwa-docs/frameworks/solidstart-overview.png)

## 何を検証する library か

API route では、`invokeApiRoute` が Request、params、locals、空の `nativeEvent` を持つ event を handler へ渡します。handler が JSON response を返す、form data を読む、3xx response を返すといった分岐を、URL や request body から結果まで一つの test で確認できます。3xx response は location header と status を `result.redirect` にも取り出せるため、redirect の response contract を見落としません。

server function では、`invokeServerFunction` が引数をそのまま関数へ渡します。通常の戻り値、`redirect()` を throw した遷移 signal、その他の例外を別々の result field として確認できます。headers と cookies は inspection 用の `env` に保存されますが、関数へ自動注入されません。session などの context が必要な関数は、実 application と同じように明示的な argument にします。

## 採用する判断

handler の入力、status、JSON、redirect、例外の扱いを高速に test したい場合に使います。特に、route matching を通さずに domain logic と response contract を切り分けたい場合に有効です。Request を受け取るため、単なる関数 test よりも form と JSON の分岐を実際に近い形で書けます。

一方で、この adapter は Vinxi server、filesystem route matching、middleware、serialization、runtime binding、browser navigation を起動しません。実際に `/api/users/42` が正しい handler へ届くか、middleware が locals を作るか、server function が runtime context と連動するかは SolidStart application 側の integration test で確認します。ここで unit test を増やしても、その境界を証明したことにはなりません。

## 利用の流れ

まず API route を一つ選び、request body、params、locals と response の最小 contract を Quickstart で固定します。次に How-to で、form redirect、利用者が直せる JSON input error、server function の redirect signal を分けて test します。handler が throw する想定外の例外は API route helper が包まず reject するため、error response にするのか test の `rejects` で扱うのかを application の方針として決めます。

[Quickstart](./quickstart) では JSON API route を実行します。[使い方](./how-to) では form、error、server function を一つの file で扱います。option、戻り値、既定値は [リファレンス](./reference) を参照してください。
