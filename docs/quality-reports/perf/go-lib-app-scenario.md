# Perf Suite — go-lib-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| 4_framework_workflow (10 dispatch across gin/echo/fiber/chi) | 0.03ms | 100ms | PASS | stable |
| rest_batch (5 POST + GET + DELETE via chi router) | 0.03ms | 100ms | PASS | stable |
| route_error_handling (5 unmatched 404 + echo handler error) | 0.01ms | 100ms | PASS | stable |
| v2.1 retry_workflow (5 flaky handler、 3 attempt で成功) | 5.89ms | 200ms | PASS | n/a (baseline seeded) |
| v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch) | 0.02ms | 100ms | PASS | n/a (baseline seeded) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| 4_framework_workflow (10 dispatch across gin/echo/fiber/chi) | 0.03ms | 200ms | PASS |
| rest_batch (5 POST + GET + DELETE via chi router) | 0.27ms | 200ms | PASS |
| route_error_handling (5 unmatched 404 + echo handler error) | 0.05ms | 200ms | PASS |
| v2.1 retry_workflow (5 flaky handler、 3 attempt で成功) | 5.97ms | 400ms | PASS |
| v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch) | 0.03ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| 4_framework_workflow (10 dispatch across gin/echo/fiber/chi) | 175552 B | 0 B | 102400 B | PASS |
| rest_batch (5 POST + GET + DELETE via chi router) | 1390088 B | 0 B | 102400 B | PASS |
| route_error_handling (5 unmatched 404 + echo handler error) | 505144 B | 0 B | 102400 B | PASS |
| v2.1 retry_workflow (5 flaky handler、 3 attempt で成功) | 451568 B | 0 B | 102400 B | PASS |
| v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch) | 923776 B | 0 B | 102400 B | PASS |

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
| p50 | 0.01ms | 0.01ms | -0.00ms | -16.52% |
| p95 | 0.03ms | 0.03ms | +0.00ms | +5.86% |
| p99 | 0.03ms | 0.03ms | +0.00ms | +12.40% |
| mean | 0.01ms | 0.01ms | +0.00ms | +2.93% |
| min | 0.01ms | 0.01ms | +0.00ms | +3.26% |
| max | 0.03ms | 0.03ms | +0.00ms | +14.03% |
| total | 0.19ms | 0.19ms | +0.01ms | +2.93% |

### rest_batch (5 POST + GET + DELETE via chi router)

# Perf Report — rest_batch (5 POST + GET + DELETE via chi router).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.06ms |
| mean | 0.03ms |
| stdev | 0.01ms |
| min | 0.02ms |
| max | 0.07ms |
| total | 0.51ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +20.09% |
| p95 | 0.03ms | 0.03ms | +0.01ms | +30.40% |
| p99 | 0.06ms | 0.03ms | +0.03ms | +113.36% |
| mean | 0.03ms | 0.02ms | +0.01ms | +33.08% |
| min | 0.02ms | 0.01ms | +0.00ms | +28.25% |
| max | 0.07ms | 0.03ms | +0.04ms | +131.76% |
| total | 0.51ms | 0.38ms | +0.13ms | +33.08% |

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
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -11.29% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -7.79% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -14.60% |
| mean | 0.01ms | 0.01ms | -0.00ms | -10.01% |
| min | 0.01ms | 0.01ms | -0.00ms | -10.76% |
| max | 0.01ms | 0.02ms | -0.00ms | -15.97% |
| total | 0.21ms | 0.23ms | -0.02ms | -10.01% |

### v2.1 retry_workflow (5 flaky handler、 3 attempt で成功)

# Perf Report — v2.1 retry_workflow (5 flaky handler、 3 attempt で成功).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 5.80ms |
| p95 | 5.89ms |
| p99 | 5.90ms |
| mean | 5.81ms |
| stdev | 0.06ms |
| min | 5.66ms |
| max | 5.91ms |
| total | 116.14ms |

### v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch)

# Perf Report — v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.17ms |

