# Perf Suite — orm

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| drizzleInsert | 0.01ms | 0.02ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| drizzleSelectAll | 0.24ms | 0.30ms | 20ms | 0.00034ms | PASS | stable — gate 無効 (regressionGate=false) |
| drizzleSelectWhere | 0.02ms | 0.03ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| drizzleInsert | cpu | 0.08ms | 0.01ms | 0.148 | 0.143 | 0.01ms | 0.01ms |
| drizzleSelectAll | cpu | 0.08ms | 0.24ms | 2.950 | 2.991 | 0.24ms | 0.25ms |
| drizzleSelectWhere | cpu | 0.08ms | 0.02ms | 0.206 | 0.208 | 0.02ms | 0.02ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| drizzleInsert | 0.15ms | 20ms | PASS |
| drizzleSelectAll | 2.65ms | 40ms | PASS |
| drizzleSelectWhere | 0.20ms | 20ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| drizzleInsert | -106624 B | 0 B | 102400 B | yes | PASS |
| drizzleSelectAll | -32128 B | 0 B | 102400 B | yes | PASS |
| drizzleSelectWhere | 8216 B | 0 B | 102400 B | yes | PASS |

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
| stdev | 0.0070ms |
| min | 0.01ms |
| max | 0.09ms |
| total | 3.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.00038ms | +3.30% |
| p50 | 0.01ms | 0.01ms | +0.000063ms | +0.45% |
| p95 | 0.02ms | 0.03ms | -0.0065ms | -20.71% |
| p99 | 0.04ms | 0.07ms | -0.03ms | -42.64% |
| mean | 0.02ms | 0.02ms | -0.0013ms | -7.47% |
| min | 0.01ms | 0.01ms | +0.00087ms | +8.60% |
| max | 0.09ms | 0.10ms | -0.0055ms | -5.77% |
| total | 3.11ms | 3.36ms | -0.25ms | -7.47% |

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
| max | 0.60ms |
| total | 50.34ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.24ms | 0.25ms | -0.0089ms | -3.61% |
| p50 | 0.24ms | 0.28ms | -0.03ms | -12.12% |
| p95 | 0.30ms | 0.36ms | -0.06ms | -16.85% |
| p99 | 0.37ms | 0.47ms | -0.10ms | -22.03% |
| mean | 0.25ms | 0.29ms | -0.04ms | -12.48% |
| min | 0.23ms | 0.24ms | -0.0068ms | -2.81% |
| max | 0.60ms | 0.71ms | -0.12ms | -16.74% |
| total | 50.34ms | 57.52ms | -7.18ms | -12.48% |

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
| stdev | 0.0064ms |
| min | 0.02ms |
| max | 0.10ms |
| total | 3.79ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.000084ms | -0.50% |
| p50 | 0.02ms | 0.02ms | -0.00025ms | -1.39% |
| p95 | 0.03ms | 0.03ms | -0.0086ms | -24.85% |
| p99 | 0.04ms | 0.10ms | -0.07ms | -64.49% |
| mean | 0.02ms | 0.02ms | -0.0020ms | -9.71% |
| min | 0.02ms | 0.02ms | +0.000083ms | +0.51% |
| max | 0.10ms | 0.15ms | -0.05ms | -34.78% |
| total | 3.79ms | 4.20ms | -0.41ms | -9.71% |

