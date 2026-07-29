# Perf Suite — hono

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeRoute | 0.0018ms | 0.0064ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| rpcClient$get | 0.0029ms | 0.0039ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeRoute | 0.04ms | 10ms | PASS |
| rpcClient$get | 0.04ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeRoute | -13520 B | 0 B | 102400 B | yes | PASS |
| rpcClient$get | 488 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeRoute

# Perf Report — invokeRoute.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0018ms |
| p50 | 0.0025ms |
| p95 | 0.0064ms |
| p99 | 0.01ms |
| mean | 0.0029ms |
| stdev | 0.0023ms |
| min | 0.0018ms |
| max | 0.02ms |
| total | 0.58ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0018ms | 0.0020ms | -0.00021ms | -10.24% |
| p50 | 0.0025ms | 0.0022ms | +0.00029ms | +13.43% |
| p95 | 0.0064ms | 0.0054ms | +0.00097ms | +17.95% |
| p99 | 0.01ms | 0.01ms | +0.0012ms | +9.58% |
| mean | 0.0029ms | 0.0028ms | +0.000066ms | +2.31% |
| min | 0.0018ms | 0.0020ms | -0.00025ms | -12.50% |
| max | 0.02ms | 0.03ms | -0.0019ms | -7.20% |
| total | 0.58ms | 0.57ms | +0.01ms | +2.31% |

### rpcClient$get

# Perf Report — rpcClient$get.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0029ms |
| p50 | 0.0030ms |
| p95 | 0.0039ms |
| p99 | 0.01ms |
| mean | 0.0032ms |
| stdev | 0.0011ms |
| min | 0.0028ms |
| max | 0.01ms |
| total | 0.65ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0029ms | 0.0027ms | +0.00017ms | +6.13% |
| p50 | 0.0030ms | 0.0029ms | +0.000084ms | +2.92% |
| p95 | 0.0039ms | 0.0097ms | -0.0058ms | -59.84% |
| p99 | 0.01ms | 0.07ms | -0.06ms | -85.95% |
| mean | 0.0032ms | 0.0060ms | -0.0028ms | -46.01% |
| min | 0.0028ms | 0.0027ms | +0.00017ms | +6.26% |
| max | 0.01ms | 0.19ms | -0.18ms | -93.90% |
| total | 0.65ms | 1.20ms | -0.55ms | -46.01% |

