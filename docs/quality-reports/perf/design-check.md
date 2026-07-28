# Perf Suite — design-check

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| checkSpecConformance | 0.01ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +10208%) 以上の悪化が必要) |
| checkLayoutRegression | 0.03ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +1767%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 4, 10 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| checkSpecConformance | 0.02ms | 10ms | PASS |
| checkLayoutRegression | 0.03ms | 10ms | PASS |

## Memory retention (50 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| checkSpecConformance | -43088 B | 0 B | 102400 B | yes | PASS |
| checkLayoutRegression | -2664 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### checkSpecConformance

# Perf Report — checkSpecConformance.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -5.68% |
| p95 | 0.01ms | 0.00ms | +0.00ms | +9.05% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +83.61% |
| mean | 0.00ms | 0.00ms | -0.00ms | -2.03% |
| min | 0.00ms | 0.00ms | -0.00ms | -32.00% |
| max | 0.01ms | 0.01ms | +0.01ms | +140.58% |
| total | 0.17ms | 0.18ms | -0.00ms | -2.03% |

### checkLayoutRegression

# Perf Report — checkLayoutRegression.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 5 |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.76ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | -0.00ms | -11.60% |
| p95 | 0.03ms | 0.03ms | -0.00ms | -0.24% |
| p99 | 0.03ms | 0.04ms | -0.00ms | -6.10% |
| mean | 0.02ms | 0.02ms | -0.00ms | -9.58% |
| min | 0.01ms | 0.01ms | -0.00ms | -11.87% |
| max | 0.03ms | 0.04ms | -0.00ms | -4.51% |
| total | 0.76ms | 0.84ms | -0.08ms | -9.58% |

