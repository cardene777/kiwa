# Perf Suite — nuxt-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| event_handler_workflow (10 invokeEventHandler) | 0.0081ms | 0.02ms | 100ms | 0.00042ms | PASS | stable (p10 -5% (閾値未満)、 p95 +30% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| middleware_chain (5 invokeRouteMiddleware) | 0.0024ms | 0.0042ms | 100ms | 0.00042ms | PASS | improved — gate 無効 (regressionGate=false) |
| handler_error_handling (5 throw + catch) | 0.01ms | 0.03ms | 100ms | 0.00042ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| event_handler_workflow (10 invokeEventHandler) | 0.05ms | 200ms | PASS |
| middleware_chain (5 invokeRouteMiddleware) | 0.01ms | 200ms | PASS |
| handler_error_handling (5 throw + catch) | 0.08ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| event_handler_workflow (10 invokeEventHandler) | -286824 B | 0 B | 102400 B | yes | PASS |
| middleware_chain (5 invokeRouteMiddleware) | -272 B | 0 B | 102400 B | yes | PASS |
| handler_error_handling (5 throw + catch) | 336 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### event_handler_workflow (10 invokeEventHandler)

# Perf Report — event_handler_workflow (10 invokeEventHandler).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0081ms |
| p50 | 0.0086ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0038ms |
| min | 0.0080ms |
| max | 0.02ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0081ms | 0.0085ms | -0.00042ms | -4.88% |
| p50 | 0.0086ms | 0.0097ms | -0.0011ms | -11.56% |
| p95 | 0.02ms | 0.01ms | +0.0040ms | +30.00% |
| p99 | 0.02ms | 0.02ms | +0.0045ms | +25.91% |
| mean | 0.01ms | 0.01ms | -0.000089ms | -0.86% |
| min | 0.0080ms | 0.0084ms | -0.00033ms | -3.98% |
| max | 0.02ms | 0.02ms | +0.0046ms | +25.17% |
| total | 0.21ms | 0.21ms | -0.0018ms | -0.86% |

### middleware_chain (5 invokeRouteMiddleware)

# Perf Report — middleware_chain (5 invokeRouteMiddleware).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0024ms |
| p50 | 0.0034ms |
| p95 | 0.0042ms |
| p99 | 0.0063ms |
| mean | 0.0032ms |
| stdev | 0.0010ms |
| min | 0.0023ms |
| max | 0.0068ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0024ms | 0.0034ms | -0.0010ms | -30.39% |
| p50 | 0.0034ms | 0.0035ms | -0.000084ms | -2.43% |
| p95 | 0.0042ms | 0.0042ms | +0.0000063ms | +0.15% |
| p99 | 0.0063ms | 0.0043ms | +0.0020ms | +46.91% |
| mean | 0.0032ms | 0.0036ms | -0.00032ms | -9.03% |
| min | 0.0023ms | 0.0034ms | -0.0010ms | -30.87% |
| max | 0.0068ms | 0.0043ms | +0.0025ms | +58.28% |
| total | 0.06ms | 0.07ms | -0.0064ms | -9.03% |

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
| stdev | 0.0060ms |
| min | 0.01ms |
| max | 0.04ms |
| total | 0.42ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.02ms | -0.0079ms | -35.19% |
| p50 | 0.02ms | 0.02ms | -0.00092ms | -3.97% |
| p95 | 0.03ms | 0.03ms | +0.0029ms | +10.07% |
| p99 | 0.04ms | 0.04ms | +0.0011ms | +3.22% |
| mean | 0.02ms | 0.02ms | -0.0031ms | -12.90% |
| min | 0.01ms | 0.02ms | -0.0081ms | -36.26% |
| max | 0.04ms | 0.04ms | +0.00071ms | +1.90% |
| total | 0.42ms | 0.49ms | -0.06ms | -12.90% |

