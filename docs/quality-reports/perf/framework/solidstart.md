# Perf Suite — solidstart

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeServerFunction | 0.00046ms | 0.0014ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeApiRoute | 0.0092ms | 0.03ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeServerFunction | 0.01ms | 10ms | PASS |
| invokeApiRoute | 0.14ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeServerFunction | -12048 B | 0 B | 102400 B | yes | PASS |
| invokeApiRoute | 2880 B | -22 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeServerFunction

# Perf Report — invokeServerFunction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00054ms |
| p95 | 0.0014ms |
| p99 | 0.0051ms |
| mean | 0.00071ms |
| stdev | 0.00089ms |
| min | 0.00042ms |
| max | 0.0093ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00046ms | 0.00ms | 0.00% |
| p50 | 0.00054ms | 0.00050ms | +0.000042ms | +8.40% |
| p95 | 0.0014ms | 0.0014ms | +0.000034ms | +2.43% |
| p99 | 0.0051ms | 0.0078ms | -0.0027ms | -34.53% |
| mean | 0.00071ms | 0.00073ms | -0.000016ms | -2.24% |
| min | 0.00042ms | 0.00042ms | 0.00ms | 0.00% |
| max | 0.0093ms | 0.01ms | -0.0010ms | -9.72% |
| total | 0.14ms | 0.15ms | -0.0032ms | -2.24% |

### invokeApiRoute

# Perf Report — invokeApiRoute.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0092ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.10ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.0090ms |
| max | 0.11ms |
| total | 2.99ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0092ms | 0.0092ms | -0.0000041ms | -0.04% |
| p50 | 0.01ms | 0.01ms | +0.00023ms | +2.18% |
| p95 | 0.03ms | 0.03ms | +0.00074ms | +2.72% |
| p99 | 0.10ms | 0.07ms | +0.03ms | +48.47% |
| mean | 0.01ms | 0.01ms | +0.0011ms | +8.18% |
| min | 0.0090ms | 0.0090ms | +0.000042ms | +0.47% |
| max | 0.11ms | 0.10ms | +0.01ms | +12.86% |
| total | 2.99ms | 2.77ms | +0.23ms | +8.18% |

