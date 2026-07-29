# Perf Suite — go-lib-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| 4_framework_workflow (10 dispatch across gin/echo/fiber/chi) | 0.0066ms | 0.03ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| rest_batch (5 POST + GET + DELETE via chi router) | 0.02ms | 0.03ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| route_error_handling (5 unmatched 404 + echo handler error) | 0.01ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| v2.1 retry_workflow (5 flaky handler、 3 attempt で成功) | 5.59ms | 5.90ms | 200ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch) | 0.0054ms | 0.0094ms | 100ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| 4_framework_workflow (10 dispatch across gin/echo/fiber/chi) | 0.02ms | 200ms | PASS |
| rest_batch (5 POST + GET + DELETE via chi router) | 0.08ms | 200ms | PASS |
| route_error_handling (5 unmatched 404 + echo handler error) | 0.05ms | 200ms | PASS |
| v2.1 retry_workflow (5 flaky handler、 3 attempt で成功) | 6.06ms | 400ms | PASS |
| v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch) | 0.04ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| 4_framework_workflow (10 dispatch across gin/echo/fiber/chi) | 8416 B | 0 B | 102400 B | yes | PASS |
| rest_batch (5 POST + GET + DELETE via chi router) | 984 B | 0 B | 102400 B | yes | PASS |
| route_error_handling (5 unmatched 404 + echo handler error) | 728 B | 0 B | 102400 B | yes | PASS |
| v2.1 retry_workflow (5 flaky handler、 3 attempt で成功) | 12872 B | 0 B | 102400 B | yes | PASS |
| v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch) | 4512 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### 4_framework_workflow (10 dispatch across gin/echo/fiber/chi)

# Perf Report — 4_framework_workflow (10 dispatch across gin/echo/fiber/chi).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0066ms |
| p50 | 0.0069ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.0073ms |
| min | 0.0056ms |
| max | 0.03ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0066ms | 0.0067ms | -0.00013ms | -1.91% |
| p50 | 0.0069ms | 0.0072ms | -0.00033ms | -4.65% |
| p95 | 0.03ms | 0.03ms | -0.0016ms | -5.22% |
| p99 | 0.03ms | 0.03ms | -0.0012ms | -3.86% |
| mean | 0.01ms | 0.010ms | +0.000096ms | +0.96% |
| min | 0.0056ms | 0.0067ms | -0.0011ms | -16.77% |
| max | 0.03ms | 0.03ms | -0.0011ms | -3.53% |
| total | 0.20ms | 0.20ms | +0.0019ms | +0.96% |

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
| stdev | 0.0056ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.43ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0055ms | -24.97% |
| p50 | 0.02ms | 0.04ms | -0.02ms | -55.42% |
| p95 | 0.03ms | 0.07ms | -0.04ms | -53.62% |
| p99 | 0.03ms | 0.10ms | -0.06ms | -64.11% |
| mean | 0.02ms | 0.04ms | -0.02ms | -50.49% |
| min | 0.02ms | 0.02ms | +0.00063ms | +3.95% |
| max | 0.04ms | 0.10ms | -0.07ms | -65.87% |
| total | 0.43ms | 0.88ms | -0.44ms | -50.49% |

### route_error_handling (5 unmatched 404 + echo handler error)

# Perf Report — route_error_handling (5 unmatched 404 + echo handler error).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0023ms |
| min | 0.0095ms |
| max | 0.02ms |
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | 0.00ms | 0.00% |
| p50 | 0.01ms | 0.02ms | -0.0085ms | -43.32% |
| p95 | 0.02ms | 0.06ms | -0.05ms | -76.00% |
| p99 | 0.02ms | 0.08ms | -0.06ms | -77.67% |
| mean | 0.01ms | 0.03ms | -0.01ms | -54.21% |
| min | 0.0095ms | 0.0099ms | -0.00038ms | -3.78% |
| max | 0.02ms | 0.09ms | -0.07ms | -77.97% |
| total | 0.24ms | 0.52ms | -0.28ms | -54.21% |

### v2.1 retry_workflow (5 flaky handler、 3 attempt で成功)

# Perf Report — v2.1 retry_workflow (5 flaky handler、 3 attempt で成功).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 5.59ms |
| p50 | 5.80ms |
| p95 | 5.90ms |
| p99 | 5.92ms |
| mean | 5.71ms |
| stdev | 0.35ms |
| min | 4.67ms |
| max | 5.93ms |
| total | 114.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 5.59ms | 5.31ms | +0.28ms | +5.19% |
| p50 | 5.80ms | 6.38ms | -0.58ms | -9.08% |
| p95 | 5.90ms | 6.80ms | -0.90ms | -13.22% |
| p99 | 5.92ms | 6.85ms | -0.93ms | -13.52% |
| mean | 5.71ms | 6.20ms | -0.49ms | -7.98% |
| min | 4.67ms | 5.06ms | -0.39ms | -7.78% |
| max | 5.93ms | 6.86ms | -0.93ms | -13.59% |
| total | 114.10ms | 123.99ms | -9.89ms | -7.98% |

### v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch)

# Perf Report — v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0054ms |
| p50 | 0.0065ms |
| p95 | 0.0094ms |
| p99 | 0.01ms |
| mean | 0.0069ms |
| stdev | 0.0021ms |
| min | 0.0053ms |
| max | 0.01ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0054ms | 0.02ms | -0.01ms | -66.57% |
| p50 | 0.0065ms | 0.02ms | -0.01ms | -61.76% |
| p95 | 0.0094ms | 0.02ms | -0.01ms | -59.04% |
| p99 | 0.01ms | 0.04ms | -0.02ms | -62.44% |
| mean | 0.0069ms | 0.02ms | -0.01ms | -62.50% |
| min | 0.0053ms | 0.02ms | -0.01ms | -66.05% |
| max | 0.01ms | 0.04ms | -0.02ms | -62.94% |
| total | 0.14ms | 0.37ms | -0.23ms | -62.50% |

