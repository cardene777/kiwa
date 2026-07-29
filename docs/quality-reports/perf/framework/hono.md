# Perf Suite — hono

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeRoute | 0.0018ms | 0.0063ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| rpcClient$get | 0.0027ms | 0.0042ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeRoute | 0.04ms | 10ms | PASS |
| rpcClient$get | 0.07ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeRoute | -13904 B | 0 B | 102400 B | yes | PASS |
| rpcClient$get | 112 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeRoute

# Perf Report — invokeRoute.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0018ms |
| p50 | 0.0019ms |
| p95 | 0.0063ms |
| p99 | 0.01ms |
| mean | 0.0025ms |
| stdev | 0.0021ms |
| min | 0.0018ms |
| max | 0.02ms |
| total | 0.50ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0018ms | 0.0020ms | -0.00021ms | -10.24% |
| p50 | 0.0019ms | 0.0022ms | -0.00025ms | -11.54% |
| p95 | 0.0063ms | 0.0054ms | +0.00088ms | +16.19% |
| p99 | 0.01ms | 0.01ms | -0.0017ms | -13.51% |
| mean | 0.0025ms | 0.0028ms | -0.00033ms | -11.70% |
| min | 0.0018ms | 0.0020ms | -0.00025ms | -12.50% |
| max | 0.02ms | 0.03ms | -0.0029ms | -10.80% |
| total | 0.50ms | 0.57ms | -0.07ms | -11.70% |

### rpcClient$get

# Perf Report — rpcClient$get.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0027ms |
| p50 | 0.0028ms |
| p95 | 0.0042ms |
| p99 | 0.0088ms |
| mean | 0.0032ms |
| stdev | 0.0022ms |
| min | 0.0026ms |
| max | 0.03ms |
| total | 0.63ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0027ms | 0.0027ms | -0.000042ms | -1.55% |
| p50 | 0.0028ms | 0.0029ms | -0.000084ms | -2.92% |
| p95 | 0.0042ms | 0.0097ms | -0.0055ms | -56.57% |
| p99 | 0.0088ms | 0.07ms | -0.06ms | -87.68% |
| mean | 0.0032ms | 0.0060ms | -0.0028ms | -47.35% |
| min | 0.0026ms | 0.0027ms | -0.000041ms | -1.54% |
| max | 0.03ms | 0.19ms | -0.16ms | -83.50% |
| total | 0.63ms | 1.20ms | -0.57ms | -47.35% |

