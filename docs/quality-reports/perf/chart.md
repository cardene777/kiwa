# Perf Suite — chart

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| renderChart | 0.00083ms | 0.0027ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| computeAxis | 0.00058ms | 0.0014ms | 5ms | 0.00033ms | PASS | stable (差 0.00017ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| captureLegend | 0.00058ms | 0.0011ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| dispatchTooltip | 0.00063ms | 0.0021ms | 5ms | 0.00033ms | PASS | improved — gate 無効 (regressionGate=false) |

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
| renderChart | 201296 B | 0 B | 102400 B | yes | PASS |
| computeAxis | -16432 B | 0 B | 102400 B | yes | PASS |
| captureLegend | 1016 B | 0 B | 102400 B | yes | PASS |
| dispatchTooltip | 616 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### renderChart

# Perf Report — renderChart.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00083ms |
| p50 | 0.00083ms |
| p95 | 0.0027ms |
| p99 | 0.0068ms |
| mean | 0.0011ms |
| stdev | 0.0011ms |
| min | 0.00079ms |
| max | 0.01ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00083ms | 0.00083ms | 0.00ms | 0.00% |
| p50 | 0.00083ms | 0.00088ms | -0.000041ms | -4.69% |
| p95 | 0.0027ms | 0.0025ms | +0.00019ms | +7.86% |
| p99 | 0.0068ms | 0.0050ms | +0.0018ms | +35.79% |
| mean | 0.0011ms | 0.0013ms | -0.00018ms | -13.63% |
| min | 0.00079ms | 0.00079ms | +0.0000010ms | +0.13% |
| max | 0.01ms | 0.01ms | -0.0021ms | -17.19% |
| total | 0.22ms | 0.26ms | -0.04ms | -13.63% |

### computeAxis

# Perf Report — computeAxis.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00058ms |
| p50 | 0.00063ms |
| p95 | 0.0014ms |
| p99 | 0.0062ms |
| mean | 0.00088ms |
| stdev | 0.0013ms |
| min | 0.00054ms |
| max | 0.01ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00058ms | 0.00075ms | -0.00017ms | -22.27% |
| p50 | 0.00063ms | 0.00075ms | -0.00013ms | -16.67% |
| p95 | 0.0014ms | 0.00097ms | +0.00047ms | +48.70% |
| p99 | 0.0062ms | 0.0048ms | +0.0014ms | +30.09% |
| mean | 0.00088ms | 0.00095ms | -0.000069ms | -7.26% |
| min | 0.00054ms | 0.00071ms | -0.00017ms | -23.59% |
| max | 0.01ms | 0.01ms | +0.0011ms | +8.10% |
| total | 0.18ms | 0.19ms | -0.01ms | -7.26% |

### captureLegend

# Perf Report — captureLegend.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00058ms |
| p50 | 0.00063ms |
| p95 | 0.0011ms |
| p99 | 0.0061ms |
| mean | 0.00084ms |
| stdev | 0.0012ms |
| min | 0.00046ms |
| max | 0.01ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00058ms | 0.00063ms | -0.000046ms | -7.38% |
| p50 | 0.00063ms | 0.00067ms | -0.000042ms | -6.30% |
| p95 | 0.0011ms | 0.0011ms | -0.000039ms | -3.46% |
| p99 | 0.0061ms | 0.0062ms | -0.00012ms | -2.01% |
| mean | 0.00084ms | 0.00085ms | -0.0000031ms | -0.37% |
| min | 0.00046ms | 0.00063ms | -0.00017ms | -26.72% |
| max | 0.01ms | 0.01ms | +0.00075ms | +5.77% |
| total | 0.17ms | 0.17ms | -0.00063ms | -0.37% |

### dispatchTooltip

# Perf Report — dispatchTooltip.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00063ms |
| p50 | 0.0012ms |
| p95 | 0.0021ms |
| p99 | 0.0078ms |
| mean | 0.0018ms |
| stdev | 0.0074ms |
| min | 0.00063ms |
| max | 0.10ms |
| total | 0.35ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00063ms | 0.0012ms | -0.00058ms | -48.26% |
| p50 | 0.0012ms | 0.0013ms | -0.000042ms | -3.36% |
| p95 | 0.0021ms | 0.0019ms | +0.00019ms | +9.74% |
| p99 | 0.0078ms | 0.0060ms | +0.0018ms | +30.46% |
| mean | 0.0018ms | 0.0014ms | +0.00034ms | +23.70% |
| min | 0.00063ms | 0.0012ms | -0.00054ms | -46.44% |
| max | 0.10ms | 0.01ms | +0.09ms | +866.19% |
| total | 0.35ms | 0.28ms | +0.07ms | +23.70% |

