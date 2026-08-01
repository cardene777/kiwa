# Perf Suite — chart-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00058ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.0012ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| dashboard_render_workflow (10 chart across 4 kinds x 4 providers) | 0.11ms | 0.27ms | 100ms | 0.00076ms | PASS | regressed — gate 無効 (regressionGate=false) |
| axis_recompute_batch (5 dataset で computeAxis) | 0.02ms | 0.15ms | 100ms | 0.00098ms | PASS | stable (換算後 p10 +2% (閾値未満)、 p95 +348% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| animation_frame_burst (5 series x 10 frames) | 0.04ms | 0.61ms | 100ms | 0.0010ms | PASS | stable (換算後 p10 +5% (閾値未満)、 p95 +734% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| drilldown_batch (5 hit + 5 miss) | 0.0085ms | 0.02ms | 100ms | 0.0010ms | PASS | stable — gate 無効 (regressionGate=false) |
| export_batch (3 SVG + 3 PNG) | 0.01ms | 0.16ms | 100ms | 0.0010ms | PASS | regressed — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| dashboard_render_workflow (10 chart across 4 kinds x 4 providers) | cpu | 0.12ms | 0.17ms | 0.11ms | 0.868 | 0.465 | n/a | 20.0% | 0.07ms | 0.04ms |
| axis_recompute_batch (5 dataset で computeAxis) | cpu | 0.09ms | 0.31ms | 0.02ms | 0.218 | 0.213 | n/a | 20.0% | 0.02ms | 0.02ms |
| animation_frame_burst (5 series x 10 frames) | cpu | 0.09ms | 2.38ms | 0.04ms | 0.432 | 0.410 | n/a | 20.0% | 0.04ms | 0.03ms |
| drilldown_batch (5 hit + 5 miss) | cpu | 0.09ms | 0.10ms | 0.0085ms | 0.091 | 0.095 | n/a | 20.0% | 0.0074ms | 0.0077ms |
| export_batch (3 SVG + 3 PNG) | cpu | 0.09ms | 0.36ms | 0.01ms | 0.147 | 0.115 | n/a | 20.0% | 0.01ms | 0.0094ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dashboard_render_workflow (10 chart across 4 kinds x 4 providers) | 0.34ms | 200ms | PASS |
| axis_recompute_batch (5 dataset で computeAxis) | 0.22ms | 200ms | PASS |
| animation_frame_burst (5 series x 10 frames) | 0.18ms | 200ms | PASS |
| drilldown_batch (5 hit + 5 miss) | 0.05ms | 200ms | PASS |
| export_batch (3 SVG + 3 PNG) | 0.69ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| dashboard_render_workflow (10 chart across 4 kinds x 4 providers) | -2928 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| axis_recompute_batch (5 dataset で computeAxis) | 6264 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| animation_frame_burst (5 series x 10 frames) | 648 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| drilldown_batch (5 hit + 5 miss) | 3416 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| export_batch (3 SVG + 3 PNG) | 512 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |

## Detailed serial reports

### dashboard_render_workflow (10 chart across 4 kinds x 4 providers)

# Perf Report — dashboard_render_workflow (10 chart across 4 kinds x 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.11ms |
| p50 | 0.16ms |
| p95 | 0.27ms |
| p99 | 0.28ms |
| mean | 0.17ms |
| stdev | 0.06ms |
| min | 0.09ms |
| max | 0.28ms |
| total | 3.44ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.651)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.07ms | 0.04ms | +0.03ms | +86.65% |
| p50 | 0.10ms | 0.05ms | +0.05ms | +100.51% |
| p95 | 0.17ms | 0.08ms | +0.09ms | +117.70% |
| p99 | 0.18ms | 0.09ms | +0.09ms | +110.44% |
| mean | 0.11ms | 0.05ms | +0.06ms | +104.67% |
| min | 0.06ms | 0.04ms | +0.03ms | +74.62% |
| max | 0.18ms | 0.09ms | +0.09ms | +108.77% |
| total | 2.24ms | 1.09ms | +1.14ms | +104.67% |

### axis_recompute_batch (5 dataset で computeAxis)

# Perf Report — axis_recompute_batch (5 dataset で computeAxis).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.15ms |
| p99 | 0.20ms |
| mean | 0.04ms |
| stdev | 0.05ms |
| min | 0.02ms |
| max | 0.21ms |
| total | 0.84ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.841)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.00040ms | +2.36% |
| p50 | 0.02ms | 0.02ms | +0.00064ms | +3.48% |
| p95 | 0.12ms | 0.03ms | +0.10ms | +347.96% |
| p99 | 0.17ms | 0.03ms | +0.14ms | +498.42% |
| mean | 0.04ms | 0.02ms | +0.02ms | +79.12% |
| min | 0.02ms | 0.02ms | +0.000096ms | +0.57% |
| max | 0.18ms | 0.03ms | +0.15ms | +536.04% |
| total | 0.71ms | 0.39ms | +0.31ms | +79.12% |

### animation_frame_burst (5 series x 10 frames)

# Perf Report — animation_frame_burst (5 series x 10 frames).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.04ms |
| p50 | 0.05ms |
| p95 | 0.61ms |
| p99 | 0.87ms |
| mean | 0.14ms |
| stdev | 0.22ms |
| min | 0.04ms |
| max | 0.94ms |
| total | 2.81ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.865)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.03ms | +0.0018ms | +5.44% |
| p50 | 0.05ms | 0.04ms | +0.0048ms | +11.65% |
| p95 | 0.53ms | 0.06ms | +0.46ms | +733.55% |
| p99 | 0.75ms | 0.06ms | +0.69ms | +1082.07% |
| mean | 0.12ms | 0.04ms | +0.08ms | +186.96% |
| min | 0.03ms | 0.03ms | +0.00089ms | +2.70% |
| max | 0.81ms | 0.06ms | +0.75ms | +1168.33% |
| total | 2.43ms | 0.85ms | +1.59ms | +186.96% |

### drilldown_batch (5 hit + 5 miss)

# Perf Report — drilldown_batch (5 hit + 5 miss).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0085ms |
| p50 | 0.0088ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.0054ms |
| min | 0.0085ms |
| max | 0.03ms |
| total | 0.22ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.868)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0074ms | 0.0077ms | -0.00029ms | -3.83% |
| p50 | 0.0077ms | 0.0079ms | -0.00023ms | -2.91% |
| p95 | 0.02ms | 0.02ms | -0.0011ms | -5.87% |
| p99 | 0.02ms | 0.02ms | -0.000037ms | -0.15% |
| mean | 0.0095ms | 0.0095ms | +0.000048ms | +0.50% |
| min | 0.0074ms | 0.0077ms | -0.00029ms | -3.78% |
| max | 0.03ms | 0.03ms | +0.00022ms | +0.87% |
| total | 0.19ms | 0.19ms | +0.00095ms | +0.50% |

### export_batch (3 SVG + 3 PNG)

# Perf Report — export_batch (3 SVG + 3 PNG).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.03ms |
| p95 | 0.16ms |
| p99 | 0.16ms |
| mean | 0.04ms |
| stdev | 0.05ms |
| min | 0.01ms |
| max | 0.16ms |
| total | 0.83ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.864)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.0094ms | +0.0026ms | +27.57% |
| p50 | 0.02ms | 0.01ms | +0.01ms | +88.09% |
| p95 | 0.14ms | 0.02ms | +0.12ms | +572.30% |
| p99 | 0.14ms | 0.03ms | +0.11ms | +384.36% |
| mean | 0.04ms | 0.01ms | +0.02ms | +180.06% |
| min | 0.0096ms | 0.0093ms | +0.00028ms | +3.03% |
| max | 0.14ms | 0.03ms | +0.11ms | +353.01% |
| total | 0.72ms | 0.26ms | +0.46ms | +180.06% |

