# Perf Suite — chart

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| renderChart | 0.00088ms | 0.0030ms | 5ms | 0.00033ms | PASS | stable (p10 +5% (閾値未満)、 p95 +21% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| computeAxis | 0.00054ms | 0.0013ms | 5ms | 0.00033ms | PASS | stable (差 0.00021ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| captureLegend | 0.00063ms | 0.0011ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| dispatchTooltip | 0.00067ms | 0.0019ms | 5ms | 0.00033ms | PASS | improved — gate 無効 (regressionGate=false) |

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
| renderChart | 205488 B | 0 B | 102400 B | yes | PASS |
| computeAxis | -456 B | 0 B | 102400 B | yes | PASS |
| captureLegend | 712 B | 0 B | 102400 B | yes | PASS |
| dispatchTooltip | 712 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### renderChart

# Perf Report — renderChart.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00088ms |
| p50 | 0.00088ms |
| p95 | 0.0030ms |
| p99 | 0.0084ms |
| mean | 0.0013ms |
| stdev | 0.0018ms |
| min | 0.00083ms |
| max | 0.02ms |
| total | 0.27ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00088ms | 0.00083ms | +0.000042ms | +5.04% |
| p50 | 0.00088ms | 0.00088ms | 0.00ms | 0.00% |
| p95 | 0.0030ms | 0.0025ms | +0.00053ms | +21.35% |
| p99 | 0.0084ms | 0.0050ms | +0.0034ms | +67.10% |
| mean | 0.0013ms | 0.0013ms | +0.000047ms | +3.63% |
| min | 0.00083ms | 0.00079ms | +0.000042ms | +5.31% |
| max | 0.02ms | 0.01ms | +0.0097ms | +80.41% |
| total | 0.27ms | 0.26ms | +0.0094ms | +3.63% |

### computeAxis

# Perf Report — computeAxis.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00054ms |
| p50 | 0.00063ms |
| p95 | 0.0013ms |
| p99 | 0.0056ms |
| mean | 0.00087ms |
| stdev | 0.0012ms |
| min | 0.00054ms |
| max | 0.01ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00054ms | 0.00075ms | -0.00021ms | -27.73% |
| p50 | 0.00063ms | 0.00075ms | -0.00013ms | -16.67% |
| p95 | 0.0013ms | 0.00097ms | +0.00035ms | +35.91% |
| p99 | 0.0056ms | 0.0048ms | +0.00086ms | +17.92% |
| mean | 0.00087ms | 0.00095ms | -0.000088ms | -9.19% |
| min | 0.00054ms | 0.00071ms | -0.00017ms | -23.59% |
| max | 0.01ms | 0.01ms | +0.0012ms | +8.73% |
| total | 0.17ms | 0.19ms | -0.02ms | -9.19% |

### captureLegend

# Perf Report — captureLegend.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00063ms |
| p50 | 0.00063ms |
| p95 | 0.0011ms |
| p99 | 0.0044ms |
| mean | 0.00081ms |
| stdev | 0.00078ms |
| min | 0.00058ms |
| max | 0.0072ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00063ms | 0.00063ms | 0.00ms | 0.00% |
| p50 | 0.00063ms | 0.00067ms | -0.000042ms | -6.30% |
| p95 | 0.0011ms | 0.0011ms | +0.000010ms | +0.93% |
| p99 | 0.0044ms | 0.0062ms | -0.0019ms | -29.94% |
| mean | 0.00081ms | 0.00085ms | -0.000035ms | -4.08% |
| min | 0.00058ms | 0.00063ms | -0.000042ms | -6.72% |
| max | 0.0072ms | 0.01ms | -0.0058ms | -44.55% |
| total | 0.16ms | 0.17ms | -0.0069ms | -4.08% |

### dispatchTooltip

# Perf Report — dispatchTooltip.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00067ms |
| p50 | 0.0013ms |
| p95 | 0.0019ms |
| p99 | 0.01ms |
| mean | 0.0013ms |
| stdev | 0.0015ms |
| min | 0.00063ms |
| max | 0.01ms |
| total | 0.27ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00067ms | 0.0012ms | -0.00054ms | -44.78% |
| p50 | 0.0013ms | 0.0013ms | +0.000041ms | +3.28% |
| p95 | 0.0019ms | 0.0019ms | -0.000030ms | -1.54% |
| p99 | 0.01ms | 0.0060ms | +0.0041ms | +67.86% |
| mean | 0.0013ms | 0.0014ms | -0.000066ms | -4.68% |
| min | 0.00063ms | 0.0012ms | -0.00054ms | -46.44% |
| max | 0.01ms | 0.01ms | +0.0038ms | +35.00% |
| total | 0.27ms | 0.28ms | -0.01ms | -4.68% |

