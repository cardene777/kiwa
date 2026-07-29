# Perf Suite — chart-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| dashboard_render_workflow (10 chart across 4 kinds x 4 providers) | 0.05ms | 0.16ms | 100ms | 0.00044ms | PASS | stable (p10 +7% (閾値未満)、 p95 +105% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| axis_recompute_batch (5 dataset で computeAxis) | 0.02ms | 0.03ms | 100ms | 0.00045ms | PASS | stable — gate 無効 (regressionGate=false) |
| animation_frame_burst (5 series x 10 frames) | 0.03ms | 0.05ms | 100ms | 0.00048ms | PASS | stable — gate 無効 (regressionGate=false) |
| drilldown_batch (5 hit + 5 miss) | 0.0085ms | 0.01ms | 100ms | 0.00045ms | PASS | stable — gate 無効 (regressionGate=false) |
| export_batch (3 SVG + 3 PNG) | 0.01ms | 0.02ms | 100ms | 0.00045ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| dashboard_render_workflow (10 chart across 4 kinds x 4 providers) | cpu | 0.09ms | 0.05ms | 0.558 | 0.520 | 0.04ms | 0.04ms |
| axis_recompute_batch (5 dataset で computeAxis) | cpu | 0.09ms | 0.02ms | 0.207 | 0.211 | 0.02ms | 0.02ms |
| animation_frame_burst (5 series x 10 frames) | cpu | 0.08ms | 0.03ms | 0.400 | 0.463 | 0.03ms | 0.04ms |
| drilldown_batch (5 hit + 5 miss) | cpu | 0.09ms | 0.0085ms | 0.094 | 0.097 | 0.0076ms | 0.0078ms |
| export_batch (3 SVG + 3 PNG) | cpu | 0.09ms | 0.01ms | 0.115 | 0.122 | 0.0093ms | 0.0098ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dashboard_render_workflow (10 chart across 4 kinds x 4 providers) | 0.55ms | 200ms | PASS |
| axis_recompute_batch (5 dataset で computeAxis) | 0.09ms | 200ms | PASS |
| animation_frame_burst (5 series x 10 frames) | 0.16ms | 200ms | PASS |
| drilldown_batch (5 hit + 5 miss) | 0.06ms | 200ms | PASS |
| export_batch (3 SVG + 3 PNG) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| dashboard_render_workflow (10 chart across 4 kinds x 4 providers) | 5424 B | 0 B | 102400 B | yes | PASS |
| axis_recompute_batch (5 dataset で computeAxis) | 16 B | 0 B | 102400 B | yes | PASS |
| animation_frame_burst (5 series x 10 frames) | 648 B | 0 B | 102400 B | yes | PASS |
| drilldown_batch (5 hit + 5 miss) | 3040 B | 0 B | 102400 B | yes | PASS |
| export_batch (3 SVG + 3 PNG) | 1552 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### dashboard_render_workflow (10 chart across 4 kinds x 4 providers)

# Perf Report — dashboard_render_workflow (10 chart across 4 kinds x 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.05ms |
| p50 | 0.06ms |
| p95 | 0.16ms |
| p99 | 0.25ms |
| mean | 0.08ms |
| stdev | 0.05ms |
| min | 0.05ms |
| max | 0.28ms |
| total | 1.54ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.04ms | +0.0086ms | +20.63% |
| p50 | 0.06ms | 0.06ms | +0.00044ms | +0.78% |
| p95 | 0.16ms | 0.07ms | +0.09ms | +129.94% |
| p99 | 0.25ms | 0.07ms | +0.18ms | +259.81% |
| mean | 0.08ms | 0.06ms | +0.02ms | +37.00% |
| min | 0.05ms | 0.04ms | +0.0072ms | +18.70% |
| max | 0.28ms | 0.07ms | +0.21ms | +291.87% |
| total | 1.54ms | 1.13ms | +0.42ms | +37.00% |

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
| stdev | 0.0032ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.41ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.0016ms | +9.21% |
| p50 | 0.02ms | 0.02ms | +0.0016ms | +9.22% |
| p95 | 0.03ms | 0.03ms | +0.0011ms | +4.18% |
| p99 | 0.03ms | 0.03ms | -0.0067ms | -19.12% |
| mean | 0.02ms | 0.02ms | +0.0011ms | +5.65% |
| min | 0.02ms | 0.02ms | +0.00038ms | +2.23% |
| max | 0.03ms | 0.04ms | -0.0086ms | -23.31% |
| total | 0.41ms | 0.39ms | +0.02ms | +5.65% |

### animation_frame_burst (5 series x 10 frames)

# Perf Report — animation_frame_burst (5 series x 10 frames).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.04ms |
| p95 | 0.05ms |
| p99 | 0.06ms |
| mean | 0.04ms |
| stdev | 0.0068ms |
| min | 0.03ms |
| max | 0.06ms |
| total | 0.78ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.04ms | -0.0038ms | -10.32% |
| p50 | 0.04ms | 0.04ms | -0.0061ms | -14.30% |
| p95 | 0.05ms | 0.06ms | -0.0067ms | -11.08% |
| p99 | 0.06ms | 0.07ms | -0.01ms | -20.37% |
| mean | 0.04ms | 0.05ms | -0.0061ms | -13.58% |
| min | 0.03ms | 0.04ms | -0.0028ms | -7.98% |
| max | 0.06ms | 0.07ms | -0.02ms | -22.32% |
| total | 0.78ms | 0.90ms | -0.12ms | -13.58% |

### drilldown_batch (5 hit + 5 miss)

# Perf Report — drilldown_batch (5 hit + 5 miss).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0085ms |
| p50 | 0.0087ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0039ms |
| min | 0.0083ms |
| max | 0.03ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0085ms | 0.0078ms | +0.00067ms | +8.51% |
| p50 | 0.0087ms | 0.0080ms | +0.00069ms | +8.58% |
| p95 | 0.01ms | 0.02ms | -0.0036ms | -20.42% |
| p99 | 0.02ms | 0.02ms | +0.00015ms | +0.65% |
| mean | 0.01ms | 0.0094ms | +0.00071ms | +7.49% |
| min | 0.0083ms | 0.0076ms | +0.00071ms | +9.29% |
| max | 0.03ms | 0.02ms | +0.0011ms | +4.44% |
| total | 0.20ms | 0.19ms | +0.01ms | +7.49% |

### export_batch (3 SVG + 3 PNG)

# Perf Report — export_batch (3 SVG + 3 PNG).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.0047ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.0098ms | +0.00054ms | +5.50% |
| p50 | 0.01ms | 0.01ms | +0.00040ms | +3.04% |
| p95 | 0.02ms | 0.02ms | +0.0031ms | +14.62% |
| p99 | 0.03ms | 0.03ms | -0.0069ms | -20.40% |
| mean | 0.01ms | 0.01ms | +0.00015ms | +1.02% |
| min | 0.01ms | 0.0098ms | +0.00033ms | +3.41% |
| max | 0.03ms | 0.04ms | -0.0094ms | -25.34% |
| total | 0.29ms | 0.28ms | +0.0029ms | +1.02% |

