# Perf Suite — hono

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeRoute | 0.0018ms | 0.0045ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| rpcClient$get | 0.0027ms | 0.0053ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeRoute | 0.04ms | 10ms | PASS |
| rpcClient$get | 0.04ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeRoute | -17168 B | 0 B | 102400 B | yes | PASS |
| rpcClient$get | 280 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeRoute

# Perf Report — invokeRoute.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0018ms |
| p50 | 0.0019ms |
| p95 | 0.0045ms |
| p99 | 0.01ms |
| mean | 0.0025ms |
| stdev | 0.0021ms |
| min | 0.0018ms |
| max | 0.02ms |
| total | 0.50ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0018ms | 0.0020ms | -0.00025ms | -12.24% |
| p50 | 0.0019ms | 0.0022ms | -0.00025ms | -11.56% |
| p95 | 0.0045ms | 0.0054ms | -0.00092ms | -16.95% |
| p99 | 0.01ms | 0.01ms | -0.00096ms | -7.64% |
| mean | 0.0025ms | 0.0028ms | -0.00037ms | -12.94% |
| min | 0.0018ms | 0.0020ms | -0.00025ms | -12.50% |
| max | 0.02ms | 0.03ms | -0.0020ms | -7.51% |
| total | 0.50ms | 0.57ms | -0.07ms | -12.94% |

### rpcClient$get

# Perf Report — rpcClient$get.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0027ms |
| p50 | 0.0028ms |
| p95 | 0.0053ms |
| p99 | 0.02ms |
| mean | 0.0043ms |
| stdev | 0.01ms |
| min | 0.0026ms |
| max | 0.21ms |
| total | 0.86ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0027ms | 0.0027ms | -0.0000010ms | -0.04% |
| p50 | 0.0028ms | 0.0029ms | -0.000083ms | -2.89% |
| p95 | 0.0053ms | 0.0097ms | -0.0044ms | -45.64% |
| p99 | 0.02ms | 0.07ms | -0.05ms | -76.30% |
| mean | 0.0043ms | 0.0060ms | -0.0017ms | -28.48% |
| min | 0.0026ms | 0.0027ms | -0.000041ms | -1.54% |
| max | 0.21ms | 0.19ms | +0.02ms | +11.88% |
| total | 0.86ms | 1.20ms | -0.34ms | -28.48% |

