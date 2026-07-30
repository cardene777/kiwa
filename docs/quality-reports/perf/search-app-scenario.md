# Perf Suite — search-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00029ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00058ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| index_build (100 docs addDocuments + 10 search) | 0.31ms | 0.67ms | 100ms | 0.00053ms | PASS | stable — gate 無効 (regressionGate=false) |
| search_heavy_workload (50 docs + 50 search) | 0.71ms | 1.00ms | 100ms | 0.00052ms | PASS | stable — gate 無効 (regressionGate=false) |
| filter_search_cycle (20 docs + 20 filtered search) | 0.11ms | 0.34ms | 80ms | 0.00052ms | PASS | stable (換算後 p10 +11% (閾値未満)、 p95 +172% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| index_build (100 docs addDocuments + 10 search) | cpu | 0.09ms | 0.10ms | 0.31ms | 3.412 | 3.011 | 0.28ms | 0.25ms |
| search_heavy_workload (50 docs + 50 search) | cpu | 0.09ms | 0.11ms | 0.71ms | 7.867 | 8.304 | 0.63ms | 0.67ms |
| filter_search_cycle (20 docs + 20 filtered search) | cpu | 0.09ms | 0.10ms | 0.11ms | 1.177 | 1.064 | 0.09ms | 0.09ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| index_build (100 docs addDocuments + 10 search) | 1.32ms | 200ms | PASS |
| search_heavy_workload (50 docs + 50 search) | 3.42ms | 200ms | PASS |
| filter_search_cycle (20 docs + 20 filtered search) | 0.51ms | 160ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| index_build (100 docs addDocuments + 10 search) | -11848 B | 0 B | 102400 B | yes | PASS |
| search_heavy_workload (50 docs + 50 search) | -4136 B | 0 B | 102400 B | yes | PASS |
| filter_search_cycle (20 docs + 20 filtered search) | 5496 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### index_build (100 docs addDocuments + 10 search)

# Perf Report — index_build (100 docs addDocuments + 10 search).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.31ms |
| p50 | 0.38ms |
| p95 | 0.67ms |
| p99 | 0.77ms |
| mean | 0.42ms |
| stdev | 0.15ms |
| min | 0.30ms |
| max | 0.79ms |
| total | 8.45ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.903)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.28ms | 0.25ms | +0.03ms | +13.31% |
| p50 | 0.34ms | 0.30ms | +0.04ms | +13.13% |
| p95 | 0.60ms | 0.55ms | +0.05ms | +9.54% |
| p99 | 0.69ms | 0.67ms | +0.02ms | +2.95% |
| mean | 0.38ms | 0.34ms | +0.05ms | +13.54% |
| min | 0.27ms | 0.25ms | +0.02ms | +9.97% |
| max | 0.72ms | 0.71ms | +0.01ms | +1.67% |
| total | 7.63ms | 6.72ms | +0.91ms | +13.54% |

### search_heavy_workload (50 docs + 50 search)

# Perf Report — search_heavy_workload (50 docs + 50 search).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.71ms |
| p50 | 0.86ms |
| p95 | 1.00ms |
| p99 | 1.02ms |
| mean | 0.83ms |
| stdev | 0.10ms |
| min | 0.69ms |
| max | 1.02ms |
| total | 16.70ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.895)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.63ms | 0.67ms | -0.04ms | -5.26% |
| p50 | 0.77ms | 0.75ms | +0.02ms | +2.52% |
| p95 | 0.90ms | 0.88ms | +0.02ms | +1.86% |
| p99 | 0.91ms | 0.90ms | +0.01ms | +1.48% |
| mean | 0.75ms | 0.75ms | -0.0017ms | -0.23% |
| min | 0.62ms | 0.64ms | -0.02ms | -3.48% |
| max | 0.92ms | 0.90ms | +0.01ms | +1.39% |
| total | 14.94ms | 14.97ms | -0.03ms | -0.23% |

### filter_search_cycle (20 docs + 20 filtered search)

# Perf Report — filter_search_cycle (20 docs + 20 filtered search).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.11ms |
| p50 | 0.11ms |
| p95 | 0.34ms |
| p99 | 0.36ms |
| mean | 0.16ms |
| stdev | 0.08ms |
| min | 0.09ms |
| max | 0.36ms |
| total | 3.23ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.897)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.09ms | 0.09ms | +0.0092ms | +10.67% |
| p50 | 0.10ms | 0.10ms | +0.0076ms | +8.01% |
| p95 | 0.30ms | 0.11ms | +0.19ms | +172.03% |
| p99 | 0.32ms | 0.17ms | +0.15ms | +92.73% |
| mean | 0.14ms | 0.10ms | +0.05ms | +46.23% |
| min | 0.08ms | 0.09ms | -0.00061ms | -0.71% |
| max | 0.32ms | 0.18ms | +0.14ms | +80.45% |
| total | 2.89ms | 1.98ms | +0.91ms | +46.23% |

