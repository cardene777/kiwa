# Perf Suite — orm

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| drizzleInsert | 0.01ms | 0.03ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| drizzleSelectAll | 0.24ms | 0.33ms | 20ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| drizzleSelectWhere | 0.02ms | 0.02ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| drizzleInsert | 0.20ms | 20ms | PASS |
| drizzleSelectAll | 3.15ms | 40ms | PASS |
| drizzleSelectWhere | 0.21ms | 20ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| drizzleInsert | -107816 B | 0 B | 102400 B | yes | PASS |
| drizzleSelectAll | -31208 B | 0 B | 102400 B | yes | PASS |
| drizzleSelectWhere | 8256 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### drizzleInsert

# Perf Report — drizzleInsert.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.0053ms |
| min | 0.01ms |
| max | 0.05ms |
| total | 3.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.00079ms | +6.31% |
| p50 | 0.01ms | 0.01ms | +0.00092ms | +6.79% |
| p95 | 0.03ms | 0.02ms | +0.00060ms | +2.44% |
| p99 | 0.04ms | 0.04ms | +0.00049ms | +1.15% |
| mean | 0.02ms | 0.02ms | +0.00025ms | +1.59% |
| min | 0.01ms | 0.01ms | +0.00046ms | +3.77% |
| max | 0.05ms | 0.13ms | -0.07ms | -56.91% |
| total | 3.24ms | 3.19ms | +0.05ms | +1.59% |

### drizzleSelectAll

# Perf Report — drizzleSelectAll.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.24ms |
| p50 | 0.25ms |
| p95 | 0.33ms |
| p99 | 0.45ms |
| mean | 0.27ms |
| stdev | 0.04ms |
| min | 0.23ms |
| max | 0.59ms |
| total | 53.78ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.24ms | 0.27ms | -0.03ms | -10.07% |
| p50 | 0.25ms | 0.30ms | -0.05ms | -16.18% |
| p95 | 0.33ms | 0.36ms | -0.03ms | -9.00% |
| p99 | 0.45ms | 0.65ms | -0.20ms | -31.07% |
| mean | 0.27ms | 0.31ms | -0.04ms | -13.29% |
| min | 0.23ms | 0.26ms | -0.03ms | -11.54% |
| max | 0.59ms | 0.68ms | -0.09ms | -13.16% |
| total | 53.78ms | 62.02ms | -8.24ms | -13.29% |

### drizzleSelectWhere

# Perf Report — drizzleSelectWhere.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.0037ms |
| min | 0.02ms |
| max | 0.05ms |
| total | 3.68ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.00033ms | -1.93% |
| p50 | 0.02ms | 0.02ms | -0.00054ms | -3.00% |
| p95 | 0.02ms | 0.08ms | -0.06ms | -73.28% |
| p99 | 0.04ms | 0.35ms | -0.31ms | -89.32% |
| mean | 0.02ms | 0.05ms | -0.03ms | -60.06% |
| min | 0.02ms | 0.02ms | -0.00058ms | -3.47% |
| max | 0.05ms | 3.13ms | -3.08ms | -98.54% |
| total | 3.68ms | 9.21ms | -5.53ms | -60.06% |

