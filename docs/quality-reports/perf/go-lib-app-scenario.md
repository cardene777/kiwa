# Perf Suite — go-lib-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| 4_framework_workflow (10 dispatch across gin/echo/fiber/chi) | 0.03ms | 100ms | PASS | stable |
| rest_batch (5 POST + GET + DELETE via chi router) | 0.03ms | 100ms | PASS | stable |
| route_error_handling (5 unmatched 404 + echo handler error) | 0.02ms | 100ms | PASS | stable |
| v2.1 retry_workflow (5 flaky handler、 3 attempt で成功) | 5.98ms | 200ms | PASS | stable |
| v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch) | 0.01ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| 4_framework_workflow (10 dispatch across gin/echo/fiber/chi) | 0.03ms | 200ms | PASS |
| rest_batch (5 POST + GET + DELETE via chi router) | 0.11ms | 200ms | PASS |
| route_error_handling (5 unmatched 404 + echo handler error) | 0.05ms | 200ms | PASS |
| v2.1 retry_workflow (5 flaky handler、 3 attempt で成功) | 6.01ms | 400ms | PASS |
| v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| 4_framework_workflow (10 dispatch across gin/echo/fiber/chi) | 7864 B | 0 B | 102400 B | yes | PASS |
| rest_batch (5 POST + GET + DELETE via chi router) | 1320 B | 0 B | 102400 B | yes | PASS |
| route_error_handling (5 unmatched 404 + echo handler error) | 1536 B | 0 B | 102400 B | yes | PASS |
| v2.1 retry_workflow (5 flaky handler、 3 attempt で成功) | 5960 B | 0 B | 102400 B | yes | PASS |
| v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch) | -600 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### 4_framework_workflow (10 dispatch across gin/echo/fiber/chi)

# Perf Report — 4_framework_workflow (10 dispatch across gin/echo/fiber/chi).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -33.67% |
| p95 | 0.03ms | 0.03ms | -0.00ms | -11.64% |
| p99 | 0.03ms | 0.04ms | -0.00ms | -11.13% |
| mean | 0.01ms | 0.01ms | -0.00ms | -16.63% |
| min | 0.01ms | 0.01ms | -0.00ms | -34.92% |
| max | 0.03ms | 0.04ms | -0.00ms | -11.01% |
| total | 0.19ms | 0.23ms | -0.04ms | -16.63% |

### rest_batch (5 POST + GET + DELETE via chi router)

# Perf Report — rest_batch (5 POST + GET + DELETE via chi router).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.00ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.48ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +20.17% |
| p95 | 0.03ms | 0.03ms | -0.00ms | -6.06% |
| p99 | 0.03ms | 0.04ms | -0.00ms | -11.58% |
| mean | 0.02ms | 0.02ms | +0.00ms | +8.34% |
| min | 0.02ms | 0.02ms | 0.00ms | 0.00% |
| max | 0.03ms | 0.04ms | -0.00ms | -12.74% |
| total | 0.48ms | 0.44ms | +0.04ms | +8.34% |

### route_error_handling (5 unmatched 404 + echo handler error)

# Perf Report — route_error_handling (5 unmatched 404 + echo handler error).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +12.78% |
| p95 | 0.02ms | 0.01ms | +0.01ms | +60.68% |
| p99 | 0.02ms | 0.01ms | +0.01ms | +89.21% |
| mean | 0.01ms | 0.01ms | +0.00ms | +24.93% |
| min | 0.01ms | 0.01ms | -0.00ms | -5.32% |
| max | 0.02ms | 0.01ms | +0.01ms | +96.29% |
| total | 0.26ms | 0.21ms | +0.05ms | +24.93% |

### v2.1 retry_workflow (5 flaky handler、 3 attempt で成功)

# Perf Report — v2.1 retry_workflow (5 flaky handler、 3 attempt で成功).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 5.84ms |
| p95 | 5.98ms |
| p99 | 6.01ms |
| mean | 5.80ms |
| stdev | 0.28ms |
| min | 4.67ms |
| max | 6.01ms |
| total | 115.94ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 5.84ms | 6.09ms | -0.25ms | -4.07% |
| p95 | 5.98ms | 6.70ms | -0.72ms | -10.70% |
| p99 | 6.01ms | 7.35ms | -1.35ms | -18.33% |
| mean | 5.80ms | 6.20ms | -0.41ms | -6.54% |
| min | 4.67ms | 5.63ms | -0.96ms | -17.11% |
| max | 6.01ms | 7.52ms | -1.51ms | -20.04% |
| total | 115.94ms | 124.06ms | -8.12ms | -6.54% |

### v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch)

# Perf Report — v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.01ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +1.23% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +23.36% |
| p99 | 0.01ms | 0.02ms | -0.01ms | -34.26% |
| mean | 0.01ms | 0.01ms | -0.00ms | -6.37% |
| min | 0.01ms | 0.01ms | -0.00ms | -3.62% |
| max | 0.01ms | 0.02ms | -0.01ms | -40.03% |
| total | 0.15ms | 0.16ms | -0.01ms | -6.37% |

