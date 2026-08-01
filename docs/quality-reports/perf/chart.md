# Perf Suite — chart

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| renderChart | 0.00083ms | 0.02ms | 5ms | 0.00028ms | PASS | stable (差 0.00016ms が下限 0.00028ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| computeAxis | 0.00063ms | 0.0015ms | 5ms | 0.00029ms | PASS | stable — gate 無効 (regressionGate=false) |
| captureLegend | 0.00038ms | 0.02ms | 5ms | 0.00029ms | PASS | stable (換算後 p10 -3% (閾値未満)、 p95 +707% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| dispatchTooltip | 0.00038ms | 0.01ms | 5ms | 0.00029ms | PASS | stable (換算後 p10 -3% (閾値未満)、 p95 +392% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| renderChart | cpu | 0.09ms | 0.50ms | 0.00083ms | 0.009 | 0.007 | n/a | 20.0% | 0.00070ms | 0.00054ms |
| computeAxis | cpu | 0.09ms | 0.09ms | 0.00063ms | 0.007 | 0.007 | n/a | 20.0% | 0.00054ms | 0.00054ms |
| captureLegend | cpu | 0.09ms | 0.38ms | 0.00038ms | 0.004 | 0.004 | n/a | 20.0% | 0.00032ms | 0.00033ms |
| dispatchTooltip | cpu | 0.09ms | 0.26ms | 0.00038ms | 0.004 | 0.004 | n/a | 20.0% | 0.00032ms | 0.00033ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| renderChart | 0.05ms | 10ms | PASS |
| computeAxis | 0.02ms | 10ms | PASS |
| captureLegend | 0.05ms | 10ms | PASS |
| dispatchTooltip | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| renderChart | 203616 B | -63154 B | 102400 B | yes | 220 (20 + 200) | PASS |
| computeAxis | 568 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| captureLegend | -15616 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| dispatchTooltip | 744 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |

## Detailed serial reports

### renderChart

# Perf Report — renderChart.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00083ms |
| p50 | 0.0021ms |
| p95 | 0.02ms |
| p99 | 0.08ms |
| mean | 0.0064ms |
| stdev | 0.01ms |
| min | 0.00054ms |
| max | 0.12ms |
| total | 1.29ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.838)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00070ms | 0.00054ms | +0.00016ms | +30.01% |
| p50 | 0.0018ms | 0.00071ms | +0.0011ms | +151.51% |
| p95 | 0.02ms | 0.0033ms | +0.02ms | +503.23% |
| p99 | 0.07ms | 0.0087ms | +0.06ms | +679.57% |
| mean | 0.0054ms | 0.0011ms | +0.0043ms | +374.76% |
| min | 0.00045ms | 0.00042ms | +0.000037ms | +8.98% |
| max | 0.10ms | 0.01ms | +0.09ms | +683.09% |
| total | 1.08ms | 0.23ms | +0.85ms | +374.76% |

### computeAxis

# Perf Report — computeAxis.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00063ms |
| p50 | 0.00067ms |
| p95 | 0.0015ms |
| p99 | 0.01ms |
| mean | 0.0011ms |
| stdev | 0.0027ms |
| min | 0.00063ms |
| max | 0.03ms |
| total | 0.22ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.858)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00054ms | 0.00054ms | -0.0000056ms | -1.03% |
| p50 | 0.00057ms | 0.00058ms | -0.000011ms | -1.81% |
| p95 | 0.0013ms | 0.0032ms | -0.0018ms | -58.24% |
| p99 | 0.01ms | 0.02ms | -0.0045ms | -28.90% |
| mean | 0.00094ms | 0.0011ms | -0.00021ms | -18.24% |
| min | 0.00054ms | 0.00054ms | -0.0000046ms | -0.85% |
| max | 0.03ms | 0.02ms | +0.0069ms | +33.91% |
| total | 0.19ms | 0.23ms | -0.04ms | -18.24% |

### captureLegend

# Perf Report — captureLegend.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.0016ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0037ms |
| stdev | 0.0093ms |
| min | 0.00033ms |
| max | 0.12ms |
| total | 0.74ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.857)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00032ms | 0.00033ms | -0.000012ms | -3.49% |
| p50 | 0.0014ms | 0.00063ms | +0.00073ms | +117.20% |
| p95 | 0.01ms | 0.0016ms | +0.01ms | +707.37% |
| p99 | 0.02ms | 0.01ms | +0.0079ms | +61.20% |
| mean | 0.0031ms | 0.00090ms | +0.0022ms | +249.03% |
| min | 0.00029ms | 0.00029ms | -0.0000056ms | -1.93% |
| max | 0.10ms | 0.02ms | +0.08ms | +453.39% |
| total | 0.63ms | 0.18ms | +0.45ms | +249.03% |

### dispatchTooltip

# Perf Report — dispatchTooltip.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.0014ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.0030ms |
| stdev | 0.0081ms |
| min | 0.00038ms |
| max | 0.10ms |
| total | 0.60ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.857)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00032ms | 0.00033ms | -0.000011ms | -3.44% |
| p50 | 0.0012ms | 0.00088ms | +0.00034ms | +38.76% |
| p95 | 0.01ms | 0.0023ms | +0.0090ms | +392.45% |
| p99 | 0.03ms | 0.0088ms | +0.02ms | +198.37% |
| mean | 0.0026ms | 0.0012ms | +0.0014ms | +108.61% |
| min | 0.00032ms | 0.00033ms | -0.000011ms | -3.44% |
| max | 0.08ms | 0.05ms | +0.03ms | +69.78% |
| total | 0.52ms | 0.25ms | +0.27ms | +108.61% |

