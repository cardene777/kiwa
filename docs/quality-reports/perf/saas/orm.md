# Perf Suite — orm

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| drizzleInsert | 0.01ms | 0.05ms | 10ms | 0.00032ms | PASS | stable (換算後 p10 +14% (閾値未満)、 p95 +27% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| drizzleSelectAll | 0.25ms | 0.36ms | 20ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| drizzleSelectWhere | 0.02ms | 0.04ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| drizzleInsert | cpu | 0.08ms | 0.10ms | 0.01ms | 0.151 | 0.133 | 0.01ms | 0.01ms |
| drizzleSelectAll | cpu | 0.08ms | 0.10ms | 0.25ms | 2.967 | 2.980 | 0.24ms | 0.25ms |
| drizzleSelectWhere | cpu | 0.08ms | 0.10ms | 0.02ms | 0.210 | 0.205 | 0.02ms | 0.02ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| drizzleInsert | 0.24ms | 20ms | PASS |
| drizzleSelectAll | 3.42ms | 40ms | PASS |
| drizzleSelectWhere | 0.37ms | 20ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| drizzleInsert | -108264 B | 0 B | 102400 B | yes | PASS |
| drizzleSelectAll | -32104 B | 0 B | 102400 B | yes | PASS |
| drizzleSelectWhere | 10024 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### drizzleInsert

# Perf Report — drizzleInsert.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.05ms |
| p99 | 0.14ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.20ms |
| total | 4.54ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.952)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.0015ms | +13.62% |
| p50 | 0.02ms | 0.01ms | +0.0021ms | +15.63% |
| p95 | 0.04ms | 0.03ms | +0.0094ms | +27.33% |
| p99 | 0.13ms | 0.06ms | +0.07ms | +110.60% |
| mean | 0.02ms | 0.02ms | +0.0052ms | +31.57% |
| min | 0.01ms | 0.0099ms | +0.0016ms | +15.97% |
| max | 0.19ms | 0.10ms | +0.09ms | +87.67% |
| total | 4.32ms | 3.28ms | +1.04ms | +31.57% |

### drizzleSelectAll

# Perf Report — drizzleSelectAll.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.25ms |
| p50 | 0.26ms |
| p95 | 0.36ms |
| p99 | 0.56ms |
| mean | 0.28ms |
| stdev | 0.06ms |
| min | 0.24ms |
| max | 0.76ms |
| total | 55.54ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.992)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.24ms | 0.25ms | -0.0011ms | -0.44% |
| p50 | 0.26ms | 0.28ms | -0.02ms | -7.06% |
| p95 | 0.36ms | 0.45ms | -0.09ms | -20.50% |
| p99 | 0.55ms | 0.87ms | -0.32ms | -36.79% |
| mean | 0.28ms | 0.31ms | -0.03ms | -10.07% |
| min | 0.24ms | 0.24ms | -0.0038ms | -1.58% |
| max | 0.76ms | 1.20ms | -0.45ms | -37.18% |
| total | 55.12ms | 61.30ms | -6.17ms | -10.07% |

### drizzleSelectWhere

# Perf Report — drizzleSelectWhere.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.04ms |
| p99 | 0.16ms |
| mean | 0.03ms |
| stdev | 0.03ms |
| min | 0.02ms |
| max | 0.34ms |
| total | 5.08ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.992)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.00041ms | +2.40% |
| p50 | 0.02ms | 0.02ms | +0.00056ms | +2.98% |
| p95 | 0.04ms | 0.03ms | +0.0031ms | +9.41% |
| p99 | 0.16ms | 0.10ms | +0.06ms | +59.24% |
| mean | 0.03ms | 0.02ms | +0.0036ms | +16.42% |
| min | 0.02ms | 0.02ms | +0.000083ms | +0.50% |
| max | 0.33ms | 0.17ms | +0.16ms | +91.93% |
| total | 5.05ms | 4.33ms | +0.71ms | +16.42% |

