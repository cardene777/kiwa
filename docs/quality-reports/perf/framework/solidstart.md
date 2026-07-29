# Perf Suite — solidstart

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeServerFunction | 0.00058ms | 0.0010ms | 5ms | 0.00033ms | PASS | stable (差 0.00013ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| invokeApiRoute | 0.0095ms | 0.03ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeServerFunction | 0.02ms | 10ms | PASS |
| invokeApiRoute | 0.42ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeServerFunction | -1760 B | 0 B | 102400 B | yes | PASS |
| invokeApiRoute | 20624 B | -2728 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeServerFunction

# Perf Report — invokeServerFunction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00058ms |
| p50 | 0.00063ms |
| p95 | 0.0010ms |
| p99 | 0.0052ms |
| mean | 0.00080ms |
| stdev | 0.00094ms |
| min | 0.00058ms |
| max | 0.010ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00058ms | 0.00046ms | +0.00013ms | +27.51% |
| p50 | 0.00063ms | 0.00050ms | +0.00013ms | +25.00% |
| p95 | 0.0010ms | 0.0014ms | -0.00037ms | -26.88% |
| p99 | 0.0052ms | 0.0078ms | -0.0026ms | -33.72% |
| mean | 0.00080ms | 0.00073ms | +0.000074ms | +10.22% |
| min | 0.00058ms | 0.00042ms | +0.00017ms | +40.14% |
| max | 0.010ms | 0.01ms | -0.00033ms | -3.25% |
| total | 0.16ms | 0.15ms | +0.01ms | +10.22% |

### invokeApiRoute

# Perf Report — invokeApiRoute.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0095ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.06ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.0090ms |
| max | 0.11ms |
| total | 2.87ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0095ms | 0.0092ms | +0.00020ms | +2.20% |
| p50 | 0.01ms | 0.01ms | +0.000084ms | +0.79% |
| p95 | 0.03ms | 0.03ms | -0.0010ms | -3.74% |
| p99 | 0.06ms | 0.07ms | -0.0043ms | -6.27% |
| mean | 0.01ms | 0.01ms | +0.00053ms | +3.81% |
| min | 0.0090ms | 0.0090ms | +0.000084ms | +0.94% |
| max | 0.11ms | 0.10ms | +0.01ms | +12.24% |
| total | 2.87ms | 2.77ms | +0.11ms | +3.81% |

