# Perf Suite — query

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| fetchQuery | 0.00ms | 5ms | PASS | stable |
| mutate | 0.00ms | 5ms | PASS | stable |
| invalidateQuery | 0.00ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| fetchQuery | 0.02ms | 10ms | PASS |
| mutate | 0.02ms | 10ms | PASS |
| invalidateQuery | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| fetchQuery | 184704 B | 0 B | 102400 B | yes | PASS |
| mutate | -280 B | 0 B | 102400 B | yes | PASS |
| invalidateQuery | 4976 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### fetchQuery

# Perf Report — fetchQuery.serial

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
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -7.03% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -19.45% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -7.11% |
| mean | 0.00ms | 0.00ms | -0.00ms | -8.02% |
| min | 0.00ms | 0.00ms | -0.00ms | -8.95% |
| max | 0.02ms | 0.02ms | -0.00ms | -7.26% |
| total | 0.17ms | 0.18ms | -0.01ms | -8.02% |

### mutate

# Perf Report — mutate.serial

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -20.14% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +19.72% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +52.98% |
| mean | 0.00ms | 0.00ms | -0.00ms | -14.30% |
| min | 0.00ms | 0.00ms | -0.00ms | -26.30% |
| max | 0.01ms | 0.01ms | -0.00ms | -8.86% |
| total | 0.18ms | 0.20ms | -0.03ms | -14.30% |

### invalidateQuery

# Perf Report — invalidateQuery.serial

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
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -29.98% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -19.60% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +18.31% |
| mean | 0.00ms | 0.00ms | -0.00ms | -18.07% |
| min | 0.00ms | 0.00ms | -0.00ms | -33.33% |
| max | 0.01ms | 0.01ms | +0.00ms | +2.81% |
| total | 0.09ms | 0.11ms | -0.02ms | -18.07% |

