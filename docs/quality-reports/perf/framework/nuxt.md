# Perf Suite — nuxt

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeEventHandler | 0.00096ms | 0.0030ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeRouteMiddleware | 0.00063ms | 0.0011ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeEventHandler | 0.03ms | 10ms | PASS |
| invokeRouteMiddleware | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeEventHandler | -11064 B | 0 B | 102400 B | yes | PASS |
| invokeRouteMiddleware | 520 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeEventHandler

# Perf Report — invokeEventHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00096ms |
| p50 | 0.0013ms |
| p95 | 0.0030ms |
| p99 | 0.01ms |
| mean | 0.0017ms |
| stdev | 0.0024ms |
| min | 0.00092ms |
| max | 0.03ms |
| total | 0.33ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00096ms | 0.00096ms | -1.0e-7ms | -0.01% |
| p50 | 0.0013ms | 0.0013ms | -0.000083ms | -6.23% |
| p95 | 0.0030ms | 0.0033ms | -0.00034ms | -10.14% |
| p99 | 0.01ms | 0.01ms | -0.0014ms | -11.57% |
| mean | 0.0017ms | 0.0017ms | +0.000013ms | +0.79% |
| min | 0.00092ms | 0.00096ms | -0.000041ms | -4.28% |
| max | 0.03ms | 0.02ms | +0.01ms | +64.54% |
| total | 0.33ms | 0.33ms | +0.0026ms | +0.79% |

### invokeRouteMiddleware

# Perf Report — invokeRouteMiddleware.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00063ms |
| p50 | 0.00067ms |
| p95 | 0.0011ms |
| p99 | 0.0035ms |
| mean | 0.00079ms |
| stdev | 0.00061ms |
| min | 0.00063ms |
| max | 0.0061ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00063ms | 0.00067ms | -0.000042ms | -6.30% |
| p50 | 0.00067ms | 0.00071ms | -0.000041ms | -5.79% |
| p95 | 0.0011ms | 0.00092ms | +0.00014ms | +14.96% |
| p99 | 0.0035ms | 0.0029ms | +0.00059ms | +20.25% |
| mean | 0.00079ms | 0.00081ms | -0.000022ms | -2.74% |
| min | 0.00063ms | 0.00063ms | 0.00ms | 0.00% |
| max | 0.0061ms | 0.0056ms | +0.00046ms | +8.14% |
| total | 0.16ms | 0.16ms | -0.0044ms | -2.74% |

