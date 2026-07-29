# Perf Suite — hono

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeRoute | 0.0018ms | 0.0047ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| rpcClient$get | 0.0030ms | 0.01ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeRoute | 0.03ms | 10ms | PASS |
| rpcClient$get | 0.15ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeRoute | -33552 B | -33416 B | 102400 B | yes | PASS |
| rpcClient$get | 4016 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeRoute

# Perf Report — invokeRoute.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0018ms |
| p50 | 0.0020ms |
| p95 | 0.0047ms |
| p99 | 0.01ms |
| mean | 0.0026ms |
| stdev | 0.0021ms |
| min | 0.0018ms |
| max | 0.02ms |
| total | 0.52ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0018ms | 0.0020ms | -0.00025ms | -12.24% |
| p50 | 0.0020ms | 0.0022ms | -0.00021ms | -9.64% |
| p95 | 0.0047ms | 0.0054ms | -0.00071ms | -13.12% |
| p99 | 0.01ms | 0.01ms | -0.0011ms | -8.88% |
| mean | 0.0026ms | 0.0028ms | -0.00024ms | -8.50% |
| min | 0.0018ms | 0.0020ms | -0.00025ms | -12.50% |
| max | 0.02ms | 0.03ms | -0.0019ms | -7.20% |
| total | 0.52ms | 0.57ms | -0.05ms | -8.50% |

### rpcClient$get

# Perf Report — rpcClient$get.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0030ms |
| p50 | 0.0030ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.0056ms |
| stdev | 0.0067ms |
| min | 0.0029ms |
| max | 0.06ms |
| total | 1.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0030ms | 0.0027ms | +0.00025ms | +9.19% |
| p50 | 0.0030ms | 0.0029ms | +0.00017ms | +5.81% |
| p95 | 0.01ms | 0.0097ms | +0.0010ms | +10.56% |
| p99 | 0.03ms | 0.07ms | -0.04ms | -53.38% |
| mean | 0.0056ms | 0.0060ms | -0.00041ms | -6.91% |
| min | 0.0029ms | 0.0027ms | +0.00021ms | +7.84% |
| max | 0.06ms | 0.19ms | -0.12ms | -65.98% |
| total | 1.12ms | 1.20ms | -0.08ms | -6.91% |

