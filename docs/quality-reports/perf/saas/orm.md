# Perf Suite — orm

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| drizzleInsert | 0.01ms | 0.02ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| drizzleSelectAll | 0.24ms | 0.30ms | 20ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| drizzleSelectWhere | 0.02ms | 0.02ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| drizzleInsert | 0.21ms | 20ms | PASS |
| drizzleSelectAll | 2.69ms | 40ms | PASS |
| drizzleSelectWhere | 0.19ms | 20ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| drizzleInsert | -107672 B | 0 B | 102400 B | yes | PASS |
| drizzleSelectAll | -32104 B | 0 B | 102400 B | yes | PASS |
| drizzleSelectWhere | 8352 B | 0 B | 102400 B | yes | PASS |

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
| mean | 0.02ms |
| stdev | 0.0051ms |
| min | 0.01ms |
| max | 0.05ms |
| total | 3.27ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.00070ms | +5.61% |
| p50 | 0.01ms | 0.01ms | +0.0011ms | +8.33% |
| p95 | 0.02ms | 0.02ms | +0.00027ms | +1.08% |
| p99 | 0.04ms | 0.04ms | +0.00018ms | +0.42% |
| mean | 0.02ms | 0.02ms | +0.00039ms | +2.46% |
| min | 0.01ms | 0.01ms | +0.00054ms | +4.46% |
| max | 0.05ms | 0.13ms | -0.08ms | -60.71% |
| total | 3.27ms | 3.19ms | +0.08ms | +2.46% |

### drizzleSelectAll

# Perf Report — drizzleSelectAll.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.24ms |
| p50 | 0.24ms |
| p95 | 0.30ms |
| p99 | 0.37ms |
| mean | 0.25ms |
| stdev | 0.04ms |
| min | 0.23ms |
| max | 0.54ms |
| total | 50.86ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.24ms | 0.27ms | -0.03ms | -11.36% |
| p50 | 0.24ms | 0.30ms | -0.06ms | -19.86% |
| p95 | 0.30ms | 0.36ms | -0.06ms | -15.96% |
| p99 | 0.37ms | 0.65ms | -0.28ms | -42.94% |
| mean | 0.25ms | 0.31ms | -0.06ms | -17.99% |
| min | 0.23ms | 0.26ms | -0.03ms | -11.57% |
| max | 0.54ms | 0.68ms | -0.13ms | -19.58% |
| total | 50.86ms | 62.02ms | -11.16ms | -17.99% |

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
| stdev | 0.0091ms |
| min | 0.02ms |
| max | 0.13ms |
| total | 3.79ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.00071ms | -4.12% |
| p50 | 0.02ms | 0.02ms | -0.00077ms | -4.26% |
| p95 | 0.02ms | 0.08ms | -0.06ms | -72.26% |
| p99 | 0.04ms | 0.35ms | -0.31ms | -88.03% |
| mean | 0.02ms | 0.05ms | -0.03ms | -58.88% |
| min | 0.02ms | 0.02ms | -0.00050ms | -2.98% |
| max | 0.13ms | 3.13ms | -3.00ms | -95.83% |
| total | 3.79ms | 9.21ms | -5.42ms | -58.88% |

