# Perf Suite — fresh

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeFreshHandler | 0.0080ms | 0.03ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| mountIsland | 0.0013ms | 0.0019ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeFreshHandler | 0.13ms | 10ms | PASS |
| mountIsland | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeFreshHandler | -290688 B | -1272 B | 102400 B | yes | PASS |
| mountIsland | 1096 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeFreshHandler

# Perf Report — invokeFreshHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0080ms |
| p50 | 0.0093ms |
| p95 | 0.03ms |
| p99 | 0.09ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.0075ms |
| max | 0.13ms |
| total | 2.59ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0080ms | 0.0084ms | -0.00033ms | -3.93% |
| p50 | 0.0093ms | 0.01ms | -0.00088ms | -8.57% |
| p95 | 0.03ms | 0.02ms | +0.0022ms | +9.72% |
| p99 | 0.09ms | 0.06ms | +0.02ms | +35.69% |
| mean | 0.01ms | 0.01ms | -0.000060ms | -0.46% |
| min | 0.0075ms | 0.0078ms | -0.00029ms | -3.73% |
| max | 0.13ms | 0.10ms | +0.03ms | +27.05% |
| total | 2.59ms | 2.60ms | -0.01ms | -0.46% |

### mountIsland

# Perf Report — mountIsland.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0013ms |
| p50 | 0.0013ms |
| p95 | 0.0019ms |
| p99 | 0.0067ms |
| mean | 0.0016ms |
| stdev | 0.0014ms |
| min | 0.0013ms |
| max | 0.02ms |
| total | 0.32ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0013ms | 0.0014ms | -0.000083ms | -6.04% |
| p50 | 0.0013ms | 0.0014ms | -0.000083ms | -5.86% |
| p95 | 0.0019ms | 0.0022ms | -0.00029ms | -13.24% |
| p99 | 0.0067ms | 0.0072ms | -0.00045ms | -6.26% |
| mean | 0.0016ms | 0.0017ms | -0.00013ms | -7.44% |
| min | 0.0013ms | 0.0013ms | -0.000083ms | -6.23% |
| max | 0.02ms | 0.02ms | +0.0035ms | +22.80% |
| total | 0.32ms | 0.35ms | -0.03ms | -7.44% |

