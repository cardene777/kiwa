# Perf Suite — solidstart

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeServerFunction | 0.00042ms | 0.0018ms | 5ms | 0.00033ms | PASS | stable (p10 -9% (閾値未満)、 p95 +27% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| invokeApiRoute | 0.0091ms | 0.03ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeServerFunction | 0.01ms | 10ms | PASS |
| invokeApiRoute | 0.31ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeServerFunction | -21888 B | 0 B | 102400 B | yes | PASS |
| invokeApiRoute | 45776 B | -22 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeServerFunction

# Perf Report — invokeServerFunction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00054ms |
| p95 | 0.0018ms |
| p99 | 0.0066ms |
| mean | 0.00079ms |
| stdev | 0.0010ms |
| min | 0.00042ms |
| max | 0.0088ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00046ms | -0.000041ms | -8.95% |
| p50 | 0.00054ms | 0.00050ms | +0.000042ms | +8.40% |
| p95 | 0.0018ms | 0.0014ms | +0.00038ms | +27.48% |
| p99 | 0.0066ms | 0.0078ms | -0.0012ms | -15.22% |
| mean | 0.00079ms | 0.00073ms | +0.000061ms | +8.42% |
| min | 0.00042ms | 0.00042ms | 0.00ms | 0.00% |
| max | 0.0088ms | 0.01ms | -0.0015ms | -14.98% |
| total | 0.16ms | 0.15ms | +0.01ms | +8.42% |

### invokeApiRoute

# Perf Report — invokeApiRoute.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0091ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.06ms |
| mean | 0.01ms |
| stdev | 0.02ms |
| min | 0.0088ms |
| max | 0.31ms |
| total | 2.93ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0091ms | 0.0092ms | -0.00013ms | -1.35% |
| p50 | 0.01ms | 0.01ms | -0.000083ms | -0.78% |
| p95 | 0.03ms | 0.03ms | +0.0022ms | +7.91% |
| p99 | 0.06ms | 0.07ms | -0.0060ms | -8.83% |
| mean | 0.01ms | 0.01ms | +0.00083ms | +6.02% |
| min | 0.0088ms | 0.0090ms | -0.00021ms | -2.32% |
| max | 0.31ms | 0.10ms | +0.21ms | +205.43% |
| total | 2.93ms | 2.77ms | +0.17ms | +6.02% |

