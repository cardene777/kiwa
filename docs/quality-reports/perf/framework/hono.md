# Perf Suite — hono

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeRoute | 0.0018ms | 0.0070ms | 5ms | 0.00033ms | PASS | stable (p10 -12% (閾値未満)、 p95 +29% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| rpcClient$get | 0.0026ms | 0.0034ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeRoute | 0.03ms | 10ms | PASS |
| rpcClient$get | 0.05ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeRoute | -13872 B | 0 B | 102400 B | yes | PASS |
| rpcClient$get | 488 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeRoute

# Perf Report — invokeRoute.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0018ms |
| p50 | 0.0020ms |
| p95 | 0.0070ms |
| p99 | 0.01ms |
| mean | 0.0028ms |
| stdev | 0.0024ms |
| min | 0.0018ms |
| max | 0.02ms |
| total | 0.57ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0018ms | 0.0020ms | -0.00025ms | -12.29% |
| p50 | 0.0020ms | 0.0022ms | -0.00015ms | -6.74% |
| p95 | 0.0070ms | 0.0054ms | +0.0016ms | +28.76% |
| p99 | 0.01ms | 0.01ms | -0.00026ms | -2.06% |
| mean | 0.0028ms | 0.0028ms | -0.000018ms | -0.64% |
| min | 0.0018ms | 0.0020ms | -0.00025ms | -12.50% |
| max | 0.02ms | 0.03ms | -0.0027ms | -10.33% |
| total | 0.57ms | 0.57ms | -0.0037ms | -0.64% |

### rpcClient$get

# Perf Report — rpcClient$get.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0026ms |
| p50 | 0.0027ms |
| p95 | 0.0034ms |
| p99 | 0.0083ms |
| mean | 0.0029ms |
| stdev | 0.0010ms |
| min | 0.0025ms |
| max | 0.01ms |
| total | 0.58ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0026ms | 0.0027ms | -0.00013ms | -4.65% |
| p50 | 0.0027ms | 0.0029ms | -0.00017ms | -5.81% |
| p95 | 0.0034ms | 0.0097ms | -0.0063ms | -65.09% |
| p99 | 0.0083ms | 0.07ms | -0.06ms | -88.50% |
| mean | 0.0029ms | 0.0060ms | -0.0031ms | -51.31% |
| min | 0.0025ms | 0.0027ms | -0.00021ms | -7.80% |
| max | 0.01ms | 0.19ms | -0.18ms | -94.56% |
| total | 0.58ms | 1.20ms | -0.62ms | -51.31% |

