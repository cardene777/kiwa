# Perf Suite — orm

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| drizzleInsert | 0.01ms | 0.02ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| drizzleSelectAll | 0.23ms | 0.33ms | 20ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| drizzleSelectWhere | 0.02ms | 0.04ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| drizzleInsert | 0.13ms | 20ms | PASS |
| drizzleSelectAll | 3.55ms | 40ms | PASS |
| drizzleSelectWhere | 0.52ms | 20ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| drizzleInsert | -125936 B | 0 B | 102400 B | yes | PASS |
| drizzleSelectAll | -32136 B | 0 B | 102400 B | yes | PASS |
| drizzleSelectWhere | 8232 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### drizzleInsert

# Perf Report — drizzleInsert.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.04ms |
| mean | 0.01ms |
| stdev | 0.0058ms |
| min | 0.01ms |
| max | 0.06ms |
| total | 2.96ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.0010ms | -8.31% |
| p50 | 0.01ms | 0.01ms | -0.00040ms | -2.93% |
| p95 | 0.02ms | 0.02ms | -0.0025ms | -10.08% |
| p99 | 0.04ms | 0.04ms | -0.0019ms | -4.41% |
| mean | 0.01ms | 0.02ms | -0.0011ms | -7.06% |
| min | 0.01ms | 0.01ms | -0.0010ms | -8.56% |
| max | 0.06ms | 0.13ms | -0.07ms | -52.91% |
| total | 2.96ms | 3.19ms | -0.23ms | -7.06% |

### drizzleSelectAll

# Perf Report — drizzleSelectAll.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.23ms |
| p50 | 0.24ms |
| p95 | 0.33ms |
| p99 | 0.46ms |
| mean | 0.26ms |
| stdev | 0.05ms |
| min | 0.23ms |
| max | 0.59ms |
| total | 52.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.23ms | 0.27ms | -0.03ms | -12.15% |
| p50 | 0.24ms | 0.30ms | -0.06ms | -20.01% |
| p95 | 0.33ms | 0.36ms | -0.03ms | -7.98% |
| p99 | 0.46ms | 0.65ms | -0.20ms | -30.08% |
| mean | 0.26ms | 0.31ms | -0.05ms | -15.77% |
| min | 0.23ms | 0.26ms | -0.03ms | -12.08% |
| max | 0.59ms | 0.68ms | -0.09ms | -13.15% |
| total | 52.24ms | 62.02ms | -9.78ms | -15.77% |

### drizzleSelectWhere

# Perf Report — drizzleSelectWhere.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.04ms |
| p99 | 0.10ms |
| mean | 0.03ms |
| stdev | 0.03ms |
| min | 0.02ms |
| max | 0.36ms |
| total | 5.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.0018ms | +10.13% |
| p50 | 0.02ms | 0.02ms | +0.0018ms | +10.14% |
| p95 | 0.04ms | 0.08ms | -0.04ms | -49.71% |
| p99 | 0.10ms | 0.35ms | -0.25ms | -70.76% |
| mean | 0.03ms | 0.05ms | -0.02ms | -44.50% |
| min | 0.02ms | 0.02ms | +0.00079ms | +4.72% |
| max | 0.36ms | 3.13ms | -2.76ms | -88.36% |
| total | 5.11ms | 9.21ms | -4.10ms | -44.50% |

