# Perf Suite — fresh

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeFreshHandler | 0.0081ms | 0.02ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| mountIsland | 0.0013ms | 0.0025ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeFreshHandler | 0.14ms | 10ms | PASS |
| mountIsland | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeFreshHandler | -16920 B | 0 B | 102400 B | yes | PASS |
| mountIsland | 54520 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeFreshHandler

# Perf Report — invokeFreshHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0081ms |
| p50 | 0.0095ms |
| p95 | 0.02ms |
| p99 | 0.05ms |
| mean | 0.01ms |
| stdev | 0.0098ms |
| min | 0.0074ms |
| max | 0.11ms |
| total | 2.49ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0081ms | 0.0084ms | -0.00025ms | -2.94% |
| p50 | 0.0095ms | 0.01ms | -0.00075ms | -7.35% |
| p95 | 0.02ms | 0.02ms | +0.0000069ms | +0.03% |
| p99 | 0.05ms | 0.06ms | -0.01ms | -17.11% |
| mean | 0.01ms | 0.01ms | -0.00055ms | -4.20% |
| min | 0.0074ms | 0.0078ms | -0.00046ms | -5.85% |
| max | 0.11ms | 0.10ms | +0.0085ms | +8.62% |
| total | 2.49ms | 2.60ms | -0.11ms | -4.20% |

### mountIsland

# Perf Report — mountIsland.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0013ms |
| p50 | 0.0014ms |
| p95 | 0.0025ms |
| p99 | 0.0079ms |
| mean | 0.0062ms |
| stdev | 0.06ms |
| min | 0.0013ms |
| max | 0.92ms |
| total | 1.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0013ms | 0.0014ms | -0.000042ms | -3.05% |
| p50 | 0.0014ms | 0.0014ms | -0.000041ms | -2.90% |
| p95 | 0.0025ms | 0.0022ms | +0.00029ms | +13.39% |
| p99 | 0.0079ms | 0.0072ms | +0.00078ms | +10.95% |
| mean | 0.0062ms | 0.0017ms | +0.0045ms | +258.13% |
| min | 0.0013ms | 0.0013ms | -0.000042ms | -3.15% |
| max | 0.92ms | 0.02ms | +0.90ms | +5939.43% |
| total | 1.24ms | 0.35ms | +0.90ms | +258.13% |

