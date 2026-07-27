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
| renderChart | 200600 B | 0 B | 102400 B | yes | PASS |
| computeAxis | -14888 B | 0 B | 102400 B | yes | PASS |
| captureLegend | 816 B | 0 B | 102400 B | yes | PASS |
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
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -4.92% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -11.74% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +1.20% |
| mean | 0.00ms | 0.00ms | -0.00ms | -1.05% |
| min | 0.00ms | 0.00ms | +0.00ms | +6.31% |
| max | 0.01ms | 0.01ms | +0.00ms | +3.27% |
| total | 0.24ms | 0.25ms | -0.00ms | -1.05% |

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
| max | 0.02ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -6.56% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -61.40% |
| p99 | 0.01ms | 0.02ms | -0.01ms | -62.73% |
| mean | 0.00ms | 0.00ms | -0.00ms | -38.88% |
| min | 0.00ms | 0.00ms | -0.00ms | -0.18% |
| max | 0.02ms | 0.03ms | -0.01ms | -41.69% |
| total | 0.18ms | 0.30ms | -0.12ms | -38.88% |

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
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +51.75% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +47.15% |
| mean | 0.00ms | 0.00ms | +0.00ms | +10.52% |
| min | 0.00ms | 0.00ms | -0.00ms | -21.44% |
| max | 0.01ms | 0.01ms | +0.01ms | +83.76% |
| total | 0.17ms | 0.16ms | +0.02ms | +10.52% |

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
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +9.12% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +21.81% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +21.71% |
| mean | 0.00ms | 0.00ms | +0.00ms | +8.18% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.02ms | -0.01ms | -38.02% |
| total | 0.25ms | 0.23ms | +0.02ms | +8.18% |

