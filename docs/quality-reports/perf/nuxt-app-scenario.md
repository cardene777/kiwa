# Perf Suite — nuxt-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| event_handler_workflow (10 invokeEventHandler) | 0.0081ms | 0.02ms | 100ms | 0.00050ms | PASS | stable (p10 -5% (閾値未満)、 p95 +45% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| middleware_chain (5 invokeRouteMiddleware) | 0.0026ms | 0.0044ms | 100ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |
| handler_error_handling (5 throw + catch) | 0.01ms | 0.03ms | 100ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| event_handler_workflow (10 invokeEventHandler) | 0.05ms | 200ms | PASS |
| middleware_chain (5 invokeRouteMiddleware) | 0.01ms | 200ms | PASS |
| handler_error_handling (5 throw + catch) | 0.08ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| event_handler_workflow (10 invokeEventHandler) | 6880 B | 0 B | 102400 B | yes | PASS |
| middleware_chain (5 invokeRouteMiddleware) | 5720 B | 0 B | 102400 B | yes | PASS |
| handler_error_handling (5 throw + catch) | 1344 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### event_handler_workflow (10 invokeEventHandler)

# Perf Report — event_handler_workflow (10 invokeEventHandler).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0081ms |
| p50 | 0.0093ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0035ms |
| min | 0.0081ms |
| max | 0.02ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0081ms | 0.0085ms | -0.00041ms | -4.83% |
| p50 | 0.0093ms | 0.0097ms | -0.00040ms | -4.07% |
| p95 | 0.02ms | 0.01ms | +0.0059ms | +44.68% |
| p99 | 0.02ms | 0.02ms | +0.0026ms | +14.91% |
| mean | 0.01ms | 0.01ms | +0.00024ms | +2.30% |
| min | 0.0081ms | 0.0084ms | -0.00025ms | -2.99% |
| max | 0.02ms | 0.02ms | +0.0018ms | +9.52% |
| total | 0.21ms | 0.21ms | +0.0048ms | +2.30% |

### middleware_chain (5 invokeRouteMiddleware)

# Perf Report — middleware_chain (5 invokeRouteMiddleware).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0026ms |
| p50 | 0.0035ms |
| p95 | 0.0044ms |
| p99 | 0.0073ms |
| mean | 0.0035ms |
| stdev | 0.0012ms |
| min | 0.0025ms |
| max | 0.0080ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0026ms | 0.0034ms | -0.00084ms | -24.54% |
| p50 | 0.0035ms | 0.0035ms | +0.000021ms | +0.59% |
| p95 | 0.0044ms | 0.0042ms | +0.00022ms | +5.38% |
| p99 | 0.0073ms | 0.0043ms | +0.0030ms | +70.58% |
| mean | 0.0035ms | 0.0036ms | -0.000046ms | -1.29% |
| min | 0.0025ms | 0.0034ms | -0.00092ms | -27.14% |
| max | 0.0080ms | 0.0043ms | +0.0037ms | +86.44% |
| total | 0.07ms | 0.07ms | -0.00092ms | -1.29% |

### handler_error_handling (5 throw + catch)

# Perf Report — handler_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.0056ms |
| min | 0.01ms |
| max | 0.04ms |
| total | 0.41ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.02ms | -0.0078ms | -34.98% |
| p50 | 0.02ms | 0.02ms | -0.00096ms | -4.15% |
| p95 | 0.03ms | 0.03ms | -0.0011ms | -3.77% |
| p99 | 0.04ms | 0.04ms | -0.00042ms | -1.17% |
| mean | 0.02ms | 0.02ms | -0.0039ms | -16.19% |
| min | 0.01ms | 0.02ms | -0.0081ms | -36.45% |
| max | 0.04ms | 0.04ms | -0.00025ms | -0.67% |
| total | 0.41ms | 0.49ms | -0.08ms | -16.19% |

