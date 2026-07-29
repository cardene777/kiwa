# Perf Suite — orm

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| drizzleInsert | 0.01ms | 0.03ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| drizzleSelectAll | 0.23ms | 0.31ms | 20ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| drizzleSelectWhere | 0.02ms | 0.03ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| drizzleInsert | 0.15ms | 20ms | PASS |
| drizzleSelectAll | 2.80ms | 40ms | PASS |
| drizzleSelectWhere | 0.19ms | 20ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| drizzleInsert | -106200 B | 0 B | 102400 B | yes | PASS |
| drizzleSelectAll | -31672 B | 0 B | 102400 B | yes | PASS |
| drizzleSelectWhere | 8968 B | 0 B | 102400 B | yes | PASS |

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
| p99 | 0.05ms |
| mean | 0.02ms |
| stdev | 0.0054ms |
| min | 0.01ms |
| max | 0.05ms |
| total | 3.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.00063ms | +4.98% |
| p50 | 0.01ms | 0.01ms | +0.00077ms | +5.71% |
| p95 | 0.03ms | 0.02ms | +0.00049ms | +1.98% |
| p99 | 0.05ms | 0.04ms | +0.0030ms | +7.12% |
| mean | 0.02ms | 0.02ms | +0.00024ms | +1.52% |
| min | 0.01ms | 0.01ms | +0.00058ms | +4.80% |
| max | 0.05ms | 0.13ms | -0.07ms | -57.57% |
| total | 3.24ms | 3.19ms | +0.05ms | +1.52% |

### drizzleSelectAll

# Perf Report — drizzleSelectAll.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.23ms |
| p50 | 0.24ms |
| p95 | 0.31ms |
| p99 | 0.36ms |
| mean | 0.25ms |
| stdev | 0.04ms |
| min | 0.23ms |
| max | 0.54ms |
| total | 50.41ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.23ms | 0.27ms | -0.03ms | -11.98% |
| p50 | 0.24ms | 0.30ms | -0.06ms | -19.93% |
| p95 | 0.31ms | 0.36ms | -0.05ms | -13.62% |
| p99 | 0.36ms | 0.65ms | -0.29ms | -44.12% |
| mean | 0.25ms | 0.31ms | -0.06ms | -18.72% |
| min | 0.23ms | 0.26ms | -0.03ms | -11.78% |
| max | 0.54ms | 0.68ms | -0.14ms | -20.57% |
| total | 50.41ms | 62.02ms | -11.61ms | -18.72% |

### drizzleSelectWhere

# Perf Report — drizzleSelectWhere.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.0066ms |
| min | 0.02ms |
| max | 0.10ms |
| total | 3.87ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.000083ms | -0.48% |
| p50 | 0.02ms | 0.02ms | -0.000041ms | -0.23% |
| p95 | 0.03ms | 0.08ms | -0.06ms | -69.35% |
| p99 | 0.04ms | 0.35ms | -0.32ms | -89.97% |
| mean | 0.02ms | 0.05ms | -0.03ms | -58.04% |
| min | 0.02ms | 0.02ms | +0.00013ms | +0.75% |
| max | 0.10ms | 3.13ms | -3.03ms | -96.92% |
| total | 3.87ms | 9.21ms | -5.35ms | -58.04% |

