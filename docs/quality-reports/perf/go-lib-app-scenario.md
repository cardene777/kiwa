# Perf Suite — go-lib-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| 4_framework_workflow (10 dispatch across gin/echo/fiber/chi) | 0.0049ms | 0.03ms | 100ms | 0.00049ms | PASS | improved — gate 無効 (regressionGate=false) |
| rest_batch (5 POST + GET + DELETE via chi router) | 0.02ms | 0.03ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| route_error_handling (5 unmatched 404 + echo handler error) | 0.01ms | 0.01ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| v2.1 retry_workflow (5 flaky handler、 3 attempt で成功) | 5.79ms | 6.00ms | 200ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch) | 0.0055ms | 0.02ms | 100ms | 0.00049ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| 4_framework_workflow (10 dispatch across gin/echo/fiber/chi) | 0.02ms | 200ms | PASS |
| rest_batch (5 POST + GET + DELETE via chi router) | 0.08ms | 200ms | PASS |
| route_error_handling (5 unmatched 404 + echo handler error) | 0.06ms | 200ms | PASS |
| v2.1 retry_workflow (5 flaky handler、 3 attempt で成功) | 6.02ms | 400ms | PASS |
| v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch) | 0.03ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| 4_framework_workflow (10 dispatch across gin/echo/fiber/chi) | 7352 B | 0 B | 102400 B | yes | PASS |
| rest_batch (5 POST + GET + DELETE via chi router) | 984 B | 0 B | 102400 B | yes | PASS |
| route_error_handling (5 unmatched 404 + echo handler error) | 1472 B | 0 B | 102400 B | yes | PASS |
| v2.1 retry_workflow (5 flaky handler、 3 attempt で成功) | 12872 B | 0 B | 102400 B | yes | PASS |
| v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch) | 4088 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### 4_framework_workflow (10 dispatch across gin/echo/fiber/chi)

# Perf Report — 4_framework_workflow (10 dispatch across gin/echo/fiber/chi).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0049ms |
| p50 | 0.0075ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.0079ms |
| min | 0.0049ms |
| max | 0.03ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0049ms | 0.0067ms | -0.0018ms | -27.16% |
| p50 | 0.0075ms | 0.0072ms | +0.00035ms | +4.92% |
| p95 | 0.03ms | 0.03ms | -0.0015ms | -4.82% |
| p99 | 0.03ms | 0.03ms | -0.0011ms | -3.47% |
| mean | 0.01ms | 0.010ms | +0.000033ms | +0.33% |
| min | 0.0049ms | 0.0067ms | -0.0018ms | -26.70% |
| max | 0.03ms | 0.03ms | -0.0010ms | -3.14% |
| total | 0.20ms | 0.20ms | +0.00067ms | +0.33% |

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
| stdev | 0.0037ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.47ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0030ms | -13.52% |
| p50 | 0.02ms | 0.04ms | -0.02ms | -47.72% |
| p95 | 0.03ms | 0.07ms | -0.04ms | -58.08% |
| p99 | 0.03ms | 0.10ms | -0.07ms | -67.65% |
| mean | 0.02ms | 0.04ms | -0.02ms | -46.67% |
| min | 0.02ms | 0.02ms | +0.0026ms | +16.32% |
| max | 0.03ms | 0.10ms | -0.07ms | -69.26% |
| total | 0.47ms | 0.88ms | -0.41ms | -46.67% |

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
| min | 0.01ms |
| max | 0.02ms |
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.00028ms | +2.75% |
| p50 | 0.01ms | 0.02ms | -0.0076ms | -38.77% |
| p95 | 0.01ms | 0.06ms | -0.05ms | -77.16% |
| p99 | 0.02ms | 0.08ms | -0.07ms | -81.48% |
| mean | 0.01ms | 0.03ms | -0.01ms | -52.67% |
| min | 0.01ms | 0.0099ms | +0.00033ms | +3.36% |
| max | 0.02ms | 0.09ms | -0.07ms | -82.26% |
| total | 0.24ms | 0.52ms | -0.27ms | -52.67% |

### v2.1 retry_workflow (5 flaky handler、 3 attempt で成功)

# Perf Report — v2.1 retry_workflow (5 flaky handler、 3 attempt で成功).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 5.79ms |
| p50 | 5.88ms |
| p95 | 6.00ms |
| p99 | 6.05ms |
| mean | 5.88ms |
| stdev | 0.09ms |
| min | 5.70ms |
| max | 6.06ms |
| total | 117.64ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 5.79ms | 5.31ms | +0.48ms | +8.97% |
| p50 | 5.88ms | 6.38ms | -0.50ms | -7.86% |
| p95 | 6.00ms | 6.80ms | -0.79ms | -11.69% |
| p99 | 6.05ms | 6.85ms | -0.80ms | -11.65% |
| mean | 5.88ms | 6.20ms | -0.32ms | -5.12% |
| min | 5.70ms | 5.06ms | +0.64ms | +12.62% |
| max | 6.06ms | 6.86ms | -0.80ms | -11.64% |
| total | 117.64ms | 123.99ms | -6.35ms | -5.12% |

### v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch)

# Perf Report — v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0055ms |
| p50 | 0.0067ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0076ms |
| stdev | 0.0030ms |
| min | 0.0053ms |
| max | 0.02ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0055ms | 0.02ms | -0.01ms | -66.29% |
| p50 | 0.0067ms | 0.02ms | -0.01ms | -60.54% |
| p95 | 0.02ms | 0.02ms | -0.0077ms | -33.65% |
| p99 | 0.02ms | 0.04ms | -0.02ms | -55.62% |
| mean | 0.0076ms | 0.02ms | -0.01ms | -58.86% |
| min | 0.0053ms | 0.02ms | -0.01ms | -66.04% |
| max | 0.02ms | 0.04ms | -0.02ms | -58.86% |
| total | 0.15ms | 0.37ms | -0.22ms | -58.86% |

