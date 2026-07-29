# Perf Suite — orm

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00042ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00083ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| drizzleInsert | 0.01ms | 0.03ms | 10ms | 0.00083ms | PASS | stable (p10 +6% (閾値未満)、 p95 +27% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| drizzleSelectAll | 0.26ms | 0.69ms | 20ms | 0.00083ms | PASS | stable (p10 -2% (閾値未満)、 p95 +91% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| drizzleSelectWhere | 0.02ms | 0.02ms | 10ms | 0.00083ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| drizzleInsert | 0.18ms | 20ms | PASS |
| drizzleSelectAll | 3.15ms | 40ms | PASS |
| drizzleSelectWhere | 0.22ms | 20ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| drizzleInsert | -125328 B | -187547 B | 102400 B | yes | PASS |
| drizzleSelectAll | -30616 B | 0 B | 102400 B | yes | PASS |
| drizzleSelectWhere | -7144 B | 0 B | 102400 B | yes | PASS |

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
| p99 | 0.12ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.18ms |
| total | 3.72ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.00071ms | +5.65% |
| p50 | 0.01ms | 0.01ms | +0.0013ms | +9.57% |
| p95 | 0.03ms | 0.02ms | +0.0068ms | +27.46% |
| p99 | 0.12ms | 0.04ms | +0.08ms | +195.57% |
| mean | 0.02ms | 0.02ms | +0.0027ms | +16.83% |
| min | 0.01ms | 0.01ms | +0.00046ms | +3.77% |
| max | 0.18ms | 0.13ms | +0.05ms | +40.38% |
| total | 3.72ms | 3.19ms | +0.54ms | +16.83% |

### drizzleSelectAll

# Perf Report — drizzleSelectAll.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.26ms |
| p50 | 0.28ms |
| p95 | 0.69ms |
| p99 | 1.02ms |
| mean | 0.34ms |
| stdev | 0.16ms |
| min | 0.25ms |
| max | 1.24ms |
| total | 67.49ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.26ms | 0.27ms | -0.0053ms | -1.98% |
| p50 | 0.28ms | 0.30ms | -0.02ms | -7.70% |
| p95 | 0.69ms | 0.36ms | +0.33ms | +90.52% |
| p99 | 1.02ms | 0.65ms | +0.37ms | +56.58% |
| mean | 0.34ms | 0.31ms | +0.03ms | +8.82% |
| min | 0.25ms | 0.26ms | -0.0097ms | -3.68% |
| max | 1.24ms | 0.68ms | +0.56ms | +83.38% |
| total | 67.49ms | 62.02ms | +5.47ms | +8.82% |

### drizzleSelectWhere

# Perf Report — drizzleSelectWhere.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.09ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.02ms |
| max | 0.14ms |
| total | 3.77ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0013ms | -7.47% |
| p50 | 0.02ms | 0.02ms | -0.0017ms | -9.21% |
| p95 | 0.02ms | 0.08ms | -0.06ms | -70.42% |
| p99 | 0.09ms | 0.35ms | -0.26ms | -74.90% |
| mean | 0.02ms | 0.05ms | -0.03ms | -59.13% |
| min | 0.02ms | 0.02ms | -0.00096ms | -5.71% |
| max | 0.14ms | 3.13ms | -2.99ms | -95.49% |
| total | 3.77ms | 9.21ms | -5.45ms | -59.13% |

