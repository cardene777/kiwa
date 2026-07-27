# design check

`@kiwa-lab/design-check` は、承認済みの design spec と実装から採取した値を比較し、token の逸脱と layout の回帰を判定する library です。値を採取する browser automation や DOM library とは分離されているため、Playwright、jsdom、独自の design token exporter が出す値を、同じ `DesignActual` と `LayoutSnapshot` の形で検証できます。

![仕様値と実測値を照合する流れ](/images/kiwa-docs/foundation/design-check-overview.png)

## 設計値と実装値の違いをレビュー可能にする

`checkSpecConformance` は colors、spacing、typography、component props の spec を actual と照合し、pass、確認した category 数、差分を返します。差分は値の不一致か、spec が要求する値の欠落かを path とともに示します。actual にだけある key は検出しないため、不要な token の検出は schema validation や lint の責務です。test が失敗したときは、spec を変更すべきか実装を戻すべきかをレビューしてから修正します。

component props の比較は一階層までです。深い object の構造まで一般的に比較する library ではありません。取得側で必要な値を平坦にしてから渡すか、より細かな spec に分けてください。`assertDesignConformance` は CI で failure を Error にしたいときに使い、ローカル調査では check API の差分全体を表示します。

## 見た目ではなく layout の契約を比較する

`checkLayoutRegression` は baseline と actual の selector ごとの位置、サイズ、可視性を比較します。位置とサイズには tolerance を指定でき、viewport を渡せば右端または下端への overflow も検出します。actual 内の可視矩形が交差すると overlap として報告するため、header と本文の意図しない重なりも test にできます。baseline にある selector が actual から消えた場合は missing です。

これは screenshot の pixel diff ではありません。font loading、CSS computed style、image diff、実 browser の animation は扱いません。同じ viewport、font、scale、locale、時刻、fixture data で採取した snapshot を渡すことが呼び出し側の責務です。tooltip や modal の意図した overlap は、対象 selector を絞った snapshot を作るなど、評価方針を test 側で明示します。

## 読み進める

[Quickstart](./quickstart) では design token の適合を検証します。[使い方](./how-to) では layout snapshot、assertion、overflow、overlap を扱います。入力の正確な shape と tolerance の規則は [リファレンス](./reference) にあります。
