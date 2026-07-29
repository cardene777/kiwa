# Perf Suite — nuxt-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| event_handler_workflow (10 invokeEventHandler) | 0.0082ms | 0.03ms | 100ms | 0.00042ms | PASS | stable (p10 -3% (閾値未満)、 p95 +89% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| middleware_chain (5 invokeRouteMiddleware) | 0.0024ms | 0.0050ms | 100ms | 0.00042ms | PASS | improved — gate 無効 (regressionGate=false) |
| handler_error_handling (5 throw + catch) | 0.01ms | 0.03ms | 100ms | 0.00042ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| event_handler_workflow (10 invokeEventHandler) | 0.07ms | 200ms | PASS |
| middleware_chain (5 invokeRouteMiddleware) | 0.01ms | 200ms | PASS |
| handler_error_handling (5 throw + catch) | 0.08ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| event_handler_workflow (10 invokeEventHandler) | -327208 B | 0 B | 102400 B | yes | PASS |
| middleware_chain (5 invokeRouteMiddleware) | -3064 B | 0 B | 102400 B | yes | PASS |
| handler_error_handling (5 throw + catch) | 400 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### event_handler_workflow (10 invokeEventHandler)

# Perf Report — event_handler_workflow (10 invokeEventHandler).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0082ms |
| p50 | 0.0090ms |
| p95 | 0.03ms |
| p99 | 0.06ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.0082ms |
| max | 0.07ms |
| total | 0.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0082ms | 0.0085ms | -0.00029ms | -3.42% |
| p50 | 0.0090ms | 0.0097ms | -0.00075ms | -7.71% |
| p95 | 0.03ms | 0.01ms | +0.01ms | +89.40% |
| p99 | 0.06ms | 0.02ms | +0.04ms | +234.50% |
| mean | 0.01ms | 0.01ms | +0.0024ms | +23.39% |
| min | 0.0082ms | 0.0084ms | -0.00017ms | -1.99% |
| max | 0.07ms | 0.02ms | +0.05ms | +260.77% |
| total | 0.26ms | 0.21ms | +0.05ms | +23.39% |

### middleware_chain (5 invokeRouteMiddleware)

# Perf Report — middleware_chain (5 invokeRouteMiddleware).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0024ms |
| p50 | 0.0034ms |
| p95 | 0.0050ms |
| p99 | 0.0063ms |
| mean | 0.0033ms |
| stdev | 0.0011ms |
| min | 0.0023ms |
| max | 0.0066ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0024ms | 0.0034ms | -0.0010ms | -30.51% |
| p50 | 0.0034ms | 0.0035ms | -0.000084ms | -2.43% |
| p95 | 0.0050ms | 0.0042ms | +0.00083ms | +19.82% |
| p99 | 0.0063ms | 0.0043ms | +0.0020ms | +46.84% |
| mean | 0.0033ms | 0.0036ms | -0.00025ms | -6.92% |
| min | 0.0023ms | 0.0034ms | -0.0010ms | -30.87% |
| max | 0.0066ms | 0.0043ms | +0.0023ms | +53.41% |
| total | 0.07ms | 0.07ms | -0.0049ms | -6.92% |

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
| stdev | 0.0066ms |
| min | 0.01ms |
| max | 0.04ms |
| total | 0.43ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.02ms | -0.0076ms | -33.83% |
| p50 | 0.02ms | 0.02ms | -0.00052ms | -2.25% |
| p95 | 0.03ms | 0.03ms | +0.0043ms | +15.04% |
| p99 | 0.04ms | 0.04ms | +0.0033ms | +9.38% |
| mean | 0.02ms | 0.02ms | -0.0027ms | -11.02% |
| min | 0.01ms | 0.02ms | -0.0077ms | -34.39% |
| max | 0.04ms | 0.04ms | +0.0031ms | +8.29% |
| total | 0.43ms | 0.49ms | -0.05ms | -11.02% |

