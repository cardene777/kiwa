# Perf Suite — chart

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| renderChart | 0.00058ms | 0.0044ms | 5ms | 0.00032ms | PASS | stable (換算後 p10 +6% (閾値未満)、 p95 +30% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| computeAxis | 0.00058ms | 0.0019ms | 5ms | 0.00032ms | PASS | stable — gate 無効 (regressionGate=false) |
| captureLegend | 0.00038ms | 0.02ms | 5ms | 0.00029ms | PASS | stable (換算後 p10 -3% (閾値未満)、 p95 +779% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| dispatchTooltip | 0.00038ms | 0.0054ms | 5ms | 0.00032ms | PASS | stable (換算後 p10 +9% (閾値未満)、 p95 +127% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| renderChart | cpu | 0.08ms | 0.09ms | 0.00058ms | 0.007 | 0.007 | 0.00057ms | 0.00054ms |
| computeAxis | cpu | 0.08ms | 0.09ms | 0.00058ms | 0.007 | 0.007 | 0.00056ms | 0.00054ms |
| captureLegend | cpu | 0.09ms | 0.93ms | 0.00038ms | 0.004 | 0.004 | 0.00032ms | 0.00033ms |
| dispatchTooltip | cpu | 0.08ms | 0.12ms | 0.00038ms | 0.005 | 0.004 | 0.00036ms | 0.00033ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| renderChart | 0.02ms | 10ms | PASS |
| computeAxis | 0.01ms | 10ms | PASS |
| captureLegend | 0.01ms | 10ms | PASS |
| dispatchTooltip | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| renderChart | 201288 B | 0 B | 102400 B | yes | PASS |
| computeAxis | -16248 B | 0 B | 102400 B | yes | PASS |
| captureLegend | 1712 B | 0 B | 102400 B | yes | PASS |
| dispatchTooltip | 8216 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### renderChart

# Perf Report — renderChart.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00058ms |
| p50 | 0.00075ms |
| p95 | 0.0044ms |
| p99 | 0.01ms |
| mean | 0.0013ms |
| stdev | 0.0021ms |
| min | 0.00046ms |
| max | 0.02ms |
| total | 0.26ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.971)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00057ms | 0.00054ms | +0.000030ms | +5.66% |
| p50 | 0.00073ms | 0.00071ms | +0.000021ms | +2.90% |
| p95 | 0.0043ms | 0.0033ms | +0.00098ms | +29.62% |
| p99 | 0.01ms | 0.0087ms | +0.0043ms | +49.68% |
| mean | 0.0013ms | 0.0011ms | +0.00015ms | +12.82% |
| min | 0.00044ms | 0.00042ms | +0.000029ms | +6.95% |
| max | 0.01ms | 0.01ms | +0.0021ms | +16.63% |
| total | 0.26ms | 0.23ms | +0.03ms | +12.82% |

### computeAxis

# Perf Report — computeAxis.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00058ms |
| p50 | 0.00063ms |
| p95 | 0.0019ms |
| p99 | 0.01ms |
| mean | 0.0011ms |
| stdev | 0.0023ms |
| min | 0.00054ms |
| max | 0.02ms |
| total | 0.21ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.954)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00056ms | 0.00054ms | +0.000014ms | +2.58% |
| p50 | 0.00060ms | 0.00058ms | +0.000013ms | +2.23% |
| p95 | 0.0018ms | 0.0032ms | -0.0013ms | -42.08% |
| p99 | 0.01ms | 0.02ms | -0.0027ms | -17.47% |
| mean | 0.0010ms | 0.0011ms | -0.00012ms | -10.66% |
| min | 0.00052ms | 0.00054ms | -0.000024ms | -4.46% |
| max | 0.02ms | 0.02ms | +0.0026ms | +12.92% |
| total | 0.20ms | 0.23ms | -0.02ms | -10.66% |

### captureLegend

# Perf Report — captureLegend.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00075ms |
| p95 | 0.02ms |
| p99 | 0.10ms |
| mean | 0.02ms |
| stdev | 0.26ms |
| min | 0.00033ms |
| max | 3.70ms |
| total | 4.40ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.861)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00032ms | 0.00033ms | -0.000010ms | -3.07% |
| p50 | 0.00065ms | 0.00063ms | +0.000021ms | +3.29% |
| p95 | 0.01ms | 0.0016ms | +0.01ms | +779.33% |
| p99 | 0.08ms | 0.01ms | +0.07ms | +537.02% |
| mean | 0.02ms | 0.00090ms | +0.02ms | +1999.44% |
| min | 0.00029ms | 0.00029ms | -0.0000044ms | -1.50% |
| max | 3.19ms | 0.02ms | +3.17ms | +17651.71% |
| total | 3.79ms | 0.18ms | +3.61ms | +1999.44% |

### dispatchTooltip

# Perf Report — dispatchTooltip.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00071ms |
| p95 | 0.0054ms |
| p99 | 0.02ms |
| mean | 0.0017ms |
| stdev | 0.0035ms |
| min | 0.00033ms |
| max | 0.03ms |
| total | 0.34ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.966)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00036ms | 0.00033ms | +0.000029ms | +8.80% |
| p50 | 0.00068ms | 0.00088ms | -0.00019ms | -21.82% |
| p95 | 0.0052ms | 0.0023ms | +0.0029ms | +126.72% |
| p99 | 0.02ms | 0.0088ms | +0.0084ms | +95.24% |
| mean | 0.0017ms | 0.0012ms | +0.00041ms | +33.24% |
| min | 0.00032ms | 0.00033ms | -0.000011ms | -3.38% |
| max | 0.03ms | 0.05ms | -0.02ms | -39.14% |
| total | 0.33ms | 0.25ms | +0.08ms | +33.24% |

