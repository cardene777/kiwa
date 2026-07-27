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
| fetchQuery | 0.01ms | 10ms | PASS |
| mutate | 0.01ms | 10ms | PASS |
| invalidateQuery | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| fetchQuery | 5632 B | 0 B | 102400 B | yes | PASS |
| mutate | 776 B | 0 B | 102400 B | yes | PASS |
| invalidateQuery | -14960 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +14.41% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +3.87% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -10.11% |
| mean | 0.00ms | 0.00ms | +0.00ms | +7.86% |
| min | 0.00ms | 0.00ms | +0.00ms | +27.29% |
| max | 0.01ms | 0.02ms | -0.00ms | -19.20% |
| total | 0.20ms | 0.18ms | +0.01ms | +7.86% |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -10.07% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +28.01% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +8.70% |
| mean | 0.00ms | 0.00ms | -0.00ms | -10.37% |
| min | 0.00ms | 0.00ms | -0.00ms | -20.99% |
| max | 0.01ms | 0.01ms | -0.00ms | -18.04% |
| total | 0.18ms | 0.20ms | -0.02ms | -10.37% |

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
| max | 0.02ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -29.98% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -20.27% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -36.54% |
| mean | 0.00ms | 0.00ms | -0.00ms | -18.03% |
| min | 0.00ms | 0.00ms | -0.00ms | -22.40% |
| max | 0.02ms | 0.01ms | +0.01ms | +65.13% |
| total | 0.09ms | 0.11ms | -0.02ms | -18.03% |

