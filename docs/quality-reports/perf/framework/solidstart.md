# Perf Suite — solidstart

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeServerFunction | 0.00046ms | 0.0011ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeApiRoute | 0.0096ms | 0.04ms | 5ms | 0.00033ms | PASS | stable (p10 +4% (閾値未満)、 p95 +53% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeServerFunction | 0.02ms | 10ms | PASS |
| invokeApiRoute | 0.13ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeServerFunction | -12304 B | 0 B | 102400 B | yes | PASS |
| invokeApiRoute | 52216 B | -319 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeServerFunction

# Perf Report — invokeServerFunction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00054ms |
| p95 | 0.0011ms |
| p99 | 0.0034ms |
| mean | 0.00068ms |
| stdev | 0.00084ms |
| min | 0.00042ms |
| max | 0.0094ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00046ms | 0.00ms | 0.00% |
| p50 | 0.00054ms | 0.00050ms | +0.000042ms | +8.40% |
| p95 | 0.0011ms | 0.0014ms | -0.00033ms | -24.00% |
| p99 | 0.0034ms | 0.0078ms | -0.0044ms | -56.05% |
| mean | 0.00068ms | 0.00073ms | -0.000045ms | -6.26% |
| min | 0.00042ms | 0.00042ms | 0.00ms | 0.00% |
| max | 0.0094ms | 0.01ms | -0.00088ms | -8.50% |
| total | 0.14ms | 0.15ms | -0.0091ms | -6.26% |

### invokeApiRoute

# Perf Report — invokeApiRoute.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0096ms |
| p50 | 0.01ms |
| p95 | 0.04ms |
| p99 | 0.09ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.0091ms |
| max | 0.13ms |
| total | 3.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0096ms | 0.0092ms | +0.00038ms | +4.05% |
| p50 | 0.01ms | 0.01ms | +0.00019ms | +1.78% |
| p95 | 0.04ms | 0.03ms | +0.01ms | +53.37% |
| p99 | 0.09ms | 0.07ms | +0.02ms | +28.72% |
| mean | 0.02ms | 0.01ms | +0.0017ms | +12.14% |
| min | 0.0091ms | 0.0090ms | +0.00017ms | +1.86% |
| max | 0.13ms | 0.10ms | +0.02ms | +24.85% |
| total | 3.10ms | 2.77ms | +0.34ms | +12.14% |

