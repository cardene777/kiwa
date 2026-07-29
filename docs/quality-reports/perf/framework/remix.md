# Perf Suite — remix

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeLoader | 0.0033ms | 0.01ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeAction | 0.0027ms | 0.0059ms | 5ms | 0.00033ms | PASS | stable (p10 +0% (閾値未満)、 p95 +46% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeLoader | 0.05ms | 10ms | PASS |
| invokeAction | 0.05ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeLoader | -54136 B | 0 B | 102400 B | yes | PASS |
| invokeAction | -4680 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeLoader

# Perf Report — invokeLoader.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0033ms |
| p50 | 0.0042ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.0054ms |
| stdev | 0.0047ms |
| min | 0.0031ms |
| max | 0.04ms |
| total | 1.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0033ms | 0.0033ms | +0.000042ms | +1.28% |
| p50 | 0.0042ms | 0.0040ms | +0.00017ms | +4.17% |
| p95 | 0.01ms | 0.01ms | -0.0011ms | -9.39% |
| p99 | 0.03ms | 0.03ms | -0.0013ms | -4.37% |
| mean | 0.0054ms | 0.0054ms | -0.0000012ms | -0.02% |
| min | 0.0031ms | 0.0031ms | -0.000042ms | -1.34% |
| max | 0.04ms | 0.05ms | -0.0027ms | -5.78% |
| total | 1.08ms | 1.08ms | -0.00025ms | -0.02% |

### invokeAction

# Perf Report — invokeAction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0027ms |
| p50 | 0.0029ms |
| p95 | 0.0059ms |
| p99 | 0.02ms |
| mean | 0.0040ms |
| stdev | 0.0081ms |
| min | 0.0026ms |
| max | 0.11ms |
| total | 0.80ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0027ms | 0.0027ms | +0.0000010ms | +0.04% |
| p50 | 0.0029ms | 0.0027ms | +0.00013ms | +4.55% |
| p95 | 0.0059ms | 0.0040ms | +0.0019ms | +46.05% |
| p99 | 0.02ms | 0.0083ms | +0.01ms | +161.87% |
| mean | 0.0040ms | 0.0030ms | +0.0010ms | +33.97% |
| min | 0.0026ms | 0.0026ms | 0.00ms | 0.00% |
| max | 0.11ms | 0.01ms | +0.09ms | +646.01% |
| total | 0.80ms | 0.60ms | +0.20ms | +33.97% |

