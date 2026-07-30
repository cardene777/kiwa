# Perf Suite — visual-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| baseline_compare (identical 10x10 png) | 0.01ms | 0.02ms | 30ms | 0.00046ms | PASS | stable — gate 無効 (regressionGate=false) |
| burst_compare (5 different 10x10 diff) | 0.05ms | 0.09ms | 100ms | 0.00047ms | PASS | stable (換算後 p10 -4% (閾値未満)、 p95 +28% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| large_image_diff (100x100 png) | 0.01ms | 0.02ms | 100ms | 0.00047ms | PASS | stable (換算後 p10 +7% (閾値未満)、 p95 +27% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| baseline_compare (identical 10x10 png) | cpu | 0.09ms | 0.10ms | 0.01ms | 0.127 | 0.132 | 0.01ms | 0.01ms |
| burst_compare (5 different 10x10 diff) | cpu | 0.09ms | 0.10ms | 0.05ms | 0.532 | 0.552 | 0.04ms | 0.05ms |
| large_image_diff (100x100 png) | cpu | 0.09ms | 0.09ms | 0.01ms | 0.136 | 0.128 | 0.01ms | 0.01ms |

## Concurrent p95 (concurrency = 2, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| baseline_compare (identical 10x10 png) | 0.07ms | 60ms | PASS |
| burst_compare (5 different 10x10 diff) | 0.13ms | 200ms | PASS |
| large_image_diff (100x100 png) | 0.04ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| baseline_compare (identical 10x10 png) | 90336 B | 0 B | 102400 B | yes | PASS |
| burst_compare (5 different 10x10 diff) | 477384 B | 0 B | 102400 B | yes | PASS |
| large_image_diff (100x100 png) | 355200 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### baseline_compare (identical 10x10 png)

# Perf Report — baseline_compare (identical 10x10 png).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0019ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.27ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.927)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00047ms | -4.31% |
| p50 | 0.01ms | 0.01ms | -0.00075ms | -5.97% |
| p95 | 0.01ms | 0.05ms | -0.04ms | -73.30% |
| p99 | 0.02ms | 0.11ms | -0.09ms | -84.91% |
| mean | 0.01ms | 0.02ms | -0.0092ms | -42.68% |
| min | 0.010ms | 0.01ms | -0.00017ms | -1.65% |
| max | 0.02ms | 0.12ms | -0.11ms | -86.21% |
| total | 0.25ms | 0.43ms | -0.18ms | -42.68% |

### burst_compare (5 different 10x10 diff)

# Perf Report — burst_compare (5 different 10x10 diff).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.05ms |
| p50 | 0.06ms |
| p95 | 0.09ms |
| p99 | 0.13ms |
| mean | 0.06ms |
| stdev | 0.02ms |
| min | 0.05ms |
| max | 0.14ms |
| total | 1.29ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.940)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.05ms | -0.0017ms | -3.70% |
| p50 | 0.05ms | 0.05ms | +0.0033ms | +6.62% |
| p95 | 0.08ms | 0.06ms | +0.02ms | +27.86% |
| p99 | 0.12ms | 0.06ms | +0.06ms | +92.72% |
| mean | 0.06ms | 0.05ms | +0.0087ms | +16.77% |
| min | 0.04ms | 0.04ms | +0.00058ms | +1.34% |
| max | 0.13ms | 0.06ms | +0.07ms | +108.75% |
| total | 1.21ms | 1.04ms | +0.17ms | +16.77% |

### large_image_diff (100x100 png)

# Perf Report — large_image_diff (100x100 png).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0017ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.27ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.931)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.00070ms | +6.65% |
| p50 | 0.01ms | 0.01ms | +0.0010ms | +9.18% |
| p95 | 0.02ms | 0.01ms | +0.0034ms | +27.43% |
| p99 | 0.02ms | 0.01ms | +0.0035ms | +26.68% |
| mean | 0.01ms | 0.01ms | +0.0014ms | +12.53% |
| min | 0.01ms | 0.0098ms | +0.00021ms | +2.16% |
| max | 0.02ms | 0.01ms | +0.0035ms | +26.51% |
| total | 0.26ms | 0.23ms | +0.03ms | +12.53% |

