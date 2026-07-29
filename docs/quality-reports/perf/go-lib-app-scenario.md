# Perf Suite — go-lib-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| 4_framework_workflow (10 dispatch across gin/echo/fiber/chi) | 0.0050ms | 0.03ms | 100ms | 0.00049ms | PASS | improved — gate 無効 (regressionGate=false) |
| rest_batch (5 POST + GET + DELETE via chi router) | 0.02ms | 0.03ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| route_error_handling (5 unmatched 404 + echo handler error) | 0.0097ms | 0.01ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| v2.1 retry_workflow (5 flaky handler、 3 attempt で成功) | 4.89ms | 6.04ms | 200ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch) | 0.0063ms | 0.08ms | 100ms | 0.00049ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| 4_framework_workflow (10 dispatch across gin/echo/fiber/chi) | 0.02ms | 200ms | PASS |
| rest_batch (5 POST + GET + DELETE via chi router) | 0.07ms | 200ms | PASS |
| route_error_handling (5 unmatched 404 + echo handler error) | 0.05ms | 200ms | PASS |
| v2.1 retry_workflow (5 flaky handler、 3 attempt で成功) | 6.03ms | 400ms | PASS |
| v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch) | 0.04ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| 4_framework_workflow (10 dispatch across gin/echo/fiber/chi) | 8800 B | 0 B | 102400 B | yes | PASS |
| rest_batch (5 POST + GET + DELETE via chi router) | 888 B | 0 B | 102400 B | yes | PASS |
| route_error_handling (5 unmatched 404 + echo handler error) | 1424 B | 0 B | 102400 B | yes | PASS |
| v2.1 retry_workflow (5 flaky handler、 3 attempt で成功) | 11784 B | -175 B | 102400 B | yes | PASS |
| v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch) | 5968 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### 4_framework_workflow (10 dispatch across gin/echo/fiber/chi)

# Perf Report — 4_framework_workflow (10 dispatch across gin/echo/fiber/chi).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0050ms |
| p50 | 0.0066ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.0095ms |
| stdev | 0.0073ms |
| min | 0.0049ms |
| max | 0.03ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0050ms | 0.0067ms | -0.0018ms | -26.11% |
| p50 | 0.0066ms | 0.0072ms | -0.00056ms | -7.83% |
| p95 | 0.03ms | 0.03ms | -0.0034ms | -10.91% |
| p99 | 0.03ms | 0.03ms | -0.0011ms | -3.42% |
| mean | 0.0095ms | 0.010ms | -0.00046ms | -4.66% |
| min | 0.0049ms | 0.0067ms | -0.0018ms | -27.33% |
| max | 0.03ms | 0.03ms | -0.00050ms | -1.57% |
| total | 0.19ms | 0.20ms | -0.0093ms | -4.66% |

### rest_batch (5 POST + GET + DELETE via chi router)

# Perf Report — rest_batch (5 POST + GET + DELETE via chi router).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0043ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.46ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0032ms | -14.35% |
| p50 | 0.02ms | 0.04ms | -0.02ms | -50.62% |
| p95 | 0.03ms | 0.07ms | -0.04ms | -58.10% |
| p99 | 0.03ms | 0.10ms | -0.06ms | -64.62% |
| mean | 0.02ms | 0.04ms | -0.02ms | -47.58% |
| min | 0.02ms | 0.02ms | +0.0020ms | +12.63% |
| max | 0.04ms | 0.10ms | -0.07ms | -65.71% |
| total | 0.46ms | 0.88ms | -0.42ms | -47.58% |

### route_error_handling (5 unmatched 404 + echo handler error)

# Perf Report — route_error_handling (5 unmatched 404 + echo handler error).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0097ms |
| p50 | 0.0099ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.01ms |
| stdev | 0.0013ms |
| min | 0.0095ms |
| max | 0.01ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0097ms | 0.01ms | -0.00042ms | -4.12% |
| p50 | 0.0099ms | 0.02ms | -0.0097ms | -49.58% |
| p95 | 0.01ms | 0.06ms | -0.05ms | -78.43% |
| p99 | 0.01ms | 0.08ms | -0.07ms | -82.68% |
| mean | 0.01ms | 0.03ms | -0.02ms | -59.45% |
| min | 0.0095ms | 0.0099ms | -0.00042ms | -4.20% |
| max | 0.01ms | 0.09ms | -0.07ms | -83.44% |
| total | 0.21ms | 0.52ms | -0.31ms | -59.45% |

### v2.1 retry_workflow (5 flaky handler、 3 attempt で成功)

# Perf Report — v2.1 retry_workflow (5 flaky handler、 3 attempt で成功).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 4.89ms |
| p50 | 5.84ms |
| p95 | 6.04ms |
| p99 | 6.38ms |
| mean | 5.69ms |
| stdev | 0.45ms |
| min | 4.78ms |
| max | 6.46ms |
| total | 113.77ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 4.89ms | 5.31ms | -0.42ms | -7.97% |
| p50 | 5.84ms | 6.38ms | -0.54ms | -8.49% |
| p95 | 6.04ms | 6.80ms | -0.76ms | -11.12% |
| p99 | 6.38ms | 6.85ms | -0.47ms | -6.87% |
| mean | 5.69ms | 6.20ms | -0.51ms | -8.24% |
| min | 4.78ms | 5.06ms | -0.29ms | -5.64% |
| max | 6.46ms | 6.86ms | -0.40ms | -5.82% |
| total | 113.77ms | 123.99ms | -10.22ms | -8.24% |

### v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch)

# Perf Report — v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0063ms |
| p50 | 0.02ms |
| p95 | 0.08ms |
| p99 | 0.09ms |
| mean | 0.03ms |
| stdev | 0.03ms |
| min | 0.0059ms |
| max | 0.09ms |
| total | 0.57ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0063ms | 0.02ms | -0.0099ms | -60.93% |
| p50 | 0.02ms | 0.02ms | -0.0019ms | -10.91% |
| p95 | 0.08ms | 0.02ms | +0.06ms | +247.35% |
| p99 | 0.09ms | 0.04ms | +0.06ms | +154.72% |
| mean | 0.03ms | 0.02ms | +0.01ms | +55.95% |
| min | 0.0059ms | 0.02ms | -0.0098ms | -62.60% |
| max | 0.09ms | 0.04ms | +0.05ms | +141.04% |
| total | 0.57ms | 0.37ms | +0.21ms | +55.95% |

