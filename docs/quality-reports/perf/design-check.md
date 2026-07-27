# Perf Suite — design-check

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| checkSpecConformance | 0.01ms | 5ms | PASS | stable |
| checkLayoutRegression | 0.03ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 10 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| checkSpecConformance | 0.01ms | 10ms | PASS |
| checkLayoutRegression | 0.02ms | 10ms | PASS |

## Memory retention (50 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| checkSpecConformance | 492920 B | 0 B | 102400 B | PASS |
| checkLayoutRegression | 254440 B | 0 B | 102400 B | PASS |

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
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -7.81% |
| p95 | 0.01ms | 0.00ms | +0.00ms | +29.19% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -7.85% |
| mean | 0.00ms | 0.00ms | -0.00ms | -1.02% |
| min | 0.00ms | 0.00ms | +0.00ms | +1.98% |
| max | 0.01ms | 0.01ms | -0.00ms | -22.09% |
| total | 0.16ms | 0.16ms | -0.00ms | -1.02% |

### checkLayoutRegression

# Perf Report — checkLayoutRegression.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.72ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.02ms | -0.01ms | -33.56% |
| p95 | 0.03ms | 0.03ms | -0.00ms | -7.12% |
| p99 | 0.03ms | 0.03ms | -0.00ms | -3.53% |
| mean | 0.01ms | 0.02ms | -0.00ms | -22.80% |
| min | 0.01ms | 0.01ms | -0.00ms | -5.59% |
| max | 0.03ms | 0.03ms | -0.00ms | -4.28% |
| total | 0.72ms | 0.94ms | -0.21ms | -22.80% |

