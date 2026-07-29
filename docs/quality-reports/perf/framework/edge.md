# Perf Suite — edge

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeEdgeHandler | 0.0080ms | 0.03ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeEdgeHandlerWithKv | 0.0065ms | 0.0080ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeEdgeHandler | 0.15ms | 10ms | PASS |
| invokeEdgeHandlerWithKv | 0.07ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeEdgeHandler | 6176 B | -11118 B | 102400 B | yes | PASS |
| invokeEdgeHandlerWithKv | 2080 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeEdgeHandler

# Perf Report — invokeEdgeHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0080ms |
| p50 | 0.0093ms |
| p95 | 0.03ms |
| p99 | 0.07ms |
| mean | 0.02ms |
| stdev | 0.04ms |
| min | 0.0075ms |
| max | 0.59ms |
| total | 3.02ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0080ms | 0.0082ms | -0.00021ms | -2.60% |
| p50 | 0.0093ms | 0.0095ms | -0.00013ms | -1.33% |
| p95 | 0.03ms | 0.03ms | -0.0017ms | -6.26% |
| p99 | 0.07ms | 0.10ms | -0.03ms | -32.02% |
| mean | 0.02ms | 0.02ms | -0.0010ms | -6.43% |
| min | 0.0075ms | 0.0077ms | -0.00025ms | -3.23% |
| max | 0.59ms | 0.65ms | -0.06ms | -9.18% |
| total | 3.02ms | 3.23ms | -0.21ms | -6.43% |

### invokeEdgeHandlerWithKv

# Perf Report — invokeEdgeHandlerWithKv.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0065ms |
| p50 | 0.0067ms |
| p95 | 0.0080ms |
| p99 | 0.01ms |
| mean | 0.0070ms |
| stdev | 0.00099ms |
| min | 0.0064ms |
| max | 0.01ms |
| total | 1.39ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0065ms | 0.0070ms | -0.00046ms | -6.56% |
| p50 | 0.0067ms | 0.0072ms | -0.00050ms | -6.94% |
| p95 | 0.0080ms | 0.0095ms | -0.0015ms | -16.09% |
| p99 | 0.01ms | 0.01ms | +0.0016ms | +15.39% |
| mean | 0.0070ms | 0.0079ms | -0.00098ms | -12.39% |
| min | 0.0064ms | 0.0069ms | -0.00046ms | -6.66% |
| max | 0.01ms | 0.06ms | -0.05ms | -77.20% |
| total | 1.39ms | 1.59ms | -0.20ms | -12.39% |

