# Perf Suite — go-lib-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| 4_framework_workflow (10 dispatch across gin/echo/fiber/chi) | 0.0067ms | 0.03ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| rest_batch (5 POST + GET + DELETE via chi router) | 0.02ms | 0.03ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| route_error_handling (5 unmatched 404 + echo handler error) | 0.0094ms | 0.02ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| v2.1 retry_workflow (5 flaky handler、 3 attempt で成功) | 6.42ms | 6.79ms | 200ms | 0.00042ms | PASS | regressed — gate 無効 (regressionGate=false) |
| v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch) | 0.0056ms | 0.01ms | 100ms | 0.00042ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| 4_framework_workflow (10 dispatch across gin/echo/fiber/chi) | 0.02ms | 200ms | PASS |
| rest_batch (5 POST + GET + DELETE via chi router) | 0.08ms | 200ms | PASS |
| route_error_handling (5 unmatched 404 + echo handler error) | 0.05ms | 200ms | PASS |
| v2.1 retry_workflow (5 flaky handler、 3 attempt で成功) | 6.66ms | 400ms | PASS |
| v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch) | 0.03ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| 4_framework_workflow (10 dispatch across gin/echo/fiber/chi) | -2896 B | 0 B | 102400 B | yes | PASS |
| rest_batch (5 POST + GET + DELETE via chi router) | 1064 B | 0 B | 102400 B | yes | PASS |
| route_error_handling (5 unmatched 404 + echo handler error) | 280 B | 0 B | 102400 B | yes | PASS |
| v2.1 retry_workflow (5 flaky handler、 3 attempt で成功) | 12504 B | -171 B | 102400 B | yes | PASS |
| v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch) | 3648 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### 4_framework_workflow (10 dispatch across gin/echo/fiber/chi)

# Perf Report — 4_framework_workflow (10 dispatch across gin/echo/fiber/chi).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0067ms |
| p50 | 0.0070ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.0074ms |
| min | 0.0057ms |
| max | 0.03ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0067ms | 0.0067ms | -0.000084ms | -1.24% |
| p50 | 0.0070ms | 0.0072ms | -0.00023ms | -3.20% |
| p95 | 0.03ms | 0.03ms | -0.0016ms | -5.16% |
| p99 | 0.03ms | 0.03ms | -0.00032ms | -1.02% |
| mean | 0.01ms | 0.010ms | +0.00013ms | +1.27% |
| min | 0.0057ms | 0.0067ms | -0.00096ms | -14.28% |
| max | 0.03ms | 0.03ms | 0.00ms | 0.00% |
| total | 0.20ms | 0.20ms | +0.0025ms | +1.27% |

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
| p10 | 0.02ms | 0.02ms | -0.0030ms | -13.75% |
| p50 | 0.02ms | 0.04ms | -0.02ms | -49.24% |
| p95 | 0.03ms | 0.07ms | -0.04ms | -56.29% |
| p99 | 0.03ms | 0.10ms | -0.07ms | -67.74% |
| mean | 0.02ms | 0.04ms | -0.02ms | -46.38% |
| min | 0.02ms | 0.02ms | +0.0026ms | +16.58% |
| max | 0.03ms | 0.10ms | -0.07ms | -69.66% |
| total | 0.47ms | 0.88ms | -0.41ms | -46.38% |

### route_error_handling (5 unmatched 404 + echo handler error)

# Perf Report — route_error_handling (5 unmatched 404 + echo handler error).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0094ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0025ms |
| min | 0.0092ms |
| max | 0.02ms |
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0094ms | 0.01ms | -0.00068ms | -6.67% |
| p50 | 0.01ms | 0.02ms | -0.0081ms | -41.31% |
| p95 | 0.02ms | 0.06ms | -0.05ms | -74.75% |
| p99 | 0.02ms | 0.08ms | -0.07ms | -78.92% |
| mean | 0.01ms | 0.03ms | -0.01ms | -53.12% |
| min | 0.0092ms | 0.0099ms | -0.00067ms | -6.73% |
| max | 0.02ms | 0.09ms | -0.07ms | -79.67% |
| total | 0.24ms | 0.52ms | -0.27ms | -53.12% |

### v2.1 retry_workflow (5 flaky handler、 3 attempt で成功)

# Perf Report — v2.1 retry_workflow (5 flaky handler、 3 attempt で成功).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 6.42ms |
| p50 | 6.57ms |
| p95 | 6.79ms |
| p99 | 6.79ms |
| mean | 6.58ms |
| stdev | 0.12ms |
| min | 6.32ms |
| max | 6.79ms |
| total | 131.64ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 6.42ms | 5.31ms | +1.11ms | +20.93% |
| p50 | 6.57ms | 6.38ms | +0.20ms | +3.09% |
| p95 | 6.79ms | 6.80ms | -0.0060ms | -0.09% |
| p99 | 6.79ms | 6.85ms | -0.05ms | -0.79% |
| mean | 6.58ms | 6.20ms | +0.38ms | +6.17% |
| min | 6.32ms | 5.06ms | +1.26ms | +24.80% |
| max | 6.79ms | 6.86ms | -0.07ms | -0.97% |
| total | 131.64ms | 123.99ms | +7.65ms | +6.17% |

### v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch)

# Perf Report — v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0056ms |
| p50 | 0.0066ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0071ms |
| stdev | 0.0021ms |
| min | 0.0055ms |
| max | 0.01ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0056ms | 0.02ms | -0.01ms | -65.54% |
| p50 | 0.0066ms | 0.02ms | -0.01ms | -61.03% |
| p95 | 0.01ms | 0.02ms | -0.01ms | -55.48% |
| p99 | 0.01ms | 0.04ms | -0.02ms | -60.95% |
| mean | 0.0071ms | 0.02ms | -0.01ms | -61.53% |
| min | 0.0055ms | 0.02ms | -0.01ms | -65.25% |
| max | 0.01ms | 0.04ms | -0.02ms | -61.76% |
| total | 0.14ms | 0.37ms | -0.23ms | -61.53% |

