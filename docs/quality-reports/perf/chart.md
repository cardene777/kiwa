# Perf Suite — chart

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| renderChart | 0.00088ms | 0.0027ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| computeAxis | 0.00063ms | 0.0013ms | 5ms | 0.00033ms | PASS | stable (p10 -17% (閾値未満)、 p95 +33% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| captureLegend | 0.00067ms | 0.0010ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| dispatchTooltip | 0.00092ms | 0.0021ms | 5ms | 0.00033ms | PASS | stable (差 0.00029ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |

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
| renderChart | 199640 B | 0 B | 102400 B | yes | PASS |
| computeAxis | -16280 B | 0 B | 102400 B | yes | PASS |
| captureLegend | 2656 B | 0 B | 102400 B | yes | PASS |
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
| p95 | 0.0027ms |
| p99 | 0.0099ms |
| mean | 0.0014ms |
| stdev | 0.0014ms |
| min | 0.00083ms |
| max | 0.01ms |
| total | 0.27ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00088ms | 0.00083ms | +0.000042ms | +5.04% |
| p50 | 0.00092ms | 0.00088ms | +0.000042ms | +4.80% |
| p95 | 0.0027ms | 0.0025ms | +0.00024ms | +9.55% |
| p99 | 0.0099ms | 0.0050ms | +0.0049ms | +97.15% |
| mean | 0.0014ms | 0.0013ms | +0.000064ms | +4.92% |
| min | 0.00083ms | 0.00079ms | +0.000042ms | +5.31% |
| max | 0.01ms | 0.01ms | -0.00071ms | -5.84% |
| total | 0.27ms | 0.26ms | +0.01ms | +4.92% |

### computeAxis

# Perf Report — computeAxis.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00063ms |
| p50 | 0.00067ms |
| p95 | 0.0013ms |
| p99 | 0.0079ms |
| mean | 0.00094ms |
| stdev | 0.0013ms |
| min | 0.00058ms |
| max | 0.01ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00063ms | 0.00075ms | -0.00013ms | -16.67% |
| p50 | 0.00067ms | 0.00075ms | -0.000083ms | -11.07% |
| p95 | 0.0013ms | 0.00097ms | +0.00032ms | +33.24% |
| p99 | 0.0079ms | 0.0048ms | +0.0031ms | +65.00% |
| mean | 0.00094ms | 0.00095ms | -0.0000096ms | -1.01% |
| min | 0.00058ms | 0.00071ms | -0.00013ms | -17.66% |
| max | 0.01ms | 0.01ms | +0.0015ms | +10.90% |
| total | 0.19ms | 0.19ms | -0.0019ms | -1.01% |

### captureLegend

# Perf Report — captureLegend.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00067ms |
| p50 | 0.00067ms |
| p95 | 0.0010ms |
| p99 | 0.0060ms |
| mean | 0.00085ms |
| stdev | 0.00099ms |
| min | 0.00063ms |
| max | 0.01ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00067ms | 0.00063ms | +0.000041ms | +6.56% |
| p50 | 0.00067ms | 0.00067ms | 0.00ms | 0.00% |
| p95 | 0.0010ms | 0.0011ms | -0.00012ms | -11.11% |
| p99 | 0.0060ms | 0.0062ms | -0.00025ms | -3.98% |
| mean | 0.00085ms | 0.00085ms | +0.0000027ms | +0.32% |
| min | 0.00063ms | 0.00063ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | -0.0024ms | -18.59% |
| total | 0.17ms | 0.17ms | +0.00054ms | +0.32% |

### dispatchTooltip

# Perf Report — dispatchTooltip.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00092ms |
| p50 | 0.0013ms |
| p95 | 0.0021ms |
| p99 | 0.0091ms |
| mean | 0.0015ms |
| stdev | 0.0013ms |
| min | 0.00071ms |
| max | 0.0096ms |
| total | 0.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00092ms | 0.0012ms | -0.00029ms | -24.09% |
| p50 | 0.0013ms | 0.0013ms | +0.000083ms | +6.64% |
| p95 | 0.0021ms | 0.0019ms | +0.00022ms | +11.60% |
| p99 | 0.0091ms | 0.0060ms | +0.0031ms | +51.23% |
| mean | 0.0015ms | 0.0014ms | +0.000039ms | +2.75% |
| min | 0.00071ms | 0.0012ms | -0.00046ms | -39.33% |
| max | 0.0096ms | 0.01ms | -0.0013ms | -11.54% |
| total | 0.29ms | 0.28ms | +0.0078ms | +2.75% |

