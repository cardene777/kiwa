# Perf Suite — nuxt-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| event_handler_workflow (10 invokeEventHandler) | 0.01ms | 0.02ms | 100ms | 0.00042ms | PASS | stable (p10 +18% (閾値未満)、 p95 +57% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| middleware_chain (5 invokeRouteMiddleware) | 0.0023ms | 0.0060ms | 100ms | 0.00042ms | PASS | improved — gate 無効 (regressionGate=false) |
| handler_error_handling (5 throw + catch) | 0.01ms | 0.03ms | 100ms | 0.00042ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| event_handler_workflow (10 invokeEventHandler) | 0.05ms | 200ms | PASS |
| middleware_chain (5 invokeRouteMiddleware) | 0.01ms | 200ms | PASS |
| handler_error_handling (5 throw + catch) | 0.07ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| event_handler_workflow (10 invokeEventHandler) | 4080 B | 0 B | 102400 B | yes | PASS |
| middleware_chain (5 invokeRouteMiddleware) | 4744 B | 0 B | 102400 B | yes | PASS |
| handler_error_handling (5 throw + catch) | 1344 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### event_handler_workflow (10 invokeEventHandler)

# Perf Report — event_handler_workflow (10 invokeEventHandler).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0032ms |
| min | 0.0097ms |
| max | 0.02ms |
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.0085ms | +0.0015ms | +17.90% |
| p50 | 0.01ms | 0.0097ms | +0.0014ms | +14.13% |
| p95 | 0.02ms | 0.01ms | +0.0076ms | +57.21% |
| p99 | 0.02ms | 0.02ms | +0.0036ms | +20.87% |
| mean | 0.01ms | 0.01ms | +0.0017ms | +16.78% |
| min | 0.0097ms | 0.0084ms | +0.0014ms | +16.42% |
| max | 0.02ms | 0.02ms | +0.0026ms | +14.29% |
| total | 0.24ms | 0.21ms | +0.03ms | +16.78% |

### middleware_chain (5 invokeRouteMiddleware)

# Perf Report — middleware_chain (5 invokeRouteMiddleware).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0023ms |
| p50 | 0.0025ms |
| p95 | 0.0060ms |
| p99 | 0.0063ms |
| mean | 0.0032ms |
| stdev | 0.0012ms |
| min | 0.0023ms |
| max | 0.0063ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0023ms | 0.0034ms | -0.0011ms | -32.83% |
| p50 | 0.0025ms | 0.0035ms | -0.00092ms | -26.53% |
| p95 | 0.0060ms | 0.0042ms | +0.0018ms | +44.17% |
| p99 | 0.0063ms | 0.0043ms | +0.0020ms | +46.92% |
| mean | 0.0032ms | 0.0036ms | -0.00038ms | -10.55% |
| min | 0.0023ms | 0.0034ms | -0.0011ms | -32.12% |
| max | 0.0063ms | 0.0043ms | +0.0020ms | +47.59% |
| total | 0.06ms | 0.07ms | -0.0075ms | -10.55% |

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
| stdev | 0.0062ms |
| min | 0.01ms |
| max | 0.04ms |
| total | 0.39ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.02ms | -0.0086ms | -38.66% |
| p50 | 0.02ms | 0.02ms | -0.0021ms | -9.21% |
| p95 | 0.03ms | 0.03ms | -0.00074ms | -2.60% |
| p99 | 0.04ms | 0.04ms | +0.0012ms | +3.43% |
| mean | 0.02ms | 0.02ms | -0.0047ms | -19.31% |
| min | 0.01ms | 0.02ms | -0.0087ms | -39.25% |
| max | 0.04ms | 0.04ms | +0.0017ms | +4.59% |
| total | 0.39ms | 0.49ms | -0.09ms | -19.31% |

