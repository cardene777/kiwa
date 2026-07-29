# Perf Suite — go-lib-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00058ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.0012ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| 4_framework_workflow (10 dispatch across gin/echo/fiber/chi) | 0.0054ms | 0.03ms | 100ms | 0.0011ms | PASS | stable — gate 無効 (regressionGate=false) |
| rest_batch (5 POST + GET + DELETE via chi router) | 0.02ms | 0.10ms | 100ms | 0.0011ms | PASS | regressed — gate 無効 (regressionGate=false) |
| route_error_handling (5 unmatched 404 + echo handler error) | 0.01ms | 0.18ms | 100ms | 0.0012ms | PASS | regressed — gate 無効 (regressionGate=false) |
| v2.1 retry_workflow (5 flaky handler、 3 attempt で成功) | 6.05ms | 6.74ms | 200ms | 0.0012ms | PASS | stable — gate 無効 (regressionGate=false) |
| v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch) | 0.0056ms | 0.02ms | 100ms | 0.0012ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| 4_framework_workflow (10 dispatch across gin/echo/fiber/chi) | cpu | 0.08ms | 0.0054ms | 0.064 | 0.063 | 0.0053ms | 0.0052ms |
| rest_batch (5 POST + GET + DELETE via chi router) | cpu | 0.08ms | 0.02ms | 0.296 | 0.184 | 0.02ms | 0.01ms |
| route_error_handling (5 unmatched 404 + echo handler error) | cpu | 0.08ms | 0.01ms | 0.148 | 0.120 | 0.01ms | 0.0098ms |
| v2.1 retry_workflow (5 flaky handler、 3 attempt で成功) | cpu | 0.08ms | 6.05ms | 73.109 | 57.656 | 6.03ms | 4.76ms |
| v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch) | cpu | 0.08ms | 0.0056ms | 0.068 | 0.067 | 0.0057ms | 0.0056ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| 4_framework_workflow (10 dispatch across gin/echo/fiber/chi) | 0.03ms | 200ms | PASS |
| rest_batch (5 POST + GET + DELETE via chi router) | 0.28ms | 200ms | PASS |
| route_error_handling (5 unmatched 404 + echo handler error) | 0.97ms | 200ms | PASS |
| v2.1 retry_workflow (5 flaky handler、 3 attempt で成功) | 6.77ms | 400ms | PASS |
| v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch) | 0.03ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| 4_framework_workflow (10 dispatch across gin/echo/fiber/chi) | 7392 B | 0 B | 102400 B | yes | PASS |
| rest_batch (5 POST + GET + DELETE via chi router) | 1192 B | 0 B | 102400 B | yes | PASS |
| route_error_handling (5 unmatched 404 + echo handler error) | 1008 B | 0 B | 102400 B | yes | PASS |
| v2.1 retry_workflow (5 flaky handler、 3 attempt で成功) | 12888 B | 0 B | 102400 B | yes | PASS |
| v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch) | 11880 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### 4_framework_workflow (10 dispatch across gin/echo/fiber/chi)

# Perf Report — 4_framework_workflow (10 dispatch across gin/echo/fiber/chi).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0054ms |
| p50 | 0.0064ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.0053ms |
| max | 0.04ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0054ms | 0.0052ms | +0.00020ms | +3.94% |
| p50 | 0.0064ms | 0.0057ms | +0.00067ms | +11.73% |
| p95 | 0.03ms | 0.03ms | +0.0033ms | +10.49% |
| p99 | 0.04ms | 0.03ms | +0.0053ms | +16.91% |
| mean | 0.01ms | 0.0087ms | +0.0024ms | +27.68% |
| min | 0.0053ms | 0.0051ms | +0.00021ms | +4.06% |
| max | 0.04ms | 0.03ms | +0.0058ms | +18.52% |
| total | 0.22ms | 0.17ms | +0.05ms | +27.68% |

### rest_batch (5 POST + GET + DELETE via chi router)

# Perf Report — rest_batch (5 POST + GET + DELETE via chi router).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.05ms |
| p95 | 0.10ms |
| p99 | 0.12ms |
| mean | 0.06ms |
| stdev | 0.03ms |
| min | 0.02ms |
| max | 0.13ms |
| total | 1.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.01ms | +0.0096ms | +64.72% |
| p50 | 0.05ms | 0.02ms | +0.04ms | +222.75% |
| p95 | 0.10ms | 0.03ms | +0.07ms | +243.92% |
| p99 | 0.12ms | 0.04ms | +0.09ms | +222.57% |
| mean | 0.06ms | 0.02ms | +0.04ms | +199.78% |
| min | 0.02ms | 0.01ms | +0.0080ms | +57.10% |
| max | 0.13ms | 0.04ms | +0.09ms | +218.67% |
| total | 1.16ms | 0.39ms | +0.77ms | +199.78% |

### route_error_handling (5 unmatched 404 + echo handler error)

# Perf Report — route_error_handling (5 unmatched 404 + echo handler error).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.03ms |
| p95 | 0.18ms |
| p99 | 0.22ms |
| mean | 0.06ms |
| stdev | 0.06ms |
| min | 0.01ms |
| max | 0.23ms |
| total | 1.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.0098ms | +0.0024ms | +24.45% |
| p50 | 0.03ms | 0.010ms | +0.02ms | +190.80% |
| p95 | 0.18ms | 0.01ms | +0.16ms | +1548.50% |
| p99 | 0.22ms | 0.01ms | +0.21ms | +1986.38% |
| mean | 0.06ms | 0.01ms | +0.05ms | +461.73% |
| min | 0.01ms | 0.0097ms | +0.0014ms | +14.60% |
| max | 0.23ms | 0.01ms | +0.22ms | +2095.45% |
| total | 1.13ms | 0.20ms | +0.93ms | +461.73% |

### v2.1 retry_workflow (5 flaky handler、 3 attempt で成功)

# Perf Report — v2.1 retry_workflow (5 flaky handler、 3 attempt で成功).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 6.05ms |
| p50 | 6.41ms |
| p95 | 6.74ms |
| p99 | 7.81ms |
| mean | 6.40ms |
| stdev | 0.54ms |
| min | 5.18ms |
| max | 8.08ms |
| total | 128.01ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 6.05ms | 4.76ms | +1.29ms | +27.18% |
| p50 | 6.41ms | 5.86ms | +0.55ms | +9.43% |
| p95 | 6.74ms | 6.77ms | -0.04ms | -0.55% |
| p99 | 7.81ms | 6.78ms | +1.03ms | +15.24% |
| mean | 6.40ms | 5.81ms | +0.60ms | +10.25% |
| min | 5.18ms | 4.63ms | +0.55ms | +11.96% |
| max | 8.08ms | 6.78ms | +1.30ms | +19.18% |
| total | 128.01ms | 116.10ms | +11.90ms | +10.25% |

### v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch)

# Perf Report — v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0056ms |
| p50 | 0.0059ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0074ms |
| stdev | 0.0037ms |
| min | 0.0055ms |
| max | 0.02ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0056ms | 0.0056ms | +0.000041ms | +0.74% |
| p50 | 0.0059ms | 0.0060ms | -0.00010ms | -1.72% |
| p95 | 0.02ms | 0.03ms | -0.010ms | -38.31% |
| p99 | 0.02ms | 0.13ms | -0.11ms | -85.12% |
| mean | 0.0074ms | 0.01ms | -0.0068ms | -47.94% |
| min | 0.0055ms | 0.0055ms | +0.000042ms | +0.76% |
| max | 0.02ms | 0.15ms | -0.13ms | -87.12% |
| total | 0.15ms | 0.28ms | -0.14ms | -47.94% |

