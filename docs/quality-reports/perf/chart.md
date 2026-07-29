# Perf Suite — chart

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| renderChart | 0.00083ms | 0.0018ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| computeAxis | 0.00054ms | 0.0012ms | 5ms | 0.00033ms | PASS | stable (差 0.00021ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| captureLegend | 0.00058ms | 0.0011ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| dispatchTooltip | 0.00063ms | 0.0019ms | 5ms | 0.00033ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| renderChart | 0.01ms | 10ms | PASS |
| computeAxis | 0.01ms | 10ms | PASS |
| captureLegend | 0.01ms | 10ms | PASS |
| dispatchTooltip | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| renderChart | 201016 B | 0 B | 102400 B | yes | PASS |
| computeAxis | -16432 B | 0 B | 102400 B | yes | PASS |
| captureLegend | 712 B | 0 B | 102400 B | yes | PASS |
| dispatchTooltip | 248 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### renderChart

# Perf Report — renderChart.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00083ms |
| p50 | 0.00088ms |
| p95 | 0.0018ms |
| p99 | 0.0069ms |
| mean | 0.0011ms |
| stdev | 0.0012ms |
| min | 0.00079ms |
| max | 0.01ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00083ms | 0.00083ms | 0.00ms | 0.00% |
| p50 | 0.00088ms | 0.00088ms | 0.00ms | 0.00% |
| p95 | 0.0018ms | 0.0025ms | -0.00071ms | -28.72% |
| p99 | 0.0069ms | 0.0050ms | +0.0019ms | +38.07% |
| mean | 0.0011ms | 0.0013ms | -0.00019ms | -14.37% |
| min | 0.00079ms | 0.00079ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | -0.0012ms | -9.96% |
| total | 0.22ms | 0.26ms | -0.04ms | -14.37% |

### computeAxis

# Perf Report — computeAxis.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00054ms |
| p50 | 0.00058ms |
| p95 | 0.0012ms |
| p99 | 0.0065ms |
| mean | 0.00086ms |
| stdev | 0.0013ms |
| min | 0.00054ms |
| max | 0.02ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00054ms | 0.00075ms | -0.00021ms | -27.87% |
| p50 | 0.00058ms | 0.00075ms | -0.00017ms | -22.13% |
| p95 | 0.0012ms | 0.00097ms | +0.00027ms | +28.12% |
| p99 | 0.0065ms | 0.0048ms | +0.0017ms | +36.31% |
| mean | 0.00086ms | 0.00095ms | -0.000092ms | -9.61% |
| min | 0.00054ms | 0.00071ms | -0.00017ms | -23.59% |
| max | 0.02ms | 0.01ms | +0.0017ms | +12.46% |
| total | 0.17ms | 0.19ms | -0.02ms | -9.61% |

### captureLegend

# Perf Report — captureLegend.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00058ms |
| p50 | 0.00067ms |
| p95 | 0.0011ms |
| p99 | 0.0053ms |
| mean | 0.00081ms |
| stdev | 0.00081ms |
| min | 0.00046ms |
| max | 0.0073ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00058ms | 0.00063ms | -0.000045ms | -7.23% |
| p50 | 0.00067ms | 0.00067ms | 0.00ms | 0.00% |
| p95 | 0.0011ms | 0.0011ms | -0.000068ms | -6.08% |
| p99 | 0.0053ms | 0.0062ms | -0.00091ms | -14.71% |
| mean | 0.00081ms | 0.00085ms | -0.000036ms | -4.23% |
| min | 0.00046ms | 0.00063ms | -0.00017ms | -26.72% |
| max | 0.0073ms | 0.01ms | -0.0057ms | -44.23% |
| total | 0.16ms | 0.17ms | -0.0072ms | -4.23% |

### dispatchTooltip

# Perf Report — dispatchTooltip.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00063ms |
| p50 | 0.00096ms |
| p95 | 0.0019ms |
| p99 | 0.0082ms |
| mean | 0.0013ms |
| stdev | 0.0016ms |
| min | 0.00058ms |
| max | 0.01ms |
| total | 0.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00063ms | 0.0012ms | -0.00058ms | -48.26% |
| p50 | 0.00096ms | 0.0013ms | -0.00029ms | -23.32% |
| p95 | 0.0019ms | 0.0019ms | +0.0000052ms | +0.27% |
| p99 | 0.0082ms | 0.0060ms | +0.0022ms | +36.25% |
| mean | 0.0013ms | 0.0014ms | -0.00013ms | -9.46% |
| min | 0.00058ms | 0.0012ms | -0.00058ms | -50.04% |
| max | 0.01ms | 0.01ms | +0.0036ms | +33.46% |
| total | 0.26ms | 0.28ms | -0.03ms | -9.46% |

