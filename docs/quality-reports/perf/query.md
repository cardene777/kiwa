# Perf Suite — query

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| fetchQuery | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +32787%) 以上の悪化が必要) |
| mutate | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +37450%) 以上の悪化が必要) |
| invalidateQuery | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +108932%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| fetchQuery | 0.02ms | 10ms | PASS |
| mutate | 0.02ms | 10ms | PASS |
| invalidateQuery | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| fetchQuery | -7056 B | 0 B | 102400 B | yes | PASS |
| mutate | -15192 B | 0 B | 102400 B | yes | PASS |
| invalidateQuery | 464 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### fetchQuery

# Perf Report — fetchQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.02ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -13.28% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +119.51% |
| p99 | 0.02ms | 0.01ms | +0.01ms | +161.21% |
| mean | 0.00ms | 0.00ms | +0.00ms | +12.92% |
| min | 0.00ms | 0.00ms | -0.00ms | -21.44% |
| max | 0.02ms | 0.01ms | +0.01ms | +49.38% |
| total | 0.21ms | 0.18ms | +0.02ms | +12.92% |

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
| max | 0.02ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -11.20% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +34.35% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +68.64% |
| mean | 0.00ms | 0.00ms | -0.00ms | -19.57% |
| min | 0.00ms | 0.00ms | -0.00ms | -12.31% |
| max | 0.02ms | 0.07ms | -0.05ms | -71.81% |
| total | 0.21ms | 0.26ms | -0.05ms | -19.57% |

### invalidateQuery

# Perf Report — invalidateQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.02ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -0.30% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +91.54% |
| p99 | 0.02ms | 0.00ms | +0.02ms | +1192.15% |
| mean | 0.00ms | 0.00ms | +0.00ms | +64.88% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.01ms | +0.01ms | +62.42% |
| total | 0.14ms | 0.09ms | +0.06ms | +64.88% |

