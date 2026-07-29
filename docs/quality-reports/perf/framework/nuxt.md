# Perf Suite — nuxt

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeEventHandler | 0.00088ms | 0.0027ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeRouteMiddleware | 0.00063ms | 0.00084ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeEventHandler | 0.02ms | 10ms | PASS |
| invokeRouteMiddleware | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeEventHandler | -17456 B | 0 B | 102400 B | yes | PASS |
| invokeRouteMiddleware | -56 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeEventHandler

# Perf Report — invokeEventHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00088ms |
| p50 | 0.00096ms |
| p95 | 0.0027ms |
| p99 | 0.01ms |
| mean | 0.0015ms |
| stdev | 0.0027ms |
| min | 0.00083ms |
| max | 0.03ms |
| total | 0.31ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00088ms | 0.00096ms | -0.000084ms | -8.76% |
| p50 | 0.00096ms | 0.0013ms | -0.00038ms | -28.13% |
| p95 | 0.0027ms | 0.0033ms | -0.00068ms | -20.31% |
| p99 | 0.01ms | 0.01ms | +0.0014ms | +12.10% |
| mean | 0.0015ms | 0.0017ms | -0.00010ms | -6.22% |
| min | 0.00083ms | 0.00096ms | -0.00012ms | -12.94% |
| max | 0.03ms | 0.02ms | +0.0082ms | +48.28% |
| total | 0.31ms | 0.33ms | -0.02ms | -6.22% |

### invokeRouteMiddleware

# Perf Report — invokeRouteMiddleware.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00063ms |
| p50 | 0.00067ms |
| p95 | 0.00084ms |
| p99 | 0.0035ms |
| mean | 0.00077ms |
| stdev | 0.00056ms |
| min | 0.00063ms |
| max | 0.0053ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00063ms | 0.00067ms | -0.000042ms | -6.30% |
| p50 | 0.00067ms | 0.00071ms | -0.000042ms | -5.93% |
| p95 | 0.00084ms | 0.00092ms | -0.000076ms | -8.23% |
| p99 | 0.0035ms | 0.0029ms | +0.00058ms | +20.12% |
| mean | 0.00077ms | 0.00081ms | -0.000043ms | -5.34% |
| min | 0.00063ms | 0.00063ms | 0.00ms | 0.00% |
| max | 0.0053ms | 0.0056ms | -0.00037ms | -6.67% |
| total | 0.15ms | 0.16ms | -0.0086ms | -5.34% |

