# Perf Suite — go-lib-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| 4_framework_workflow (10 dispatch across gin/echo/fiber/chi) | 0.0048ms | 0.03ms | 100ms | 0.00049ms | PASS | improved — gate 無効 (regressionGate=false) |
| rest_batch (5 POST + GET + DELETE via chi router) | 0.02ms | 0.04ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| route_error_handling (5 unmatched 404 + echo handler error) | 0.010ms | 0.01ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| v2.1 retry_workflow (5 flaky handler、 3 attempt で成功) | 5.75ms | 5.89ms | 200ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch) | 0.0061ms | 0.02ms | 100ms | 0.00049ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| 4_framework_workflow (10 dispatch across gin/echo/fiber/chi) | 0.02ms | 200ms | PASS |
| rest_batch (5 POST + GET + DELETE via chi router) | 0.08ms | 200ms | PASS |
| route_error_handling (5 unmatched 404 + echo handler error) | 0.05ms | 200ms | PASS |
| v2.1 retry_workflow (5 flaky handler、 3 attempt で成功) | 6.01ms | 400ms | PASS |
| v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch) | 0.04ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| 4_framework_workflow (10 dispatch across gin/echo/fiber/chi) | 8816 B | 0 B | 102400 B | yes | PASS |
| rest_batch (5 POST + GET + DELETE via chi router) | -104 B | 0 B | 102400 B | yes | PASS |
| route_error_handling (5 unmatched 404 + echo handler error) | 120 B | 0 B | 102400 B | yes | PASS |
| v2.1 retry_workflow (5 flaky handler、 3 attempt で成功) | 12856 B | 0 B | 102400 B | yes | PASS |
| v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch) | 7152 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### 4_framework_workflow (10 dispatch across gin/echo/fiber/chi)

# Perf Report — 4_framework_workflow (10 dispatch across gin/echo/fiber/chi).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0048ms |
| p50 | 0.0068ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.0097ms |
| stdev | 0.0081ms |
| min | 0.0047ms |
| max | 0.03ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0048ms | 0.0067ms | -0.0019ms | -28.39% |
| p50 | 0.0068ms | 0.0072ms | -0.00040ms | -5.52% |
| p95 | 0.03ms | 0.03ms | -0.0013ms | -4.10% |
| p99 | 0.03ms | 0.03ms | +0.0019ms | +6.11% |
| mean | 0.0097ms | 0.010ms | -0.00030ms | -3.05% |
| min | 0.0047ms | 0.0067ms | -0.0020ms | -29.82% |
| max | 0.03ms | 0.03ms | +0.0028ms | +8.63% |
| total | 0.19ms | 0.20ms | -0.0061ms | -3.05% |

### rest_batch (5 POST + GET + DELETE via chi router)

# Perf Report — rest_batch (5 POST + GET + DELETE via chi router).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.0053ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.51ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0012ms | -5.64% |
| p50 | 0.02ms | 0.04ms | -0.02ms | -46.24% |
| p95 | 0.04ms | 0.07ms | -0.03ms | -46.78% |
| p99 | 0.04ms | 0.10ms | -0.06ms | -61.57% |
| mean | 0.03ms | 0.04ms | -0.02ms | -41.97% |
| min | 0.02ms | 0.02ms | +0.0035ms | +21.85% |
| max | 0.04ms | 0.10ms | -0.07ms | -64.06% |
| total | 0.51ms | 0.88ms | -0.37ms | -41.97% |

### route_error_handling (5 unmatched 404 + echo handler error)

# Perf Report — route_error_handling (5 unmatched 404 + echo handler error).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.010ms |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0014ms |
| min | 0.0098ms |
| max | 0.02ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.010ms | 0.01ms | -0.00017ms | -1.69% |
| p50 | 0.01ms | 0.02ms | -0.0095ms | -48.52% |
| p95 | 0.01ms | 0.06ms | -0.05ms | -78.48% |
| p99 | 0.02ms | 0.08ms | -0.07ms | -81.85% |
| mean | 0.01ms | 0.03ms | -0.02ms | -58.40% |
| min | 0.0098ms | 0.0099ms | -0.00013ms | -1.26% |
| max | 0.02ms | 0.09ms | -0.07ms | -82.45% |
| total | 0.21ms | 0.52ms | -0.30ms | -58.40% |

### v2.1 retry_workflow (5 flaky handler、 3 attempt で成功)

# Perf Report — v2.1 retry_workflow (5 flaky handler、 3 attempt で成功).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 5.75ms |
| p50 | 5.81ms |
| p95 | 5.89ms |
| p99 | 5.91ms |
| mean | 5.77ms |
| stdev | 0.25ms |
| min | 4.71ms |
| max | 5.92ms |
| total | 115.34ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 5.75ms | 5.31ms | +0.44ms | +8.19% |
| p50 | 5.81ms | 6.38ms | -0.56ms | -8.82% |
| p95 | 5.89ms | 6.80ms | -0.91ms | -13.33% |
| p99 | 5.91ms | 6.85ms | -0.93ms | -13.60% |
| mean | 5.77ms | 6.20ms | -0.43ms | -6.98% |
| min | 4.71ms | 5.06ms | -0.36ms | -7.03% |
| max | 5.92ms | 6.86ms | -0.94ms | -13.67% |
| total | 115.34ms | 123.99ms | -8.66ms | -6.98% |

### v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch)

# Perf Report — v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0061ms |
| p50 | 0.0066ms |
| p95 | 0.02ms |
| p99 | 0.15ms |
| mean | 0.02ms |
| stdev | 0.04ms |
| min | 0.0059ms |
| max | 0.18ms |
| total | 0.31ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0061ms | 0.02ms | -0.01ms | -62.27% |
| p50 | 0.0066ms | 0.02ms | -0.01ms | -60.91% |
| p95 | 0.02ms | 0.02ms | -0.0047ms | -20.43% |
| p99 | 0.15ms | 0.04ms | +0.11ms | +311.55% |
| mean | 0.02ms | 0.02ms | -0.0029ms | -15.90% |
| min | 0.0059ms | 0.02ms | -0.0098ms | -62.33% |
| max | 0.18ms | 0.04ms | +0.14ms | +360.59% |
| total | 0.31ms | 0.37ms | -0.06ms | -15.90% |

