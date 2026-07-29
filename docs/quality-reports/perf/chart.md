# Perf Suite — chart

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| renderChart | 0.00088ms | 0.0025ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| computeAxis | 0.00058ms | 0.0018ms | 5ms | 0.00033ms | PASS | stable (差 0.00017ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| captureLegend | 0.00050ms | 0.0011ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| dispatchTooltip | 0.00067ms | 0.0020ms | 5ms | 0.00033ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| renderChart | 0.02ms | 10ms | PASS |
| computeAxis | 0.01ms | 10ms | PASS |
| captureLegend | 0.01ms | 10ms | PASS |
| dispatchTooltip | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| renderChart | 201944 B | 0 B | 102400 B | yes | PASS |
| computeAxis | -456 B | 0 B | 102400 B | yes | PASS |
| captureLegend | 616 B | 0 B | 102400 B | yes | PASS |
| dispatchTooltip | 712 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### renderChart

# Perf Report — renderChart.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00088ms |
| p50 | 0.00092ms |
| p95 | 0.0025ms |
| p99 | 0.0048ms |
| mean | 0.0012ms |
| stdev | 0.00084ms |
| min | 0.00079ms |
| max | 0.0082ms |
| total | 0.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00088ms | 0.00083ms | +0.000042ms | +5.04% |
| p50 | 0.00092ms | 0.00088ms | +0.000041ms | +4.69% |
| p95 | 0.0025ms | 0.0025ms | -0.000013ms | -0.55% |
| p99 | 0.0048ms | 0.0050ms | -0.00026ms | -5.11% |
| mean | 0.0012ms | 0.0013ms | -0.00013ms | -10.44% |
| min | 0.00079ms | 0.00079ms | 0.00ms | 0.00% |
| max | 0.0082ms | 0.01ms | -0.0040ms | -32.65% |
| total | 0.23ms | 0.26ms | -0.03ms | -10.44% |

### computeAxis

# Perf Report — computeAxis.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00058ms |
| p50 | 0.00058ms |
| p95 | 0.0018ms |
| p99 | 0.0061ms |
| mean | 0.00087ms |
| stdev | 0.0013ms |
| min | 0.00054ms |
| max | 0.02ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00058ms | 0.00075ms | -0.00017ms | -22.27% |
| p50 | 0.00058ms | 0.00075ms | -0.00017ms | -22.13% |
| p95 | 0.0018ms | 0.00097ms | +0.00088ms | +90.59% |
| p99 | 0.0061ms | 0.0048ms | +0.0013ms | +27.85% |
| mean | 0.00087ms | 0.00095ms | -0.000084ms | -8.84% |
| min | 0.00054ms | 0.00071ms | -0.00017ms | -23.59% |
| max | 0.02ms | 0.01ms | +0.0027ms | +20.25% |
| total | 0.17ms | 0.19ms | -0.02ms | -8.84% |

### captureLegend

# Perf Report — captureLegend.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00067ms |
| p95 | 0.0011ms |
| p99 | 0.0055ms |
| mean | 0.00082ms |
| stdev | 0.00087ms |
| min | 0.00046ms |
| max | 0.0077ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00063ms | -0.00013ms | -20.00% |
| p50 | 0.00067ms | 0.00067ms | -0.0000010ms | -0.15% |
| p95 | 0.0011ms | 0.0011ms | +0.000017ms | +1.48% |
| p99 | 0.0055ms | 0.0062ms | -0.00075ms | -12.08% |
| mean | 0.00082ms | 0.00085ms | -0.000030ms | -3.59% |
| min | 0.00046ms | 0.00063ms | -0.00017ms | -26.72% |
| max | 0.0077ms | 0.01ms | -0.0053ms | -40.71% |
| total | 0.16ms | 0.17ms | -0.0061ms | -3.59% |

### dispatchTooltip

# Perf Report — dispatchTooltip.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00067ms |
| p50 | 0.0012ms |
| p95 | 0.0020ms |
| p99 | 0.0080ms |
| mean | 0.0013ms |
| stdev | 0.0012ms |
| min | 0.00067ms |
| max | 0.01ms |
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00067ms | 0.0012ms | -0.00054ms | -44.78% |
| p50 | 0.0012ms | 0.0013ms | -0.000084ms | -6.72% |
| p95 | 0.0020ms | 0.0019ms | +0.000054ms | +2.84% |
| p99 | 0.0080ms | 0.0060ms | +0.0020ms | +33.19% |
| mean | 0.0013ms | 0.0014ms | -0.00014ms | -10.20% |
| min | 0.00067ms | 0.0012ms | -0.00050ms | -42.93% |
| max | 0.01ms | 0.01ms | -0.00046ms | -4.23% |
| total | 0.25ms | 0.28ms | -0.03ms | -10.20% |

