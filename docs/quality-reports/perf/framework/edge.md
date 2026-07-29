# Perf Suite — edge

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeEdgeHandler | 0.0077ms | 0.03ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeEdgeHandlerWithKv | 0.0068ms | 0.0094ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeEdgeHandler | 0.14ms | 10ms | PASS |
| invokeEdgeHandlerWithKv | 0.08ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeEdgeHandler | -11392 B | -11118 B | 102400 B | yes | PASS |
| invokeEdgeHandlerWithKv | 1040 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeEdgeHandler

# Perf Report — invokeEdgeHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0077ms |
| p50 | 0.0091ms |
| p95 | 0.03ms |
| p99 | 0.08ms |
| mean | 0.02ms |
| stdev | 0.04ms |
| min | 0.0076ms |
| max | 0.51ms |
| total | 3.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0077ms | 0.0082ms | -0.00046ms | -5.64% |
| p50 | 0.0091ms | 0.0095ms | -0.00033ms | -3.53% |
| p95 | 0.03ms | 0.03ms | +0.0054ms | +19.60% |
| p99 | 0.08ms | 0.10ms | -0.02ms | -17.53% |
| mean | 0.02ms | 0.02ms | -0.00092ms | -5.69% |
| min | 0.0076ms | 0.0077ms | -0.00017ms | -2.15% |
| max | 0.51ms | 0.65ms | -0.14ms | -22.01% |
| total | 3.05ms | 3.23ms | -0.18ms | -5.69% |

### invokeEdgeHandlerWithKv

# Perf Report — invokeEdgeHandlerWithKv.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0068ms |
| p50 | 0.0071ms |
| p95 | 0.0094ms |
| p99 | 0.05ms |
| mean | 0.0081ms |
| stdev | 0.0054ms |
| min | 0.0066ms |
| max | 0.05ms |
| total | 1.62ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0068ms | 0.0070ms | -0.00021ms | -3.04% |
| p50 | 0.0071ms | 0.0072ms | -0.00010ms | -1.44% |
| p95 | 0.0094ms | 0.0095ms | -0.00013ms | -1.36% |
| p99 | 0.05ms | 0.01ms | +0.04ms | +348.37% |
| mean | 0.0081ms | 0.0079ms | +0.00016ms | +2.03% |
| min | 0.0066ms | 0.0069ms | -0.00029ms | -4.23% |
| max | 0.05ms | 0.06ms | -0.01ms | -17.28% |
| total | 1.62ms | 1.59ms | +0.03ms | +2.03% |

