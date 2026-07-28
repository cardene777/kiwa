# Perf Suite — core-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| spec_parsing (50 parseSpec of typical spec) | 0.99ms | 50ms | PASS | stable (検知には +0.5ms (baseline 比 +147%) 以上の悪化が必要) |
| pool_lifecycle (create + 10 borrow/release + stopAll) | 0.01ms | 50ms | PASS | stable (検知には +0.5ms (baseline 比 +5706%) 以上の悪化が必要) |
| spec_pool_integration (parseSpec + pool per case) | 0.08ms | 50ms | PASS | stable (検知には +0.5ms (baseline 比 +638%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| spec_parsing (50 parseSpec of typical spec) | 4.38ms | 100ms | PASS |
| pool_lifecycle (create + 10 borrow/release + stopAll) | 0.36ms | 100ms | PASS |
| spec_pool_integration (parseSpec + pool per case) | 2.80ms | 100ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| spec_parsing (50 parseSpec of typical spec) | -7712 B | 0 B | 102400 B | yes | PASS |
| pool_lifecycle (create + 10 borrow/release + stopAll) | 18256 B | 0 B | 102400 B | yes | PASS |
| spec_pool_integration (parseSpec + pool per case) | 2280 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### spec_parsing (50 parseSpec of typical spec)

# Perf Report — spec_parsing (50 parseSpec of typical spec).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.28ms |
| p95 | 0.99ms |
| p99 | 2.00ms |
| mean | 0.37ms |
| stdev | 0.44ms |
| min | 0.11ms |
| max | 2.32ms |
| total | 11.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.28ms | 0.15ms | +0.13ms | +89.14% |
| p95 | 0.99ms | 0.34ms | +0.65ms | +190.32% |
| p99 | 2.00ms | 0.60ms | +1.40ms | +233.92% |
| mean | 0.37ms | 0.19ms | +0.18ms | +90.48% |
| min | 0.11ms | 0.12ms | -0.00ms | -3.95% |
| max | 2.32ms | 0.70ms | +1.62ms | +231.82% |
| total | 11.06ms | 5.81ms | +5.25ms | +90.48% |

### pool_lifecycle (create + 10 borrow/release + stopAll)

# Perf Report — pool_lifecycle (create + 10 borrow/release + stopAll).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.28ms |
| mean | 0.02ms |
| stdev | 0.07ms |
| min | 0.00ms |
| max | 0.38ms |
| total | 0.53ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.01ms | -0.00ms | -14.05% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +34.11% |
| p99 | 0.28ms | 0.01ms | +0.27ms | +2623.28% |
| mean | 0.02ms | 0.01ms | +0.01ms | +205.32% |
| min | 0.00ms | 0.01ms | -0.00ms | -23.98% |
| max | 0.38ms | 0.01ms | +0.37ms | +3661.77% |
| total | 0.53ms | 0.17ms | +0.36ms | +205.32% |

### spec_pool_integration (parseSpec + pool per case)

# Perf Report — spec_pool_integration (parseSpec + pool per case).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.08ms |
| p99 | 0.51ms |
| mean | 0.04ms |
| stdev | 0.12ms |
| min | 0.01ms |
| max | 0.68ms |
| total | 1.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -1.45% |
| p95 | 0.08ms | 0.08ms | -0.00ms | -1.16% |
| p99 | 0.51ms | 0.09ms | +0.43ms | +490.33% |
| mean | 0.04ms | 0.02ms | +0.02ms | +82.51% |
| min | 0.01ms | 0.00ms | +0.00ms | +41.08% |
| max | 0.68ms | 0.09ms | +0.59ms | +685.26% |
| total | 1.18ms | 0.65ms | +0.54ms | +82.51% |

