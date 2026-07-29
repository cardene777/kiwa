# Perf Suite — nuxt-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| event_handler_workflow (10 invokeEventHandler) | 0.0082ms | 0.02ms | 100ms | 0.00050ms | PASS | stable (p10 -3% (閾値未満)、 p95 +41% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| middleware_chain (5 invokeRouteMiddleware) | 0.0033ms | 0.0040ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| handler_error_handling (5 throw + catch) | 0.02ms | 0.03ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| event_handler_workflow (10 invokeEventHandler) | 0.05ms | 200ms | PASS |
| middleware_chain (5 invokeRouteMiddleware) | 0.01ms | 200ms | PASS |
| handler_error_handling (5 throw + catch) | 0.07ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| event_handler_workflow (10 invokeEventHandler) | 6792 B | 0 B | 102400 B | yes | PASS |
| middleware_chain (5 invokeRouteMiddleware) | 5640 B | 0 B | 102400 B | yes | PASS |
| handler_error_handling (5 throw + catch) | 1344 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### event_handler_workflow (10 invokeEventHandler)

# Perf Report — event_handler_workflow (10 invokeEventHandler).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0082ms |
| p50 | 0.0089ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0040ms |
| min | 0.0081ms |
| max | 0.02ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0082ms | 0.0085ms | -0.00029ms | -3.42% |
| p50 | 0.0089ms | 0.0097ms | -0.00081ms | -8.36% |
| p95 | 0.02ms | 0.01ms | +0.0055ms | +41.07% |
| p99 | 0.02ms | 0.02ms | +0.0030ms | +17.43% |
| mean | 0.01ms | 0.01ms | +0.00068ms | +6.53% |
| min | 0.0081ms | 0.0084ms | -0.00025ms | -2.99% |
| max | 0.02ms | 0.02ms | +0.0024ms | +13.15% |
| total | 0.22ms | 0.21ms | +0.01ms | +6.53% |

### middleware_chain (5 invokeRouteMiddleware)

# Perf Report — middleware_chain (5 invokeRouteMiddleware).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0033ms |
| p50 | 0.0034ms |
| p95 | 0.0040ms |
| p99 | 0.0044ms |
| mean | 0.0035ms |
| stdev | 0.00028ms |
| min | 0.0033ms |
| max | 0.0045ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0033ms | 0.0034ms | -0.000079ms | -2.31% |
| p50 | 0.0034ms | 0.0035ms | -0.000084ms | -2.43% |
| p95 | 0.0040ms | 0.0042ms | -0.00015ms | -3.60% |
| p99 | 0.0044ms | 0.0043ms | +0.00010ms | +2.43% |
| mean | 0.0035ms | 0.0036ms | -0.000065ms | -1.82% |
| min | 0.0033ms | 0.0034ms | -0.000083ms | -2.46% |
| max | 0.0045ms | 0.0043ms | +0.00017ms | +3.89% |
| total | 0.07ms | 0.07ms | -0.0013ms | -1.82% |

### handler_error_handling (5 throw + catch)

# Perf Report — handler_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0028ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.50ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.00016ms | +0.73% |
| p50 | 0.02ms | 0.02ms | +0.0010ms | +4.33% |
| p95 | 0.03ms | 0.03ms | -0.000027ms | -0.09% |
| p99 | 0.03ms | 0.04ms | -0.0023ms | -6.59% |
| mean | 0.02ms | 0.02ms | +0.00039ms | +1.60% |
| min | 0.02ms | 0.02ms | -0.00013ms | -0.56% |
| max | 0.03ms | 0.04ms | -0.0029ms | -7.84% |
| total | 0.50ms | 0.49ms | +0.0078ms | +1.60% |

