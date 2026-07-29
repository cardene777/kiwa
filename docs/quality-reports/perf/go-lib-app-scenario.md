# Perf Suite — go-lib-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| 4_framework_workflow (10 dispatch across gin/echo/fiber/chi) | 0.0049ms | 0.03ms | 100ms | 0.00042ms | PASS | improved — gate 無効 (regressionGate=false) |
| rest_batch (5 POST + GET + DELETE via chi router) | 0.02ms | 0.03ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| route_error_handling (5 unmatched 404 + echo handler error) | 0.0099ms | 0.01ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| v2.1 retry_workflow (5 flaky handler、 3 attempt で成功) | 6.30ms | 6.56ms | 200ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch) | 0.0057ms | 0.01ms | 100ms | 0.00042ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| 4_framework_workflow (10 dispatch across gin/echo/fiber/chi) | 0.03ms | 200ms | PASS |
| rest_batch (5 POST + GET + DELETE via chi router) | 0.10ms | 200ms | PASS |
| route_error_handling (5 unmatched 404 + echo handler error) | 0.05ms | 200ms | PASS |
| v2.1 retry_workflow (5 flaky handler、 3 attempt で成功) | 6.64ms | 400ms | PASS |
| v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch) | 0.04ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| 4_framework_workflow (10 dispatch across gin/echo/fiber/chi) | 7576 B | 0 B | 102400 B | yes | PASS |
| rest_batch (5 POST + GET + DELETE via chi router) | 984 B | 0 B | 102400 B | yes | PASS |
| route_error_handling (5 unmatched 404 + echo handler error) | 1568 B | 0 B | 102400 B | yes | PASS |
| v2.1 retry_workflow (5 flaky handler、 3 attempt で成功) | 12792 B | 0 B | 102400 B | yes | PASS |
| v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch) | 4056 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### 4_framework_workflow (10 dispatch across gin/echo/fiber/chi)

# Perf Report — 4_framework_workflow (10 dispatch across gin/echo/fiber/chi).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0049ms |
| p50 | 0.0068ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.0099ms |
| stdev | 0.0083ms |
| min | 0.0048ms |
| max | 0.03ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0049ms | 0.0067ms | -0.0019ms | -27.78% |
| p50 | 0.0068ms | 0.0072ms | -0.00038ms | -5.22% |
| p95 | 0.03ms | 0.03ms | +0.00042ms | +1.34% |
| p99 | 0.03ms | 0.03ms | +0.0012ms | +3.62% |
| mean | 0.0099ms | 0.010ms | -0.000065ms | -0.65% |
| min | 0.0048ms | 0.0067ms | -0.0019ms | -28.58% |
| max | 0.03ms | 0.03ms | +0.0013ms | +4.18% |
| total | 0.20ms | 0.20ms | -0.0013ms | -0.65% |

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
| stdev | 0.0044ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.46ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0029ms | -13.31% |
| p50 | 0.02ms | 0.04ms | -0.02ms | -51.05% |
| p95 | 0.03ms | 0.07ms | -0.04ms | -55.90% |
| p99 | 0.03ms | 0.10ms | -0.06ms | -64.51% |
| mean | 0.02ms | 0.04ms | -0.02ms | -47.27% |
| min | 0.02ms | 0.02ms | +0.0030ms | +18.69% |
| max | 0.04ms | 0.10ms | -0.07ms | -65.96% |
| total | 0.46ms | 0.88ms | -0.41ms | -47.27% |

### route_error_handling (5 unmatched 404 + echo handler error)

# Perf Report — route_error_handling (5 unmatched 404 + echo handler error).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0099ms |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0016ms |
| min | 0.0098ms |
| max | 0.02ms |
| total | 0.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0099ms | 0.01ms | -0.00021ms | -2.10% |
| p50 | 0.01ms | 0.02ms | -0.0091ms | -46.19% |
| p95 | 0.01ms | 0.06ms | -0.05ms | -77.61% |
| p99 | 0.02ms | 0.08ms | -0.07ms | -81.75% |
| mean | 0.01ms | 0.03ms | -0.01ms | -56.26% |
| min | 0.0098ms | 0.0099ms | -0.000083ms | -0.84% |
| max | 0.02ms | 0.09ms | -0.07ms | -82.50% |
| total | 0.23ms | 0.52ms | -0.29ms | -56.26% |

### v2.1 retry_workflow (5 flaky handler、 3 attempt で成功)

# Perf Report — v2.1 retry_workflow (5 flaky handler、 3 attempt で成功).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 6.30ms |
| p50 | 6.47ms |
| p95 | 6.56ms |
| p99 | 6.63ms |
| mean | 6.40ms |
| stdev | 0.30ms |
| min | 5.17ms |
| max | 6.65ms |
| total | 127.91ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 6.30ms | 5.31ms | +0.99ms | +18.69% |
| p50 | 6.47ms | 6.38ms | +0.09ms | +1.43% |
| p95 | 6.56ms | 6.80ms | -0.24ms | -3.48% |
| p99 | 6.63ms | 6.85ms | -0.22ms | -3.16% |
| mean | 6.40ms | 6.20ms | +0.20ms | +3.16% |
| min | 5.17ms | 5.06ms | +0.11ms | +2.14% |
| max | 6.65ms | 6.86ms | -0.21ms | -3.08% |
| total | 127.91ms | 123.99ms | +3.91ms | +3.16% |

### v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch)

# Perf Report — v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0057ms |
| p50 | 0.0072ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0083ms |
| stdev | 0.0027ms |
| min | 0.0056ms |
| max | 0.01ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0057ms | 0.02ms | -0.01ms | -65.00% |
| p50 | 0.0072ms | 0.02ms | -0.0098ms | -57.72% |
| p95 | 0.01ms | 0.02ms | -0.0095ms | -41.31% |
| p99 | 0.01ms | 0.04ms | -0.02ms | -60.81% |
| mean | 0.0083ms | 0.02ms | -0.01ms | -54.97% |
| min | 0.0056ms | 0.02ms | -0.01ms | -64.19% |
| max | 0.01ms | 0.04ms | -0.02ms | -63.69% |
| total | 0.17ms | 0.37ms | -0.20ms | -54.97% |

