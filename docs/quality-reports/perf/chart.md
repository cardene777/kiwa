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

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| renderChart | 200944 B | 0 B | 102400 B | yes | PASS |
| computeAxis | 832 B | 0 B | 102400 B | yes | PASS |
| captureLegend | -12992 B | 0 B | 102400 B | yes | PASS |
| dispatchTooltip | 912 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -4.92% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +6.47% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +2.93% |
| mean | 0.00ms | 0.00ms | +0.00ms | +3.02% |
| min | 0.00ms | 0.00ms | +0.00ms | +6.31% |
| max | 0.01ms | 0.01ms | -0.00ms | -0.65% |
| total | 0.25ms | 0.25ms | +0.01ms | +3.02% |

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
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -6.56% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -64.60% |
| p99 | 0.01ms | 0.02ms | -0.01ms | -58.72% |
| mean | 0.00ms | 0.00ms | -0.00ms | -41.12% |
| min | 0.00ms | 0.00ms | -0.00ms | -7.75% |
| max | 0.01ms | 0.03ms | -0.02ms | -57.87% |
| total | 0.18ms | 0.30ms | -0.12ms | -41.12% |

### captureLegend

# Perf Report — captureLegend.serial

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -6.16% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +18.00% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +68.47% |
| mean | 0.00ms | 0.00ms | +0.00ms | +11.33% |
| min | 0.00ms | 0.00ms | -0.00ms | -21.44% |
| max | 0.01ms | 0.01ms | +0.01ms | +72.95% |
| total | 0.17ms | 0.16ms | +0.02ms | +11.33% |

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
| max | 0.01ms |
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -12.70% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +34.72% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +0.26% |
| mean | 0.00ms | 0.00ms | +0.00ms | +2.43% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.02ms | -0.01ms | -31.80% |
| total | 0.24ms | 0.23ms | +0.01ms | +2.43% |

