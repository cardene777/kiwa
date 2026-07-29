# Perf Suite — fresh

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeFreshHandler | 0.0078ms | 0.02ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| mountIsland | 0.0013ms | 0.0020ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeFreshHandler | 0.16ms | 10ms | PASS |
| mountIsland | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeFreshHandler | -11048 B | -4 B | 102400 B | yes | PASS |
| mountIsland | 1000 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeFreshHandler

# Perf Report — invokeFreshHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0078ms |
| p50 | 0.0090ms |
| p95 | 0.02ms |
| p99 | 0.06ms |
| mean | 0.01ms |
| stdev | 0.0092ms |
| min | 0.0074ms |
| max | 0.10ms |
| total | 2.38ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0078ms | 0.0084ms | -0.00054ms | -6.42% |
| p50 | 0.0090ms | 0.01ms | -0.0012ms | -12.24% |
| p95 | 0.02ms | 0.02ms | -0.0016ms | -7.03% |
| p99 | 0.06ms | 0.06ms | -0.0085ms | -13.36% |
| mean | 0.01ms | 0.01ms | -0.0011ms | -8.74% |
| min | 0.0074ms | 0.0078ms | -0.00042ms | -5.31% |
| max | 0.10ms | 0.10ms | -0.0031ms | -3.13% |
| total | 2.38ms | 2.60ms | -0.23ms | -8.74% |

### mountIsland

# Perf Report — mountIsland.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0013ms |
| p50 | 0.0013ms |
| p95 | 0.0020ms |
| p99 | 0.0058ms |
| mean | 0.0016ms |
| stdev | 0.0013ms |
| min | 0.0013ms |
| max | 0.02ms |
| total | 0.32ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0013ms | 0.0014ms | -0.000083ms | -6.04% |
| p50 | 0.0013ms | 0.0014ms | -0.000082ms | -5.79% |
| p95 | 0.0020ms | 0.0022ms | -0.00020ms | -9.23% |
| p99 | 0.0058ms | 0.0072ms | -0.0013ms | -18.29% |
| mean | 0.0016ms | 0.0017ms | -0.00011ms | -6.61% |
| min | 0.0013ms | 0.0013ms | -0.000042ms | -3.15% |
| max | 0.02ms | 0.02ms | +0.0012ms | +7.96% |
| total | 0.32ms | 0.35ms | -0.02ms | -6.61% |

