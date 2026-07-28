# Quality Metrics リファレンス

`@kiwa-lab/quality-metrics` は品質信号を `QualityReport` に組み立て、release gate を評価します。

## Metric API

`coverageFromV8Summary`、`testCountFromCategories`、`fidelityFromMethodCounts`、`perfFromSamples`、`mutationFromCounts` が共通指標を作ります。coverageは0から100へ丸め、test countとmutation countは非負整数を要求します。`mutationFromCounts` はkilledがmutationsを超えるとthrowします。AI providerでは `costFromSamples`、`latencyFromSamples`、`tokenFromSamples`、`accuracyFromSamples` も使います。

`fidelityFromMethodCounts` はreal methodが0件ならratioを100とします。これは実行時挙動の一致を証明しないため、実行時比較には `assertFidelity` を使います。`assertFidelity` は戻り値をdeep strict equalityで比較し、例外はmessageが一致するときだけ一致とみなします。

`assembleReport` はprovider、version、各metricからreportを作ります。`emitJson` と `emitMarkdown` はreportとverdictを出力します。

## Gate API

`evaluateReleaseGate(report, overrides, context)` は `passed`、`blockers`、評価したaxis数を返します。既定の7軸はcoverage三種、fidelity ratio、perf p95、mutation kill rate、behavior test数です。`overrides` は既定しきい値の部分上書きです。`context.mutationTier` または `context.a11yTier` を渡すとtier axisを追加します。

`assertMutationTier` と `assertA11yTier` は単一metricを即時に検証します。mutationは0件をfail、a11yは0違反をpassと扱います。`resolveMutationTier` と `resolveA11yTier` は `core`、`framework`、`saas`、`test-type` を正規化し、未知のlabelはthrowします。

## 履歴と制約

`captureSnapshot`、`compareToBaseline`、`detectDrift`、`generateTrendReport` は時系列比較に使います。drift gateは `context.driftEnabled` とbaselineの両方を渡した場合だけ有効です。AIのcost、latency、token、accuracyはprovider名が `@kiwa-lab/ai-` の場合だけgateの追加axisになります。異なる計測条件の履歴を同じthreshold学習に混ぜないでください。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| <code v-pre>mutationFromCounts: killed ($&#123;input.killed&#125;) exceeds mutations ($&#123;input.mutations&#125;)</code> | [packages/quality-metrics/src/collect.ts](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/collect.ts#L115) |
| <code v-pre>costFromSamples: invalid sample $&#123;s&#125; (must be non-negative number)</code> | [packages/quality-metrics/src/collect.ts](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/collect.ts#L140) |
| <code v-pre>tokenFromSamples: promptTokens.length ($&#123;input.promptTokens.length&#125;) !== completionTokens.length ($&#123;input.completionTokens.length&#125;)</code> | [packages/quality-metrics/src/collect.ts](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/collect.ts#L175) |
| <code v-pre>accuracyFromSamples: method is required</code> | [packages/quality-metrics/src/collect.ts](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/collect.ts#L204) |
| <code v-pre>accuracyFromSamples: invalid sample $&#123;s&#125; (must be number in &#91;0, 1&#93;)</code> | [packages/quality-metrics/src/collect.ts](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/collect.ts#L210) |
| <code v-pre>a11yFromBaseline: invalid $&#123;field&#125; count $&#123;raw&#125; (must be non-negative finite number)</code> | [packages/quality-metrics/src/collect.ts](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/collect.ts#L248) |
| <code v-pre>assembleReport: provider is required</code> | [packages/quality-metrics/src/collect.ts](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/collect.ts#L285) |
| <code v-pre>assembleReport: version is required</code> | [packages/quality-metrics/src/collect.ts](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/collect.ts#L286) |
| <code v-pre>normalizePercentage: invalid input $&#123;pct&#125;</code> | [packages/quality-metrics/src/collect.ts](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/collect.ts#L308) |
| <code v-pre>$&#123;label&#125;: expected finite number, got $&#123;v&#125;</code> | [packages/quality-metrics/src/collect.ts](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/collect.ts#L317) |
| <code v-pre>$&#123;label&#125;: expected non-negative integer, got $&#123;v&#125;</code> | [packages/quality-metrics/src/collect.ts](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/collect.ts#L320) |
| <code v-pre>percentilesFromSamples: invalid sample $&#123;s&#125; (must be non-negative number)</code> | [packages/quality-metrics/src/collect.ts](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/collect.ts#L339) |
| <code v-pre>nearestRank: invalid percentile $&#123;percentile&#125;</code> | [packages/quality-metrics/src/collect.ts](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/collect.ts#L353) |
| <code v-pre>diffReports: provider mismatch — $&#123;previous.provider&#125; vs $&#123;current.provider&#125;</code> | [packages/quality-metrics/src/emit.ts](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/emit.ts#L157) |
| <code v-pre>resolveA11yTier: unknown a11y tier label "$&#123;label&#125;" (expected Core / Framework / SaaS / Test type)</code> | [packages/quality-metrics/src/gate.ts](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/gate.ts#L124) |
| <code v-pre>assertA11yTier: critical impact $&#123;critical&#125; &gt; $&#123;threshold.critical&#125; — "$&#123;input.tier&#125;" tier does not allow critical &gt; 0 (SSOT: docs/quality/a11y-thresholds.md)</code> | [packages/quality-metrics/src/gate.ts](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/gate.ts#L152) |
| <code v-pre>assertA11yTier: serious impact $&#123;serious&#125; &gt; $&#123;threshold.serious&#125; — "$&#123;input.tier&#125;" tier ceiling breached</code> | [packages/quality-metrics/src/gate.ts](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/gate.ts#L157) |
| <code v-pre>assertA11yTier: moderate impact $&#123;moderate&#125; &gt; $&#123;threshold.moderate&#125; — "$&#123;input.tier&#125;" tier ceiling breached</code> | [packages/quality-metrics/src/gate.ts](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/gate.ts#L162) |
| <code v-pre>resolveMutationTier: unknown mutation tier label "$&#123;label&#125;" (expected Core / Framework / SaaS / Test type)</code> | [packages/quality-metrics/src/gate.ts](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/gate.ts#L50) |
| <code v-pre>assertMutationTier: no mutation signal (0 mutations) for tier "$&#123;input.tier&#125;" — empty suite would slip past a 0/0 = 0% gate</code> | [packages/quality-metrics/src/gate.ts](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/gate.ts#L71) |
| <code v-pre>assertMutationTier: mutation kill rate $&#123;actual.toFixed(2)&#125;% below "$&#123;input.tier&#125;" tier threshold $&#123;threshold&#125;%</code> | [packages/quality-metrics/src/gate.ts](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/gate.ts#L77) |

## API 契約

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/quality-metrics/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [collect.ts](./api/collect) | 11 | 0 |
| [emit.ts](./api/emit) | 3 | 0 |
| [fidelity-assert.ts](./api/fidelity-assert) | 1 | 4 |
| [gate.ts](./api/gate) | 8 | 0 |
| [history.ts](./api/history) | 4 | 6 |
| [real-fidelity-gate.ts](./api/real-fidelity-gate) | 1 | 3 |
| [threshold-learning.ts](./api/threshold-learning) | 2 | 2 |
| [types.ts](./api/types) | 1 | 19 |

<!-- kiwa-public-api:end -->
