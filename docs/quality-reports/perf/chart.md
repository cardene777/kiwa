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
| computeAxis | 0.02ms | 10ms | PASS |
| captureLegend | 0.01ms | 10ms | PASS |
| dispatchTooltip | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| renderChart | 202160 B | -61495 B | 102400 B | yes | PASS |
| computeAxis | 9072 B | 0 B | 102400 B | yes | PASS |
| captureLegend | 1760 B | 0 B | 102400 B | yes | PASS |
| dispatchTooltip | 752 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +35.05% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -39.71% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +13.44% |
| mean | 0.00ms | 0.00ms | +0.00ms | +16.53% |
| min | 0.00ms | 0.00ms | +0.00ms | +56.46% |
| max | 0.01ms | 0.01ms | +0.00ms | +17.33% |
| total | 0.29ms | 0.25ms | +0.04ms | +16.53% |

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
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +33.44% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -63.03% |
| p99 | 0.01ms | 0.02ms | -0.01ms | -61.09% |
| mean | 0.00ms | 0.00ms | -0.00ms | -30.49% |
| min | 0.00ms | 0.00ms | +0.00ms | +15.31% |
| max | 0.01ms | 0.03ms | -0.01ms | -50.00% |
| total | 0.21ms | 0.30ms | -0.09ms | -30.49% |

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
| stdev | 0.03ms |
| min | 0.00ms |
| max | 0.36ms |
| total | 0.54ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +0.15% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +69.32% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +93.09% |
| mean | 0.00ms | 0.00ms | +0.00ms | +244.53% |
| min | 0.00ms | 0.00ms | +0.00ms | +7.20% |
| max | 0.36ms | 0.01ms | +0.35ms | +4604.45% |
| total | 0.54ms | 0.16ms | +0.38ms | +244.53% |

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
| total | 0.27ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +9.12% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +25.06% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +78.19% |
| mean | 0.00ms | 0.00ms | +0.00ms | +14.13% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.02ms | -0.01ms | -29.03% |
| total | 0.27ms | 0.23ms | +0.03ms | +14.13% |

