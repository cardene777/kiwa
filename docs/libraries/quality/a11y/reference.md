# A11y リファレンス

## DOM audit

| API | 内容 |
| --- | --- |
| `runAxe` | `context` と axe `runOptions` を使い jsdom 上で axe を実行します |
| `reportViolations` | `maxImpact` 以上を `blocking` として取り出し、診断用 summary を作ります |
| `expectNoViolations` | blocking 違反があれば summary を含む error を throw します |

`runAxe` の `context` は `Element`、`Document`、selector を受け取ります。`context` を省略するとglobal `document` を使います。どちらもないNode environmentでは実行できません。`axe-core` はdynamic importするpeer dependencyで、未install時は導入方法を含むerrorになります。

## layer harness

| API | 内容 |
| --- | --- |
| `runLayerHarness` | jsdom、Playwright、SSR hydration の layer report を作ります |
| `bucketViolations` | axe violation を impact ごとに集計します |
| `unionByRule` | SSR と hydration の同一 rule を node 数を保って結合します |
| `computeTotals` | 適用済み layer の impact count を合算します |
| `isHarnessOk` | critical、serious、moderate が0件かを判定します |
| `summariseHarness` | layer report の診断用 text を作ります |

`runLayerHarness` のPlaywright layerは事前に取得した `AxeResults` を受け取ります。browserを起動したりaxe scriptを注入したりはしません。`results.violations` が不正または欠けているPlaywright fixtureは空の違反として集計されます。SSR hydration layerではSSR stringと任意のhydrated elementを渡します。

## 設定と lifecycle

`maxImpact` は `minor`、`moderate`、`serious`、`critical` のいずれかです。impactが未指定のviolationはblockingから除外されます。DOMを書き換えるtestは `afterEach` で元のmarkupに戻してください。detached elementをlayer harnessに渡した場合、実行中だけdocumentに接続し、完了後に元の位置へ戻します。

## 制約

`runAxe` は jsdom 向けです。Playwright の `Page` を直接渡すことはできません。browser audit は page 側の axe 実行結果を `runLayerHarness` に渡してください。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| <code v-pre>runAxe requires "axe-core" to be installed. Run &#96;pnpm add -D axe-core&#96;.</code> | [packages/a11y/src/audit.ts](https://github.com/cardene777/kiwa/blob/main/packages/a11y/src/audit.ts#L20) |
| <code v-pre>runAxe: no context and no global document (jsdom env required).</code> | [packages/a11y/src/audit.ts](https://github.com/cardene777/kiwa/blob/main/packages/a11y/src/audit.ts#L29) |
| <code v-pre>report.summary</code> | [packages/a11y/src/audit.ts](https://github.com/cardene777/kiwa/blob/main/packages/a11y/src/audit.ts#L64) |
| <code v-pre>ssrHydration layer requires a jsdom-like global document (vitest env=jsdom).</code> | [packages/a11y/src/layer-harness.ts](https://github.com/cardene777/kiwa/blob/main/packages/a11y/src/layer-harness.ts#L312) |
| <code v-pre>'ssrHydration layer requires a string ssrHtml fixture — got ' + typeof fixture.ssrHtml + '.'</code> | [packages/a11y/src/layer-harness.ts](https://github.com/cardene777/kiwa/blob/main/packages/a11y/src/layer-harness.ts#L320) |

## API 契約

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/a11y/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [audit.ts](./api/audit) | 3 | 1 |
| [layer-harness.ts](./api/layer-harness) | 8 | 4 |
| [types.ts](./api/types) | 0 | 4 |

<!-- kiwa-public-api:end -->
