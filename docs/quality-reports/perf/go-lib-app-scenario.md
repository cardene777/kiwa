# Perf Suite — go-lib-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| 4_framework_workflow (10 dispatch across gin/echo/fiber/chi) | 0.03ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +3386%) 以上の悪化が必要) |
| rest_batch (5 POST + GET + DELETE via chi router) | 0.04ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +2141%) 以上の悪化が必要) |
| route_error_handling (5 unmatched 404 + echo handler error) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +3559%) 以上の悪化が必要) |
| v2.1 retry_workflow (5 flaky handler、 3 attempt で成功) | 6.82ms | 200ms | PASS | stable |
| v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +5909%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| 4_framework_workflow (10 dispatch across gin/echo/fiber/chi) | 0.03ms | 200ms | PASS |
| rest_batch (5 POST + GET + DELETE via chi router) | 0.10ms | 200ms | PASS |
| route_error_handling (5 unmatched 404 + echo handler error) | 0.06ms | 200ms | PASS |
| v2.1 retry_workflow (5 flaky handler、 3 attempt で成功) | 6.23ms | 400ms | PASS |
| v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch) | 0.03ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| 4_framework_workflow (10 dispatch across gin/echo/fiber/chi) | 7792 B | 0 B | 102400 B | yes | PASS |
| rest_batch (5 POST + GET + DELETE via chi router) | 424 B | 0 B | 102400 B | yes | PASS |
| route_error_handling (5 unmatched 404 + echo handler error) | 776 B | 0 B | 102400 B | yes | PASS |
| v2.1 retry_workflow (5 flaky handler、 3 attempt で成功) | 13272 B | 0 B | 102400 B | yes | PASS |
| v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch) | 7392 B | 0 B | 102400 B | yes | PASS |

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
| p50 | 0.01ms | 0.01ms | -0.00ms | -25.69% |
| p95 | 0.03ms | 0.01ms | +0.02ms | +111.90% |
| p99 | 0.03ms | 0.03ms | +0.01ms | +22.88% |
| mean | 0.01ms | 0.01ms | +0.00ms | +12.82% |
| min | 0.01ms | 0.01ms | -0.00ms | -0.82% |
| max | 0.03ms | 0.11ms | -0.07ms | -69.25% |
| total | 0.19ms | 1.71ms | -1.52ms | -88.72% |

### rest_batch (5 POST + GET + DELETE via chi router)

# Perf Report — rest_batch (5 POST + GET + DELETE via chi router).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.04ms |
| p99 | 0.14ms |
| mean | 0.03ms |
| stdev | 0.03ms |
| min | 0.02ms |
| max | 0.17ms |
| total | 0.53ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +2.82% |
| p95 | 0.04ms | 0.02ms | +0.01ms | +57.10% |
| p99 | 0.14ms | 0.03ms | +0.11ms | +346.29% |
| mean | 0.03ms | 0.02ms | +0.01ms | +49.51% |
| min | 0.02ms | 0.01ms | +0.00ms | +25.25% |
| max | 0.17ms | 0.15ms | +0.02ms | +11.28% |
| total | 0.53ms | 3.57ms | -3.03ms | -85.05% |

### route_error_handling (5 unmatched 404 + echo handler error)

# Perf Report — route_error_handling (5 unmatched 404 + echo handler error).serial

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
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -14.08% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -21.99% |
| p99 | 0.01ms | 0.03ms | -0.01ms | -49.79% |
| mean | 0.01ms | 0.05ms | -0.04ms | -79.90% |
| min | 0.01ms | 0.01ms | -0.00ms | -7.56% |
| max | 0.01ms | 7.74ms | -7.73ms | -99.83% |
| total | 0.20ms | 10.11ms | -9.91ms | -97.99% |

### v2.1 retry_workflow (5 flaky handler、 3 attempt で成功)

# Perf Report — v2.1 retry_workflow (5 flaky handler、 3 attempt で成功).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 6.10ms |
| p95 | 6.82ms |
| p99 | 13.77ms |
| mean | 6.46ms |
| stdev | 2.18ms |
| min | 4.90ms |
| max | 15.51ms |
| total | 129.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 6.10ms | 7.11ms | -1.01ms | -14.19% |
| p95 | 6.82ms | 14.81ms | -7.99ms | -53.93% |
| p99 | 13.77ms | 30.08ms | -16.31ms | -54.21% |
| mean | 6.46ms | 8.60ms | -2.15ms | -24.95% |
| min | 4.90ms | 4.26ms | +0.64ms | +14.93% |
| max | 15.51ms | 47.81ms | -32.30ms | -67.56% |
| total | 129.14ms | 1720.55ms | -1591.42ms | -92.49% |

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
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +19.76% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +19.92% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -11.89% |
| mean | 0.01ms | 0.01ms | +0.00ms | +14.46% |
| min | 0.01ms | 0.00ms | +0.00ms | +15.13% |
| max | 0.01ms | 0.02ms | -0.01ms | -39.96% |
| total | 0.14ms | 1.25ms | -1.11ms | -88.55% |

