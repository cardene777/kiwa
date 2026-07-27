# Perf Suite — go-lib-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| 4_framework_workflow (10 dispatch across gin/echo/fiber/chi) | 0.03ms | 100ms | PASS | stable |
| rest_batch (5 POST + GET + DELETE via chi router) | 0.03ms | 100ms | PASS | stable |
| route_error_handling (5 unmatched 404 + echo handler error) | 0.01ms | 100ms | PASS | stable |
| v2.1 retry_workflow (5 flaky handler、 3 attempt で成功) | 6.48ms | 200ms | PASS | stable |
| v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch) | 0.01ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| 4_framework_workflow (10 dispatch across gin/echo/fiber/chi) | 0.03ms | 200ms | PASS |
| rest_batch (5 POST + GET + DELETE via chi router) | 0.08ms | 200ms | PASS |
| route_error_handling (5 unmatched 404 + echo handler error) | 0.06ms | 200ms | PASS |
| v2.1 retry_workflow (5 flaky handler、 3 attempt で成功) | 6.53ms | 400ms | PASS |
| v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch) | 0.03ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| 4_framework_workflow (10 dispatch across gin/echo/fiber/chi) | 9240 B | 0 B | 102400 B | yes | PASS |
| rest_batch (5 POST + GET + DELETE via chi router) | 504 B | 0 B | 102400 B | yes | PASS |
| route_error_handling (5 unmatched 404 + echo handler error) | 176 B | 0 B | 102400 B | yes | PASS |
| v2.1 retry_workflow (5 flaky handler、 3 attempt で成功) | 5528 B | 0 B | 102400 B | yes | PASS |
| v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch) | -504 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -28.57% |
| p95 | 0.03ms | 0.03ms | -0.01ms | -14.76% |
| p99 | 0.03ms | 0.04ms | -0.00ms | -8.71% |
| mean | 0.01ms | 0.01ms | -0.00ms | -19.67% |
| min | 0.01ms | 0.01ms | -0.00ms | -36.51% |
| max | 0.03ms | 0.04ms | -0.00ms | -7.22% |
| total | 0.18ms | 0.23ms | -0.05ms | -19.67% |

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
| total | 0.44ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +6.24% |
| p95 | 0.03ms | 0.03ms | -0.00ms | -8.61% |
| p99 | 0.03ms | 0.04ms | -0.01ms | -16.96% |
| mean | 0.02ms | 0.02ms | +0.00ms | +0.50% |
| min | 0.02ms | 0.02ms | -0.00ms | -2.19% |
| max | 0.03ms | 0.04ms | -0.01ms | -18.71% |
| total | 0.44ms | 0.44ms | +0.00ms | +0.50% |

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
| total | 0.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +8.79% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +28.06% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +27.62% |
| mean | 0.01ms | 0.01ms | +0.00ms | +9.83% |
| min | 0.01ms | 0.01ms | +0.00ms | +2.44% |
| max | 0.01ms | 0.01ms | +0.00ms | +27.52% |
| total | 0.23ms | 0.21ms | +0.02ms | +9.83% |

### v2.1 retry_workflow (5 flaky handler、 3 attempt で成功)

# Perf Report — v2.1 retry_workflow (5 flaky handler、 3 attempt で成功).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 6.42ms |
| p95 | 6.48ms |
| p99 | 6.49ms |
| mean | 6.21ms |
| stdev | 0.46ms |
| min | 5.06ms |
| max | 6.49ms |
| total | 124.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 6.42ms | 6.09ms | +0.33ms | +5.36% |
| p95 | 6.48ms | 6.70ms | -0.22ms | -3.34% |
| p99 | 6.49ms | 7.35ms | -0.86ms | -11.75% |
| mean | 6.21ms | 6.20ms | +0.01ms | +0.16% |
| min | 5.06ms | 5.63ms | -0.57ms | -10.18% |
| max | 6.49ms | 7.52ms | -1.02ms | -13.62% |
| total | 124.26ms | 124.06ms | +0.20ms | +0.16% |

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
| p50 | 0.01ms | 0.01ms | -0.00ms | -10.98% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +15.46% |
| p99 | 0.01ms | 0.02ms | -0.01ms | -44.59% |
| mean | 0.01ms | 0.01ms | -0.00ms | -12.11% |
| min | 0.01ms | 0.01ms | -0.00ms | -2.89% |
| max | 0.01ms | 0.02ms | -0.01ms | -50.61% |
| total | 0.14ms | 0.16ms | -0.02ms | -12.11% |

