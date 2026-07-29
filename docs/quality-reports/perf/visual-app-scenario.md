# Perf Suite — visual-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| baseline_compare (identical 10x10 png) | 0.01ms | 0.02ms | 30ms | 0.00051ms | PASS | stable — gate 無効 (regressionGate=false) |
| burst_compare (5 different 10x10 diff) | 0.05ms | 0.07ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| large_image_diff (100x100 png) | 0.01ms | 0.01ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| baseline_compare (identical 10x10 png) | cpu | 0.08ms | 0.01ms | 0.122 | 0.146 | 0.01ms | 0.01ms |
| burst_compare (5 different 10x10 diff) | cpu | 0.08ms | 0.05ms | 0.591 | 0.571 | 0.05ms | 0.05ms |
| large_image_diff (100x100 png) | cpu | 0.08ms | 0.01ms | 0.136 | 0.130 | 0.01ms | 0.01ms |

## Concurrent p95 (concurrency = 2, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| baseline_compare (identical 10x10 png) | 0.03ms | 60ms | PASS |
| burst_compare (5 different 10x10 diff) | 0.13ms | 200ms | PASS |
| large_image_diff (100x100 png) | 0.03ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| baseline_compare (identical 10x10 png) | 89984 B | 0 B | 102400 B | yes | PASS |
| burst_compare (5 different 10x10 diff) | 478432 B | 0 B | 102400 B | yes | PASS |
| large_image_diff (100x100 png) | 95176 B | 0 B | 102400 B | yes | PASS |

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
| min | 0.0087ms |
| max | 0.02ms |
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.0024ms | -19.24% |
| p50 | 0.01ms | 0.02ms | -0.0069ms | -37.93% |
| p95 | 0.02ms | 0.15ms | -0.14ms | -90.18% |
| p99 | 0.02ms | 0.16ms | -0.14ms | -89.64% |
| mean | 0.01ms | 0.05ms | -0.04ms | -77.18% |
| min | 0.0087ms | 0.01ms | -0.0018ms | -17.14% |
| max | 0.02ms | 0.16ms | -0.15ms | -89.51% |
| total | 0.24ms | 1.03ms | -0.80ms | -77.18% |

### burst_compare (5 different 10x10 diff)

# Perf Report — burst_compare (5 different 10x10 diff).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.05ms |
| p50 | 0.05ms |
| p95 | 0.07ms |
| p99 | 0.07ms |
| mean | 0.05ms |
| stdev | 0.0076ms |
| min | 0.04ms |
| max | 0.07ms |
| total | 1.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.05ms | +0.00075ms | +1.62% |
| p50 | 0.05ms | 0.15ms | -0.10ms | -66.53% |
| p95 | 0.07ms | 0.30ms | -0.23ms | -77.73% |
| p99 | 0.07ms | 0.70ms | -0.63ms | -89.80% |
| mean | 0.05ms | 0.17ms | -0.11ms | -68.21% |
| min | 0.04ms | 0.05ms | -0.0017ms | -3.61% |
| max | 0.07ms | 0.81ms | -0.73ms | -90.91% |
| total | 1.07ms | 3.37ms | -2.30ms | -68.21% |

### large_image_diff (100x100 png)

# Perf Report — large_image_diff (100x100 png).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.01ms |
| stdev | 0.00098ms |
| min | 0.01ms |
| max | 0.01ms |
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.00035ms | +3.26% |
| p50 | 0.01ms | 0.01ms | -0.00052ms | -4.32% |
| p95 | 0.01ms | 0.04ms | -0.03ms | -66.52% |
| p99 | 0.01ms | 0.08ms | -0.06ms | -80.94% |
| mean | 0.01ms | 0.02ms | -0.0071ms | -37.54% |
| min | 0.01ms | 0.0094ms | +0.0016ms | +17.33% |
| max | 0.01ms | 0.08ms | -0.07ms | -82.69% |
| total | 0.24ms | 0.38ms | -0.14ms | -37.54% |

