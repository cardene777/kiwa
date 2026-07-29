# Perf Suite — solidstart

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeServerFunction | 0.00042ms | 0.0011ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeApiRoute | 0.0095ms | 0.03ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeServerFunction | 0.01ms | 10ms | PASS |
| invokeApiRoute | 0.14ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeServerFunction | -11728 B | 0 B | 102400 B | yes | PASS |
| invokeApiRoute | -13480 B | -22 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeServerFunction

# Perf Report — invokeServerFunction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00054ms |
| p95 | 0.0011ms |
| p99 | 0.0083ms |
| mean | 0.00072ms |
| stdev | 0.0012ms |
| min | 0.00038ms |
| max | 0.010ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00046ms | -0.000041ms | -8.95% |
| p50 | 0.00054ms | 0.00050ms | +0.000041ms | +8.20% |
| p95 | 0.0011ms | 0.0014ms | -0.00025ms | -18.17% |
| p99 | 0.0083ms | 0.0078ms | +0.00051ms | +6.45% |
| mean | 0.00072ms | 0.00073ms | -0.0000025ms | -0.34% |
| min | 0.00038ms | 0.00042ms | -0.000041ms | -9.86% |
| max | 0.010ms | 0.01ms | -0.00033ms | -3.25% |
| total | 0.14ms | 0.15ms | -0.00050ms | -0.34% |

### invokeApiRoute

# Perf Report — invokeApiRoute.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0095ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.08ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.0090ms |
| max | 0.16ms |
| total | 3.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0095ms | 0.0092ms | +0.00029ms | +3.11% |
| p50 | 0.01ms | 0.01ms | +0.00056ms | +5.33% |
| p95 | 0.03ms | 0.03ms | +0.0017ms | +6.09% |
| p99 | 0.08ms | 0.07ms | +0.01ms | +19.58% |
| mean | 0.02ms | 0.01ms | +0.0017ms | +12.45% |
| min | 0.0090ms | 0.0090ms | +0.000083ms | +0.93% |
| max | 0.16ms | 0.10ms | +0.06ms | +56.74% |
| total | 3.11ms | 2.77ms | +0.34ms | +12.45% |

