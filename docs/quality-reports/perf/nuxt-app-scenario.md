# Perf Suite — nuxt-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| event_handler_workflow (10 invokeEventHandler) | 0.0083ms | 0.02ms | 100ms | 0.00049ms | PASS | stable (p10 -2% (閾値未満)、 p95 +40% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| middleware_chain (5 invokeRouteMiddleware) | 0.0031ms | 0.0049ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| handler_error_handling (5 throw + catch) | 0.01ms | 0.03ms | 100ms | 0.00049ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| event_handler_workflow (10 invokeEventHandler) | 0.05ms | 200ms | PASS |
| middleware_chain (5 invokeRouteMiddleware) | 0.02ms | 200ms | PASS |
| handler_error_handling (5 throw + catch) | 0.06ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| event_handler_workflow (10 invokeEventHandler) | 5160 B | 0 B | 102400 B | yes | PASS |
| middleware_chain (5 invokeRouteMiddleware) | 9024 B | 0 B | 102400 B | yes | PASS |
| handler_error_handling (5 throw + catch) | 1344 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### event_handler_workflow (10 invokeEventHandler)

# Perf Report — event_handler_workflow (10 invokeEventHandler).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0083ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0032ms |
| min | 0.0083ms |
| max | 0.02ms |
| total | 0.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0083ms | 0.0085ms | -0.00020ms | -2.39% |
| p50 | 0.01ms | 0.0097ms | +0.00069ms | +7.06% |
| p95 | 0.02ms | 0.01ms | +0.0053ms | +39.99% |
| p99 | 0.02ms | 0.02ms | +0.0026ms | +14.96% |
| mean | 0.01ms | 0.01ms | +0.00090ms | +8.65% |
| min | 0.0083ms | 0.0084ms | -0.00013ms | -1.49% |
| max | 0.02ms | 0.02ms | +0.0019ms | +10.43% |
| total | 0.23ms | 0.21ms | +0.02ms | +8.65% |

### middleware_chain (5 invokeRouteMiddleware)

# Perf Report — middleware_chain (5 invokeRouteMiddleware).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0031ms |
| p50 | 0.0035ms |
| p95 | 0.0049ms |
| p99 | 0.0083ms |
| mean | 0.0039ms |
| stdev | 0.0014ms |
| min | 0.0023ms |
| max | 0.0091ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0031ms | 0.0034ms | -0.00032ms | -9.26% |
| p50 | 0.0035ms | 0.0035ms | +0.000041ms | +1.17% |
| p95 | 0.0049ms | 0.0042ms | +0.00068ms | +16.22% |
| p99 | 0.0083ms | 0.0043ms | +0.0040ms | +93.79% |
| mean | 0.0039ms | 0.0036ms | +0.00030ms | +8.31% |
| min | 0.0023ms | 0.0034ms | -0.0010ms | -30.87% |
| max | 0.0091ms | 0.0043ms | +0.0048ms | +112.65% |
| total | 0.08ms | 0.07ms | +0.0059ms | +8.31% |

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
| stdev | 0.0064ms |
| min | 0.01ms |
| max | 0.04ms |
| total | 0.41ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.02ms | -0.0079ms | -35.52% |
| p50 | 0.02ms | 0.02ms | -0.0015ms | -6.50% |
| p95 | 0.03ms | 0.03ms | -0.0019ms | -6.70% |
| p99 | 0.04ms | 0.04ms | +0.0037ms | +10.47% |
| mean | 0.02ms | 0.02ms | -0.0039ms | -16.06% |
| min | 0.01ms | 0.02ms | -0.0082ms | -37.01% |
| max | 0.04ms | 0.04ms | +0.0051ms | +13.77% |
| total | 0.41ms | 0.49ms | -0.08ms | -16.06% |

