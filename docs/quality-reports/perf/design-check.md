# Perf Suite — design-check

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| checkSpecConformance | 0.00ms | 5ms | PASS | stable |
| checkLayoutRegression | 0.03ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 10 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| checkSpecConformance | 0.02ms | 10ms | PASS |
| checkLayoutRegression | 0.03ms | 10ms | PASS |

## Memory retention (50 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| checkSpecConformance | 193912 B | 0 B | 102400 B | yes | PASS |
| checkLayoutRegression | -2144 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### checkSpecConformance

# Perf Report — checkSpecConformance.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -12.18% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -3.84% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +49.74% |
| mean | 0.00ms | 0.00ms | -0.00ms | -16.56% |
| min | 0.00ms | 0.00ms | -0.00ms | -34.62% |
| max | 0.01ms | 0.01ms | +0.01ms | +97.21% |
| total | 0.15ms | 0.18ms | -0.03ms | -16.56% |

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
| total | 0.74ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -6.42% |
| p95 | 0.03ms | 0.05ms | -0.02ms | -41.29% |
| p99 | 0.03ms | 0.07ms | -0.04ms | -53.07% |
| mean | 0.01ms | 0.02ms | -0.01ms | -29.39% |
| min | 0.01ms | 0.01ms | -0.00ms | -22.88% |
| max | 0.03ms | 0.08ms | -0.05ms | -59.64% |
| total | 0.74ms | 1.04ms | -0.31ms | -29.39% |

