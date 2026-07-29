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
| invokeLoad | 0.01ms | 10ms | PASS |
| invokeAction | 0.23ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeLoad | -13312 B | 0 B | 102400 B | yes | PASS |
| invokeAction | -95400 B | -34580 B | 102400 B | yes | PASS |

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
| p99 | 0.0058ms |
| mean | 0.00092ms |
| stdev | 0.0010ms |
| min | 0.00063ms |
| max | 0.0097ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00063ms | 0.00067ms | -0.000042ms | -6.30% |
| p50 | 0.00067ms | 0.00071ms | -0.000042ms | -5.92% |
| p95 | 0.0015ms | 0.0015ms | -0.000040ms | -2.67% |
| p99 | 0.0058ms | 0.0073ms | -0.0015ms | -21.00% |
| mean | 0.00092ms | 0.00098ms | -0.000055ms | -5.59% |
| min | 0.00063ms | 0.00063ms | 0.00ms | 0.00% |
| max | 0.0097ms | 0.0098ms | -0.00013ms | -1.28% |
| total | 0.18ms | 0.20ms | -0.01ms | -5.59% |

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
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.17ms |
| total | 3.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00021ms | -1.95% |
| p50 | 0.01ms | 0.01ms | -0.000083ms | -0.72% |
| p95 | 0.03ms | 0.03ms | +0.00015ms | +0.56% |
| p99 | 0.08ms | 0.11ms | -0.03ms | -29.68% |
| mean | 0.02ms | 0.02ms | -0.000010ms | -0.07% |
| min | 0.01ms | 0.01ms | -0.00013ms | -1.22% |
| max | 0.17ms | 0.13ms | +0.05ms | +35.97% |
| total | 3.11ms | 3.12ms | -0.0021ms | -0.07% |

