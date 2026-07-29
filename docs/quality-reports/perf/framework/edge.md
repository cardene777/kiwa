# Perf Suite — edge

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeEdgeHandler | 0.0088ms | 0.02ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeEdgeHandlerWithKv | 0.0067ms | 0.0075ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeEdgeHandler | 0.13ms | 10ms | PASS |
| invokeEdgeHandlerWithKv | 0.07ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeEdgeHandler | -12480 B | -4 B | 102400 B | yes | PASS |
| invokeEdgeHandlerWithKv | 1152 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeEdgeHandler

# Perf Report — invokeEdgeHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0088ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.06ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.0078ms |
| max | 0.17ms |
| total | 2.69ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0088ms | 0.0082ms | +0.00058ms | +7.05% |
| p50 | 0.01ms | 0.0095ms | +0.00060ms | +6.38% |
| p95 | 0.02ms | 0.03ms | -0.0037ms | -13.37% |
| p99 | 0.06ms | 0.10ms | -0.03ms | -33.51% |
| mean | 0.01ms | 0.02ms | -0.0027ms | -16.82% |
| min | 0.0078ms | 0.0077ms | +0.000083ms | +1.07% |
| max | 0.17ms | 0.65ms | -0.49ms | -74.16% |
| total | 2.69ms | 3.23ms | -0.54ms | -16.82% |

### invokeEdgeHandlerWithKv

# Perf Report — invokeEdgeHandlerWithKv.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0067ms |
| p50 | 0.0068ms |
| p95 | 0.0075ms |
| p99 | 0.01ms |
| mean | 0.0070ms |
| stdev | 0.00064ms |
| min | 0.0066ms |
| max | 0.01ms |
| total | 1.39ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0067ms | 0.0070ms | -0.00033ms | -4.76% |
| p50 | 0.0068ms | 0.0072ms | -0.00038ms | -5.21% |
| p95 | 0.0075ms | 0.0095ms | -0.0020ms | -21.44% |
| p99 | 0.01ms | 0.01ms | +0.00027ms | +2.64% |
| mean | 0.0070ms | 0.0079ms | -0.00097ms | -12.17% |
| min | 0.0066ms | 0.0069ms | -0.00029ms | -4.25% |
| max | 0.01ms | 0.06ms | -0.05ms | -80.94% |
| total | 1.39ms | 1.59ms | -0.19ms | -12.17% |

