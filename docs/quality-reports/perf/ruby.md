# Perf Suite — ruby

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| dispatchRailsRequest | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +19950%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| dispatchGenericRequest | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +74733%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| renderERB | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +64691%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dispatchRailsRequest | 0.01ms | 10ms | PASS |
| dispatchGenericRequest | 0.02ms | 10ms | PASS |
| renderERB | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| dispatchRailsRequest | 12744 B | 0 B | 102400 B | yes | PASS |
| dispatchGenericRequest | -600 B | 0 B | 102400 B | yes | PASS |
| renderERB | -18152 B | 0 B | 102400 B | yes | PASS |

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
| max | 0.01ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -13.28% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -23.47% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -12.44% |
| mean | 0.00ms | 0.00ms | -0.00ms | -16.87% |
| min | 0.00ms | 0.00ms | -0.00ms | -9.17% |
| max | 0.01ms | 0.01ms | -0.01ms | -41.19% |
| total | 0.16ms | 0.19ms | -0.03ms | -16.87% |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -7.58% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -0.46% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -7.07% |
| mean | 0.00ms | 0.00ms | -0.00ms | -1.89% |
| min | 0.00ms | 0.00ms | -0.00ms | -8.95% |
| max | 0.01ms | 0.01ms | +0.00ms | +26.83% |
| total | 0.12ms | 0.12ms | -0.00ms | -1.89% |

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
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -8.20% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +4.23% |
| p99 | 0.01ms | 0.02ms | -0.01ms | -71.90% |
| mean | 0.00ms | 0.00ms | -0.00ms | -57.56% |
| min | 0.00ms | 0.00ms | -0.00ms | -9.17% |
| max | 0.01ms | 0.12ms | -0.10ms | -90.25% |
| total | 0.13ms | 0.30ms | -0.18ms | -57.56% |

