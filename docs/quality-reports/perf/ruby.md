# Perf Suite — ruby

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| dispatchRailsRequest | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +19950%) 以上の悪化が必要) |
| dispatchGenericRequest | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +74733%) 以上の悪化が必要) |
| renderERB | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +64691%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dispatchRailsRequest | 0.01ms | 10ms | PASS |
| dispatchGenericRequest | 0.01ms | 10ms | PASS |
| renderERB | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| dispatchRailsRequest | 95608 B | 0 B | 102400 B | yes | PASS |
| dispatchGenericRequest | 536 B | 0 B | 102400 B | yes | PASS |
| renderERB | -2608 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### dispatchRailsRequest

# Perf Report — dispatchRailsRequest.serial

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -33.28% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -19.87% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -0.42% |
| mean | 0.00ms | 0.00ms | -0.00ms | -10.33% |
| min | 0.00ms | 0.00ms | -0.00ms | -18.12% |
| max | 0.02ms | 0.01ms | +0.01ms | +53.98% |
| total | 0.17ms | 0.19ms | -0.02ms | -10.33% |

### dispatchGenericRequest

# Perf Report — dispatchGenericRequest.serial

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
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -15.34% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +24.50% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -3.09% |
| mean | 0.00ms | 0.00ms | -0.00ms | -3.92% |
| min | 0.00ms | 0.00ms | -0.00ms | -18.12% |
| max | 0.01ms | 0.01ms | +0.00ms | +83.75% |
| total | 0.12ms | 0.12ms | -0.00ms | -3.92% |

### renderERB

# Perf Report — renderERB.serial

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
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -16.60% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -12.62% |
| p99 | 0.01ms | 0.02ms | -0.01ms | -54.18% |
| mean | 0.00ms | 0.00ms | -0.00ms | -59.59% |
| min | 0.00ms | 0.00ms | -0.00ms | -18.12% |
| max | 0.01ms | 0.12ms | -0.10ms | -90.04% |
| total | 0.12ms | 0.30ms | -0.18ms | -59.59% |

