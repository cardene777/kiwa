# Perf Suite — nuxt

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeEventHandler | 0.00096ms | 0.0033ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeRouteMiddleware | 0.00067ms | 0.00088ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeEventHandler | 0.02ms | 10ms | PASS |
| invokeRouteMiddleware | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeEventHandler | 3712 B | 0 B | 102400 B | yes | PASS |
| invokeRouteMiddleware | 616 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeEventHandler

# Perf Report — invokeEventHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00096ms |
| p50 | 0.0013ms |
| p95 | 0.0033ms |
| p99 | 0.01ms |
| mean | 0.0019ms |
| stdev | 0.0046ms |
| min | 0.00088ms |
| max | 0.06ms |
| total | 0.38ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00096ms | 0.00096ms | 0.00ms | 0.00% |
| p50 | 0.0013ms | 0.0013ms | -0.000041ms | -3.08% |
| p95 | 0.0033ms | 0.0033ms | -0.000059ms | -1.78% |
| p99 | 0.01ms | 0.01ms | +0.0029ms | +25.20% |
| mean | 0.0019ms | 0.0017ms | +0.00025ms | +14.90% |
| min | 0.00088ms | 0.00096ms | -0.000083ms | -8.66% |
| max | 0.06ms | 0.02ms | +0.04ms | +261.59% |
| total | 0.38ms | 0.33ms | +0.05ms | +14.90% |

### invokeRouteMiddleware

# Perf Report — invokeRouteMiddleware.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00067ms |
| p50 | 0.00067ms |
| p95 | 0.00088ms |
| p99 | 0.0043ms |
| mean | 0.00079ms |
| stdev | 0.00060ms |
| min | 0.00058ms |
| max | 0.0055ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00067ms | 0.00067ms | -0.0000010ms | -0.15% |
| p50 | 0.00067ms | 0.00071ms | -0.000041ms | -5.79% |
| p95 | 0.00088ms | 0.00092ms | -0.000038ms | -4.11% |
| p99 | 0.0043ms | 0.0029ms | +0.0014ms | +47.17% |
| mean | 0.00079ms | 0.00081ms | -0.000018ms | -2.23% |
| min | 0.00058ms | 0.00063ms | -0.000042ms | -6.72% |
| max | 0.0055ms | 0.0056ms | -0.000084ms | -1.49% |
| total | 0.16ms | 0.16ms | -0.0036ms | -2.23% |

