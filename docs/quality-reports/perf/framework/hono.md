# Perf Suite — hono

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeRoute | 0.0018ms | 0.0044ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| rpcClient$get | 0.0027ms | 0.0042ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeRoute | 0.03ms | 10ms | PASS |
| rpcClient$get | 0.04ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeRoute | -18128 B | 0 B | 102400 B | yes | PASS |
| rpcClient$get | -56 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeRoute

# Perf Report — invokeRoute.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0018ms |
| p50 | 0.0018ms |
| p95 | 0.0044ms |
| p99 | 0.01ms |
| mean | 0.0024ms |
| stdev | 0.0021ms |
| min | 0.0017ms |
| max | 0.02ms |
| total | 0.48ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0018ms | 0.0020ms | -0.00029ms | -14.30% |
| p50 | 0.0018ms | 0.0022ms | -0.00033ms | -15.41% |
| p95 | 0.0044ms | 0.0054ms | -0.0010ms | -19.04% |
| p99 | 0.01ms | 0.01ms | -0.0011ms | -8.57% |
| mean | 0.0024ms | 0.0028ms | -0.00045ms | -15.91% |
| min | 0.0017ms | 0.0020ms | -0.00029ms | -14.55% |
| max | 0.02ms | 0.03ms | -0.0026ms | -9.70% |
| total | 0.48ms | 0.57ms | -0.09ms | -15.91% |

### rpcClient$get

# Perf Report — rpcClient$get.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0027ms |
| p50 | 0.0027ms |
| p95 | 0.0042ms |
| p99 | 0.0078ms |
| mean | 0.0030ms |
| stdev | 0.0010ms |
| min | 0.0026ms |
| max | 0.01ms |
| total | 0.60ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0027ms | 0.0027ms | -0.000043ms | -1.59% |
| p50 | 0.0027ms | 0.0029ms | -0.00017ms | -5.77% |
| p95 | 0.0042ms | 0.0097ms | -0.0054ms | -56.17% |
| p99 | 0.0078ms | 0.07ms | -0.06ms | -89.20% |
| mean | 0.0030ms | 0.0060ms | -0.0030ms | -50.38% |
| min | 0.0026ms | 0.0027ms | -0.000041ms | -1.54% |
| max | 0.01ms | 0.19ms | -0.18ms | -93.99% |
| total | 0.60ms | 1.20ms | -0.60ms | -50.38% |

