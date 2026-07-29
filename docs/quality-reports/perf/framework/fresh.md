# Perf Suite — fresh

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeFreshHandler | 0.0078ms | 0.02ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| mountIsland | 0.0013ms | 0.0019ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeFreshHandler | 0.18ms | 10ms | PASS |
| mountIsland | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeFreshHandler | -439456 B | -4 B | 102400 B | yes | PASS |
| mountIsland | -88 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeFreshHandler

# Perf Report — invokeFreshHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0078ms |
| p50 | 0.0094ms |
| p95 | 0.02ms |
| p99 | 0.05ms |
| mean | 0.01ms |
| stdev | 0.0090ms |
| min | 0.0074ms |
| max | 0.10ms |
| total | 2.36ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0078ms | 0.0084ms | -0.00054ms | -6.47% |
| p50 | 0.0094ms | 0.01ms | -0.00085ms | -8.37% |
| p95 | 0.02ms | 0.02ms | -0.0034ms | -14.74% |
| p99 | 0.05ms | 0.06ms | -0.0094ms | -14.83% |
| mean | 0.01ms | 0.01ms | -0.0012ms | -9.28% |
| min | 0.0074ms | 0.0078ms | -0.00042ms | -5.32% |
| max | 0.10ms | 0.10ms | -0.0011ms | -1.10% |
| total | 2.36ms | 2.60ms | -0.24ms | -9.28% |

### mountIsland

# Perf Report — mountIsland.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0013ms |
| p50 | 0.0013ms |
| p95 | 0.0019ms |
| p99 | 0.0058ms |
| mean | 0.0016ms |
| stdev | 0.0013ms |
| min | 0.0012ms |
| max | 0.02ms |
| total | 0.32ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0013ms | 0.0014ms | -0.000084ms | -6.11% |
| p50 | 0.0013ms | 0.0014ms | -0.000083ms | -5.86% |
| p95 | 0.0019ms | 0.0022ms | -0.00026ms | -11.79% |
| p99 | 0.0058ms | 0.0072ms | -0.0014ms | -18.93% |
| mean | 0.0016ms | 0.0017ms | -0.00015ms | -8.61% |
| min | 0.0012ms | 0.0013ms | -0.00012ms | -9.30% |
| max | 0.02ms | 0.02ms | +0.00092ms | +6.04% |
| total | 0.32ms | 0.35ms | -0.03ms | -8.61% |

