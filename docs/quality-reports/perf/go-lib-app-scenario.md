# Perf Suite — go-lib-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| 4_framework_workflow (10 dispatch across gin/echo/fiber/chi) | 0.07ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +3386%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| rest_batch (5 POST + GET + DELETE via chi router) | 0.08ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +2141%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| route_error_handling (5 unmatched 404 + echo handler error) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +3559%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| v2.1 retry_workflow (5 flaky handler、 3 attempt で成功) | 47.48ms | 200ms | PASS | regressed — gate 無効 (regressionGate=false) |
| v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +5909%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| 4_framework_workflow (10 dispatch across gin/echo/fiber/chi) | 0.06ms | 200ms | PASS |
| rest_batch (5 POST + GET + DELETE via chi router) | 0.08ms | 200ms | PASS |
| route_error_handling (5 unmatched 404 + echo handler error) | 0.06ms | 200ms | PASS |
| v2.1 retry_workflow (5 flaky handler、 3 attempt で成功) | 49.95ms | 400ms | PASS |
| v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch) | 0.04ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| 4_framework_workflow (10 dispatch across gin/echo/fiber/chi) | 8248 B | 0 B | 102400 B | yes | PASS |
| rest_batch (5 POST + GET + DELETE via chi router) | -440 B | 0 B | 102400 B | yes | PASS |
| route_error_handling (5 unmatched 404 + echo handler error) | 10592 B | 0 B | 102400 B | yes | PASS |
| v2.1 retry_workflow (5 flaky handler、 3 attempt で成功) | 13272 B | -172 B | 102400 B | yes | PASS |
| v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch) | -14792 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### 4_framework_workflow (10 dispatch across gin/echo/fiber/chi)

# Perf Report — 4_framework_workflow (10 dispatch across gin/echo/fiber/chi).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.07ms |
| p99 | 0.49ms |
| mean | 0.04ms |
| stdev | 0.13ms |
| min | 0.01ms |
| max | 0.59ms |
| total | 0.76ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -15.84% |
| p95 | 0.07ms | 0.01ms | +0.05ms | +365.14% |
| p99 | 0.49ms | 0.03ms | +0.46ms | +1737.07% |
| mean | 0.04ms | 0.01ms | +0.03ms | +343.50% |
| min | 0.01ms | 0.01ms | +0.00ms | +17.87% |
| max | 0.59ms | 0.11ms | +0.49ms | +452.91% |
| total | 0.76ms | 1.71ms | -0.95ms | -55.65% |

### rest_batch (5 POST + GET + DELETE via chi router)

# Perf Report — rest_batch (5 POST + GET + DELETE via chi router).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.08ms |
| p99 | 0.84ms |
| mean | 0.07ms |
| stdev | 0.23ms |
| min | 0.02ms |
| max | 1.03ms |
| total | 1.42ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +9.66% |
| p95 | 0.08ms | 0.02ms | +0.06ms | +247.45% |
| p99 | 0.84ms | 0.03ms | +0.81ms | +2572.28% |
| mean | 0.07ms | 0.02ms | +0.05ms | +297.77% |
| min | 0.02ms | 0.01ms | +0.01ms | +43.25% |
| max | 1.03ms | 0.15ms | +0.88ms | +589.44% |
| total | 1.42ms | 3.57ms | -2.15ms | -60.22% |

### route_error_handling (5 unmatched 404 + echo handler error)

# Perf Report — route_error_handling (5 unmatched 404 + echo handler error).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -7.40% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -12.11% |
| p99 | 0.02ms | 0.03ms | -0.01ms | -41.05% |
| mean | 0.01ms | 0.05ms | -0.04ms | -78.13% |
| min | 0.01ms | 0.01ms | -0.00ms | -1.99% |
| max | 0.02ms | 7.74ms | -7.73ms | -99.80% |
| total | 0.22ms | 10.11ms | -9.89ms | -97.81% |

### v2.1 retry_workflow (5 flaky handler、 3 attempt で成功)

# Perf Report — v2.1 retry_workflow (5 flaky handler、 3 attempt で成功).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 14.21ms |
| p95 | 47.48ms |
| p99 | 79.31ms |
| mean | 20.43ms |
| stdev | 17.97ms |
| min | 7.27ms |
| max | 87.26ms |
| total | 408.57ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 14.21ms | 7.11ms | +7.10ms | +99.75% |
| p95 | 47.48ms | 14.81ms | +32.67ms | +220.64% |
| p99 | 79.31ms | 30.08ms | +49.23ms | +163.68% |
| mean | 20.43ms | 8.60ms | +11.83ms | +137.46% |
| min | 7.27ms | 4.26ms | +3.01ms | +70.71% |
| max | 87.26ms | 47.81ms | +39.45ms | +82.52% |
| total | 408.57ms | 1720.55ms | -1311.98ms | -76.25% |

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
| max | 0.02ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +27.22% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +15.73% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -3.56% |
| mean | 0.01ms | 0.01ms | +0.00ms | +23.45% |
| min | 0.01ms | 0.00ms | +0.00ms | +36.14% |
| max | 0.02ms | 0.02ms | -0.01ms | -32.84% |
| total | 0.15ms | 1.25ms | -1.10ms | -87.66% |

