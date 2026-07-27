# Perf Suite — feature-flag

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| evaluateFlag | 0.00ms | 5ms | PASS | stable |
| evaluateAllFlags | 0.00ms | 5ms | PASS | improved |
| registerRule | 0.00ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| evaluateFlag | 0.01ms | 10ms | PASS |
| evaluateAllFlags | 0.02ms | 10ms | PASS |
| registerRule | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| evaluateFlag | 326112 B | 0 B | 102400 B | PASS |
| evaluateAllFlags | 698152 B | 0 B | 102400 B | PASS |
| registerRule | 192592 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### evaluateFlag

# Perf Report — evaluateFlag.serial

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -6.72% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +17.19% |
| p99 | 0.01ms | 0.01ms | +0.01ms | +117.45% |
| mean | 0.00ms | 0.00ms | +0.00ms | +10.16% |
| min | 0.00ms | 0.00ms | -0.00ms | -9.86% |
| max | 0.01ms | 0.01ms | +0.00ms | +39.60% |
| total | 0.17ms | 0.15ms | +0.02ms | +10.16% |

### evaluateAllFlags

# Perf Report — evaluateAllFlags.serial

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
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -8.06% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -38.65% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -4.38% |
| mean | 0.00ms | 0.00ms | -0.00ms | -8.71% |
| min | 0.00ms | 0.00ms | -0.00ms | -8.66% |
| max | 0.01ms | 0.00ms | +0.01ms | +244.52% |
| total | 0.21ms | 0.23ms | -0.02ms | -8.71% |

### registerRule

# Perf Report — registerRule.serial

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
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -16.40% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -60.15% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +41.77% |
| mean | 0.00ms | 0.00ms | -0.00ms | -5.75% |
| min | 0.00ms | 0.00ms | -0.00ms | -20.19% |
| max | 0.01ms | 0.01ms | +0.00ms | +46.48% |
| total | 0.07ms | 0.07ms | -0.00ms | -5.75% |

