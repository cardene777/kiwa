# Perf Suite — chart-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| dashboard_render_workflow (10 chart across 4 kinds x 4 providers) | 0.06ms | 0.31ms | 100ms | 0.00050ms | PASS | stable (p10 +12% (閾値未満)、 p95 +303% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| axis_recompute_batch (5 dataset で computeAxis) | 0.02ms | 0.03ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| animation_frame_burst (5 series x 10 frames) | 0.04ms | 0.08ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| drilldown_batch (5 hit + 5 miss) | 0.02ms | 0.03ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| export_batch (3 SVG + 3 PNG) | 0.02ms | 1.54ms | 100ms | 0.00050ms | PASS | stable (p10 -5% (閾値未満)、 p95 +6012% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dashboard_render_workflow (10 chart across 4 kinds x 4 providers) | 0.22ms | 200ms | PASS |
| axis_recompute_batch (5 dataset で computeAxis) | 0.09ms | 200ms | PASS |
| animation_frame_burst (5 series x 10 frames) | 11.07ms | 200ms | PASS |
| drilldown_batch (5 hit + 5 miss) | 0.04ms | 200ms | PASS |
| export_batch (3 SVG + 3 PNG) | 0.07ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| dashboard_render_workflow (10 chart across 4 kinds x 4 providers) | -792 B | 0 B | 102400 B | yes | PASS |
| axis_recompute_batch (5 dataset で computeAxis) | 11808 B | 0 B | 102400 B | yes | PASS |
| animation_frame_burst (5 series x 10 frames) | 712 B | 0 B | 102400 B | yes | PASS |
| drilldown_batch (5 hit + 5 miss) | 15304 B | 0 B | 102400 B | yes | PASS |
| export_batch (3 SVG + 3 PNG) | 912 B | 24576 B | 102400 B | yes | PASS |

## Detailed serial reports

### dashboard_render_workflow (10 chart across 4 kinds x 4 providers)

# Perf Report — dashboard_render_workflow (10 chart across 4 kinds x 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.06ms |
| p50 | 0.07ms |
| p95 | 0.31ms |
| p99 | 3.69ms |
| mean | 0.29ms |
| stdev | 1.00ms |
| min | 0.06ms |
| max | 4.53ms |
| total | 5.86ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.06ms | 0.05ms | +0.0066ms | +12.24% |
| p50 | 0.07ms | 0.06ms | +0.01ms | +21.36% |
| p95 | 0.31ms | 0.08ms | +0.23ms | +303.18% |
| p99 | 3.69ms | 0.09ms | +3.60ms | +4049.83% |
| mean | 0.29ms | 0.06ms | +0.23ms | +375.86% |
| min | 0.06ms | 0.05ms | +0.0060ms | +12.24% |
| max | 4.53ms | 0.09ms | +4.44ms | +4840.95% |
| total | 5.86ms | 1.23ms | +4.63ms | +375.86% |

### axis_recompute_batch (5 dataset で computeAxis)

# Perf Report — axis_recompute_batch (5 dataset で computeAxis).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.03ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.03ms |
| stdev | 0.0034ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.52ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.0032ms | +17.17% |
| p50 | 0.03ms | 0.02ms | +0.0014ms | +5.64% |
| p95 | 0.03ms | 0.03ms | -0.00084ms | -2.64% |
| p99 | 0.03ms | 0.03ms | -0.0016ms | -4.82% |
| mean | 0.03ms | 0.02ms | +0.0012ms | +4.64% |
| min | 0.02ms | 0.02ms | +0.0013ms | +6.76% |
| max | 0.03ms | 0.03ms | -0.0018ms | -5.33% |
| total | 0.52ms | 0.50ms | +0.02ms | +4.64% |

### animation_frame_burst (5 series x 10 frames)

# Perf Report — animation_frame_burst (5 series x 10 frames).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.04ms |
| p50 | 0.06ms |
| p95 | 0.08ms |
| p99 | 0.08ms |
| mean | 0.06ms |
| stdev | 0.01ms |
| min | 0.04ms |
| max | 0.08ms |
| total | 1.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.05ms | -0.0022ms | -4.77% |
| p50 | 0.06ms | 0.14ms | -0.08ms | -58.41% |
| p95 | 0.08ms | 0.27ms | -0.19ms | -70.57% |
| p99 | 0.08ms | 0.84ms | -0.75ms | -90.16% |
| mean | 0.06ms | 0.17ms | -0.11ms | -65.49% |
| min | 0.04ms | 0.04ms | +0.0019ms | +4.55% |
| max | 0.08ms | 0.98ms | -0.90ms | -91.49% |
| total | 1.18ms | 3.43ms | -2.25ms | -65.49% |

### drilldown_batch (5 hit + 5 miss)

# Perf Report — drilldown_batch (5 hit + 5 miss).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0040ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.40ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0030ms | -13.99% |
| p50 | 0.02ms | 0.04ms | -0.02ms | -52.23% |
| p95 | 0.03ms | 0.08ms | -0.05ms | -64.90% |
| p99 | 0.03ms | 0.11ms | -0.08ms | -70.42% |
| mean | 0.02ms | 0.04ms | -0.02ms | -49.53% |
| min | 0.02ms | 0.02ms | -0.0025ms | -12.30% |
| max | 0.03ms | 0.12ms | -0.08ms | -71.37% |
| total | 0.40ms | 0.80ms | -0.39ms | -49.53% |

### export_batch (3 SVG + 3 PNG)

# Perf Report — export_batch (3 SVG + 3 PNG).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 1.54ms |
| p99 | 1.80ms |
| mean | 0.19ms |
| stdev | 0.52ms |
| min | 0.02ms |
| max | 1.86ms |
| total | 3.73ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.00074ms | -4.58% |
| p50 | 0.02ms | 0.02ms | -0.00033ms | -1.99% |
| p95 | 1.54ms | 0.03ms | +1.51ms | +6011.66% |
| p99 | 1.80ms | 0.03ms | +1.77ms | +6522.35% |
| mean | 0.19ms | 0.02ms | +0.17ms | +937.19% |
| min | 0.02ms | 0.02ms | -0.00054ms | -3.41% |
| max | 1.86ms | 0.03ms | +1.84ms | +6638.32% |
| total | 3.73ms | 0.36ms | +3.37ms | +937.19% |

