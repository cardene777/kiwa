# Perf Suite — query

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| fetchQuery | 0.00ms | 5ms | PASS | stable |
| mutate | 0.00ms | 5ms | PASS | stable |
| invalidateQuery | 0.00ms | 5ms | PASS | improved |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| fetchQuery | 0.01ms | 10ms | PASS |
| mutate | 0.01ms | 10ms | PASS |
| invalidateQuery | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| fetchQuery | 346072 B | 0 B | 102400 B | PASS |
| mutate | 525464 B | 0 B | 102400 B | PASS |
| invalidateQuery | 232080 B | 0 B | 102400 B | PASS |

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
| max | 0.01ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -18.74% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +21.29% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -2.82% |
| mean | 0.00ms | 0.00ms | -0.00ms | -15.77% |
| min | 0.00ms | 0.00ms | -0.00ms | -26.72% |
| max | 0.01ms | 0.01ms | -0.00ms | -1.15% |
| total | 0.16ms | 0.19ms | -0.03ms | -15.77% |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -23.77% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -51.60% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +43.68% |
| mean | 0.00ms | 0.00ms | -0.00ms | -24.80% |
| min | 0.00ms | 0.00ms | -0.00ms | -17.66% |
| max | 0.01ms | 0.01ms | +0.00ms | +4.53% |
| total | 0.18ms | 0.25ms | -0.06ms | -24.80% |

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
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -22.13% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -70.74% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -36.89% |
| mean | 0.00ms | 0.00ms | -0.00ms | -23.82% |
| min | 0.00ms | 0.00ms | -0.00ms | -24.92% |
| max | 0.01ms | 0.01ms | +0.00ms | +25.71% |
| total | 0.08ms | 0.10ms | -0.02ms | -23.82% |

