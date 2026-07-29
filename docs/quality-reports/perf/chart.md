# Perf Suite — chart

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| renderChart | 0.0011ms | 0.0018ms | 5ms | 0.00033ms | PASS | stable (差 0.00029ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| computeAxis | 0.00063ms | 0.0012ms | 5ms | 0.00033ms | PASS | stable (p10 -17% (閾値未満)、 p95 +25% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| captureLegend | 0.00071ms | 0.0012ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| dispatchTooltip | 0.0014ms | 0.0020ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

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
| renderChart | 203168 B | -60639 B | 102400 B | yes | PASS |
| computeAxis | 7576 B | 0 B | 102400 B | yes | PASS |
| captureLegend | 25072 B | 0 B | 102400 B | yes | PASS |
| dispatchTooltip | 21072 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### renderChart

# Perf Report — renderChart.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0011ms |
| p50 | 0.0012ms |
| p95 | 0.0018ms |
| p99 | 0.0047ms |
| mean | 0.0013ms |
| stdev | 0.00078ms |
| min | 0.0011ms |
| max | 0.0092ms |
| total | 0.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0011ms | 0.00083ms | +0.00029ms | +35.05% |
| p50 | 0.0012ms | 0.00088ms | +0.00029ms | +33.37% |
| p95 | 0.0018ms | 0.0025ms | -0.00068ms | -27.36% |
| p99 | 0.0047ms | 0.0050ms | -0.00034ms | -6.81% |
| mean | 0.0013ms | 0.0013ms | +0.000028ms | +2.16% |
| min | 0.0011ms | 0.00079ms | +0.00029ms | +36.92% |
| max | 0.0092ms | 0.01ms | -0.0029ms | -23.71% |
| total | 0.26ms | 0.26ms | +0.0056ms | +2.16% |

### computeAxis

# Perf Report — computeAxis.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00063ms |
| p50 | 0.00083ms |
| p95 | 0.0012ms |
| p99 | 0.0070ms |
| mean | 0.00096ms |
| stdev | 0.0012ms |
| min | 0.00058ms |
| max | 0.01ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00063ms | 0.00075ms | -0.00013ms | -16.67% |
| p50 | 0.00083ms | 0.00075ms | +0.000083ms | +11.07% |
| p95 | 0.0012ms | 0.00097ms | +0.00024ms | +25.12% |
| p99 | 0.0070ms | 0.0048ms | +0.0022ms | +47.06% |
| mean | 0.00096ms | 0.00095ms | +0.0000091ms | +0.96% |
| min | 0.00058ms | 0.00071ms | -0.00012ms | -17.51% |
| max | 0.01ms | 0.01ms | -0.00079ms | -5.92% |
| total | 0.19ms | 0.19ms | +0.0018ms | +0.96% |

### captureLegend

# Perf Report — captureLegend.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00071ms |
| p50 | 0.00075ms |
| p95 | 0.0012ms |
| p99 | 0.0061ms |
| mean | 0.00091ms |
| stdev | 0.0010ms |
| min | 0.00071ms |
| max | 0.01ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00071ms | 0.00063ms | +0.000083ms | +13.28% |
| p50 | 0.00075ms | 0.00067ms | +0.000083ms | +12.44% |
| p95 | 0.0012ms | 0.0011ms | +0.000044ms | +3.92% |
| p99 | 0.0061ms | 0.0062ms | -0.00013ms | -2.02% |
| mean | 0.00091ms | 0.00085ms | +0.000067ms | +7.87% |
| min | 0.00071ms | 0.00063ms | +0.000083ms | +13.28% |
| max | 0.01ms | 0.01ms | -0.0011ms | -8.34% |
| total | 0.18ms | 0.17ms | +0.01ms | +7.87% |

### dispatchTooltip

# Perf Report — dispatchTooltip.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0014ms |
| p50 | 0.0014ms |
| p95 | 0.0020ms |
| p99 | 0.0052ms |
| mean | 0.0016ms |
| stdev | 0.00070ms |
| min | 0.0013ms |
| max | 0.0082ms |
| total | 0.31ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0014ms | 0.0012ms | +0.00017ms | +13.82% |
| p50 | 0.0014ms | 0.0013ms | +0.00017ms | +13.36% |
| p95 | 0.0020ms | 0.0019ms | +0.000085ms | +4.43% |
| p99 | 0.0052ms | 0.0060ms | -0.00080ms | -13.32% |
| mean | 0.0016ms | 0.0014ms | +0.00014ms | +9.87% |
| min | 0.0013ms | 0.0012ms | +0.00017ms | +14.22% |
| max | 0.0082ms | 0.01ms | -0.0026ms | -24.23% |
| total | 0.31ms | 0.28ms | +0.03ms | +9.87% |

