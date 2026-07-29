# Perf Suite — sveltekit

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeLoad | 0.00063ms | 0.0015ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeAction | 0.01ms | 0.03ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeLoad | 0.02ms | 10ms | PASS |
| invokeAction | 0.23ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeLoad | -14568 B | 0 B | 102400 B | yes | PASS |
| invokeAction | -97064 B | -32300 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeLoad

# Perf Report — invokeLoad.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00063ms |
| p50 | 0.00067ms |
| p95 | 0.0015ms |
| p99 | 0.0054ms |
| mean | 0.00091ms |
| stdev | 0.0010ms |
| min | 0.00063ms |
| max | 0.01ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00063ms | 0.00067ms | -0.000042ms | -6.30% |
| p50 | 0.00067ms | 0.00071ms | -0.000042ms | -5.92% |
| p95 | 0.0015ms | 0.0015ms | -0.000028ms | -1.89% |
| p99 | 0.0054ms | 0.0073ms | -0.0019ms | -26.13% |
| mean | 0.00091ms | 0.00098ms | -0.000067ms | -6.86% |
| min | 0.00063ms | 0.00063ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.0098ms | +0.0014ms | +14.46% |
| total | 0.18ms | 0.20ms | -0.01ms | -6.86% |

### invokeAction

# Perf Report — invokeAction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.08ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.12ms |
| total | 3.00ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00017ms | -1.56% |
| p50 | 0.01ms | 0.01ms | -0.000063ms | -0.55% |
| p95 | 0.03ms | 0.03ms | -0.00029ms | -1.04% |
| p99 | 0.08ms | 0.11ms | -0.03ms | -29.40% |
| mean | 0.02ms | 0.02ms | -0.00057ms | -3.66% |
| min | 0.01ms | 0.01ms | -0.000083ms | -0.81% |
| max | 0.12ms | 0.13ms | -0.0034ms | -2.68% |
| total | 3.00ms | 3.12ms | -0.11ms | -3.66% |

