# Perf Suite — edge

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeEdgeHandler | 0.0088ms | 0.03ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeEdgeHandlerWithKv | 0.0064ms | 0.0083ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeEdgeHandler | 0.12ms | 10ms | PASS |
| invokeEdgeHandlerWithKv | 0.07ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeEdgeHandler | -93968 B | 0 B | 102400 B | yes | PASS |
| invokeEdgeHandlerWithKv | -688 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeEdgeHandler

# Perf Report — invokeEdgeHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0088ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.06ms |
| mean | 0.01ms |
| stdev | 0.0096ms |
| min | 0.0075ms |
| max | 0.10ms |
| total | 2.59ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0088ms | 0.0082ms | +0.00062ms | +7.55% |
| p50 | 0.01ms | 0.0095ms | +0.00075ms | +7.92% |
| p95 | 0.03ms | 0.03ms | -0.00052ms | -1.90% |
| p99 | 0.06ms | 0.10ms | -0.04ms | -41.53% |
| mean | 0.01ms | 0.02ms | -0.0032ms | -19.74% |
| min | 0.0075ms | 0.0077ms | -0.00021ms | -2.68% |
| max | 0.10ms | 0.65ms | -0.56ms | -85.04% |
| total | 2.59ms | 3.23ms | -0.64ms | -19.74% |

### invokeEdgeHandlerWithKv

# Perf Report — invokeEdgeHandlerWithKv.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0064ms |
| p50 | 0.0066ms |
| p95 | 0.0083ms |
| p99 | 0.01ms |
| mean | 0.0069ms |
| stdev | 0.0013ms |
| min | 0.0062ms |
| max | 0.02ms |
| total | 1.38ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0064ms | 0.0070ms | -0.00058ms | -8.33% |
| p50 | 0.0066ms | 0.0072ms | -0.00058ms | -8.09% |
| p95 | 0.0083ms | 0.0095ms | -0.0013ms | -13.20% |
| p99 | 0.01ms | 0.01ms | +0.0015ms | +14.19% |
| mean | 0.0069ms | 0.0079ms | -0.0011ms | -13.28% |
| min | 0.0062ms | 0.0069ms | -0.00067ms | -9.70% |
| max | 0.02ms | 0.06ms | -0.05ms | -71.49% |
| total | 1.38ms | 1.59ms | -0.21ms | -13.28% |

