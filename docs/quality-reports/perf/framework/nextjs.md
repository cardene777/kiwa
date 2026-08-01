# Perf Suite — nextjs

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeServerAction | 0.00063ms | 0.0037ms | 5ms | 0.00031ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeMiddleware | 0.0048ms | 0.0092ms | 5ms | 0.00032ms | PASS | stable — gate 無効 (regressionGate=false) |
| renderServerComponent | 0.00042ms | 0.0017ms | 5ms | 0.00032ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| invokeServerAction | cpu | 0.09ms | 0.09ms | 0.00063ms | 0.007 | 0.007 | n/a | 20.0% | 0.00059ms | 0.00054ms |
| invokeMiddleware | cpu | 0.09ms | 0.09ms | 0.0048ms | 0.056 | 0.056 | n/a | 20.0% | 0.0046ms | 0.0046ms |
| renderServerComponent | cpu | 0.09ms | 0.09ms | 0.00042ms | 0.005 | 0.005 | n/a | 20.0% | 0.00040ms | 0.00038ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeServerAction | 0.02ms | 10ms | PASS |
| invokeMiddleware | 0.08ms | 10ms | PASS |
| renderServerComponent | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| invokeServerAction | -15776 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| invokeMiddleware | -27184 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| renderServerComponent | 1552 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |

## Detailed serial reports

### invokeServerAction

# Perf Report — invokeServerAction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00063ms |
| p50 | 0.00071ms |
| p95 | 0.0037ms |
| p99 | 0.02ms |
| mean | 0.0015ms |
| stdev | 0.0031ms |
| min | 0.00058ms |
| max | 0.03ms |
| total | 0.29ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.947)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00059ms | 0.00054ms | +0.000050ms | +9.17% |
| p50 | 0.00067ms | 0.00063ms | +0.000045ms | +7.24% |
| p95 | 0.0035ms | 0.0031ms | +0.00039ms | +12.62% |
| p99 | 0.01ms | 0.0085ms | +0.0061ms | +71.77% |
| mean | 0.0014ms | 0.0012ms | +0.00020ms | +16.60% |
| min | 0.00055ms | 0.00054ms | +0.000011ms | +2.02% |
| max | 0.03ms | 0.03ms | +0.0031ms | +12.01% |
| total | 0.28ms | 0.24ms | +0.04ms | +16.60% |

### invokeMiddleware

# Perf Report — invokeMiddleware.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0048ms |
| p50 | 0.0050ms |
| p95 | 0.0092ms |
| p99 | 0.03ms |
| mean | 0.0059ms |
| stdev | 0.0046ms |
| min | 0.0047ms |
| max | 0.06ms |
| total | 1.18ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.961)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0046ms | 0.0046ms | +0.000020ms | +0.44% |
| p50 | 0.0048ms | 0.0050ms | -0.00024ms | -4.69% |
| p95 | 0.0089ms | 0.01ms | -0.0015ms | -14.09% |
| p99 | 0.02ms | 0.03ms | -0.0025ms | -9.34% |
| mean | 0.0057ms | 0.0061ms | -0.00039ms | -6.46% |
| min | 0.0046ms | 0.0044ms | +0.00015ms | +3.38% |
| max | 0.06ms | 0.06ms | -0.0066ms | -10.60% |
| total | 1.13ms | 1.21ms | -0.08ms | -6.46% |

### renderServerComponent

# Perf Report — renderServerComponent.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00042ms |
| p95 | 0.0017ms |
| p99 | 0.0081ms |
| mean | 0.00078ms |
| stdev | 0.0018ms |
| min | 0.00038ms |
| max | 0.02ms |
| total | 0.16ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.957)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00040ms | 0.00038ms | +0.000023ms | +6.19% |
| p50 | 0.00040ms | 0.00046ms | -0.000059ms | -12.84% |
| p95 | 0.0017ms | 0.0018ms | -0.00010ms | -5.82% |
| p99 | 0.0077ms | 0.0092ms | -0.0015ms | -16.14% |
| mean | 0.00075ms | 0.00084ms | -0.000092ms | -10.97% |
| min | 0.00036ms | 0.00038ms | -0.000016ms | -4.27% |
| max | 0.02ms | 0.02ms | +0.0032ms | +18.83% |
| total | 0.15ms | 0.17ms | -0.02ms | -10.97% |

