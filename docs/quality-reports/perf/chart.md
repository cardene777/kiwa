# Perf Suite — chart

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| renderChart | 0.01ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +17802%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| computeAxis | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +38667%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| captureLegend | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +52078%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| dispatchTooltip | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +27184%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

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
| renderChart | 401424 B | 0 B | 102400 B | yes | PASS |
| computeAxis | -6776 B | 0 B | 102400 B | yes | PASS |
| captureLegend | -8 B | 0 B | 102400 B | yes | PASS |
| dispatchTooltip | -4472 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### renderChart

# Perf Report — renderChart.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.05ms |
| mean | 0.01ms |
| stdev | 0.11ms |
| min | 0.00ms |
| max | 1.51ms |
| total | 2.36ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +69.04% |
| p95 | 0.01ms | 0.00ms | +0.01ms | +242.91% |
| p99 | 0.05ms | 0.02ms | +0.03ms | +216.66% |
| mean | 0.01ms | 0.00ms | +0.01ms | +417.42% |
| min | 0.00ms | 0.00ms | +0.00ms | +127.73% |
| max | 1.51ms | 0.13ms | +1.37ms | +1034.74% |
| total | 2.36ms | 0.46ms | +1.90ms | +417.42% |

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
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -12.68% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +44.69% |
| mean | 0.00ms | 0.00ms | +0.00ms | +1.75% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +19.31% |
| total | 0.21ms | 0.21ms | +0.00ms | +1.75% |

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
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +9.61% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +52.61% |
| mean | 0.00ms | 0.00ms | +0.00ms | +9.52% |
| min | 0.00ms | 0.00ms | -0.00ms | -6.16% |
| max | 0.01ms | 0.01ms | +0.01ms | +85.06% |
| total | 0.18ms | 0.16ms | +0.02ms | +9.52% |

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
| total | 0.28ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -3.05% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +6.85% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +15.48% |
| mean | 0.00ms | 0.00ms | -0.00ms | -6.71% |
| min | 0.00ms | 0.00ms | -0.00ms | -28.97% |
| max | 0.01ms | 0.01ms | +0.00ms | +34.66% |
| total | 0.28ms | 0.30ms | -0.02ms | -6.71% |

