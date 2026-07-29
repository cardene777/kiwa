# Perf Suite — chart

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| renderChart | 0.00083ms | 0.0024ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| computeAxis | 0.00054ms | 0.0017ms | 5ms | 0.00033ms | PASS | stable (差 0.00021ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| captureLegend | 0.00046ms | 0.00093ms | 5ms | 0.00033ms | PASS | stable (差 0.00017ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| dispatchTooltip | 0.00067ms | 0.0018ms | 5ms | 0.00033ms | PASS | improved — gate 無効 (regressionGate=false) |

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
| renderChart | 202432 B | 0 B | 102400 B | yes | PASS |
| computeAxis | -15216 B | 0 B | 102400 B | yes | PASS |
| captureLegend | 2560 B | 0 B | 102400 B | yes | PASS |
| dispatchTooltip | 744 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### renderChart

# Perf Report — renderChart.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00083ms |
| p50 | 0.00088ms |
| p95 | 0.0024ms |
| p99 | 0.01ms |
| mean | 0.0013ms |
| stdev | 0.0022ms |
| min | 0.00079ms |
| max | 0.03ms |
| total | 0.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00083ms | 0.00083ms | 0.00ms | 0.00% |
| p50 | 0.00088ms | 0.00088ms | 0.00ms | 0.00% |
| p95 | 0.0024ms | 0.0025ms | -0.00010ms | -4.07% |
| p99 | 0.01ms | 0.0050ms | +0.0050ms | +99.73% |
| mean | 0.0013ms | 0.0013ms | -0.0000037ms | -0.28% |
| min | 0.00079ms | 0.00079ms | 0.00ms | 0.00% |
| max | 0.03ms | 0.01ms | +0.01ms | +112.72% |
| total | 0.26ms | 0.26ms | -0.00073ms | -0.28% |

### computeAxis

# Perf Report — computeAxis.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00054ms |
| p50 | 0.00058ms |
| p95 | 0.0017ms |
| p99 | 0.0045ms |
| mean | 0.00085ms |
| stdev | 0.0013ms |
| min | 0.00050ms |
| max | 0.02ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00054ms | 0.00075ms | -0.00021ms | -27.73% |
| p50 | 0.00058ms | 0.00075ms | -0.00017ms | -22.27% |
| p95 | 0.0017ms | 0.00097ms | +0.00070ms | +72.52% |
| p99 | 0.0045ms | 0.0048ms | -0.00024ms | -5.11% |
| mean | 0.00085ms | 0.00095ms | -0.00010ms | -10.92% |
| min | 0.00050ms | 0.00071ms | -0.00021ms | -29.38% |
| max | 0.02ms | 0.01ms | +0.0029ms | +21.80% |
| total | 0.17ms | 0.19ms | -0.02ms | -10.92% |

### captureLegend

# Perf Report — captureLegend.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00063ms |
| p95 | 0.00093ms |
| p99 | 0.0042ms |
| mean | 0.00076ms |
| stdev | 0.00082ms |
| min | 0.00042ms |
| max | 0.0087ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00063ms | -0.00017ms | -26.56% |
| p50 | 0.00063ms | 0.00067ms | -0.000042ms | -6.30% |
| p95 | 0.00093ms | 0.0011ms | -0.00020ms | -17.56% |
| p99 | 0.0042ms | 0.0062ms | -0.0020ms | -32.58% |
| mean | 0.00076ms | 0.00085ms | -0.000090ms | -10.67% |
| min | 0.00042ms | 0.00063ms | -0.00021ms | -33.44% |
| max | 0.0087ms | 0.01ms | -0.0043ms | -33.02% |
| total | 0.15ms | 0.17ms | -0.02ms | -10.67% |

### dispatchTooltip

# Perf Report — dispatchTooltip.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00067ms |
| p50 | 0.00092ms |
| p95 | 0.0018ms |
| p99 | 0.0048ms |
| mean | 0.0011ms |
| stdev | 0.00073ms |
| min | 0.00063ms |
| max | 0.0058ms |
| total | 0.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00067ms | 0.0012ms | -0.00054ms | -44.87% |
| p50 | 0.00092ms | 0.0013ms | -0.00033ms | -26.64% |
| p95 | 0.0018ms | 0.0019ms | -0.00016ms | -8.16% |
| p99 | 0.0048ms | 0.0060ms | -0.0012ms | -19.39% |
| mean | 0.0011ms | 0.0014ms | -0.00029ms | -20.32% |
| min | 0.00063ms | 0.0012ms | -0.00054ms | -46.44% |
| max | 0.0058ms | 0.01ms | -0.0050ms | -46.16% |
| total | 0.23ms | 0.28ms | -0.06ms | -20.32% |

