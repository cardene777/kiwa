# Perf Suite — solidstart

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeServerFunction | 0.00042ms | 0.0020ms | 5ms | 0.00033ms | PASS | stable (p10 -9% (閾値未満)、 p95 +45% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| invokeApiRoute | 0.0094ms | 0.04ms | 5ms | 0.00033ms | PASS | stable (p10 +1% (閾値未満)、 p95 +61% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeServerFunction | 0.01ms | 10ms | PASS |
| invokeApiRoute | 0.14ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeServerFunction | -17712 B | 0 B | 102400 B | yes | PASS |
| invokeApiRoute | 3888 B | -22 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeServerFunction

# Perf Report — invokeServerFunction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00054ms |
| p95 | 0.0020ms |
| p99 | 0.0075ms |
| mean | 0.00085ms |
| stdev | 0.0011ms |
| min | 0.00042ms |
| max | 0.0094ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00046ms | -0.000041ms | -8.95% |
| p50 | 0.00054ms | 0.00050ms | +0.000041ms | +8.20% |
| p95 | 0.0020ms | 0.0014ms | +0.00062ms | +44.59% |
| p99 | 0.0075ms | 0.0078ms | -0.00038ms | -4.83% |
| mean | 0.00085ms | 0.00073ms | +0.00013ms | +17.62% |
| min | 0.00042ms | 0.00042ms | 0.00ms | 0.00% |
| max | 0.0094ms | 0.01ms | -0.00088ms | -8.50% |
| total | 0.17ms | 0.15ms | +0.03ms | +17.62% |

### invokeApiRoute

# Perf Report — invokeApiRoute.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0094ms |
| p50 | 0.01ms |
| p95 | 0.04ms |
| p99 | 0.07ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.0090ms |
| max | 0.11ms |
| total | 3.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0094ms | 0.0092ms | +0.00013ms | +1.35% |
| p50 | 0.01ms | 0.01ms | +0.00048ms | +4.54% |
| p95 | 0.04ms | 0.03ms | +0.02ms | +61.19% |
| p99 | 0.07ms | 0.07ms | +0.0023ms | +3.35% |
| mean | 0.02ms | 0.01ms | +0.0018ms | +12.68% |
| min | 0.0090ms | 0.0090ms | +0.000042ms | +0.47% |
| max | 0.11ms | 0.10ms | +0.0057ms | +5.72% |
| total | 3.12ms | 2.77ms | +0.35ms | +12.68% |

