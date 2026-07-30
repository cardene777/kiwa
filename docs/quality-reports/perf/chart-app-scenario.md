# Perf Suite — chart-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| dashboard_render_workflow (10 chart across 4 kinds x 4 providers) | 0.05ms | 0.12ms | 100ms | 0.00040ms | PASS | stable (換算後 p10 +20% (閾値未満)、 p95 +39% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| axis_recompute_batch (5 dataset で computeAxis) | 0.02ms | 0.03ms | 100ms | 0.00040ms | PASS | stable — gate 無効 (regressionGate=false) |
| animation_frame_burst (5 series x 10 frames) | 0.05ms | 0.07ms | 100ms | 0.00032ms | PASS | regressed — gate 無効 (regressionGate=false) |
| drilldown_batch (5 hit + 5 miss) | 0.0085ms | 0.02ms | 100ms | 0.00038ms | PASS | stable — gate 無効 (regressionGate=false) |
| export_batch (3 SVG + 3 PNG) | 0.01ms | 0.02ms | 100ms | 0.00041ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| dashboard_render_workflow (10 chart across 4 kinds x 4 providers) | cpu | 0.08ms | 0.11ms | 0.05ms | 0.560 | 0.465 | 0.04ms | 0.04ms |
| axis_recompute_batch (5 dataset で computeAxis) | cpu | 0.08ms | 0.09ms | 0.02ms | 0.209 | 0.213 | 0.02ms | 0.02ms |
| animation_frame_burst (5 series x 10 frames) | cpu | 0.10ms | 0.12ms | 0.05ms | 0.496 | 0.410 | 0.04ms | 0.03ms |
| drilldown_batch (5 hit + 5 miss) | cpu | 0.09ms | 0.09ms | 0.0085ms | 0.095 | 0.095 | 0.0077ms | 0.0077ms |
| export_batch (3 SVG + 3 PNG) | cpu | 0.08ms | 0.09ms | 0.01ms | 0.122 | 0.115 | 0.010ms | 0.0094ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dashboard_render_workflow (10 chart across 4 kinds x 4 providers) | 0.19ms | 200ms | PASS |
| axis_recompute_batch (5 dataset で computeAxis) | 0.09ms | 200ms | PASS |
| animation_frame_burst (5 series x 10 frames) | 0.19ms | 200ms | PASS |
| drilldown_batch (5 hit + 5 miss) | 0.05ms | 200ms | PASS |
| export_batch (3 SVG + 3 PNG) | 0.06ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| dashboard_render_workflow (10 chart across 4 kinds x 4 providers) | 5304 B | 0 B | 102400 B | yes | PASS |
| axis_recompute_batch (5 dataset で computeAxis) | 400 B | 0 B | 102400 B | yes | PASS |
| animation_frame_burst (5 series x 10 frames) | 648 B | 0 B | 102400 B | yes | PASS |
| drilldown_batch (5 hit + 5 miss) | 920 B | 0 B | 102400 B | yes | PASS |
| export_batch (3 SVG + 3 PNG) | 1560 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### dashboard_render_workflow (10 chart across 4 kinds x 4 providers)

# Perf Report — dashboard_render_workflow (10 chart across 4 kinds x 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.05ms |
| p50 | 0.06ms |
| p95 | 0.12ms |
| p99 | 0.12ms |
| mean | 0.07ms |
| stdev | 0.02ms |
| min | 0.04ms |
| max | 0.12ms |
| total | 1.36ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.965)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.04ms | +0.0076ms | +20.45% |
| p50 | 0.06ms | 0.05ms | +0.0080ms | +15.51% |
| p95 | 0.11ms | 0.08ms | +0.03ms | +39.34% |
| p99 | 0.12ms | 0.09ms | +0.03ms | +37.22% |
| mean | 0.07ms | 0.05ms | +0.01ms | +20.15% |
| min | 0.04ms | 0.04ms | +0.0027ms | +7.71% |
| max | 0.12ms | 0.09ms | +0.03ms | +36.74% |
| total | 1.31ms | 1.09ms | +0.22ms | +20.15% |

### axis_recompute_batch (5 dataset で computeAxis)

# Perf Report — axis_recompute_batch (5 dataset で computeAxis).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0034ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.39ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.963)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.00038ms | -2.23% |
| p50 | 0.02ms | 0.02ms | -0.0013ms | -6.83% |
| p95 | 0.03ms | 0.03ms | -0.0015ms | -5.35% |
| p99 | 0.03ms | 0.03ms | -0.0013ms | -4.57% |
| mean | 0.02ms | 0.02ms | -0.0011ms | -5.83% |
| min | 0.02ms | 0.02ms | -0.00033ms | -1.98% |
| max | 0.03ms | 0.03ms | -0.0012ms | -4.38% |
| total | 0.37ms | 0.39ms | -0.02ms | -5.83% |

### animation_frame_burst (5 series x 10 frames)

# Perf Report — animation_frame_burst (5 series x 10 frames).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.05ms |
| p50 | 0.06ms |
| p95 | 0.07ms |
| p99 | 0.08ms |
| mean | 0.06ms |
| stdev | 0.0080ms |
| min | 0.05ms |
| max | 0.08ms |
| total | 1.25ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.780)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.03ms | +0.0070ms | +21.04% |
| p50 | 0.05ms | 0.04ms | +0.0068ms | +16.48% |
| p95 | 0.06ms | 0.06ms | -0.0050ms | -7.96% |
| p99 | 0.06ms | 0.06ms | -0.0040ms | -6.29% |
| mean | 0.05ms | 0.04ms | +0.0062ms | +14.60% |
| min | 0.04ms | 0.03ms | +0.0062ms | +18.78% |
| max | 0.06ms | 0.06ms | -0.0038ms | -5.88% |
| total | 0.97ms | 0.85ms | +0.12ms | +14.60% |

### drilldown_batch (5 hit + 5 miss)

# Perf Report — drilldown_batch (5 hit + 5 miss).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0085ms |
| p50 | 0.0087ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0042ms |
| min | 0.0083ms |
| max | 0.03ms |
| total | 0.20ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.908)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0077ms | 0.0077ms | +0.000045ms | +0.58% |
| p50 | 0.0079ms | 0.0079ms | +0.000012ms | +0.16% |
| p95 | 0.02ms | 0.02ms | -0.00095ms | -5.16% |
| p99 | 0.02ms | 0.02ms | -0.0023ms | -9.58% |
| mean | 0.0092ms | 0.0095ms | -0.00030ms | -3.14% |
| min | 0.0075ms | 0.0077ms | -0.00017ms | -2.27% |
| max | 0.02ms | 0.03ms | -0.0027ms | -10.37% |
| total | 0.18ms | 0.19ms | -0.0060ms | -3.14% |

### export_batch (3 SVG + 3 PNG)

# Perf Report — export_batch (3 SVG + 3 PNG).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0031ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.27ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.982)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.010ms | 0.0094ms | +0.00060ms | +6.35% |
| p50 | 0.01ms | 0.01ms | +0.00049ms | +4.09% |
| p95 | 0.02ms | 0.02ms | -0.0025ms | -11.89% |
| p99 | 0.02ms | 0.03ms | -0.0090ms | -30.95% |
| mean | 0.01ms | 0.01ms | +0.00015ms | +1.19% |
| min | 0.0098ms | 0.0093ms | +0.00048ms | +5.17% |
| max | 0.02ms | 0.03ms | -0.01ms | -34.13% |
| total | 0.26ms | 0.26ms | +0.0031ms | +1.19% |

