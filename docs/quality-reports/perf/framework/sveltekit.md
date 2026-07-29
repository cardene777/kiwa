# Perf Suite — sveltekit

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeLoad | 0.00067ms | 0.0017ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeAction | 0.01ms | 0.03ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeLoad | 0.03ms | 10ms | PASS |
| invokeAction | 0.36ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeLoad | -9848 B | 0 B | 102400 B | yes | PASS |
| invokeAction | -97512 B | -35036 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeLoad

# Perf Report — invokeLoad.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00067ms |
| p50 | 0.00075ms |
| p95 | 0.0017ms |
| p99 | 0.0079ms |
| mean | 0.00099ms |
| stdev | 0.0012ms |
| min | 0.00063ms |
| max | 0.01ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00067ms | 0.00067ms | -0.0000010ms | -0.15% |
| p50 | 0.00075ms | 0.00071ms | +0.000041ms | +5.78% |
| p95 | 0.0017ms | 0.0015ms | +0.00023ms | +15.53% |
| p99 | 0.0079ms | 0.0073ms | +0.00053ms | +7.23% |
| mean | 0.00099ms | 0.00098ms | +0.000010ms | +1.05% |
| min | 0.00063ms | 0.00063ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.0098ms | +0.00062ms | +6.37% |
| total | 0.20ms | 0.20ms | +0.0021ms | +1.05% |

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
| total | 3.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.00025ms | +2.33% |
| p50 | 0.01ms | 0.01ms | +0.00044ms | +3.82% |
| p95 | 0.03ms | 0.03ms | +0.0036ms | +13.11% |
| p99 | 0.08ms | 0.11ms | -0.03ms | -31.28% |
| mean | 0.02ms | 0.02ms | +0.00023ms | +1.46% |
| min | 0.01ms | 0.01ms | +0.000084ms | +0.82% |
| max | 0.12ms | 0.13ms | -0.0044ms | -3.48% |
| total | 3.16ms | 3.12ms | +0.05ms | +1.46% |

