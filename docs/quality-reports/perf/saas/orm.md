# Perf Suite — orm

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| drizzleInsert | 0.01ms | 0.05ms | 10ms | 0.00033ms | PASS | stable (p10 -2% (閾値未満)、 p95 +108% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| drizzleSelectAll | 0.25ms | 16.68ms | 20ms | 0.00033ms | PASS | stable (p10 -7% (閾値未満)、 p95 +4514% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| drizzleSelectWhere | 0.02ms | 0.02ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| drizzleInsert | 0.18ms | 20ms | PASS |
| drizzleSelectAll | 3.44ms | 40ms | PASS |
| drizzleSelectWhere | 0.50ms | 20ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| drizzleInsert | -121264 B | 0 B | 102400 B | yes | PASS |
| drizzleSelectAll | -32136 B | 0 B | 102400 B | yes | PASS |
| drizzleSelectWhere | 20464 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### drizzleInsert

# Perf Report — drizzleInsert.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.05ms |
| p99 | 0.10ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.15ms |
| total | 4.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00021ms | -1.66% |
| p50 | 0.01ms | 0.01ms | +0.00092ms | +6.79% |
| p95 | 0.05ms | 0.02ms | +0.03ms | +107.97% |
| p99 | 0.10ms | 0.04ms | +0.05ms | +126.87% |
| mean | 0.02ms | 0.02ms | +0.0044ms | +27.88% |
| min | 0.01ms | 0.01ms | -0.00067ms | -5.47% |
| max | 0.15ms | 0.13ms | +0.02ms | +17.26% |
| total | 4.08ms | 3.19ms | +0.89ms | +27.88% |

### drizzleSelectAll

# Perf Report — drizzleSelectAll.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.25ms |
| p50 | 0.30ms |
| p95 | 16.68ms |
| p99 | 62.53ms |
| mean | 3.02ms |
| stdev | 11.08ms |
| min | 0.24ms |
| max | 85.47ms |
| total | 603.52ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.25ms | 0.27ms | -0.02ms | -6.60% |
| p50 | 0.30ms | 0.30ms | -0.0065ms | -2.15% |
| p95 | 16.68ms | 0.36ms | +16.32ms | +4513.88% |
| p99 | 62.53ms | 0.65ms | +61.88ms | +9493.38% |
| mean | 3.02ms | 0.31ms | +2.71ms | +873.06% |
| min | 0.24ms | 0.26ms | -0.02ms | -8.34% |
| max | 85.47ms | 0.68ms | +84.80ms | +12536.02% |
| total | 603.52ms | 62.02ms | +541.50ms | +873.06% |

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
| stdev | 0.02ms |
| min | 0.02ms |
| max | 0.20ms |
| total | 4.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.00054ms | +3.13% |
| p50 | 0.02ms | 0.02ms | +0.00042ms | +2.31% |
| p95 | 0.02ms | 0.08ms | -0.06ms | -70.52% |
| p99 | 0.04ms | 0.35ms | -0.31ms | -88.18% |
| mean | 0.02ms | 0.05ms | -0.03ms | -55.08% |
| min | 0.02ms | 0.02ms | +0.00054ms | +3.23% |
| max | 0.20ms | 3.13ms | -2.93ms | -93.71% |
| total | 4.14ms | 9.21ms | -5.07ms | -55.08% |

