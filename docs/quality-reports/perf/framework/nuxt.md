# Perf Suite — nuxt

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeEventHandler | 0.00088ms | 0.0021ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeRouteMiddleware | 0.00063ms | 0.00084ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeEventHandler | 0.04ms | 10ms | PASS |
| invokeRouteMiddleware | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeEventHandler | -13888 B | 0 B | 102400 B | yes | PASS |
| invokeRouteMiddleware | 520 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeEventHandler

# Perf Report — invokeEventHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00088ms |
| p50 | 0.00092ms |
| p95 | 0.0021ms |
| p99 | 0.02ms |
| mean | 0.0016ms |
| stdev | 0.0037ms |
| min | 0.00083ms |
| max | 0.04ms |
| total | 0.33ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00088ms | 0.00096ms | -0.000084ms | -8.76% |
| p50 | 0.00092ms | 0.0013ms | -0.00042ms | -31.21% |
| p95 | 0.0021ms | 0.0033ms | -0.0013ms | -38.68% |
| p99 | 0.02ms | 0.01ms | +0.0042ms | +36.14% |
| mean | 0.0016ms | 0.0017ms | -0.0000056ms | -0.34% |
| min | 0.00083ms | 0.00096ms | -0.00013ms | -13.05% |
| max | 0.04ms | 0.02ms | +0.03ms | +155.68% |
| total | 0.33ms | 0.33ms | -0.0011ms | -0.34% |

### invokeRouteMiddleware

# Perf Report — invokeRouteMiddleware.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00063ms |
| p50 | 0.00063ms |
| p95 | 0.00084ms |
| p99 | 0.0029ms |
| mean | 0.00075ms |
| stdev | 0.00054ms |
| min | 0.00058ms |
| max | 0.0053ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00063ms | 0.00067ms | -0.000042ms | -6.30% |
| p50 | 0.00063ms | 0.00071ms | -0.000083ms | -11.72% |
| p95 | 0.00084ms | 0.00092ms | -0.000078ms | -8.45% |
| p99 | 0.0029ms | 0.0029ms | +0.000046ms | +1.60% |
| mean | 0.00075ms | 0.00081ms | -0.000058ms | -7.11% |
| min | 0.00058ms | 0.00063ms | -0.000042ms | -6.72% |
| max | 0.0053ms | 0.0056ms | -0.00037ms | -6.67% |
| total | 0.15ms | 0.16ms | -0.01ms | -7.11% |

