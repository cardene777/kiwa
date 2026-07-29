# Perf Suite — orm

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| drizzleInsert | 0.01ms | 0.02ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| drizzleSelectAll | 0.24ms | 0.33ms | 20ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| drizzleSelectWhere | 0.02ms | 0.03ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| drizzleInsert | 0.23ms | 20ms | PASS |
| drizzleSelectAll | 3.04ms | 40ms | PASS |
| drizzleSelectWhere | 0.23ms | 20ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| drizzleInsert | -126416 B | 0 B | 102400 B | yes | PASS |
| drizzleSelectAll | -31240 B | 0 B | 102400 B | yes | PASS |
| drizzleSelectWhere | 7024 B | 0 B | 102400 B | yes | PASS |

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
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0047ms |
| min | 0.01ms |
| max | 0.05ms |
| total | 3.01ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00050ms | -3.99% |
| p50 | 0.01ms | 0.01ms | +0.00027ms | +2.00% |
| p95 | 0.02ms | 0.02ms | -0.0010ms | -4.11% |
| p99 | 0.03ms | 0.04ms | -0.0094ms | -22.38% |
| mean | 0.02ms | 0.02ms | -0.00090ms | -5.66% |
| min | 0.01ms | 0.01ms | -0.00071ms | -5.82% |
| max | 0.05ms | 0.13ms | -0.08ms | -59.89% |
| total | 3.01ms | 3.19ms | -0.18ms | -5.66% |

### drizzleSelectAll

# Perf Report — drizzleSelectAll.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.24ms |
| p50 | 0.25ms |
| p95 | 0.33ms |
| p99 | 0.39ms |
| mean | 0.27ms |
| stdev | 0.04ms |
| min | 0.23ms |
| max | 0.62ms |
| total | 53.35ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.24ms | 0.27ms | -0.03ms | -11.18% |
| p50 | 0.25ms | 0.30ms | -0.05ms | -17.73% |
| p95 | 0.33ms | 0.36ms | -0.03ms | -9.54% |
| p99 | 0.39ms | 0.65ms | -0.26ms | -39.54% |
| mean | 0.27ms | 0.31ms | -0.04ms | -13.99% |
| min | 0.23ms | 0.26ms | -0.03ms | -11.86% |
| max | 0.62ms | 0.68ms | -0.05ms | -7.74% |
| total | 53.35ms | 62.02ms | -8.67ms | -13.99% |

### drizzleSelectWhere

# Perf Report — drizzleSelectWhere.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.05ms |
| mean | 0.02ms |
| stdev | 0.0086ms |
| min | 0.02ms |
| max | 0.11ms |
| total | 3.95ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.00013ms | -0.77% |
| p50 | 0.02ms | 0.02ms | +0.000042ms | +0.23% |
| p95 | 0.03ms | 0.08ms | -0.06ms | -69.77% |
| p99 | 0.05ms | 0.35ms | -0.30ms | -86.85% |
| mean | 0.02ms | 0.05ms | -0.03ms | -57.16% |
| min | 0.02ms | 0.02ms | -0.00042ms | -2.48% |
| max | 0.11ms | 3.13ms | -3.01ms | -96.34% |
| total | 3.95ms | 9.21ms | -5.27ms | -57.16% |

