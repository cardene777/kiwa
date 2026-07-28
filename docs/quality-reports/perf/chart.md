# Perf Suite — chart

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| renderChart | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +17802%) 以上の悪化が必要) |
| computeAxis | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +38667%) 以上の悪化が必要) |
| captureLegend | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +52078%) 以上の悪化が必要) |
| dispatchTooltip | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +27184%) 以上の悪化が必要) |

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
| renderChart | 202920 B | -62460 B | 102400 B | yes | PASS |
| computeAxis | -10392 B | 0 B | 102400 B | yes | PASS |
| captureLegend | 712 B | 0 B | 102400 B | yes | PASS |
| dispatchTooltip | 24648 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.28ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -34.48% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +32.91% |
| p99 | 0.01ms | 0.02ms | -0.01ms | -36.06% |
| mean | 0.00ms | 0.00ms | -0.00ms | -38.11% |
| min | 0.00ms | 0.00ms | -0.00ms | -11.20% |
| max | 0.01ms | 0.13ms | -0.12ms | -90.36% |
| total | 0.28ms | 0.46ms | -0.17ms | -38.11% |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -28.57% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +20.62% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +37.09% |
| mean | 0.00ms | 0.00ms | -0.00ms | -14.14% |
| min | 0.00ms | 0.00ms | -0.00ms | -31.61% |
| max | 0.01ms | 0.01ms | +0.00ms | +19.32% |
| total | 0.18ms | 0.21ms | -0.03ms | -14.14% |

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
| max | 0.03ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -5.93% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +74.28% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +108.72% |
| mean | 0.00ms | 0.00ms | +0.00ms | +17.27% |
| min | 0.00ms | 0.00ms | -0.00ms | -31.23% |
| max | 0.03ms | 0.01ms | +0.02ms | +210.32% |
| total | 0.19ms | 0.16ms | +0.03ms | +17.27% |

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
| max | 0.07ms |
| total | 0.34ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -9.09% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +2.85% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +20.49% |
| mean | 0.00ms | 0.00ms | +0.00ms | +13.07% |
| min | 0.00ms | 0.00ms | -0.00ms | -6.43% |
| max | 0.07ms | 0.01ms | +0.06ms | +712.34% |
| total | 0.34ms | 0.30ms | +0.04ms | +13.07% |

