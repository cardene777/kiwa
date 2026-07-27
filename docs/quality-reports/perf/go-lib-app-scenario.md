# Perf Suite — go-lib-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| 4_framework_workflow (10 dispatch across gin/echo/fiber/chi) | 0.04ms | 100ms | PASS | stable |
| rest_batch (5 POST + GET + DELETE via chi router) | 0.03ms | 100ms | PASS | stable |
| route_error_handling (5 unmatched 404 + echo handler error) | 0.13ms | 100ms | PASS | stable |
| v2.1 retry_workflow (5 flaky handler、 3 attempt で成功) | 6.71ms | 200ms | PASS | stable |
| v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch) | 0.01ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| 4_framework_workflow (10 dispatch across gin/echo/fiber/chi) | 0.03ms | 200ms | PASS |
| rest_batch (5 POST + GET + DELETE via chi router) | 0.12ms | 200ms | PASS |
| route_error_handling (5 unmatched 404 + echo handler error) | 0.28ms | 200ms | PASS |
| v2.1 retry_workflow (5 flaky handler、 3 attempt で成功) | 6.61ms | 400ms | PASS |
| v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch) | 0.04ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| 4_framework_workflow (10 dispatch across gin/echo/fiber/chi) | 16688 B | -15065 B | 102400 B | yes | PASS |
| rest_batch (5 POST + GET + DELETE via chi router) | 680 B | 0 B | 102400 B | yes | PASS |
| route_error_handling (5 unmatched 404 + echo handler error) | 1224 B | 0 B | 102400 B | yes | PASS |
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
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.04ms |
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +11.23% |
| p95 | 0.04ms | 0.03ms | +0.00ms | +5.72% |
| p99 | 0.04ms | 0.04ms | +0.01ms | +19.27% |
| mean | 0.01ms | 0.01ms | +0.00ms | +10.12% |
| min | 0.01ms | 0.01ms | +0.00ms | +3.71% |
| max | 0.04ms | 0.04ms | +0.01ms | +22.60% |
| total | 0.25ms | 0.23ms | +0.02ms | +10.12% |

### rest_batch (5 POST + GET + DELETE via chi router)

# Perf Report — rest_batch (5 POST + GET + DELETE via chi router).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.03ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.00ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.54ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.02ms | +0.01ms | +27.34% |
| p95 | 0.03ms | 0.03ms | +0.00ms | +10.37% |
| p99 | 0.04ms | 0.04ms | +0.00ms | +0.19% |
| mean | 0.03ms | 0.02ms | +0.00ms | +22.47% |
| min | 0.02ms | 0.02ms | +0.00ms | +23.68% |
| max | 0.04ms | 0.04ms | -0.00ms | -1.95% |
| total | 0.54ms | 0.44ms | +0.10ms | +22.47% |

### route_error_handling (5 unmatched 404 + echo handler error)

# Perf Report — route_error_handling (5 unmatched 404 + echo handler error).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.13ms |
| p99 | 0.17ms |
| mean | 0.02ms |
| stdev | 0.05ms |
| min | 0.01ms |
| max | 0.18ms |
| total | 0.49ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -4.99% |
| p95 | 0.13ms | 0.01ms | +0.12ms | +1091.76% |
| p99 | 0.17ms | 0.01ms | +0.16ms | +1425.70% |
| mean | 0.02ms | 0.01ms | +0.01ms | +134.70% |
| min | 0.01ms | 0.01ms | -0.00ms | -4.91% |
| max | 0.18ms | 0.01ms | +0.17ms | +1508.59% |
| total | 0.49ms | 0.21ms | +0.28ms | +134.70% |

### v2.1 retry_workflow (5 flaky handler、 3 attempt で成功)

# Perf Report — v2.1 retry_workflow (5 flaky handler、 3 attempt で成功).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 6.13ms |
| p95 | 6.71ms |
| p99 | 7.00ms |
| mean | 6.03ms |
| stdev | 0.48ms |
| min | 5.03ms |
| max | 7.08ms |
| total | 120.56ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 6.13ms | 6.09ms | +0.04ms | +0.74% |
| p95 | 6.71ms | 6.70ms | +0.00ms | +0.05% |
| p99 | 7.00ms | 7.35ms | -0.35ms | -4.75% |
| mean | 6.03ms | 6.20ms | -0.17ms | -2.82% |
| min | 5.03ms | 5.63ms | -0.60ms | -10.67% |
| max | 7.08ms | 7.52ms | -0.44ms | -5.82% |
| total | 120.56ms | 124.06ms | -3.49ms | -2.82% |

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
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +3.06% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +40.98% |
| p99 | 0.01ms | 0.02ms | -0.01ms | -32.97% |
| mean | 0.01ms | 0.01ms | +0.00ms | +1.20% |
| min | 0.01ms | 0.01ms | +0.00ms | +8.70% |
| max | 0.01ms | 0.02ms | -0.01ms | -40.38% |
| total | 0.16ms | 0.16ms | +0.00ms | +1.20% |

