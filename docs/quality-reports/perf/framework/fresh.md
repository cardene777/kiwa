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
| invokeFreshHandler | 0.20ms | 10ms | PASS |
| mountIsland | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeFreshHandler | 2784 B | -1530 B | 102400 B | yes | PASS |
| mountIsland | -88 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeFreshHandler

# Perf Report — invokeFreshHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0078ms |
| p50 | 0.0092ms |
| p95 | 0.02ms |
| p99 | 0.06ms |
| mean | 0.01ms |
| stdev | 0.0096ms |
| min | 0.0075ms |
| max | 0.10ms |
| total | 2.38ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0078ms | 0.0084ms | -0.00054ms | -6.42% |
| p50 | 0.0092ms | 0.01ms | -0.0010ms | -10.00% |
| p95 | 0.02ms | 0.02ms | -0.0025ms | -11.17% |
| p99 | 0.06ms | 0.06ms | -0.0070ms | -10.97% |
| mean | 0.01ms | 0.01ms | -0.0011ms | -8.53% |
| min | 0.0075ms | 0.0078ms | -0.00037ms | -4.77% |
| max | 0.10ms | 0.10ms | -0.0032ms | -3.25% |
| total | 2.38ms | 2.60ms | -0.22ms | -8.53% |

### mountIsland

# Perf Report — mountIsland.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0013ms |
| p50 | 0.0013ms |
| p95 | 0.0019ms |
| p99 | 0.0051ms |
| mean | 0.0016ms |
| stdev | 0.0012ms |
| min | 0.0012ms |
| max | 0.02ms |
| total | 0.32ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0013ms | 0.0014ms | -0.000084ms | -6.11% |
| p50 | 0.0013ms | 0.0014ms | -0.000083ms | -5.86% |
| p95 | 0.0019ms | 0.0022ms | -0.00032ms | -14.79% |
| p99 | 0.0051ms | 0.0072ms | -0.0021ms | -28.72% |
| mean | 0.0016ms | 0.0017ms | -0.00015ms | -8.80% |
| min | 0.0012ms | 0.0013ms | -0.00012ms | -9.30% |
| max | 0.02ms | 0.02ms | +0.00012ms | +0.82% |
| total | 0.32ms | 0.35ms | -0.03ms | -8.80% |

