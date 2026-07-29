# Perf Harness リファレンス

`@kiwa-lab/perf-harness` は測定結果を保存し、同じ条件の baseline と比較します。

## 測定 API

`measure` は `name`、非同期可の `fn`、`iterations` を受け取り、ms単位の `samples`、Type 7補間のp50、p95、p99、平均、MADを返します。`iterations` は1以上です。`warmup` は固定回数、`warmupStrategy` が `convergent` の場合は直近windowの収束を待ちます。

収束warmupの既定値はwindow 20、p95に対して5%以内、最大200回です。収束しなくても本測定を実行し、結果の `warmupConverged` はfalseになります。`trimPercent` を指定すると、元の `samples` を保持したまま `trimmed` に再計算値を返します。`measureConcurrent` はworkerごとにwarmupしてから計測し、sample数は `concurrency * iterationsPerWorker` です。`measureMemory` はメモリを計測します。

## 回帰 API

`detectRegression` は `current` と `baseline` のp95差をbootstrapで比較します。既定値は2,000回、95%信頼区間、20%しきい値です。`RegressionResult` の `verdict` は `improved`、`stable`、`regressed` のいずれかです。信頼区間がゼロをまたぐ場合、または変化率がしきい値に届かない場合は `stable` です。

`detectRegressionStrict` は既定で99%信頼区間と10%しきい値を使います。`evaluatePerfGate` は性能結果、p95、cost、token、accuracyのしきい値から `QualityReport` とblockerを返します。しきい値を一つも渡さない場合はaxesを評価せずpassします。指定したcost、token、accuracyの実測値がない場合はfail扱いです。

## Baseline

`saveBaseline(path, result)` はschema 1のenvelopeを保存します。`loadBaseline(path)` は `null` または `envelope` と `envMismatch` を返します。legacyの単一resultも読み込みますが、環境値はunknownとなるため現行環境との不一致になります。比較前にNode version、platform、hostname、CPU、git SHAの不一致を確認してください。

`defaultBaselinePath(moduleName)` は `.perf-baseline` 配下の保存先を返します。複数操作を保存する場合は `saveBaselineEnvelope` を使います。

## 制約と後始末

wall clockのsub millisecond測定はOS schedulerの影響を受けます。共有CIでは絶対値ではなく、同じ環境での差分を比較します。`measureMemory` は `--expose-gc` がない環境ではforced GCを使えずノイズが増えます。baselineを更新する前に環境mismatchを解消してください。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| <code v-pre>&#96;saveBaselineEnvelope: 標本が 2 件未満の記録は baseline にできない ($&#123;names&#125;)。&#96; + ' 比較には最低 2 件が要る (bootstrap CI がそれ未満で退化する)。 iterations を増やす。'</code> | [packages/perf-harness/src/baseline.ts](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/baseline.ts#L71) |
| <code v-pre>measureConcurrent: concurrency must be &gt;= 1, got $&#123;input.concurrency&#125;</code> | [packages/perf-harness/src/concurrent.ts](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/concurrent.ts#L37) |
| <code v-pre>measureConcurrent: iterationsPerWorker must be &gt;= 1, got $&#123;input.iterationsPerWorker&#125;</code> | [packages/perf-harness/src/concurrent.ts](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/concurrent.ts#L40) |
| <code v-pre>measureConcurrent: warmup must be &gt;= 0, got $&#123;warmup&#125;</code> | [packages/perf-harness/src/concurrent.ts](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/concurrent.ts#L46) |
| <code v-pre>measure: iterations must be &gt;= 1, got $&#123;input.iterations&#125;</code> | [packages/perf-harness/src/measure.ts](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/measure.ts#L15) |
| <code v-pre>measure: warmup must be &gt;= 0, got $&#123;warmupCount&#125;</code> | [packages/perf-harness/src/measure.ts](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/measure.ts#L24) |
| <code v-pre>measureMemory: iterations must be &gt;= 1, got $&#123;input.iterations&#125;</code> | [packages/perf-harness/src/memory.ts](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/memory.ts#L42) |
| <code v-pre>measureMemory: warmup must be a non-negative integer, got $&#123;warmup&#125;</code> | [packages/perf-harness/src/memory.ts](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/memory.ts#L48) |
| <code v-pre>Could not resolve repo root from $&#123;start&#125;</code> | [packages/perf-harness/src/three-layer.ts](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/three-layer.ts#L701) |

## API 契約

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [baseline.ts](./api/baseline) | 8 | 0 |
| [concurrent.ts](./api/concurrent) | 1 | 1 |
| [gate.ts](./api/gate) | 1 | 0 |
| [live.ts](./api/live) | 1 | 4 |
| [measure.ts](./api/measure) | 3 | 0 |
| [memory.ts](./api/memory) | 1 | 2 |
| [regression.ts](./api/regression) | 4 | 0 |
| [report.ts](./api/report) | 1 | 0 |
| [three-layer.ts](./api/three-layer) | 4 | 4 |
| [types.ts](./api/types) | 0 | 7 |

<!-- kiwa-public-api:end -->
