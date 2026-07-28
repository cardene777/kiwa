# component

`@kiwa-lab/component` は、component story を入力として、引数の解決、ユーザー操作、簡易 a11y 検査、visual baseline の判断を一つの in-memory harness で test する library です。Storybook、Playwright Component Testing、Chromatic に似た作業を同じ story 定義から切り出せますが、それらの実行環境を起動する wrapper ではありません。

<img src="/images/kiwa-docs/foundation/component-overview.webp" alt="Story を複数の検証へつなぐ流れ" width="1200" height="658" loading="lazy" decoding="async">

## 何を確かめる library か

利用者はまず component の代表状態を story として登録します。`mount` は meta と story の args を解決して `MockNode` の canvas を返します。その canvas に対して play function の操作、名前のない button や label のない input の検出、markup の変更判定を実行します。これにより、たとえば Save button の既定ラベル、play が失敗する step、変更された story を承認する前の状態を、network や cloud service なしで再現できます。

この library は framework を選びません。ただし、React、Vue、Svelte、Solid の component 自体を render するものではありません。render 関数は `MockNode` を返す必要があります。実 browser の CSS、viewport ごとの layout、focus 移動、screen reader tree、pixel diff はここで証明できないため、component test、`@kiwa-lab/a11y`、`@kiwa-lab/visual`、E2E test に渡します。

## 採用する判断

story の args からどの状態を作るか、操作で何が変わるか、意図しない markup 変更をどう review するかを速く test したいときに向いています。既に Storybook と Chromatic を実行している project でも、外部 service に送る前の unit-level contract を固定する用途に使えます。一方、実際の screenshot の差分や Storybook addon の挙動を確認したい場合は、この harness だけで完結させず、それぞれの実行環境の test を追加してください。

## 利用の流れ

一つの story から始め、まず args が canvas に反映されることを確認します。次に play function を通して操作の成否を assertion し、a11y heuristic が検出する範囲を理解します。最後に同じ markup を baseline と比較し、変更されたときだけ review します。いずれも test ごとに registry と visual mock を作り直すと、別の story の listener や baseline が混ざりません。

[Quickstart](./quickstart) では最小の story test を実行します。[使い方](./how-to) では play、a11y、visual review を同じ test file で扱います。公開 API と mock の制約は [リファレンス](./reference) にまとめています。実 framework の部品を確認する場合は [ui](../ui/)、仕様とのレイアウト差分は [design check](../design-check/)、ページ全体の browser 挙動は [e2e](../e2e/) を参照してください。
