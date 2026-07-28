# A11y

`@kiwa-lab/a11y` は、axe-core の検査結果を Vitest と browser test で同じ形式に扱う adapter です。DOM を axe で検査した結果から、release を止める impact を選び、jsdom、Playwright、SSR hydration の三つの層を一つの report にまとめられます。

<img src="/images/kiwa-docs/quality/a11y-overview.webp" alt="DOMまたはbrowser pageへaxeを実行してthresholdでpassかblockを決める流れ" width="1672" height="941" loading="lazy" decoding="async">

## 何を検証する library か

`runAxe` は jsdom の `Element`、`Document`、selector を axe-core へ渡します。`reportViolations` はすべての rule を残したまま、選んだ impact 以上だけを `blocking` として取り出します。`expectNoViolations` は blocking rule がある場合に、impact、rule ID、help、該当 node 数を含む Error を投げるため、CI log から修正箇所を追えます。

`runLayerHarness` は jsdom の実行結果、browser 側であらかじめ取得した axe result、SSR HTML と hydration 後 DOM の result を集約します。fixture を渡していない layer は成功ではなく `applicable: false` と理由付きで記録されます。適用された layer に critical、serious、moderate が一件でもあると harness の `ok` は false です。minor は集計しますが harness の合否には影響しません。

## 採用する判断

component の静的な DOM contract を確認するなら jsdom と `runAxe` から始めます。画面遷移後の DOM、focus、実 CSS に依存する rule を確認するなら Playwright で axe を実行し、その生の result を harness へ渡します。SSR の HTML と hydration 後の DOM で rule が増減しないことを確認するなら SSR hydration fixture を使います。

この library は browser を起動せず、Playwright page へ axe を注入しません。keyboard 操作、screen reader の読み上げ、実 device の表示は browser E2E と手動検証で扱います。axe の結果がゼロでも、すべてのアクセシビリティ要件を証明したことにはなりません。

## threshold を決める

`reportViolations` と `expectNoViolations` の既定は `minor` です。既定のままでは impact を持つすべての違反が blocking になります。release gate を serious 以上にする場合は `maxImpact: "serious"` を明示します。impact がない axe violation は `blocking` には入りませんが、`violations` 配列には残ります。無視するのではなく、別の policy で確認してください。

[Quickstart](./quickstart) は jsdom の button を検査します。[使い方](./how-to) は threshold と layer report を実行します。公開 API と fixture の正確な形は [リファレンス](./reference) を参照してください。
