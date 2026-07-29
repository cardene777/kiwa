# Perf Suite — go-lib-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| 4_framework_workflow (10 dispatch across gin/echo/fiber/chi) | 0.0049ms | 0.03ms | 100ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |
| rest_batch (5 POST + GET + DELETE via chi router) | 0.02ms | 0.03ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| route_error_handling (5 unmatched 404 + echo handler error) | 0.01ms | 0.01ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| v2.1 retry_workflow (5 flaky handler、 3 attempt で成功) | 5.71ms | 5.98ms | 200ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch) | 0.0053ms | 0.01ms | 100ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| 4_framework_workflow (10 dispatch across gin/echo/fiber/chi) | 0.02ms | 200ms | PASS |
| rest_batch (5 POST + GET + DELETE via chi router) | 0.07ms | 200ms | PASS |
| route_error_handling (5 unmatched 404 + echo handler error) | 0.05ms | 200ms | PASS |
| v2.1 retry_workflow (5 flaky handler、 3 attempt で成功) | 5.98ms | 400ms | PASS |
| v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch) | 0.03ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| 4_framework_workflow (10 dispatch across gin/echo/fiber/chi) | 7392 B | 0 B | 102400 B | yes | PASS |
| rest_batch (5 POST + GET + DELETE via chi router) | 1160 B | 0 B | 102400 B | yes | PASS |
| route_error_handling (5 unmatched 404 + echo handler error) | 976 B | 0 B | 102400 B | yes | PASS |
| v2.1 retry_workflow (5 flaky handler、 3 attempt で成功) | 12856 B | 0 B | 102400 B | yes | PASS |
| v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch) | 6504 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### 4_framework_workflow (10 dispatch across gin/echo/fiber/chi)

# Perf Report — 4_framework_workflow (10 dispatch across gin/echo/fiber/chi).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0049ms |
| p50 | 0.0065ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.0093ms |
| stdev | 0.0074ms |
| min | 0.0048ms |
| max | 0.03ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0049ms | 0.0067ms | -0.0018ms | -27.29% |
| p50 | 0.0065ms | 0.0072ms | -0.00067ms | -9.29% |
| p95 | 0.03ms | 0.03ms | -0.0031ms | -9.75% |
| p99 | 0.03ms | 0.03ms | -0.0015ms | -4.76% |
| mean | 0.0093ms | 0.010ms | -0.00065ms | -6.55% |
| min | 0.0048ms | 0.0067ms | -0.0019ms | -27.95% |
| max | 0.03ms | 0.03ms | -0.0011ms | -3.53% |
| total | 0.19ms | 0.20ms | -0.01ms | -6.55% |

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
| max | 0.03ms |
| total | 0.43ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0056ms | -25.16% |
| p50 | 0.02ms | 0.04ms | -0.02ms | -51.81% |
| p95 | 0.03ms | 0.07ms | -0.04ms | -58.25% |
| p99 | 0.03ms | 0.10ms | -0.07ms | -68.26% |
| mean | 0.02ms | 0.04ms | -0.02ms | -51.37% |
| min | 0.02ms | 0.02ms | +0.00063ms | +3.95% |
| max | 0.03ms | 0.10ms | -0.07ms | -69.94% |
| total | 0.43ms | 0.88ms | -0.45ms | -51.37% |

### route_error_handling (5 unmatched 404 + echo handler error)

# Perf Report — route_error_handling (5 unmatched 404 + echo handler error).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0016ms |
| min | 0.0096ms |
| max | 0.02ms |
| total | 0.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.000055ms | -0.54% |
| p50 | 0.01ms | 0.02ms | -0.0087ms | -44.07% |
| p95 | 0.01ms | 0.06ms | -0.05ms | -78.98% |
| p99 | 0.02ms | 0.08ms | -0.07ms | -80.44% |
| mean | 0.01ms | 0.03ms | -0.01ms | -56.02% |
| min | 0.0096ms | 0.0099ms | -0.00033ms | -3.37% |
| max | 0.02ms | 0.09ms | -0.07ms | -80.71% |
| total | 0.23ms | 0.52ms | -0.29ms | -56.02% |

### v2.1 retry_workflow (5 flaky handler、 3 attempt で成功)

# Perf Report — v2.1 retry_workflow (5 flaky handler、 3 attempt で成功).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 5.71ms |
| p50 | 5.82ms |
| p95 | 5.98ms |
| p99 | 5.98ms |
| mean | 5.83ms |
| stdev | 0.09ms |
| min | 5.64ms |
| max | 5.99ms |
| total | 116.64ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 5.71ms | 5.31ms | +0.40ms | +7.55% |
| p50 | 5.82ms | 6.38ms | -0.55ms | -8.69% |
| p95 | 5.98ms | 6.80ms | -0.82ms | -12.07% |
| p99 | 5.98ms | 6.85ms | -0.86ms | -12.58% |
| mean | 5.83ms | 6.20ms | -0.37ms | -5.93% |
| min | 5.64ms | 5.06ms | +0.57ms | +11.32% |
| max | 5.99ms | 6.86ms | -0.87ms | -12.71% |
| total | 116.64ms | 123.99ms | -7.36ms | -5.93% |

### v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch)

# Perf Report — v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0053ms |
| p50 | 0.0059ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0070ms |
| stdev | 0.0023ms |
| min | 0.0053ms |
| max | 0.01ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0053ms | 0.02ms | -0.01ms | -67.09% |
| p50 | 0.0059ms | 0.02ms | -0.01ms | -65.08% |
| p95 | 0.01ms | 0.02ms | -0.01ms | -45.09% |
| p99 | 0.01ms | 0.04ms | -0.02ms | -64.58% |
| mean | 0.0070ms | 0.02ms | -0.01ms | -62.27% |
| min | 0.0053ms | 0.02ms | -0.01ms | -66.58% |
| max | 0.01ms | 0.04ms | -0.03ms | -67.45% |
| total | 0.14ms | 0.37ms | -0.23ms | -62.27% |

