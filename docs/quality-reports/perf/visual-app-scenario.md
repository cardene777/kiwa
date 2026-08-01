# Perf Suite — visual-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| baseline_compare (identical 10x10 png) | 0.0091ms | 0.02ms | 30ms | 0.00046ms | PASS | improved — gate 無効 (regressionGate=false) |
| burst_compare (5 different 10x10 diff) | 0.05ms | 0.08ms | 100ms | 0.00047ms | PASS | stable — gate 無効 (regressionGate=false) |
| large_image_diff (100x100 png) | 0.01ms | 0.01ms | 100ms | 0.00046ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| baseline_compare (identical 10x10 png) | cpu | 0.09ms | 0.10ms | 0.0091ms | 0.101 | 0.132 | n/a | 20.0% | 0.0084ms | 0.01ms |
| burst_compare (5 different 10x10 diff) | cpu | 0.09ms | 0.10ms | 0.05ms | 0.555 | 0.552 | n/a | 20.0% | 0.05ms | 0.05ms |
| large_image_diff (100x100 png) | cpu | 0.09ms | 0.09ms | 0.01ms | 0.121 | 0.128 | n/a | 20.0% | 0.010ms | 0.01ms |

## Concurrent p95 (concurrency = 2, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| baseline_compare (identical 10x10 png) | 0.03ms | 60ms | PASS |
| burst_compare (5 different 10x10 diff) | 0.17ms | 200ms | PASS |
| large_image_diff (100x100 png) | 0.03ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| baseline_compare (identical 10x10 png) | 84736 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| burst_compare (5 different 10x10 diff) | 478400 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| large_image_diff (100x100 png) | 97048 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |

## Detailed serial reports

### baseline_compare (identical 10x10 png)

# Perf Report — baseline_compare (identical 10x10 png).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0091ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0025ms |
| min | 0.0085ms |
| max | 0.02ms |
| total | 0.23ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.925)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0084ms | 0.01ms | -0.0026ms | -23.43% |
| p50 | 0.0095ms | 0.01ms | -0.0031ms | -24.45% |
| p95 | 0.01ms | 0.05ms | -0.04ms | -74.14% |
| p99 | 0.02ms | 0.11ms | -0.09ms | -85.47% |
| mean | 0.01ms | 0.02ms | -0.01ms | -51.06% |
| min | 0.0078ms | 0.01ms | -0.0023ms | -23.06% |
| max | 0.02ms | 0.12ms | -0.11ms | -86.73% |
| total | 0.21ms | 0.43ms | -0.22ms | -51.06% |

### burst_compare (5 different 10x10 diff)

# Perf Report — burst_compare (5 different 10x10 diff).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.05ms |
| p50 | 0.06ms |
| p95 | 0.08ms |
| p99 | 0.09ms |
| mean | 0.06ms |
| stdev | 0.01ms |
| min | 0.05ms |
| max | 0.10ms |
| total | 1.19ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.932)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.05ms | +0.00023ms | +0.49% |
| p50 | 0.05ms | 0.05ms | +0.0024ms | +4.68% |
| p95 | 0.07ms | 0.06ms | +0.0072ms | +11.38% |
| p99 | 0.09ms | 0.06ms | +0.02ms | +36.16% |
| mean | 0.06ms | 0.05ms | +0.0038ms | +7.34% |
| min | 0.04ms | 0.04ms | -0.000060ms | -0.14% |
| max | 0.09ms | 0.06ms | +0.03ms | +42.29% |
| total | 1.11ms | 1.04ms | +0.08ms | +7.34% |

### large_image_diff (100x100 png)

# Perf Report — large_image_diff (100x100 png).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.01ms |
| stdev | 0.00091ms |
| min | 0.01ms |
| max | 0.01ms |
| total | 0.24ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.926)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.010ms | 0.01ms | -0.00059ms | -5.56% |
| p50 | 0.01ms | 0.01ms | -0.00028ms | -2.48% |
| p95 | 0.01ms | 0.01ms | -0.00012ms | -0.99% |
| p99 | 0.01ms | 0.01ms | -0.00022ms | -1.71% |
| mean | 0.01ms | 0.01ms | -0.00036ms | -3.20% |
| min | 0.0098ms | 0.0098ms | +0.000044ms | +0.45% |
| max | 0.01ms | 0.01ms | -0.00025ms | -1.88% |
| total | 0.22ms | 0.23ms | -0.0073ms | -3.20% |

