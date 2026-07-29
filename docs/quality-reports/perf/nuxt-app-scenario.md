# Perf Suite — nuxt-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| event_handler_workflow (10 invokeEventHandler) | 0.0083ms | 0.01ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| middleware_chain (5 invokeRouteMiddleware) | 0.0027ms | 0.0043ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| handler_error_handling (5 throw + catch) | 0.01ms | 0.03ms | 100ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| event_handler_workflow (10 invokeEventHandler) | 0.05ms | 200ms | PASS |
| middleware_chain (5 invokeRouteMiddleware) | 0.01ms | 200ms | PASS |
| handler_error_handling (5 throw + catch) | 0.06ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| event_handler_workflow (10 invokeEventHandler) | -474152 B | 0 B | 102400 B | yes | PASS |
| middleware_chain (5 invokeRouteMiddleware) | 5720 B | 0 B | 102400 B | yes | PASS |
| handler_error_handling (5 throw + catch) | 1344 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### event_handler_workflow (10 invokeEventHandler)

# Perf Report — event_handler_workflow (10 invokeEventHandler).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0083ms |
| p50 | 0.0090ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0028ms |
| min | 0.0082ms |
| max | 0.02ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0083ms | 0.0085ms | -0.00025ms | -2.98% |
| p50 | 0.0090ms | 0.0097ms | -0.00075ms | -7.71% |
| p95 | 0.01ms | 0.01ms | +0.00035ms | +2.63% |
| p99 | 0.02ms | 0.02ms | +0.0012ms | +7.12% |
| mean | 0.01ms | 0.01ms | -0.00016ms | -1.50% |
| min | 0.0082ms | 0.0084ms | -0.00021ms | -2.50% |
| max | 0.02ms | 0.02ms | +0.0015ms | +7.93% |
| total | 0.20ms | 0.21ms | -0.0031ms | -1.50% |

### middleware_chain (5 invokeRouteMiddleware)

# Perf Report — middleware_chain (5 invokeRouteMiddleware).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0027ms |
| p50 | 0.0032ms |
| p95 | 0.0043ms |
| p99 | 0.0062ms |
| mean | 0.0033ms |
| stdev | 0.00088ms |
| min | 0.0023ms |
| max | 0.0067ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0027ms | 0.0034ms | -0.00067ms | -19.77% |
| p50 | 0.0032ms | 0.0035ms | -0.00023ms | -6.65% |
| p95 | 0.0043ms | 0.0042ms | +0.00016ms | +3.78% |
| p99 | 0.0062ms | 0.0043ms | +0.0019ms | +45.28% |
| mean | 0.0033ms | 0.0036ms | -0.00028ms | -7.85% |
| min | 0.0023ms | 0.0034ms | -0.0010ms | -30.87% |
| max | 0.0067ms | 0.0043ms | +0.0024ms | +55.37% |
| total | 0.07ms | 0.07ms | -0.0056ms | -7.85% |

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
| stdev | 0.0061ms |
| min | 0.01ms |
| max | 0.04ms |
| total | 0.40ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.02ms | -0.0083ms | -37.31% |
| p50 | 0.02ms | 0.02ms | -0.0028ms | -12.18% |
| p95 | 0.03ms | 0.03ms | -0.0017ms | -5.82% |
| p99 | 0.04ms | 0.04ms | +0.0015ms | +4.22% |
| mean | 0.02ms | 0.02ms | -0.0044ms | -18.13% |
| min | 0.01ms | 0.02ms | -0.0085ms | -37.95% |
| max | 0.04ms | 0.04ms | +0.0023ms | +6.16% |
| total | 0.40ms | 0.49ms | -0.09ms | -18.13% |

