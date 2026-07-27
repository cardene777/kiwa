# Perf Suite — chart

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| renderChart | 0.00ms | 5ms | PASS | stable |
| computeAxis | 0.00ms | 5ms | PASS | stable |
| captureLegend | 0.00ms | 5ms | PASS | stable |
| dispatchTooltip | 0.00ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| renderChart | 0.02ms | 10ms | PASS |
| computeAxis | 0.01ms | 10ms | PASS |
| captureLegend | 0.01ms | 10ms | PASS |
| dispatchTooltip | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| renderChart | 596624 B | 0 B | 102400 B | PASS |
| computeAxis | 291640 B | 0 B | 102400 B | PASS |
| captureLegend | 139696 B | 0 B | 102400 B | PASS |
| dispatchTooltip | 326888 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### renderChart

# Perf Report — renderChart.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -5.30% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +13.98% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +2.88% |
| mean | 0.00ms | 0.00ms | +0.00ms | +2.65% |
| min | 0.00ms | 0.00ms | -0.00ms | -5.93% |
| max | 0.01ms | 0.01ms | +0.00ms | +34.05% |
| total | 0.24ms | 0.23ms | +0.01ms | +2.65% |

### computeAxis

# Perf Report — computeAxis.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -6.23% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -20.58% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -19.08% |
| mean | 0.00ms | 0.00ms | -0.00ms | -16.47% |
| min | 0.00ms | 0.00ms | -0.00ms | -7.20% |
| max | 0.01ms | 0.01ms | -0.00ms | -2.25% |
| total | 0.17ms | 0.21ms | -0.03ms | -16.47% |

### captureLegend

# Perf Report — captureLegend.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +15.42% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -52.09% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +16.83% |
| mean | 0.00ms | 0.00ms | +0.00ms | +1.31% |
| min | 0.00ms | 0.00ms | +0.00ms | +9.83% |
| max | 0.01ms | 0.01ms | +0.01ms | +99.98% |
| total | 0.16ms | 0.16ms | +0.00ms | +1.31% |

### dispatchTooltip

# Perf Report — dispatchTooltip.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 0.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +64.60% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -24.98% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -9.22% |
| mean | 0.00ms | 0.00ms | +0.00ms | +2.01% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.04ms | -0.03ms | -62.62% |
| total | 0.26ms | 0.25ms | +0.01ms | +2.01% |

