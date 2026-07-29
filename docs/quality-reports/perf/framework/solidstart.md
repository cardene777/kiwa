# Perf Suite — solidstart

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeServerFunction | 0.00042ms | 0.0019ms | 5ms | 0.00033ms | PASS | stable (p10 -9% (閾値未満)、 p95 +35% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| invokeApiRoute | 0.0090ms | 0.03ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeServerFunction | 0.01ms | 10ms | PASS |
| invokeApiRoute | 0.13ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeServerFunction | -9656 B | 0 B | 102400 B | yes | PASS |
| invokeApiRoute | 2248 B | -22 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeServerFunction

# Perf Report — invokeServerFunction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00050ms |
| p95 | 0.0019ms |
| p99 | 0.0087ms |
| mean | 0.00087ms |
| stdev | 0.0016ms |
| min | 0.00042ms |
| max | 0.02ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00046ms | -0.000041ms | -8.95% |
| p50 | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| p95 | 0.0019ms | 0.0014ms | +0.00049ms | +35.14% |
| p99 | 0.0087ms | 0.0078ms | +0.00086ms | +11.01% |
| mean | 0.00087ms | 0.00073ms | +0.00014ms | +19.83% |
| min | 0.00042ms | 0.00042ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.01ms | +0.0050ms | +48.98% |
| total | 0.17ms | 0.15ms | +0.03ms | +19.83% |

### invokeApiRoute

# Perf Report — invokeApiRoute.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0090ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.08ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.0088ms |
| max | 0.13ms |
| total | 2.89ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0090ms | 0.0092ms | -0.00021ms | -2.29% |
| p50 | 0.01ms | 0.01ms | -0.00035ms | -3.34% |
| p95 | 0.03ms | 0.03ms | +0.0048ms | +17.66% |
| p99 | 0.08ms | 0.07ms | +0.01ms | +16.00% |
| mean | 0.01ms | 0.01ms | +0.00060ms | +4.36% |
| min | 0.0088ms | 0.0090ms | -0.00017ms | -1.86% |
| max | 0.13ms | 0.10ms | +0.03ms | +27.38% |
| total | 2.89ms | 2.77ms | +0.12ms | +4.36% |

