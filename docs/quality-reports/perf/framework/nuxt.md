# Perf Suite — nuxt

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeEventHandler | 0.00088ms | 0.0028ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeRouteMiddleware | 0.00063ms | 0.00092ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeEventHandler | 0.03ms | 10ms | PASS |
| invokeRouteMiddleware | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeEventHandler | -17160 B | 0 B | 102400 B | yes | PASS |
| invokeRouteMiddleware | 440 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeEventHandler

# Perf Report — invokeEventHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00088ms |
| p50 | 0.00096ms |
| p95 | 0.0028ms |
| p99 | 0.02ms |
| mean | 0.0020ms |
| stdev | 0.0079ms |
| min | 0.00083ms |
| max | 0.11ms |
| total | 0.40ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00088ms | 0.00096ms | -0.000084ms | -8.76% |
| p50 | 0.00096ms | 0.0013ms | -0.00038ms | -28.13% |
| p95 | 0.0028ms | 0.0033ms | -0.00058ms | -17.43% |
| p99 | 0.02ms | 0.01ms | +0.0078ms | +66.75% |
| mean | 0.0020ms | 0.0017ms | +0.00037ms | +22.24% |
| min | 0.00083ms | 0.00096ms | -0.00013ms | -13.05% |
| max | 0.11ms | 0.02ms | +0.09ms | +538.20% |
| total | 0.40ms | 0.33ms | +0.07ms | +22.24% |

### invokeRouteMiddleware

# Perf Report — invokeRouteMiddleware.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00063ms |
| p50 | 0.00067ms |
| p95 | 0.00092ms |
| p99 | 0.0036ms |
| mean | 0.00076ms |
| stdev | 0.00057ms |
| min | 0.00058ms |
| max | 0.0056ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00063ms | 0.00067ms | -0.000042ms | -6.30% |
| p50 | 0.00067ms | 0.00071ms | -0.000042ms | -5.93% |
| p95 | 0.00092ms | 0.00092ms | -0.0000030ms | -0.33% |
| p99 | 0.0036ms | 0.0029ms | +0.00075ms | +25.83% |
| mean | 0.00076ms | 0.00081ms | -0.000052ms | -6.47% |
| min | 0.00058ms | 0.00063ms | -0.000042ms | -6.72% |
| max | 0.0056ms | 0.0056ms | 0.00ms | 0.00% |
| total | 0.15ms | 0.16ms | -0.01ms | -6.47% |

